from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
try:
    from ..database import get_db
    from .. import models
    from .. import schemas
    from ..services import ticket_service, response_service
    from ..utils.auth import get_current_user
except ImportError:
    from database import get_db
    import models
    import schemas
    from services import ticket_service, response_service
    from utils.auth import get_current_user


router = APIRouter(
    prefix="/tickets",
    tags=["tickets"]
)


@router.post("", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Create a new ticket.
    - Validates customer exists (returns 404 if invalid)
    - Initial status = OPEN
    - Creates AuditLog entry ("ticket_created")
    - Classifies ticket via AI or deterministic fallback (category, priority_score 1-100, risk_score 1-100, sentiment, reasoning, confidence_score)
    - Checks High-Risk Escalation rule (risk_score >= 80 auto-escalates)
    - Creates AuditLog entry ("classified")
    - Automatically assigns agent matching specialty with lowest current_load (or GENERAL agent)
    - Increases agent current_load
    - Creates AuditLog entry ("agent_assigned")
    """
    try:
        db_ticket = ticket_service.create_ticket(db, ticket)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return db_ticket


@router.get("", response_model=schemas.TicketPage)
@router.get("/", response_model=schemas.TicketPage)
def get_tickets(
    status: Optional[schemas.TicketStatus] = Query(None, description="Filter by status"),
    category: Optional[schemas.TicketCategory] = Query(None, description="Filter by category"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    agent_id: Optional[int] = Query(None, description="Filter by assigned agent ID"),
    priority_min: Optional[int] = Query(None, ge=1, le=100, description="Minimum priority score"),
    priority_max: Optional[int] = Query(None, ge=1, le=100, description="Maximum priority score"),
    channel: Optional[schemas.TicketChannel] = Query(None, description="Filter by channel"),
    customer_tier: Optional[schemas.CustomerTier] = Query(None, description="Filter by customer tier"),
    skip: int = Query(0, ge=0, description="Pagination skip offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    order_by: str = Query("created_at_desc", description="Ordering by created_at (created_at_desc or created_at_asc)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieve tickets with optional filtering and pagination.
    """
    tickets, total = ticket_service.get_tickets(
        db=db,
        status=status,
        category=category,
        customer_id=customer_id,
        agent_id=agent_id,
        priority_min=priority_min,
        priority_max=priority_max,
        channel=channel,
        customer_tier=customer_tier,
        skip=skip,
        limit=limit,
        order_by=order_by
    )
    return schemas.TicketPage(tickets=tickets, total=total)


@router.get("/at-risk", response_model=List[schemas.TicketResponse])
def get_at_risk_tickets(
    threshold: int = Query(60, ge=1, le=100, description="Risk score threshold (1-100)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get tickets with risk_score >= threshold, sorted by risk_score descending.
    """
    tickets = ticket_service.get_at_risk_tickets(db, threshold)
    return tickets


@router.post("/check-sla", response_model=dict)
def check_sla_escalations(
    max_hours: int = Query(24, ge=0, le=720, description="SLA hours threshold"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Check and automatically escalate unresolved tickets exceeding the SLA hour threshold.
    """
    escalated = ticket_service.check_and_escalate_overdue_tickets(db, max_hours=max_hours)
    return {
        "escalated_count": len(escalated),
        "escalated_ticket_ids": [t.id for t in escalated]
    }


@router.get("/audit-log/recent", response_model=List[dict])
def get_recent_audit_logs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get the most recent audit log entries across all tickets, ordered by timestamp descending.
    """
    audit_logs = ticket_service.get_recent_audit_logs(db, limit)
    result = []
    for log in audit_logs:
        log_entry = {
            "id": log.id,
            "ticket_id": log.ticket_id,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp.isoformat()
        }
        result.append(log_entry)
    return result


@router.post("/classify-all", response_model=dict)
def classify_all_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Classify all tickets that currently have category=null (unclassified).
    """
    result = ticket_service.classify_all_tickets(db)
    return result


@router.get("/{ticket_id}", response_model=schemas.TicketDetailResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get detailed view of a specific ticket by ID.
    """
    try:
        ticket = ticket_service.get_ticket(db, ticket_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    return ticket


@router.patch("/{ticket_id}", response_model=schemas.TicketDetailResponse)
def update_ticket_status(
    ticket_id: int,
    status_update: schemas.TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Update ticket status while preserving agent and customer relations.
    Allowed statuses: OPEN, IN_PROGRESS, RESOLVED, ESCALATED.
    """
    try:
        ticket = ticket_service.update_ticket_status(db, ticket_id, status_update.status)
        # Eager load full ticket details including agent and customer
        full_ticket = ticket_service.get_ticket(db, ticket.id)
    except ValueError as e:
        detail = str(e)
        if "not found" in detail.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
    return full_ticket



@router.get("/{ticket_id}/audit-log", response_model=List[dict])
def get_ticket_audit_log(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all audit log entries for a specific ticket, ordered by timestamp ascending.
    """
    try:
        audit_logs = ticket_service.get_ticket_audit_log(db, ticket_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    result = []
    for log in audit_logs:
        log_entry = {
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp.isoformat()
        }
        result.append(log_entry)
    return result


@router.post("/{ticket_id}/classify", response_model=schemas.TicketResponse)
def classify_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Re-classify a ticket by its message_text.
    """
    try:
        ticket = ticket_service.classify_ticket(db, ticket_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return ticket


@router.post("/{ticket_id}/generate-response", response_model=schemas.GenerateResponseOutput)
def generate_ai_response(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Track 3: Automated Response Generation API with RAG Knowledge Base.
    Generates suggested response, confidence score, sources used, and reasoning.
    """
    try:
        response_data = response_service.generate_ticket_response(db, ticket_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return response_data


# Customers sub-router
customers_router = APIRouter(
    prefix="/customers",
    tags=["customers"]
)

@customers_router.get("", response_model=List[schemas.CustomerResponse])
@customers_router.get("/", response_model=List[schemas.CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Customer).all()


@customers_router.get("/{customer_id}/context", response_model=schemas.Customer360ContextResponse)
def get_customer_context(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Track 2: Customer 360 Context System.
    Returns customer profile, tier, previous tickets, conversations, interaction timeline, sentiment/risk trends, and unresolved issues.
    """
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer with id {customer_id} not found")

    tickets = db.query(models.Ticket).filter(models.Ticket.customer_id == customer_id).order_by(models.Ticket.created_at.desc()).all()
    conversations = db.query(models.Conversation).filter(models.Conversation.customer_id == customer_id).order_by(models.Conversation.timestamp.asc()).all()
    interactions = db.query(models.InteractionHistory).filter(models.InteractionHistory.customer_id == customer_id).order_by(models.InteractionHistory.timestamp.asc()).all()

    sentiment_history = [
        {"ticket_id": t.id, "sentiment": t.sentiment, "created_at": t.created_at.isoformat()}
        for t in tickets if t.sentiment
    ]

    risk_history = [
        {"ticket_id": t.id, "risk_score": t.risk_score, "created_at": t.created_at.isoformat()}
        for t in tickets if t.risk_score is not None
    ]

    unresolved_issues = [t for t in tickets if t.status in (models.TicketStatus.OPEN, models.TicketStatus.IN_PROGRESS, models.TicketStatus.ESCALATED)]

    return {
        "customer_profile": customer,
        "customer_tier": customer.tier,
        "previous_tickets": tickets,
        "conversations": conversations,
        "interaction_timeline": interactions,
        "sentiment_history": sentiment_history,
        "risk_history": risk_history,
        "unresolved_issues": unresolved_issues
    }


# Agents sub-router
agents_router = APIRouter(
    prefix="/agents",
    tags=["agents"]
)

@agents_router.get("", response_model=List[schemas.AgentResponse])
@agents_router.get("/", response_model=List[schemas.AgentResponse])
def get_agents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Agent).all()