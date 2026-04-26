# 🎯 TalentScout AI
### AI-Powered Talent Scouting & Engagement Agent

> Upload a Job Description. Upload resumes. Get a ranked, explained shortlist in seconds — powered by an 8-agent LangGraph pipeline.

---

## ✨ Features

- **8-Agent LangGraph Pipeline** — JD Parser → Retrieval → Match → Engagement → Interest → Ranking → Explainability
- **Semantic Search** — Qdrant vector database for candidate discovery
- **Conversational Engagement** — Simulated recruiter-candidate Q&A via LLM
- **Dual Scoring** — Match Score (cosine + skill overlap + experience) + Interest Score (enthusiasm, alignment, intent)
- **Explainability** — Every candidate gets a recruiter-friendly summary
- **Reset System** — One-click clear of all data (PostgreSQL + Qdrant)
- **Beautiful UI** — Dark-mode React dashboard with sortable table, charts, and detail modals

---

## 🏗 Architecture

```


┌─────────────────────────────────────────────────────────┐
│                    LANGGRAPH DAG                        │
│                                                         │
│  START                                                  │
│    ↓                                                    │
│  [1] JD Parser Agent                                    │
│      → Extracts: role, skills[], experience, keywords[] │
│    ↓                                                    │
│  [2] Retrieval Agent (Qdrant semantic search)           │
│      → Returns top-K candidate IDs                      │
│    ↓                                                    │
│  [3] Per-Candidate Processing (parallel intent):        │
│      ├── [4] Match Agent                                │
│      │       → cosine sim + skill overlap + exp score  │
│      ├── [5] Engagement Agent                           │
│      │       → Simulated 3-turn conversation            │
│      └── [6] Interest Agent                             │
│              → Scores enthusiasm / alignment / intent   │
│    ↓                                                    │
│  [7] Ranking Agent                                      │
│      → final = 0.7 × match + 0.3 × interest            │
│    ↓                                                    │
│  [8] Explainability Agent                               │
│      → Recruiter-friendly summaries                     │
│    ↓                                                    │
│  END                                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🧮 Scoring Logic

### Match Score (0–1)
```
match = 0.4 × cosine_similarity(JD_embedding, candidate_embedding)
      + 0.4 × (shared_skills / total_jd_skills)
      + 0.2 × min(candidate_years / required_years, 1.0)
```

### Interest Score (0–1)
Derived from LLM analysis of simulated conversation:
- `enthusiasm` — energy and positivity in responses
- `alignment` — how well the role fits their stated goals
- `intent` — likelihood they'd accept an offer

### Final Score
```
final = 0.7 × match_score + 0.3 × interest_score
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Docker + Docker Compose
- Groq API Key (free at [console.groq.com](https://console.groq.com))

### 1. Clone & Configure
```bash
git clone https://github.com/yourusername/talentscout-ai
cd talentscout-ai
cp backend/.env.example backend/.env
# Edit backend/.env — add your GROQ_API_KEY
```

### 2. Launch Everything
```bash
docker-compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Qdrant Dashboard: http://localhost:6333/dashboard

### 3. Manual Setup (no Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env

# Start PostgreSQL and Qdrant separately, then:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload-jd` | Upload Job Description (PDF/DOCX/TXT) |
| `POST` | `/upload-resumes` | Upload multiple candidate resumes |
| `GET` | `/run-pipeline?job_id=...` | Execute full AI pipeline |
| `GET` | `/results?job_id=...` | Get ranked shortlist |
| `GET` | `/jobs` | List all uploaded jobs |
| `GET` | `/stats` | System stats |
| `GET` | `/pipeline-status` | Current pipeline state |
| `POST` | `/reset-system` | Clear all data |
| `GET` | `/health` | Health check |

---

## 📂 Project Structure

```
talentscout-ai/
│
├── backend/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app + endpoints
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Backend container config
│   ├── .env                     # Secrets 
│   ├── .env.example             # Env template
│
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── state.py             # LangGraph AgentState
│   │   ├── nodes.py             # Agent logic (all nodes)
│   │   ├── pipeline.py          # LangGraph workflow
│   │   └── llm_client.py        # Groq wrapper
│
│   ├── db/
│   │   ├── __init__.py
│   │   ├── models.py            # SQLAlchemy models
│   │   └── vector_store.py      # Qdrant operations
│
│   ├── ingestion/
│   │   ├── __init__.py
│   │   └── parser.py            # PDF/DOCX/TXT extraction
│
│   └── utils/
│       ├── __init__.py
│       └── config.py            # Central config (env handling)
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── Dockerfile               # Frontend container
│   ├── nginx.conf               # Production serving config
│   ├── vercel.json              # Vercel deployment config
│
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│
│       ├── api/
│       │   └── api.js           # Backend API calls
│
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Upload.jsx
│       │   └── Results.jsx
│
│       └── components/
│           ├── Layout.jsx
│           ├── CandidateModal.jsx
│           └── ScoreComponents.jsx
│
├── docs/
│   └── schema.sql               # PostgreSQL schema
│
├── docker-compose.yml           # Full system (backend + db + qdrant)
├── render.yaml                  # Backend deployment (Render)
├── README.md                    # Documentation
├── DEMO_SCRIPT.md               # Demo walkthrough
└── .gitignore
```

---

## ☁️ Deployment

### Backend → Render
1. Connect your GitHub repo to [render.com](https://render.com)
2. New → Web Service → select `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (GROQ_API_KEY, DATABASE_URL, QDRANT_HOST)
6. Add a Render PostgreSQL database (free tier available)
7. Add Qdrant Cloud (free at [cloud.qdrant.io](https://cloud.qdrant.io))

### Frontend → Vercel
1. Connect your GitHub repo to [vercel.com](https://vercel.com)
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variable: `VITE_API_URL=https://your-render-backend.onrender.com`

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Orchestration | LangGraph (DAG workflow) |
| LLM Calls | LangChain + Groq (Llama3-70B) |
| API | FastAPI + Uvicorn |
| Vector DB | Qdrant (semantic search) |
| SQL DB | PostgreSQL + SQLAlchemy |
| Embeddings | sentence-transformers (MiniLM-L6) |
| Document Parsing | PyMuPDF + python-docx |
| Frontend | React + Vite + Tailwind CSS |
| Charts | Recharts |
| Deployment | Render (backend) + Vercel (frontend) |

---

## 🔑 Environment Variables

```env
GROQ_API_KEY=gsk_...
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/talentscout
QDRANT_HOST=localhost
QDRANT_PORT=6333
GROQ_MODEL=llama3-70b-8192
MATCH_WEIGHT=0.7
INTEREST_WEIGHT=0.3
```

---

## 📄 License

MIT — use freely, attribution appreciated.