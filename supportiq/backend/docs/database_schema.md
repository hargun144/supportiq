# SupportIQ Database Schema

## Entity Relationship Overview

The SupportIQ PostgreSQL database consists of 9 primary tables: `customers`, `agents`, `tickets`, `audit_logs`, `users`, `conversations`, `interaction_history`, `knowledge_documents`, and `ai_generated_responses`.

---

## Table Definitions & Indexes

### 1. `customers`
Stores customer profile information and subscription tiers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | Primary Key, Index | Customer unique identifier |
| `name` | `VARCHAR(255)` | NOT NULL | Customer/Company name |
| `email` | `VARCHAR(255)` | Unique, Index, NOT NULL | Customer email address |
| `tier` | `ENUM` | NOT NULL | `free`, `premium`, `enterprise` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default UTC | Registration timestamp |

---

### 2. `agents`
Stores support agent specialty areas and current workload counts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | Primary Key, Index | Agent unique identifier |
| `name` | `VARCHAR(255)` | NOT NULL | Agent full name |
| `specialty` | `ENUM` | NOT NULL | `billing`, `technical`, `complaint`, `general` |
| `current_load` | `INTEGER` | NOT NULL, Default 0 | Active ticket load count |

---

### 3. `tickets`
Stores support tickets, AI classification scores, SLA metrics, and status tracking.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | Primary Key, Index | Ticket unique identifier |
| `customer_id` | `INTEGER` | FK (`customers.id`, CASCADE), Index | Customer reference |
| `agent_id` | `INTEGER` | FK (`agents.id`, SET NULL), Index, Nullable | Assigned agent reference |
| `channel` | `ENUM` | NOT NULL | `email`, `chat`, `phone`, `social` |
| `message_text` | `TEXT` | NOT NULL | Raw ticket content |
| `category` | `ENUM` | Index, Nullable | AI category (`billing`, `technical`, `complaint`, `general`) |
| `priority_score` | `INTEGER` | Nullable | Priority score (1 - 100) |
| `risk_score` | `INTEGER` | Nullable | Risk score (1 - 100) |
| `sentiment` | `VARCHAR(50)` | Nullable | Detected sentiment (`positive`, `neutral`, `negative`, `frustrated`) |
| `status` | `ENUM` | Index, NOT NULL | `open`, `in_progress`, `resolved`, `escalated` |
| `first_response_at` | `TIMESTAMP WITH TIME ZONE` | Nullable | Timestamp of first agent response |
| `resolved_at` | `TIMESTAMP WITH TIME ZONE` | Nullable | Timestamp of resolution |
| `first_response_time` | `INTEGER` | Nullable | Minutes to first response |
| `resolution_time` | `INTEGER` | Nullable | Minutes to resolution |
| `sla_breached` | `BOOLEAN` | Index, NOT NULL, Default False | SLA breach flag |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Index, NOT NULL, Default UTC | Ticket creation timestamp |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default UTC | Last update timestamp |

---

### 4. `conversations` (Track 2)
Stores raw and ingested multi-channel customer and agent messages.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | Primary Key, Index | Conversation ID |
| `customer_id` | `INTEGER` | FK (`customers.id`, CASCADE), Index | Customer reference |
| `ticket_id` | `INTEGER` | FK (`tickets.id`, SET NULL), Index, Nullable | Ticket reference |
| `channel` | `ENUM` | NOT NULL | `email`, `chat`, `phone`, `social` |
| `message` | `TEXT` | NOT NULL | Message text content |
| `sender_type` | `VARCHAR(50)` | NOT NULL | `customer`, `agent`, `system` |
| `timestamp` | `TIMESTAMP WITH TIME ZONE` | Index, NOT NULL, Default UTC | Message timestamp |

---

### 5. `interaction_history` (Track 2)
Stores timeline history of customer interactions across channels.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | Primary Key, Index | Interaction ID |
| `customer_id` | `INTEGER` | FK (`customers.id`, CASCADE), Index | Customer reference |
| `interaction_type` | `VARCHAR(100)` | Index, NOT NULL | Type of interaction |
| `metadata` | `TEXT` | NOT NULL | Encrypted JSON metadata |
| `timestamp` | `TIMESTAMP WITH TIME ZONE` | Index, NOT NULL, Default UTC | Interaction timestamp |

---

### 6. `knowledge_documents` (Track 3 RAG)
Stores Knowledge Base FAQs, troubleshooting guides, and policies.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | Primary Key, Index | Document ID |
| `title` | `VARCHAR(255)` | Index, NOT NULL | Document title |
| `category` | `VARCHAR(50)` | Index, NOT NULL | `faq`, `troubleshooting`, `policy` |
| `content` | `TEXT` | NOT NULL | Document content text |
| `tags` | `VARCHAR(255)` | Nullable | Comma-separated search tags |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default UTC | Creation timestamp |

---

### 7. `ai_generated_responses` (Track 3)
Stores AI-generated response recommendations and RAG citations.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | Primary Key, Index | Response record ID |
| `ticket_id` | `INTEGER` | FK (`tickets.id`, CASCADE), Index | Associated ticket ID |
| `suggested_response` | `TEXT` | NOT NULL | Generated response text |
| `confidence_score` | `FLOAT` | NOT NULL | Confidence score (0.0 to 1.0) |
| `sources_used` | `TEXT` | Nullable | JSON array of citation sources |
| `reasoning` | `TEXT` | Nullable | AI reasoning summary |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default UTC | Generation timestamp |

---

### 8. `audit_logs`
Encrypted audit log table recording all ticket actions and AI reasoning.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | Primary Key, Index | Audit log ID |
| `ticket_id` | `INTEGER` | FK (`tickets.id`, CASCADE), Index | Associated ticket ID |
| `action` | `VARCHAR(50)` | Index, NOT NULL | Action name |
| `details` | `TEXT` | NOT NULL | Fernet-encrypted JSON details payload |
| `timestamp` | `TIMESTAMP WITH TIME ZONE` | Index, NOT NULL, Default UTC | Log timestamp |

---

### 9. `users`
System user account table for support portal authentication.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | Primary Key, Index | User ID |
| `email` | `VARCHAR(255)` | Unique, Index, NOT NULL | User email |
| `hashed_password` | `VARCHAR(255)` | NOT NULL | Bcrypt hashed password |
| `full_name` | `VARCHAR(255)` | NOT NULL | Full name |
| `role` | `ENUM` | NOT NULL, Default `agent` | `admin`, `agent` |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, Default UTC | Creation timestamp |
