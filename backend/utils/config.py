from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "TalentScout AI"
    DEBUG: bool = False

    # Groq
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # PostgreSQL
    DATABASE_URL: str = ""

    # Qdrant (Cloud only)
    QDRANT_URL: str
    QDRANT_API_KEY: str
    QDRANT_COLLECTION: str = "candidates"

    

    # Embedding
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 1

    # Pipeline
    MATCH_WEIGHT: float = 0.7
    INTEREST_WEIGHT: float = 0.3

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()