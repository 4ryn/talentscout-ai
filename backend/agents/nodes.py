"""
LangGraph Agent Nodes for TalentScout AI
8 agents: JD Parser, Resume Parser, Retrieval, Match, Engagement, Interest, Ranking, Explainability
"""
import logging
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.state import AgentState, CandidateResult
from agents.llm_client import call_llm_json, call_llm
from db.vector_store import vector_store
from utils.config import settings

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# NODE 1: JD Parser Agent
# ─────────────────────────────────────────────
async def jd_parser_node(state: AgentState) -> AgentState:
    """Parse job description into structured format."""
    logger.info("JD Parser: starting")

    system = """You are an expert job description analyst.
Extract structured information from job descriptions.
Return JSON with exactly these fields:
{
  "role": "job title",
  "skills": ["skill1", "skill2", ...],
  "experience": "X years",
  "keywords": ["keyword1", "keyword2", ...]
}"""

    user = f"Parse this job description:\n\n{state['jd_text'][:4000]}"

    result = await call_llm_json(system, user)

    parsed = {
        "role": result.get("role", "Unknown Role"),
        "skills": result.get("skills", []),
        "experience": result.get("experience", "Not specified"),
        "keywords": result.get("keywords", [])
    }

    logger.info(f"JD Parser: extracted role={parsed['role']}, skills={len(parsed['skills'])}")
    return {**state, "parsed_jd": parsed, "pipeline_status": "jd_parsed"}


# ─────────────────────────────────────────────
# NODE 2: Retrieval Agent
# ─────────────────────────────────────────────
async def retrieval_node(state: AgentState) -> AgentState:
    """Retrieve top-K matching candidates from Qdrant."""
    logger.info("Retrieval: searching Qdrant")

    jd = state["parsed_jd"]
    query = f"{jd['role']} {' '.join(jd['skills'])} {' '.join(jd['keywords'])}"

    results = vector_store.search_candidates(query, top_k=settings.TOP_K_CANDIDATES)
    logger.info(f"Retrieval: found {len(results)} candidates")

    return {**state, "retrieved_candidates": results, "pipeline_status": "retrieved"}


# ─────────────────────────────────────────────
# NODE 3: Match Agent (per candidate)
# ─────────────────────────────────────────────
async def match_agent(
    jd: dict,
    candidate: dict,
    cosine_score: float
) -> dict:
    """Score a single candidate against the JD."""

    jd_skills = set(s.lower() for s in jd.get("skills", []))
    cand_skills = set(s.lower() for s in candidate.get("skills", []))

    skill_overlap = len(jd_skills & cand_skills) / max(len(jd_skills), 1)
    missing = list(jd_skills - cand_skills)

    # Experience scoring
    try:
        req_exp = float(''.join(filter(str.isdigit, jd.get("experience", "0") or "0")) or 0)
        cand_exp = float(candidate.get("experience_years", 0) or 0)
        exp_score = min(cand_exp / max(req_exp, 1), 1.0)
    except:
        exp_score = 0.5

    # Combined match score
    match_score = (cosine_score * 0.4 + skill_overlap * 0.4 + exp_score * 0.2)
    match_score = min(max(match_score, 0.0), 1.0)

    system = """You are a technical recruiter. Given a JD and candidate profile, write a concise 2-sentence match explanation.
Return JSON: {"explanation": "..."}"""

    user = f"""JD Role: {jd['role']}
JD Skills: {', '.join(jd.get('skills', [])[:10])}
Candidate Skills: {', '.join(candidate.get('skills', [])[:10])}
Missing Skills: {', '.join(missing[:5])}
Match Score: {match_score:.2f}
Candidate Experience: {candidate.get('experience_years', 0)} years
Required Experience: {jd.get('experience', 'N/A')}"""

    result = await call_llm_json(system, user)

    return {
        "match_score": round(match_score, 3),
        "explanation": result.get("explanation", "Candidate profile analyzed."),
        "missing_skills": missing[:8]
    }


# ─────────────────────────────────────────────
# NODE 4: Engagement Agent (per candidate)
# ─────────────────────────────────────────────
async def engagement_agent(candidate: dict, jd: dict) -> List[dict]:
    """Simulate a recruiter-candidate conversation."""

    system = f"""You are simulating a realistic job candidate named {candidate.get('name', 'the candidate')}.
Respond naturally and authentically to recruiter questions. Show genuine personality.
Background: {candidate.get('summary', 'Experienced professional')}"""

    questions = [
        f"Hi! Are you currently open to new opportunities? We have a {jd['role']} role.",
        f"Why are you interested in a {jd['role']} position specifically?",
        f"Our role requires {jd.get('experience', 'some')} of experience. How does your background align?"
    ]

    conversation = []
    for q in questions:
        answer = await call_llm(system, q, temperature=0.7)
        conversation.append({
            "role": "recruiter",
            "message": q
        })
        conversation.append({
            "role": "candidate",
            "message": answer.strip()
        })

    return conversation


# ─────────────────────────────────────────────
# NODE 5: Interest Agent (per candidate)
# ─────────────────────────────────────────────
async def interest_agent(conversation: List[dict], candidate: dict, jd: dict) -> dict:
    """Evaluate candidate's genuine interest from conversation."""

    conv_text = "\n".join([
        f"{msg['role'].upper()}: {msg['message']}"
        for msg in conversation
    ])

    system = """You are an expert talent psychologist analyzing candidate interest from conversations.
Score on:
- enthusiasm (0-1): energy and positivity
- alignment (0-1): how well role fits their goals
- intent (0-1): likelihood they'd accept an offer

Return JSON:
{
  "score": 0.0-1.0,
  "enthusiasm": 0.0-1.0,
  "alignment": 0.0-1.0,
  "intent": 0.0-1.0,
  "reasoning": "2-3 sentence analysis"
}"""

    user = f"Analyze this recruiter-candidate conversation:\n\n{conv_text}"

    result = await call_llm_json(system, user, temperature=0.1)

    enthusiasm = float(result.get("enthusiasm", 0.5))
    alignment = float(result.get("alignment", 0.5))
    intent = float(result.get("intent", 0.5))
    score = float(result.get("score", (enthusiasm + alignment + intent) / 3))

    return {
        "interest_score": round(min(max(score, 0.0), 1.0), 3),
        "reasoning": result.get("reasoning", "Interest level assessed from conversation.")
    }


# ─────────────────────────────────────────────
# NODE 6: Per-Candidate Processing Node (orchestrates Match + Engagement + Interest)
# ─────────────────────────────────────────────
async def process_candidates_node(state: AgentState, db: AsyncSession) -> AgentState:
    """Process each retrieved candidate through match, engagement, interest agents."""
    from db.models import Candidate

    logger.info(f"Processing {len(state['retrieved_candidates'])} candidates")
    results: List[CandidateResult] = []

    for retrieved in state["retrieved_candidates"]:
        cid = retrieved.get("candidate_id")
        cosine_score = retrieved.get("score", 0.5)

        # Load candidate from DB
        result = await db.execute(select(Candidate).where(Candidate.id == cid))
        db_candidate = result.scalar_one_or_none()

        if not db_candidate:
            logger.warning(f"Candidate {cid} not found in DB")
            continue

        candidate_data = {
            "id": db_candidate.id,
            "name": db_candidate.name,
            "skills": db_candidate.skills or [],
            "experience_years": db_candidate.experience_years or 0,
            "summary": db_candidate.summary or ""
        }

        jd = state["parsed_jd"]

        try:
            # Run Match Agent
            match_result = await match_agent(jd, candidate_data, cosine_score)

            # Run Engagement Agent
            conversation = await engagement_agent(candidate_data, jd)

            # Run Interest Agent
            interest_result = await interest_agent(conversation, candidate_data, jd)

            # Compute final score
            final = (
                settings.MATCH_WEIGHT * match_result["match_score"] +
                settings.INTEREST_WEIGHT * interest_result["interest_score"]
            )

            results.append({
                "candidate_id": cid,
                "name": candidate_data["name"],
                "skills": candidate_data["skills"],
                "experience_years": candidate_data["experience_years"],
                "summary": candidate_data["summary"],
                "match_score": match_result["match_score"],
                "match_explanation": match_result["explanation"],
                "missing_skills": match_result["missing_skills"],
                "interest_score": interest_result["interest_score"],
                "interest_reasoning": interest_result["reasoning"],
                "final_score": round(final, 3),
                "conversation": conversation,
                "full_explanation": ""  # filled by explainability node
            })

        except Exception as e:
            logger.error(f"Error processing candidate {cid}: {e}")
            state["errors"].append(f"Candidate {cid}: {str(e)}")

    return {**state, "candidate_results": results, "pipeline_status": "candidates_processed"}


# ─────────────────────────────────────────────
# NODE 7: Ranking Agent
# ─────────────────────────────────────────────
async def ranking_node(state: AgentState) -> AgentState:
    """Sort candidates by final score descending."""
    ranked = sorted(
        state["candidate_results"],
        key=lambda x: x["final_score"],
        reverse=True
    )
    logger.info(f"Ranking: sorted {len(ranked)} candidates")
    return {**state, "ranked_results": ranked, "pipeline_status": "ranked"}


# ─────────────────────────────────────────────
# NODE 8: Explainability Agent
# ─────────────────────────────────────────────
async def explainability_node(state: AgentState) -> AgentState:
    """Generate recruiter-friendly explanation for top candidates."""

    enriched = []
    for candidate in state["ranked_results"]:
        system = """You are a senior talent advisor. Write a brief, recruiter-friendly summary (3-4 sentences)
explaining why this candidate should or shouldn't be shortlisted. Be specific and actionable.
Return JSON: {"explanation": "..."}"""

        user = f"""Candidate: {candidate['name']}
Match Score: {candidate['match_score']:.0%}
Interest Score: {candidate['interest_score']:.0%}
Final Score: {candidate['final_score']:.0%}
Match Notes: {candidate['match_explanation']}
Missing Skills: {', '.join(candidate['missing_skills'][:5]) or 'None'}
Interest Notes: {candidate['interest_reasoning']}"""

        result = await call_llm_json(system, user)
        explanation = result.get("explanation", candidate["match_explanation"])

        enriched.append({**candidate, "full_explanation": explanation})

    logger.info("Explainability: done")
    return {**state, "ranked_results": enriched, "pipeline_status": "complete"}