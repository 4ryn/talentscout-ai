-- TalentScout AI - PostgreSQL Schema
-- Run with: psql -U postgres -d talentscout -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────
-- JOBS
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title           VARCHAR(255) NOT NULL,
    raw_text        TEXT NOT NULL,
    parsed_role     VARCHAR(255),
    parsed_skills   JSONB,         -- ["Python", "FastAPI", ...]
    parsed_experience VARCHAR(255),
    parsed_keywords JSONB,         -- ["backend", "api", ...]
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);


-- ─────────────────────────────
-- CANDIDATES
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS candidates (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    raw_text        TEXT NOT NULL,
    skills          JSONB,         -- ["Python", "SQL", ...]
    experience_years FLOAT,
    summary         TEXT,
    qdrant_id       VARCHAR(255),  -- reference to Qdrant point ID
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_created ON candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_name ON candidates(name);


-- ─────────────────────────────
-- SCORES
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS scores (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    job_id              TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id        TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

    -- Scores (0.0 - 1.0)
    match_score         FLOAT NOT NULL DEFAULT 0.0,
    interest_score      FLOAT NOT NULL DEFAULT 0.0,
    final_score         FLOAT NOT NULL DEFAULT 0.0,  -- 0.7*match + 0.3*interest

    -- Explanations
    match_explanation   TEXT,
    missing_skills      JSONB,     -- ["Docker", "Kubernetes"]
    interest_reasoning  TEXT,
    conversation        JSONB,     -- [{role, message}, ...]
    full_explanation    TEXT,

    created_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(job_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_scores_job_final ON scores(job_id, final_score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_candidate ON scores(candidate_id);


-- ─────────────────────────────
-- VIEWS
-- ─────────────────────────────

-- Ranked shortlist view
CREATE OR REPLACE VIEW ranked_candidates AS
SELECT
    s.job_id,
    j.title AS job_title,
    c.id AS candidate_id,
    c.name,
    c.email,
    c.skills,
    c.experience_years,
    s.match_score,
    s.interest_score,
    s.final_score,
    s.match_explanation,
    s.missing_skills,
    s.full_explanation,
    RANK() OVER (PARTITION BY s.job_id ORDER BY s.final_score DESC) AS rank
FROM scores s
JOIN jobs j ON j.id = s.job_id
JOIN candidates c ON c.id = s.candidate_id;