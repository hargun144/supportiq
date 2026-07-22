# SupportIQ Backend Architecture

## Overview
SupportIQ is an AI-native customer support intelligence platform automating ticket classification, Customer 360 context engine, RAG response generation, predictive risk analytics, and intelligent agent workload assignment.

---

## Architectural Modules & Track Coverage

### Track 1: Production Core Architecture
- **Routers Layer** (`routers/tickets.py`, `routers/auth.py`, `routers/dashboard.py`, `routers/channels.py`, `routers/analytics.py`): Thin Controllers with Pydantic schemas.
- **Service Layer** (`services/ticket_service.py`, `services/ai_service.py`, `services/response_service.py`, `services/risk_service.py`): Business logic, transactions, SLA metrics, and RAG pipelines.
- **Data Layer** (`models.py`, `database.py`): Declarative SQLAlchemy models with indexes, cascades, and Fernet encryption.

---

### Track 2: Unified Customer Context Engine (`routers/channels.py`, `services/ticket_service.py`)
- **Customer 360 System**:
  - `GET /customers/{customer_id}/context`: Aggregates customer profile, tier, ticket history, conversation history, interaction timeline, sentiment trends, risk trends, and unresolved issues.
- **Unified Channel Ingestion**:
  - `POST /channels/email`, `POST /channels/chat`, `POST /channels/social`, `POST /channels/phone`
  - Normalizes raw incoming channel payloads, resolves/creates customer profiles, auto-creates tickets (triggering AI classification + agent assignment), and records `Conversation` and `InteractionHistory` timelines.

---

### Track 3: Automated Response Generation & RAG Pipeline (`services/response_service.py`)
- **Pipeline Architecture**:
```text
Ticket Message & Customer Context
               ↓
Knowledge Base Retrieval (KnowledgeDocument Search)
               ↓
RAG Context Assembly & Source Citation
               ↓
AI Response Synthesis (LLM or Template Fallback)
               ↓
Structured Response Output & Audit Logging
```
- **Endpoint**: `POST /tickets/{ticket_id}/generate-response`
- **Output**: Returns `suggested_response`, `confidence_score`, `sources_used`, and `reasoning`.

---

### Track 4: Predictive Support Analytics (`services/risk_service.py`, `routers/analytics.py`)
- **Risk Prediction Engine**:
  - Evaluates sentiment, customer subscription tier, historical complaints count, ticket age, SLA breach status, category, and priority score.
  - Computes `escalation_probability` (0.0 to 1.0), `risk_level` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `risk_factors` list, and `recommended_action`.
- **Endpoint**: `GET /analytics/risk-predictions`
