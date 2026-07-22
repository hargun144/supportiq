from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone, timedelta

try:
    from .. import models
    from .. import schemas
    from ..models import TicketCategory, TicketStatus, AgentSpecialty
    from .ai_service import classify_ticket as ai_classify_ticket
except ImportError:
    try:
        from . import models, schemas
        from .models import TicketCategory, TicketStatus, AgentSpecialty
        from services.ai_service import classify_ticket as ai_classify_ticket
    except ImportError:
        import models
        import schemas
        from models import TicketCategory, TicketStatus, AgentSpecialty
        from services.ai_service import classify_ticket as ai_classify_ticket


def create_audit_log(db: Session, ticket_id: int, action: str, details: dict) -> models.AuditLog:
    """
    Create an audit log entry for a ticket.
    """
    audit_log = models.AuditLog(
        ticket_id=ticket_id,
        action=action,
        details=details
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def create_ticket(db: Session, ticket: schemas.TicketCreate) -> models.Ticket:
    """
    Create a new ticket with AI classification, escalation checks, and agent assignment.
    """
    # 1. Validate customer exists
    customer = db.query(models.Customer).filter(models.Customer.id == ticket.customer_id).first()
    if not customer:
        raise ValueError(f"Customer with id {ticket.customer_id} not found")

    # 2. Instantiate Ticket
    db_ticket = models.Ticket(
        customer_id=ticket.customer_id,
        channel=ticket.channel,
        message_text=ticket.message_text,
        status=TicketStatus.OPEN
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)

    # AuditLog: ticket_created
    create_audit_log(
        db=db,
        ticket_id=db_ticket.id,
        action="ticket_created",
        details={
            "customer_id": ticket.customer_id,
            "channel": ticket.channel.value if hasattr(ticket.channel, "value") else str(ticket.channel)
        }
    )

    # 3. AI Classification
    ai_res = ai_classify_ticket(db_ticket.message_text)
    db_ticket.category = ai_res.category
    db_ticket.priority_score = ai_res.priority_score
    db_ticket.risk_score = ai_res.risk_score
    db_ticket.sentiment = ai_res.sentiment
    db.add(db_ticket)
    db.commit()

    # AuditLog: classified
    create_audit_log(
        db=db,
        ticket_id=db_ticket.id,
        action="classified",
        details={
            "category": db_ticket.category.value if db_ticket.category else None,
            "priority_score": db_ticket.priority_score,
            "risk_score": db_ticket.risk_score,
            "sentiment": db_ticket.sentiment,
            "reasoning": ai_res.reasoning,
            "confidence_score": ai_res.confidence_score
        }
    )

    # 4. Check High-Risk Escalation Rule (risk_score >= 80)
    if db_ticket.risk_score and db_ticket.risk_score >= 80:
        db_ticket.status = TicketStatus.ESCALATED
        db.add(db_ticket)
        db.commit()
        create_audit_log(
            db=db,
            ticket_id=db_ticket.id,
            action="auto_escalated_risk",
            details={
                "reason": "Risk score exceeded threshold (>= 80)",
                "risk_score": db_ticket.risk_score
            }
        )

    # 5. Agent Assignment
    agent_specialty_map = {
        TicketCategory.BILLING: AgentSpecialty.BILLING,
        TicketCategory.TECHNICAL: AgentSpecialty.TECHNICAL,
        TicketCategory.COMPLAINT: AgentSpecialty.COMPLAINT,
        TicketCategory.GENERAL: AgentSpecialty.GENERAL
    }

    target_specialty = agent_specialty_map.get(db_ticket.category, AgentSpecialty.GENERAL)
    selected_agent = None

    specialist_agents = (
        db.query(models.Agent)
        .filter(models.Agent.specialty == target_specialty)
        .order_by(models.Agent.current_load.asc(), models.Agent.id.asc())
        .all()
    )

    if specialist_agents:
        selected_agent = specialist_agents[0]
    else:
        general_agents = (
            db.query(models.Agent)
            .filter(models.Agent.specialty == AgentSpecialty.GENERAL)
            .order_by(models.Agent.current_load.asc(), models.Agent.id.asc())
            .all()
        )
        if general_agents:
            selected_agent = general_agents[0]
        else:
            all_agents = (
                db.query(models.Agent)
                .order_by(models.Agent.current_load.asc(), models.Agent.id.asc())
                .all()
            )
            if all_agents:
                selected_agent = all_agents[0]

    if selected_agent:
        db_ticket.agent_id = selected_agent.id
        selected_agent.current_load += 1
        db.add(selected_agent)
        db.add(db_ticket)
        db.commit()

    db.refresh(db_ticket)

    # AuditLog: agent_assigned
    create_audit_log(
        db=db,
        ticket_id=db_ticket.id,
        action="agent_assigned",
        details={
            "agent_id": db_ticket.agent_id,
            "agent_name": selected_agent.name if selected_agent else None
        }
    )

    return db_ticket


def get_tickets(
    db: Session,
    status: Optional[schemas.TicketStatus] = None,
    category: Optional[schemas.TicketCategory] = None,
    customer_id: Optional[int] = None,
    agent_id: Optional[int] = None,
    priority_min: Optional[int] = None,
    priority_max: Optional[int] = None,
    channel: Optional[schemas.TicketChannel] = None,
    customer_tier: Optional[schemas.CustomerTier] = None,
    skip: int = 0,
    limit: int = 20,
    order_by: str = "created_at_desc"
) -> Tuple[List[models.Ticket], int]:
    """
    Retrieve tickets with filtering, ordering by created_at, and pagination.
    """
    query = db.query(models.Ticket)

    if status:
        query = query.filter(models.Ticket.status == status)
    if category:
        query = query.filter(models.Ticket.category == category)
    if customer_id is not None:
        query = query.filter(models.Ticket.customer_id == customer_id)
    if agent_id is not None:
        query = query.filter(models.Ticket.agent_id == agent_id)
    if priority_min is not None:
        query = query.filter(models.Ticket.priority_score >= priority_min)
    if priority_max is not None:
        query = query.filter(models.Ticket.priority_score <= priority_max)
    if channel:
        query = query.filter(models.Ticket.channel == channel)
    if customer_tier:
        query = query.join(models.Customer).filter(models.Customer.tier == customer_tier)

    total = query.count()

    query = query.options(
        joinedload(models.Ticket.customer),
        joinedload(models.Ticket.agent)
    )

    if order_by == "created_at_asc":
        query = query.order_by(models.Ticket.created_at.asc())
    else:
        query = query.order_by(models.Ticket.created_at.desc())

    tickets = query.offset(skip).limit(limit).all()
    return tickets, total



def get_at_risk_tickets(db: Session, threshold: int = 60) -> List[models.Ticket]:
    """
    Get tickets with risk_score >= threshold, sorted by risk_score descending.
    """
    return (
        db.query(models.Ticket)
        .filter(models.Ticket.risk_score >= threshold)
        .order_by(models.Ticket.risk_score.desc())
        .all()
    )


def get_ticket(db: Session, ticket_id: int) -> models.Ticket:
    """
    Get a single ticket by ID eagerly loading relationships.
    """
    ticket = (
        db.query(models.Ticket)
        .options(
            joinedload(models.Ticket.customer),
            joinedload(models.Ticket.agent),
            joinedload(models.Ticket.audit_logs)
        )
        .filter(models.Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise ValueError(f"Ticket with id {ticket_id} not found")
    return ticket


def update_ticket_status(db: Session, ticket_id: int, status_input: Any) -> models.Ticket:
    """
    Update ticket status, calculate SLA response/resolution metrics, and create audit log.
    """
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise ValueError(f"Ticket with id {ticket_id} not found")

    status_str = status_input.get("status") if isinstance(status_input, dict) else status_input
    if not status_str:
        raise ValueError("Status is required")

    try:
        if isinstance(status_str, TicketStatus):
            new_status = status_str
        else:
            new_status = TicketStatus(str(status_str).lower())
    except ValueError:
        valid_values = [s.value for s in TicketStatus]
        raise ValueError(f"Invalid status value: '{status_str}'. Valid values are: {valid_values}")

    old_status = ticket.status
    now_utc = datetime.now(timezone.utc)

    if old_status != new_status:
        ticket.status = new_status
        ticket.updated_at = now_utc

        # Track first response SLA metrics when moving to IN_PROGRESS
        if new_status == TicketStatus.IN_PROGRESS and ticket.first_response_at is None:
            ticket.first_response_at = now_utc
            created_at = ticket.created_at.replace(tzinfo=timezone.utc) if ticket.created_at.tzinfo is None else ticket.created_at
            minutes = int((now_utc - created_at).total_seconds() / 60)
            ticket.first_response_time = max(0, minutes)

        # Track resolution SLA metrics when moving to RESOLVED
        if new_status == TicketStatus.RESOLVED and old_status != TicketStatus.RESOLVED:
            ticket.resolved_at = now_utc
            created_at = ticket.created_at.replace(tzinfo=timezone.utc) if ticket.created_at.tzinfo is None else ticket.created_at
            resolution_mins = int((now_utc - created_at).total_seconds() / 60)
            ticket.resolution_time = max(0, resolution_mins)

            # Check resolution SLA target (e.g. 1440 minutes = 24 hours)
            if resolution_mins > 1440:
                ticket.sla_breached = True

            # Decrement agent current_load
            if ticket.agent and ticket.agent.current_load > 0:
                ticket.agent.current_load -= 1
                db.add(ticket.agent)

        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        create_audit_log(
            db=db,
            ticket_id=ticket_id,
            action="status_changed",
            details={
                "old_status": old_status.value,
                "new_status": ticket.status.value,
                "first_response_time": ticket.first_response_time,
                "resolution_time": ticket.resolution_time,
                "sla_breached": ticket.sla_breached
            }
        )

    return ticket


def check_and_escalate_overdue_tickets(db: Session, max_hours: int = 24, limit: int = 50) -> List[models.Ticket]:
    """
    Escalate unresolved tickets older than max_hours, flagging SLA breached.
    Optimized bulk processing capped by limit for fast transaction execution.
    """
    now_utc = datetime.now(timezone.utc)
    threshold_time = now_utc - timedelta(hours=max_hours)

    overdue_tickets = (
        db.query(models.Ticket)
        .filter(
            models.Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]),
            models.Ticket.created_at <= threshold_time
        )
        .limit(limit)
        .all()
    )

    escalated = []
    audit_logs_to_add = []
    for t in overdue_tickets:
        t.status = TicketStatus.ESCALATED
        t.sla_breached = True
        t.updated_at = now_utc
        db.add(t)

        audit_log = models.AuditLog(
            ticket_id=t.id,
            action="auto_escalated_sla",
            details={
                "reason": f"Unresolved ticket exceeded {max_hours} hours SLA threshold",
                "max_hours": max_hours
            }
        )
        audit_logs_to_add.append(audit_log)
        escalated.append(t)

    if audit_logs_to_add:
        db.add_all(audit_logs_to_add)

    db.commit()
    return escalated




def get_ticket_audit_log(db: Session, ticket_id: int) -> List[models.AuditLog]:
    """
    Get audit log entries for a specific ticket.
    """
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise ValueError(f"Ticket with id {ticket_id} not found")

    return (
        db.query(models.AuditLog)
        .filter(models.AuditLog.ticket_id == ticket_id)
        .order_by(models.AuditLog.timestamp.asc())
        .all()
    )


def get_recent_audit_logs(db: Session, limit: int = 20) -> List[models.AuditLog]:
    """
    Get recent audit log entries across all tickets.
    """
    return (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )


def classify_ticket(db: Session, ticket_id: int) -> models.Ticket:
    """
    Re-classify a ticket using AI service.
    """
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise ValueError(f"Ticket with id {ticket_id} not found")

    ai_res = ai_classify_ticket(ticket.message_text)
    ticket.category = ai_res.category
    ticket.priority_score = ai_res.priority_score
    ticket.risk_score = ai_res.risk_score
    ticket.sentiment = ai_res.sentiment
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    create_audit_log(
        db=db,
        ticket_id=ticket.id,
        action="classified",
        details={
            "category": ticket.category.value if ticket.category else None,
            "priority_score": ticket.priority_score,
            "risk_score": ticket.risk_score,
            "sentiment": ticket.sentiment,
            "reasoning": ai_res.reasoning,
            "confidence_score": ai_res.confidence_score
        }
    )
    return ticket


def classify_all_tickets(db: Session) -> Dict[str, Any]:
    """
    Classify all tickets currently lacking a category.
    """
    unclassified_tickets = db.query(models.Ticket).filter(models.Ticket.category.is_(None)).all()
    count = len(unclassified_tickets)
    audit_logs_to_add = []
    for ticket in unclassified_tickets:
        ai_res = ai_classify_ticket(ticket.message_text)
        ticket.category = ai_res.category
        ticket.priority_score = ai_res.priority_score
        ticket.risk_score = ai_res.risk_score
        ticket.sentiment = ai_res.sentiment
        db.add(ticket)

        audit_log = models.AuditLog(
            ticket_id=ticket.id,
            action="classified",
            details={
                "category": ticket.category.value if ticket.category else None,
                "priority_score": ticket.priority_score,
                "risk_score": ticket.risk_score,
                "sentiment": ticket.sentiment,
                "reasoning": ai_res.reasoning,
                "confidence_score": ai_res.confidence_score
            }
        )
        audit_logs_to_add.append(audit_log)

    if audit_logs_to_add:
        db.add_all(audit_logs_to_add)

    db.commit()
    return {"classified_count": count}



def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    """
    Get aggregated dashboard statistics including SLA compliance.
    """
    total_tickets = db.query(func.count(models.Ticket.id)).scalar() or 0
    open_tickets = db.query(func.count(models.Ticket.id)).filter(models.Ticket.status == TicketStatus.OPEN).scalar() or 0
    resolved_tickets = db.query(func.count(models.Ticket.id)).filter(models.Ticket.status == TicketStatus.RESOLVED).scalar() or 0
    escalated_tickets = db.query(func.count(models.Ticket.id)).filter(models.Ticket.status == TicketStatus.ESCALATED).scalar() or 0

    avg_priority_raw = db.query(func.avg(models.Ticket.priority_score)).scalar()
    avg_priority = round(float(avg_priority_raw), 2) if avg_priority_raw is not None else 0.0

    avg_risk_raw = db.query(func.avg(models.Ticket.risk_score)).scalar()
    avg_risk = round(float(avg_risk_raw), 2) if avg_risk_raw is not None else 0.0

    sla_breached_count = db.query(func.count(models.Ticket.id)).filter(models.Ticket.sla_breached.is_(True)).scalar() or 0

    avg_res_raw = db.query(func.avg(models.Ticket.resolution_time)).filter(models.Ticket.resolution_time.isnot(None)).scalar()
    avg_resolution_time_minutes = round(float(avg_res_raw), 2) if avg_res_raw is not None else 0.0

    tickets_per_category = {cat.value: 0 for cat in TicketCategory}
    cat_counts = db.query(models.Ticket.category, func.count(models.Ticket.id)).group_by(models.Ticket.category).all()
    for cat, count in cat_counts:
        if cat:
            cat_val = cat.value if hasattr(cat, "value") else str(cat)
            tickets_per_category[cat_val] = count

    tickets_per_agent: Dict[str, int] = {}
    agents = db.query(models.Agent).all()
    for agent in agents:
        tickets_per_agent[agent.name] = 0

    agent_counts = (
        db.query(models.Agent.name, func.count(models.Ticket.id))
        .join(models.Ticket, models.Ticket.agent_id == models.Agent.id, isouter=True)
        .group_by(models.Agent.id, models.Agent.name)
        .all()
    )
    for agent_name, count in agent_counts:
        if agent_name:
            tickets_per_agent[agent_name] = count

    busiest_agent = None
    if tickets_per_agent:
        busiest_name = max(tickets_per_agent, key=tickets_per_agent.get)
        busiest_count = tickets_per_agent[busiest_name]
        busiest_agent = {
            "name": busiest_name,
            "ticket_count": busiest_count
        }

    highest_risk_ticket = (
        db.query(models.Ticket)
        .order_by(models.Ticket.risk_score.desc().nullslast())
        .first()
    )
    highest_risk_info = None
    if highest_risk_ticket:
        highest_risk_info = {
            "id": highest_risk_ticket.id,
            "message_text": highest_risk_ticket.message_text[:100] + "..." if len(highest_risk_ticket.message_text) > 100 else highest_risk_ticket.message_text,
            "risk_score": highest_risk_ticket.risk_score,
            "category": highest_risk_ticket.category.value if highest_risk_ticket.category else None,
            "status": highest_risk_ticket.status.value if highest_risk_ticket.status else None
        }

    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets,
        "escalated_tickets": escalated_tickets,
        "avg_priority": avg_priority,
        "avg_risk": avg_risk,
        "sla_breached_count": sla_breached_count,
        "avg_resolution_time_minutes": avg_resolution_time_minutes,
        "tickets_per_category": tickets_per_category,
        "tickets_per_agent": tickets_per_agent,
        "busiest_agent": busiest_agent,
        "highest_risk_ticket": highest_risk_info
    }