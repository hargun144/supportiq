from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any

try:
    from ..database import get_db
    from .. import models, schemas
    from ..services import risk_service
    from ..utils.auth import get_current_user
except ImportError:
    from database import get_db
    import models, schemas
    from services import risk_service
    from utils.auth import get_current_user

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"]
)


@router.get("/risk-predictions", response_model=List[schemas.PredictiveRiskResult])
def get_risk_predictions(
    limit: int = Query(50, ge=1, le=200, description="Max predictions to return"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Track 4: Predictive Support Analytics API.
    Returns escalation probabilities, risk levels, contributing risk factors, and recommended actions across tickets.
    """
    predictions = risk_service.get_all_risk_predictions(db, limit=limit)
    return predictions
