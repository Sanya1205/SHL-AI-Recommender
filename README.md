# SHL AI Assessment Recommender

A conversational AI agent that helps recruiters find the right SHL assessments
through natural language, instead of manually searching the SHL product
catalog. Built for the SHL AI Research Intern take-home assignment.

```
shl-ai-recommender/
├── backend/     FastAPI service (GET /health, POST /chat)
├── frontend/    React 19 + TypeScript + Vite + Tailwind workspace UI
└── docs/        Approach document
```

## What it does

- **Clarifies** vague requests ("I need an assessment") before recommending.
- **Recommends** 1-10 SHL assessments once it has enough context, grounded
  only in the live SHL catalog (never hallucinated).
- **Refines** the shortlist when you change constraints mid-conversation.
- **Compares** assessments ("What's the difference between OPQ and GSA?")
  using catalog facts only.
- **Analyzes job descriptions** (PDF / DOCX / pasted text) and maps them to
  assessments.
- **Refuses** off-topic requests, prompt injection, legal/medical/programming
  advice, and general hiring advice unrelated to assessment selection.

## Architecture

```
User → Conversation Manager → Guardrails
                             → Need clarification? → Ask question
                             → Comparison request?  → Comparison Engine
                             → Embedding → FAISS Retriever → Recommendation Engine → Gemini → Reply
```

- **Conversation Manager** (`backend/services/conversation_manager.py`) —
  the agent's brain. Decides ask / retrieve / recommend / refuse per turn.
- **Retriever** (`backend/services/retriever.py`) — semantic search over the
  catalog using `sentence-transformers/all-MiniLM-L6-v2` + FAISS (falls back
  to TF-IDF cosine similarity if those native deps aren't installed, so the
  service still runs on constrained hosts).
- **Recommendation Engine** — ranks, scores confidence, formats cards.
- **Comparison Engine** — resolves assessment names/abbreviations to catalog
  records for grounded comparisons.
- **JD Parser** — extracts text from uploaded PDF/DOCX/pasted JDs.
- **Guardrails** — deterministic regex-based pre-filter for prompt injection
  and off-topic requests (runs before any LLM call).
- **Gemini Service** — Gemini 2.5 Flash calls for (1) structured intent/slot
  analysis and (2) grounded reply generation, with a heuristic fallback if no
  API key is configured so the service degrades gracefully rather than
  crashing.

The API is fully **stateless** — every `/chat` call carries the full
conversation history, no server-side session is stored (per spec). The
frontend persists conversation history client-side (localStorage) purely for
the "Recent Conversations" UI convenience.

## Quick start

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

- `GET http://localhost:8000/health` → `{"status": "ok"}`
- `POST http://localhost:8000/chat` → see request/response schema below.

On first startup the service fetches the live SHL catalog from
`CATALOG_SOURCE_URL`, normalizes it, and builds the FAISS index. If the fetch
fails (no network, source down), it falls back to the last cached
`backend/database/catalog.json` (a small seed file derived from the sample
conversation traces ships in the repo so local dev works out of the box).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your backend URL
npm run dev
```

Visit `http://localhost:5173`.

## Authentication

Real backend auth, not a frontend mock: FastAPI issues JWTs, passwords are
hashed with bcrypt, and users are persisted in a SQL database via SQLAlchemy.

```
POST /auth/signup   {name, email, password, role, company?} → {access_token, user}
POST /auth/login    {email, password}                        → {access_token, user}
GET  /auth/me        (Bearer token)                           → user
PATCH /auth/profile  (Bearer token) {name?, role?, company?}  → user
```

The frontend stores the JWT in `localStorage` and attaches it as
`Authorization: Bearer <token>` on every request (`frontend/src/services/api.ts`).
Profile edits, login, and signup all round-trip through these endpoints — the
Profile page (`/profile`) reads and writes real database rows, not local
state.

**Database.** Defaults to a local SQLite file (`backend/database/app.db`) —
zero config for local dev. For deployment, set `DATABASE_URL` to a managed
Postgres instance (e.g. Render Postgres), since SQLite files on most
free-tier hosts don't survive a redeploy:

```
DATABASE_URL=postgresql+psycopg2://user:password@host:5432/dbname
```

Set `JWT_SECRET_KEY` to a long random string in production — the checked-in
default is for local dev only.

## API contract

```
POST /chat
{
  "messages": [
    {"role": "user", "content": "Hiring a Java developer who works with stakeholders"},
    {"role": "assistant", "content": "Sure. What is the seniority level?"},
    {"role": "user", "content": "Mid-level, around 4 years"}
  ]
}
```

```
{
  "reply": "Got it. Here are 5 assessments that fit a mid-level Java dev with stakeholder needs.",
  "recommendations": [
    {"name": "Java 8 (New)", "url": "https://www.shl.com/...", "test_type": "K"},
    {"name": "OPQ32r", "url": "https://www.shl.com/...", "test_type": "P"}
  ],
  "end_of_conversation": false
}
```

`recommendations` is empty while clarifying or refusing; it's an array of
1-10 items once the agent commits to a shortlist. `end_of_conversation` is
`true` only when the agent considers the task complete. Recommendation
objects also carry extra optional fields (`category`, `duration`, `skills`,
`description`, `confidence`, `remote_testing`, `adaptive`, `languages`) used
by the UI — additive only, the required fields are unchanged.

## Environment variables

See `backend/.env.example` and `frontend/.env.example`.

## Deployment

**Backend → Render**
1. New Web Service → connect this repo, root directory `backend`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add env vars `GEMINI_API_KEY`, `JWT_SECRET_KEY`, and `DATABASE_URL`
   (point this at a Render Postgres instance so accounts persist across
   redeploys — see "Authentication" above).
5. Render's free tier cold-starts — the assignment's evaluator allows the
   first `/health` call up to 2 minutes, which this service respects (it
   answers `/health` immediately even if catalog/index loading is still in
   progress in the background).

**Frontend → Vercel**
1. New Project → root directory `frontend`, framework preset "Vite".
2. Env var `VITE_API_BASE_URL` = your deployed Render backend URL.
3. Deploy.

## Notes on the live catalog fetch

This code was written and reviewed in a network-isolated environment, so the
live `CATALOG_SOURCE_URL` fetch and `npm install`/`pip install` could not be
executed end-to-end here. The fetch/normalization logic is defensive (tries
several likely JSON shapes and field names, falls back to cache on failure) —
please sanity-check the normalized field mapping in
`backend/services/catalog_service.py::_normalize_record` against the actual
upstream JSON shape once you have network access, and adjust the probed key
names if needed.
