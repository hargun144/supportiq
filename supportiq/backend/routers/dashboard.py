from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
try:
    from ..database import get_db
    from .. import models
    from .. import schemas
    from ..services import ticket_service
    from ..utils.auth import get_current_user
except ImportError:
    from database import get_db
    import models
    import schemas
    from services import ticket_service
    from utils.auth import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)


@router.get("", response_model=schemas.DashboardResponse)
@router.get("/", response_model=schemas.DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get aggregated dashboard metrics:
    - total_tickets, open_tickets, resolved_tickets, escalated_tickets
    - avg_priority, avg_risk
    - tickets_per_category, tickets_per_agent
    - busiest_agent
    - highest_risk_ticket
    """
    stats = ticket_service.get_dashboard_stats(db)
    return stats
