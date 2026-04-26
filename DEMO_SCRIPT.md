# 🎬 TalentScout AI — Demo Script & Sample I/O

---

## SAMPLE JOB DESCRIPTION (paste as TXT or save as PDF)

```
Senior Backend Engineer — FinTech Startup

We are building the next generation of real-time payment infrastructure.
We're looking for a Senior Backend Engineer to join our core platform team.

Responsibilities:
- Design and build scalable microservices in Python and Go
- Own the payments API — reliability, latency, security
- Work with PostgreSQL, Redis, Kafka
- Collaborate with ML team on fraud detection pipelines
- Mentor junior engineers

Requirements:
- 5+ years backend engineering experience
- Strong Python (FastAPI, Django) or Go
- Experience with distributed systems and event-driven architecture
- PostgreSQL or MySQL at scale
- Docker, Kubernetes in production
- Experience in fintech, payments, or high-throughput systems preferred
```

---

## SAMPLE RESUMES (create as TXT files)

### resume_sarah_chen.txt
```
Sarah Chen | sarah.chen@email.com

EXPERIENCE
Senior Software Engineer — Stripe (4 years)
- Built payment processing microservices handling $2B/day in Go and Python
- Owned PostgreSQL sharding implementation (500M rows)
- Led Kafka migration for real-time fraud detection

Software Engineer — Square (2 years)
- REST APIs in Django, 99.99% uptime SLA
- Redis caching layer reducing latency 60%

SKILLS
Python, Go, FastAPI, Django, PostgreSQL, Redis, Kafka, Docker, Kubernetes,
microservices, distributed systems, AWS, fintech, payments

EDUCATION
BS Computer Science — Stanford University
```

### resume_james_okafor.txt
```
James Okafor | james.okafor@dev.io

EXPERIENCE
Backend Developer — E-commerce startup (3 years)
- Built REST APIs in Python/Flask for 500K daily users
- PostgreSQL database design and optimization
- Deployed on AWS ECS with Docker

Junior Developer — Agency (1 year)
- Django web apps for client projects

SKILLS
Python, Flask, Django, PostgreSQL, MySQL, Docker, AWS, REST APIs, Git

EDUCATION
BS Software Engineering — University of Lagos
```

### resume_priya_sharma.txt
```
Priya Sharma | priya.s@techcorp.com

EXPERIENCE
Staff Engineer — Goldman Sachs Tech (6 years)
- Core banking systems in Java and Python
- Real-time settlement systems processing 10M tx/day
- Led team of 8 engineers

Senior Engineer — JPMorgan (3 years)
- Payment gateway integrations
- PostgreSQL + Oracle at scale
- Docker/Kubernetes production deployments

SKILLS
Python, Java, PostgreSQL, Oracle, Kafka, Docker, Kubernetes, microservices,
payments, fintech, distributed systems, leadership, Go

EDUCATION
MS Computer Science — IIT Bombay
```

---

## EXPECTED OUTPUT (after pipeline)

```json
{
  "job_id": "abc-123",
  "total": 3,
  "candidates": [
    {
      "name": "Priya Sharma",
      "match_score": 0.92,
      "interest_score": 0.87,
      "final_score": 0.906,
      "missing_skills": [],
      "match_explanation": "Priya brings 9 years of fintech/payments experience with exact skill overlap including Kafka, Kubernetes, and PostgreSQL at scale. Her Goldman/JPMorgan background is directly relevant.",
      "interest_reasoning": "Expressed strong enthusiasm for the fintech challenge and real-time payments domain. Clear alignment with career goals. High intent to explore.",
      "full_explanation": "Top recommendation. Priya exceeds all requirements with 9 years of directly relevant fintech experience. Her staff engineering background suggests she can immediately contribute and mentor. Prioritize outreach."
    },
    {
      "name": "Sarah Chen",
      "match_score": 0.88,
      "interest_score": 0.79,
      "final_score": 0.853,
      "missing_skills": ["Go (limited)"],
      "match_explanation": "Sarah's Stripe and Square experience is highly relevant with strong Python, Kafka, and PostgreSQL skills. Minor gap in Go proficiency.",
      "interest_reasoning": "Engaged thoughtfully with role questions. Some hesitation about company stage (startup vs. Stripe-scale).",
      "full_explanation": "Strong candidate with direct payments infrastructure experience. The startup risk appetite should be explored in screening call. Likely strong technical fit."
    },
    {
      "name": "James Okafor",
      "match_score": 0.61,
      "interest_score": 0.72,
      "final_score": 0.643,
      "missing_skills": ["Kafka", "Kubernetes", "Go", "fintech", "distributed systems"],
      "match_explanation": "James has solid Python/PostgreSQL backend skills but lacks fintech experience and key distributed systems tools like Kafka and Kubernetes.",
      "interest_reasoning": "Showed genuine enthusiasm and eagerness to break into fintech. High motivation, but needs development.",
      "full_explanation": "Not recommended for senior role — significant skill gaps in distributed systems and fintech domain. Could be reconsidered for a mid-level position with growth path."
    }
  ]
}
```

---

## DEMO WALKTHROUGH (3-5 min video)

### 0:00 — Introduction (20s)
- "This is TalentScout AI — a multi-agent system that automates talent scouting"
- Show the dashboard

### 0:20 — Upload JD (40s)
- Navigate to Upload page
- Drop the FinTech Senior Backend Engineer JD
- Show confirmation: "JD parsed"

### 1:00 — Upload Resumes (30s)
- Drop all 3 resume files
- Show them appear in the file list with names parsed

### 1:30 — Run Pipeline (60s)
- Click "Launch AI Pipeline"
- Watch live log scroll:
  - "JD Parser extracting role & skills"
  - "Retrieval Agent searching Qdrant"
  - "Match Agent scoring each candidate"
  - "Engagement Agent simulating conversations"
  - "Pipeline complete — 3 candidates ranked"

### 2:30 — Results Page (90s)
- Show ranked table: Priya #1 (91%), Sarah #2 (85%), James #3 (64%)
- Point out Match vs Interest score columns with bars
- Click Priya's "Details" button
- Show modal:
  - Score rings (92% match, 87% interest, 91% final)
  - Skills + missing skills (none for Priya)
  - Match analysis text
  - Recruiter recommendation
  - Simulated conversation (3 turns, realistic responses)

### 4:00 — Chart View + Reset (30s)
- Switch to Chart view — show bar chart comparison
- Click "Reset System" in sidebar
- Confirm dialog → "System reset — all data cleared"
- Dashboard shows 0 jobs, 0 candidates

### 4:30 — Wrap-up (30s)
- "8 agents, zero manual work, instant ranked shortlist"
- Show architecture diagram

---

## ARCHITECTURE DIAGRAM (for submission)

```
                         ┌─────────────┐
         JD File ───────►│  FastAPI    │◄──── Resume Files
                         │  Backend   │
                         └──────┬──────┘
                                │
                         ┌──────▼──────────────────────────┐
                         │       LANGGRAPH DAG             │
                         │                                 │
                         │  ┌─────────────────────────┐   │
                         │  │  1. JD Parser Agent     │   │
                         │  │  role, skills, keywords  │   │
                         │  └──────────┬──────────────┘   │
                         │             │                   │
                         │  ┌──────────▼──────────────┐   │
                         │  │  2. Retrieval Agent     │   │◄──── Qdrant
                         │  │  semantic vector search  │   │     (embeddings)
                         │  └──────────┬──────────────┘   │
                         │             │                   │
                         │  ┌──────────▼──────────────┐   │
                         │  │  3. Match Agent         │   │
                         │  │  cosine+skills+exp score │   │
                         │  ├─────────────────────────┤   │
                         │  │  4. Engagement Agent    │   │◄──── Groq LLM
                         │  │  simulated conversation  │   │     (Llama3-70B)
                         │  ├─────────────────────────┤   │
                         │  │  5. Interest Agent      │   │
                         │  │  enthusiasm/alignment    │   │
                         │  └──────────┬──────────────┘   │
                         │             │                   │
                         │  ┌──────────▼──────────────┐   │
                         │  │  6. Ranking Agent       │   │
                         │  │  0.7×match + 0.3×int    │   │
                         │  └──────────┬──────────────┘   │
                         │             │                   │
                         │  ┌──────────▼──────────────┐   │
                         │  │  7. Explainability Agent│   │
                         │  │  recruiter summaries    │   │
                         │  └─────────────────────────┘   │
                         └─────────────────────────────────┘
                                        │
                                ┌───────▼────────┐
                                │  PostgreSQL    │
                                │  (scores,      │
                                │   candidates,  │
                                │   jobs)        │
                                └───────┬────────┘
                                        │
                                ┌───────▼────────┐
                                │  React UI      │
                                │  Dashboard     │
                                │  Results Table │
                                │  Detail Modal  │
                                └────────────────┘
```


“Hi, this is TalentScout AI, an AI-powered multi-agent system that automates the entire talent scouting process.

Recruiters usually spend hours filtering resumes and trying to assess candidate interest.
Our system solves this by automatically matching candidates, engaging them conversationally, and producing a ranked shortlist with explanations.”

🟡 0:25 — Upload Job Description (40 sec)

“Let’s start by uploading a job description.”

👉 (Go to Upload page)

“This is a Senior Backend Engineer role in fintech.”

👉 Upload JD (PDF or text)

“As soon as I upload it, the JD Parser Agent extracts key information like skills, experience, and role requirements.”

🔵 1:05 — Upload Resumes (30 sec)

“Now I’ll upload multiple candidate resumes.”

👉 Upload 3 resumes

“These resumes are processed by the Resume Parser Agent, which extracts structured data like skills, experience, and summary, and stores them in the database.”

🟣 1:35 — Run AI Pipeline (60 sec)

👉 Click “Run Pipeline”

“Now I’ll launch the AI pipeline.”

“As you can see, multiple agents are working step-by-step:

JD Parser understands the job
Retrieval Agent searches relevant candidates using vector similarity
Match Agent scores technical fit
Engagement Agent simulates conversation with candidates
Interest Agent evaluates their enthusiasm
Finally, the Ranking Agent produces a shortlist”

“This entire process is fully automated.”

🟠 2:35 — Results Page (90 sec)

👉 Go to Results

“Here we see the ranked candidates.”

👉 Point to table

“We have:

Match Score → how well the candidate fits the job
Interest Score → how likely they are interested
Final Score → combined ranking”
👉 Open Top Candidate (Priya)

“Let’s open the top candidate.”

👉 Click details

“Here’s where the system becomes really powerful:

It explains why the candidate matched
Shows missing skills
Displays interest reasoning
And even shows a simulated conversation”

“This gives recruiters not just data—but actual decision support.”

🔴 4:05 — Reset Feature (20 sec)

👉 Click Reset

“I can also reset the entire system with one click.”

“This clears all stored candidates and jobs, which is useful for running fresh evaluations.”

🟢 4:25 — Closing (30 sec)

“TalentScout AI uses 8 specialized agents, vector search, and LLM-based reasoning to transform hiring from manual filtering to intelligent automation.

It enables recruiters to:

Save time
Focus on top candidates
Make explainable decisions instantly

Thank you.”