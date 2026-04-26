from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Integer, Text, DateTime, ForeignKey, JSON
from datetime import datetime
from typing import Optional, List
import uuid

from utils.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    raw_text: Mapped[str] = mapped_column(Text)
    parsed_role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    parsed_skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    parsed_experience: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    parsed_keywords: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    scores: Mapped[List["Score"]] = relationship("Score", back_populates="job")


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    raw_text: Mapped[str] = mapped_column(Text)
    skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    experience_years: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    qdrant_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    scores: Mapped[List["Score"]] = relationship("Score", back_populates="candidate")


class Score(Base):
    __tablename__ = "scores"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(String, ForeignKey("jobs.id"))
    candidate_id: Mapped[str] = mapped_column(String, ForeignKey("candidates.id"))

    match_score: Mapped[float] = mapped_column(Float, default=0.0)
    interest_score: Mapped[float] = mapped_column(Float, default=0.0)
    final_score: Mapped[float] = mapped_column(Float, default=0.0)

    match_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    missing_skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    interest_reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    conversation: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    full_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    job: Mapped["Job"] = relationship("Job", back_populates="scores")
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="scores")


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()