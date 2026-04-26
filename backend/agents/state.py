from typing import TypedDict, List, Optional, Any
from dataclasses import dataclass, field


class CandidateResult(TypedDict):
    candidate_id: str
    name: str
    skills: List[str]
    experience_years: float
    summary: str
    match_score: float
    match_explanation: str
    missing_skills: List[str]
    interest_score: float
    interest_reasoning: str
    final_score: float
    conversation: List[dict]
    full_explanation: str


class AgentState(TypedDict):
    # Inputs
    job_id: str
    jd_text: str
    candidate_ids: List[str]  # IDs to process (from DB)

    # JD Parsed
    parsed_jd: Optional[dict]  # role, skills, experience, keywords

    # Retrieved candidates (from Qdrant)
    retrieved_candidates: List[dict]

    # Per-candidate processing results
    candidate_results: List[CandidateResult]

    # Final ranked output
    ranked_results: List[CandidateResult]
    shortlisted: List[CandidateResult] 

    # Error tracking
    errors: List[str]

    # Metadata
    pipeline_status: str  # "running" | "complete" | "error"