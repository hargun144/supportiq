from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

try:
    from ..database import get_db
    from .. import models, schemas
    from ..services import ticket_service
    from ..utils.auth import get_current_user
except ImportError:
    from database import get_db
    import models, schemas
    from services import ticket_service
    from utils.auth import get_current_user

router = APIRouter(
    prefix="/channels",
    tags=["channels"]
)


def _ingest_channel_message(
    db: Session,
    payload: schemas.ChannelMessageIngest,
    channel: models.TicketChannel
) -> schemas.TicketResponse:
    """
    Unified Ingestion Core Pipeline:
    1. Resolves/creates customer profile.
    2. Creates new ticket (invoking AI classification + agent assignment).
    3. Records Conversation transcript.
    4. Records InteractionHistory timeline entry.
    """
    # 1. Resolve Customer
    customer = None
    if payload.customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == payload.customer_id).first()

    if not customer and payload.customer_email:
        customer = db.query(models.Customer).filter(models.Customer.email == payload.customer_email).first()

    if not customer:
        email = payload.customer_email or f"customer_{int(datetime.now(timezone.utc).timestamp())}@supportiq.io"
        name = payload.customer_name or "Anonymous Customer"
        customer = models.Customer(
            name=name,
            email=email,
            tier=models.CustomerTier.FREE
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    # 2. Create Ticket via Service (Triggers AI Classification + Agent Assignment)
    ticket_create = schemas.TicketCreate(
        customer_id=customer.id,
        channel=channel,
        message_text=payload.message_text
    )
    ticket = ticket_service.create_ticket(db, ticket_create)

    # 3. Create Conversation Record
    conversation = models.Conversation(
        customer_id=customer.id,
        ticket_id=ticket.id,
        channel=channel,
        message=payload.message_text,
        sender_type="customer"
    )
    db.add(conversation)

    # 4. Create Interaction History Record
    interaction = models.InteractionHistory(
        customer_id=customer.id,
        interaction_type=f"ingest_{channel.value}",
        interaction_metadata=payload.metadata or {"source": channel.value, "ticket_id": ticket.id}
    )
    db.add(interaction)
    db.commit()

    return ticket


@router.post("/email", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED)
def ingest_email(
    payload: schemas.ChannelMessageIngest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Unified Ingestion API for Email Channel.
    """
    return _ingest_channel_message(db, payload, models.TicketChannel.EMAIL)


@router.post("/chat", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED)
def ingest_chat(
    payload: schemas.ChannelMessageIngest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Unified Ingestion API for Chat Channel.
    """
    return _ingest_channel_message(db, payload, models.TicketChannel.CHAT)


@router.post("/social", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED)
def ingest_social(
    payload: schemas.ChannelMessageIngest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Unified Ingestion API for Social Media Channel.
    """
    return _ingest_channel_message(db, payload, models.TicketChannel.SOCIAL)


@router.post("/phone", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED)
def ingest_phone(
    payload: schemas.ChannelMessageIngest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Unified Ingestion API for Phone Call Channel.
    """
    return _ingest_channel_message(db, payload, models.TicketChannel.PHONE)
