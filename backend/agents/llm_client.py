from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser
import json
import logging
import re

from utils.config import settings

logger = logging.getLogger(__name__)


def get_llm(temperature: float = 0.2) -> ChatGroq:
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        temperature=temperature,
    )


def parse_json_response(text: str) -> dict:
    """Safely extract JSON from LLM response text."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code blocks
    patterns = [
        r'```json\s*([\s\S]*?)\s*```',
        r'```\s*([\s\S]*?)\s*```',
        r'\{[\s\S]*\}',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                candidate = match.group(1) if '```' in pattern else match.group(0)
                return json.loads(candidate)
            except json.JSONDecodeError:
                continue

    logger.warning(f"Could not parse JSON from: {text[:200]}")
    return {}


async def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
    """Make an async LLM call and return text response."""
    llm = get_llm(temperature=temperature)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]
    response = await llm.ainvoke(messages)
    return response.content


async def call_llm_json(system_prompt: str, user_prompt: str, temperature: float = 0.1) -> dict:
    """Make an LLM call and parse JSON response."""
    text = await call_llm(
        system_prompt=system_prompt + "\n\nALWAYS respond with valid JSON only. No prose, no markdown.",
        user_prompt=user_prompt,
        temperature=temperature
    )
    return parse_json_response(text)