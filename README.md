# SupportIQ

**AI Support Operations Platform that predicts, resolves, and routes customer issues across channels.**

**[Live Demo](https://supportiq-frontend-y84g.onrender.com)** · **[API Docs](https://supportiq-backend-7v5p.onrender.com/docs)**

> Hosted on Render's free tier — the backend may take 30–60 seconds to wake up on first load after inactivity.

---

## About

Modern support teams receive customer queries across many disconnected channels — email, chat, social, phone — with no shared context between them. Agents manually triage tickets, lack visibility into a customer's history, and typically only react after a problem has already escalated.

SupportIQ addresses this with four integrated capabilities:

- **Intelligent Query Routing** — automatically classifies incoming tickets by category and urgency, then routes them to the specialist agent with the lowest current workload.
- **Unified Customer Context** — aggregates a customer's subscription tier, full ticket history, and cross-channel conversation timeline into a single Customer 360 view.
- **AI-Powered Response Generation** — a Retrieval-Augmented Generation (RAG) pipeline drafts suggested replies grounded in internal knowledge base documents, with confidence scores and source citations.
- **Predictive Risk Analytics** — scores each ticket's escalation risk from sentiment, SLA timers, account tier, and complaint frequency, surfacing high-risk tickets with recommended actions before they turn into churn.

---

## Tech Stack

**Frontend**
- React + TypeScript
- Vite
- Recharts

**Backend**
- FastAPI (Python)
- SQLAlchemy ORM
- Alembic (database migrations)
- JWT authentication
- Fernet encryption (audit log data)

**Database**
- PostgreSQL (production) · SQLite (local development)

**Deployment**
- Render (backend web service, frontend static site, managed PostgreSQL)

---

## Architecture

The backend follows a layered service architecture: routers handle HTTP concerns, services encapsulate business logic (ticket routing, risk scoring, response generation), and models define the data layer — keeping route handlers thin and logic testable.

```
                    Email · Chat · Social · Phone
                              │
                              ▼
                    Channel Ingestion Layer
                              │
                              ▼
                  Customer Context Aggregation
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        AI Classifier    RAG Response     Risk Scoring
              │               │               │
              ▼               ▼               ▼
       Specialist Routing  Suggested Reply  Escalation Alert
                              │
                              ▼
                      Agent Workspace
```

---

## Required Environment Variables

**Backend**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (falls back to local SQLite if unset) |
| `ENCRYPTION_KEY` | Fernet-format key used to encrypt audit log data |
| `CORS_ORIGINS` | Allowed frontend origin(s) for cross-origin requests |

**Frontend**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

---

## Roadmap

This project is under active iteration. Areas intentionally kept simple for now, with room to grow:

- **Sentiment and risk scoring** currently use rule-based/keyword heuristics rather than a trained ML model — a natural next step is a classifier trained on labeled ticket data.
- **RAG retrieval** operates over a small seeded knowledge base; a production version would connect to a live, continuously updated document store.
- **Multilingual support** is not yet implemented.
- **Real-time notifications** for high-risk ticket alerts.