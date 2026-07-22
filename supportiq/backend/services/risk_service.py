from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Dict, Any, List
from datetime import datetime, timezone

try:
    from .. import models
    from .. import schemas
except ImportError:
    try:
        from . import models, schemas
    except ImportError:
        import models
        import schemas


def evaluate_ticket_risk(db: Session, ticket: models.Ticket) -> Dict[str, Any]:
    """
    Predictive Support Analytics Engine.
    Evaluates escalation probability, risk level, risk factors, and recommended actions.
    """
    prob = 0.10  # Base probability
    factors = []

    # 1. Sentiment Factor
    sentiment = (ticket.sentiment or "").lower()
    if sentiment == "frustrated":
        prob += 0.25
        factors.append("Customer sentiment is frustrated")
    elif sentiment == "negative":
        prob += 0.15
        factors.append("Customer sentiment is negative")

    # 2. Customer Tier Factor
    if ticket.customer:
        tier_val = ticket.customer.tier.value.lower() if hasattr(ticket.customer.tier, "value") else str(ticket.customer.tier).lower()
        if tier_val == "enterprise":
            prob += 0.20
            factors.append("Enterprise tier customer SLA sensitivity")
        elif tier_val == "premium":
            prob += 0.10
            factors.append("Premium tier customer account")

    # 3. Category & Priority Factor
    cat_val = ticket.category.value.lower() if ticket.category and hasattr(ticket.category, "value") else str(ticket.category or "").lower()
    if cat_val == "complaint":
        prob += 0.20
        factors.append("Ticket category is Complaint")
    elif cat_val == "technical":
        prob += 0.10
        factors.append("Technical issue category")

    if ticket.priority_score and ticket.priority_score >= 70:
        prob += 0.15
        factors.append(f"High priority score ({ticket.priority_score})")

    # 4. SLA Status & Ticket Age
    if ticket.sla_breached:
        prob += 0.30
        factors.append("SLA deadline has been breached")

    now_utc = datetime.now(timezone.utc)
    created_at = ticket.created_at.replace(tzinfo=timezone.utc) if ticket.created_at.tzinfo is None else ticket.created_at
    age_hours = (now_utc - created_at).total_seconds() / 3600.0

    if age_hours > 24:
        prob += 0.20
        factors.append(f"Ticket has been open for {round(age_hours, 1)} hours")

    # 5. Customer History (Previous Complaints)
    if ticket.customer_id:
        past_complaints = (
            db.query(models.Ticket)
            .filter(
                models.Ticket.customer_id == ticket.customer_id,
                models.Ticket.id != ticket.id,
                models.Ticket.category == models.TicketCategory.COMPLAINT
            )
            .count()
        )
        if past_complaints > 0:
            prob += min(0.20, past_complaints * 0.10)
            factors.append(f"Customer has {past_complaints} previous complaint tickets")

    escalation_probability = min(1.0, round(prob, 2))

    # Determine Risk Level & Recommended Action
    if escalation_probability >= 0.85:
        risk_level = "CRITICAL"
        action = "Immediate phone outreach & assign Senior Support Lead"
    elif escalation_probability >= 0.65:
        risk_level = "HIGH"
        action = "Prioritize ticket response & monitor SLA breach timer"
    elif escalation_probability >= 0.35:
        risk_level = "MEDIUM"
        action = "Assign specialist agent and follow standard queue priority"
    else:
        risk_level = "LOW"
        action = "Standard automated or tier-1 agent response"

    return {
        "ticket_id": ticket.id,
        "escalation_probability": escalation_probability,
        "risk_level": risk_level,
        "risk_factors": factors,
        "recommended_action": action
    }


def get_all_risk_predictions(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get predictive risk evaluations across open/active tickets.
    """
    tickets = (
        db.query(models.Ticket)
        .options(joinedload(models.Ticket.customer))
        .filter(models.Ticket.status.in_([models.TicketStatus.OPEN, models.TicketStatus.IN_PROGRESS, models.TicketStatus.ESCALATED]))
        .order_by(models.Ticket.risk_score.desc().nullslast())
        .limit(limit)
        .all()
    )

    predictions = [evaluate_ticket_risk(db, t) for t in tickets]
    # Sort by escalation probability descending
    predictions.sort(key=lambda x: x["escalation_probability"], reverse=True)
    return predictions
