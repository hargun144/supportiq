from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field
try:
    from .models import (
        CustomerTier,
        AgentSpecialty,
        TicketChannel,
        TicketCategory,
        TicketStatus,
        Role,
    )
except ImportError:
    from models import (
        CustomerTier,
        AgentSpecialty,
        TicketChannel,
        TicketCategory,
        TicketStatus,
        Role,
    )


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str
    tier: CustomerTier
    created_at: datetime

    class Config:
        from_attributes = True


class AgentResponse(BaseModel):
    id: int
    name: str
    specialty: AgentSpecialty
    current_load: int

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: Role
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str = Field(..., example="user@example.com")
    password: str = Field(..., min_length=8, example="securepassword123")
    full_name: str = Field(..., example="John Doe")


class UserLogin(BaseModel):
    email: str = Field(..., example="user@example.com")
    password: str = Field(..., example="securepassword123")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


class TicketCreate(BaseModel):
    customer_id: int
    channel: TicketChannel
    message_text: str = Field(..., min_length=1)


class TicketResponse(BaseModel):
    id: int
    customer_id: int
    agent_id: Optional[int] = None
    channel: TicketChannel
    message_text: str
    category: Optional[TicketCategory] = None
    priority_score: Optional[int] = None
    risk_score: Optional[int] = None
    status: TicketStatus
    sentiment: Optional[str] = None
    first_response_time: Optional[int] = None
    resolution_time: Optional[int] = None
    sla_breached: bool = False
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerResponse] = None
    agent: Optional[AgentResponse] = None

    class Config:
        from_attributes = True



class TicketPage(BaseModel):
    tickets: List[TicketResponse]
    total: int

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    ticket_id: int
    action: str
    details: Optional[Any] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class TicketStatusUpdate(BaseModel):
    status: TicketStatus


class TicketDetailResponse(TicketResponse):
    customer: CustomerResponse
    agent: Optional[AgentResponse] = None
    audit_logs: List[AuditLogResponse] = []

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    escalated_tickets: int
    avg_priority: float
    avg_risk: float
    sla_breached_count: int = 0
    avg_resolution_time_minutes: float = 0.0
    tickets_per_category: Dict[str, int]
    tickets_per_agent: Dict[str, int]
    busiest_agent: Optional[Dict[str, Any]] = None
    highest_risk_ticket: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# --- Track 2: Unified Customer Context & Ingestion Schemas ---

class ConversationResponse(BaseModel):
    id: int
    customer_id: int
    ticket_id: Optional[int] = None
    channel: TicketChannel
    message: str
    sender_type: str
    timestamp: datetime

    class Config:
        from_attributes = True


class InteractionResponse(BaseModel):
    id: int
    customer_id: int
    interaction_type: str
    metadata: Optional[Any] = Field(None, alias="interaction_metadata")
    timestamp: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class ChannelMessageIngest(BaseModel):
    customer_id: Optional[int] = None
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    message_text: str = Field(..., min_length=1)
    channel: Optional[TicketChannel] = None
    metadata: Optional[Dict[str, Any]] = None


class Customer360ContextResponse(BaseModel):
    customer_profile: CustomerResponse
    customer_tier: CustomerTier
    previous_tickets: List[TicketResponse]
    conversations: List[ConversationResponse]
    interaction_timeline: List[InteractionResponse]
    sentiment_history: List[Dict[str, Any]]
    risk_history: List[Dict[str, Any]]
    unresolved_issues: List[TicketResponse]

    class Config:
        from_attributes = True


# --- Track 3: Response Generation & Knowledge Base Schemas ---

class GenerateResponseOutput(BaseModel):
    suggested_response: str
    confidence_score: float
    sources_used: List[str]
    reasoning: str

    class Config:
        from_attributes = True


# --- Track 4: Predictive Support Analytics Schemas ---

class PredictiveRiskResult(BaseModel):
    ticket_id: int
    escalation_probability: float
    risk_level: str
    risk_factors: List[str]
    recommended_action: str

    class Config:
        from_attributes = True