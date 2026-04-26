"""
LangGraph DAG Workflow for TalentScout AI

Flow:
START → JD Parser → Retrieval → Process Candidates → Ranking → Explainability → END
"""
from langgraph.graph import StateGraph, END
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from agents.state import AgentState
from agents.nodes import (
    jd_parser_node,
    retrieval_node,
    process_candidates_node,
    ranking_node,
    explainability_node,
)

logger = logging.getLogger(__name__)


def build_pipeline(db: AsyncSession):
    """Build and compile the LangGraph pipeline with DB session injected."""

    # Wrap nodes that need DB access
    async def retrieval_with_db(state: AgentState) -> AgentState:
        return await retrieval_node(state)

    async def process_with_db(state: AgentState) -> AgentState:
        return await process_candidates_node(state, db)

    # Create the graph
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("jd_parser", jd_parser_node)
    workflow.add_node("retrieval", retrieval_with_db)
    workflow.add_node("process_candidates", process_with_db)
    workflow.add_node("ranking", ranking_node)
    workflow.add_node("explainability", explainability_node)

    # Define edges (DAG flow)
    workflow.set_entry_point("jd_parser")
    workflow.add_edge("jd_parser", "retrieval")
    workflow.add_edge("retrieval", "process_candidates")
    workflow.add_edge("process_candidates", "ranking")
    workflow.add_edge("ranking", "explainability")
    workflow.add_edge("explainability", END)

    return workflow.compile()


async def run_pipeline(
    job_id: str,
    jd_text: str,
    db: AsyncSession
) -> dict:
    """Execute the full talent scouting pipeline."""

    initial_state: AgentState = {
        "job_id": job_id,
        "jd_text": jd_text,
        "candidate_ids": [],
        "parsed_jd": None,
        "retrieved_candidates": [],
        "candidate_results": [],
        "ranked_results": [],
        "errors": [],
        "pipeline_status": "starting"
    }

    pipeline = build_pipeline(db)

    logger.info(f"Starting pipeline for job_id={job_id}")
    final_state = await pipeline.ainvoke(initial_state)
    logger.info(f"Pipeline complete: {len(final_state['ranked_results'])} candidates ranked")

    return final_state