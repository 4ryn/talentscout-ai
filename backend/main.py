"""
TalentScout AI - FastAPI Backend
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import logging
import uuid
from typing import List, Optional
from datetime import datetime

from utils.config import settings
from db.models import init_db, get_db, Job, Candidate, Score
from db.vector_store import vector_store
from ingestion.parser import ingest_file
from agents.pipeline import run_pipeline
from agents.llm_client import call_llm_json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TalentScout AI",
    description="AI-Powered Talent Scouting & Engagement Agent",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track pipeline status
pipeline_status = {"status": "idle", "job_id": None, "started_at": None}


@app.on_event("startup")
async def startup():
    await init_db()
    logger.info("TalentScout AI started")


# ─────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "TalentScout AI"}


# ─────────────────────────────────────────────
# UPLOAD JD
# ─────────────────────────────────────────────
@app.post("/upload-jd")
async def upload_jd(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload and parse a Job Description (PDF, DOCX, or TXT)."""
    content = await file.read()
    text = ingest_file(content, file.filename)

    if not text:
        raise HTTPException(400, "Could not extract text from JD file")

    job = Job(
        id=str(uuid.uuid4()),
        title=file.filename,
        raw_text=text
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    logger.info(f"JD uploaded: {job.id}")
    return {
        "job_id": job.id,
        "title": job.title,
        "text_preview": text[:300],
        "char_count": len(text)
    }


# ─────────────────────────────────────────────
# UPLOAD RESUMES
# ─────────────────────────────────────────────
@app.post("/upload-resumes")
async def upload_resumes(
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload and process multiple candidate resumes."""
    uploaded = []

    for file in files:
        try:
            content = await file.read()
            text = ingest_file(content, file.filename)

            if not text:
                logger.warning(f"Empty text from {file.filename}")
                continue

            # Parse resume with LLM
            system = """You are an expert resume analyst. Extract structured candidate information.
Return JSON:
{
  "name": "Full Name",
  "email": "email or null",
  "skills": ["skill1", "skill2"],
  "experience_years": 0.0,
  "summary": "2-3 sentence professional summary"
}"""
            parsed = await call_llm_json(system, f"Parse this resume:\n\n{text[:3000]}")

            candidate = Candidate(
                id=str(uuid.uuid4()),
                name=parsed.get("name", file.filename.replace(".pdf", "").replace(".docx", "")),
                email=parsed.get("email"),
                raw_text=text,
                skills=parsed.get("skills", []),
                experience_years=float(parsed.get("experience_years", 0) or 0),
                summary=parsed.get("summary", "")
            )
            db.add(candidate)
            await db.flush()

            # Index in Qdrant
            profile_text = f"{candidate.name} {' '.join(candidate.skills or [])} {candidate.summary}"
            qdrant_id = vector_store.upsert_candidate(
                candidate_id=candidate.id,
                text=profile_text,
                payload={
                    "name": candidate.name,
                    "skills": candidate.skills,
                    "experience_years": candidate.experience_years
                }
            )
            candidate.qdrant_id = qdrant_id

            await db.commit()

            uploaded.append({
                "candidate_id": candidate.id,
                "name": candidate.name,
                "skills_count": len(candidate.skills or []),
                "experience_years": candidate.experience_years
            })

        except Exception as e:
            logger.error(f"Error processing {file.filename}: {e}")

    return {
        "uploaded": len(uploaded),
        "candidates": uploaded
    }


# ─────────────────────────────────────────────
# RUN PIPELINE
# ─────────────────────────────────────────────
@app.get("/run-pipeline")
async def run_pipeline_endpoint(
    job_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Trigger the full AI pipeline for a given job."""
    global pipeline_status

    # Load job
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, f"Job {job_id} not found")

    pipeline_status = {
        "status": "running",
        "job_id": job_id,
        "started_at": datetime.utcnow().isoformat()
    }

    try:
        # Run pipeline
        final_state = await run_pipeline(job_id, job.raw_text, db)

        # Persist results to DB
        # Delete old scores for this job
        await db.execute(delete(Score).where(Score.job_id == job_id))

        for r in final_state["ranked_results"]:
            score = Score(
                job_id=job_id,
                candidate_id=r["candidate_id"],
                match_score=r["match_score"],
                interest_score=r["interest_score"],
                final_score=r["final_score"],
                match_explanation=r["match_explanation"],
                missing_skills=r["missing_skills"],
                interest_reasoning=r["interest_reasoning"],
                conversation=r["conversation"],
                full_explanation=r["full_explanation"]
            )
            db.add(score)

        await db.commit()

        pipeline_status["status"] = "complete"

        return {
            "status": "complete",
            "job_id": job_id,
            "candidates_processed": len(final_state["ranked_results"]),
            "errors": final_state.get("errors", [])
        }

    except Exception as e:
        pipeline_status["status"] = "error"
        logger.error(f"Pipeline error: {e}")
        raise HTTPException(500, f"Pipeline failed: {str(e)}")


# ─────────────────────────────────────────────
# GET RESULTS
# ─────────────────────────────────────────────
@app.get("/results")
async def get_results(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get ranked shortlist for a job."""
    result = await db.execute(
        select(Score, Candidate)
        .join(Candidate, Score.candidate_id == Candidate.id)
        .where(Score.job_id == job_id)
        .order_by(Score.final_score.desc())
    )
    rows = result.fetchall()

    if not rows:
        raise HTTPException(404, "No results found. Run the pipeline first.")

    candidates = []
    for score, candidate in rows:
        candidates.append({
            "candidate_id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "skills": candidate.skills or [],
            "experience_years": candidate.experience_years,
            "summary": candidate.summary,
            "match_score": score.match_score,
            "interest_score": score.interest_score,
            "final_score": score.final_score,
            "match_explanation": score.match_explanation,
            "missing_skills": score.missing_skills or [],
            "interest_reasoning": score.interest_reasoning,
            "conversation": score.conversation or [],
            "full_explanation": score.full_explanation
        })

    return {
        "job_id": job_id,
        "total": len(candidates),
        "candidates": candidates
    }


# ─────────────────────────────────────────────
# PIPELINE STATUS
# ─────────────────────────────────────────────
@app.get("/pipeline-status")
async def get_pipeline_status():
    return pipeline_status


# ─────────────────────────────────────────────
# LIST JOBS
# ─────────────────────────────────────────────
@app.get("/jobs")
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).order_by(Job.created_at.desc()))
    jobs = result.scalars().all()
    return [
        {
            "id": j.id,
            "title": j.title,
            "created_at": j.created_at.isoformat()
        }
        for j in jobs
    ]


# ─────────────────────────────────────────────
# RESET SYSTEM
# ─────────────────────────────────────────────
@app.post("/reset-system")
async def reset_system(db: AsyncSession = Depends(get_db)):
    """Clear all data: PostgreSQL + Qdrant."""
    global pipeline_status

    # Clear DB tables
    await db.execute(delete(Score))
    await db.execute(delete(Candidate))
    await db.execute(delete(Job))
    await db.commit()

    # Clear Qdrant
    vector_store.delete_all()

    # Reset status
    pipeline_status = {"status": "idle", "job_id": None, "started_at": None}

    logger.info("System reset complete")
    return {"message": "System reset complete. All data cleared."}


# ─────────────────────────────────────────────
# STATS
# ─────────────────────────────────────────────
@app.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func

    jobs_count = (await db.execute(select(func.count(Job.id)))).scalar()
    cands_count = (await db.execute(select(func.count(Candidate.id)))).scalar()
    scores_count = (await db.execute(select(func.count(Score.id)))).scalar()

    return {
        "jobs": jobs_count,
        "candidates": cands_count,
        "evaluations": scores_count
    }