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

    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "candidates"
    QDRANT_URL: Optional[str] = None  # Full URL for Qdrant Cloud
    QDRANT_API_KEY: Optional[str] = None  # API Key for Qdrant Cloud

    # Embedding
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384

    # Pipeline
    TOP_K_CANDIDATES: int = 10
    MATCH_WEIGHT: float = 0.7
    INTEREST_WEIGHT: float = 0.3

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()