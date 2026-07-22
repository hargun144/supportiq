import enum
from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Boolean, Float, func
from sqlalchemy.orm import relationship

try:
    from .database import Base
    from .utils.security import encrypt_text, decrypt_text
except ImportError:
    from database import Base
    from utils.security import encrypt_text, decrypt_text


class CustomerTier(str, enum.Enum):
    FREE = "free"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class AgentSpecialty(str, enum.Enum):
    BILLING = "billing"
    TECHNICAL = "technical"
    COMPLAINT = "complaint"
    GENERAL = "general"


class TicketChannel(str, enum.Enum):
    EMAIL = "email"
    CHAT = "chat"
    PHONE = "phone"
    SOCIAL = "social"


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class TicketCategory(str, enum.Enum):
    BILLING = "billing"
    TECHNICAL = "technical"
    COMPLAINT = "complaint"
    GENERAL = "general"


class Role(str, enum.Enum):
    ADMIN = "admin"
    AGENT = "agent"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    tier = Column(
        SQLEnum(CustomerTier, name="customer_tier", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    tickets = relationship("Ticket", back_populates="customer", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="customer", cascade="all, delete-orphan")
    interactions = relationship("InteractionHistory", back_populates="customer", cascade="all, delete-orphan")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    specialty = Column(
        SQLEnum(AgentSpecialty, name="agent_specialty", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    current_load = Column(Integer, default=0, nullable=False)

    tickets = relationship("Ticket", back_populates="agent")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    channel = Column(
        SQLEnum(TicketChannel, name="ticket_channel", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    message_text = Column(Text, nullable=False)
    category = Column(
        SQLEnum(TicketCategory, name="ticket_category", values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
        index=True
    )
    priority_score = Column(Integer, nullable=True)
    risk_score = Column(Integer, nullable=True)
    status = Column(
        SQLEnum(TicketStatus, name="ticket_status", values_callable=lambda obj: [e.value for e in obj]),
        default=TicketStatus.OPEN,
        nullable=False,
        index=True
    )
    sentiment = Column(String(50), nullable=True)
    first_response_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    first_response_time = Column(Integer, nullable=True)  # in minutes
    resolution_time = Column(Integer, nullable=True)      # in minutes
    sla_breached = Column(Boolean, default=False, nullable=False, index=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    customer = relationship("Customer", back_populates="tickets")
    agent = relationship("Agent", back_populates="tickets")
    audit_logs = relationship("AuditLog", back_populates="ticket", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="ticket")
    ai_responses = relationship("AIGeneratedResponse", back_populates="ticket", cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="SET NULL"), nullable=True, index=True)
    channel = Column(
        SQLEnum(TicketChannel, name="ticket_channel", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    message = Column(Text, nullable=False)
    sender_type = Column(String(50), nullable=False, default="customer")  # customer, agent, system
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        index=True
    )

    customer = relationship("Customer", back_populates="conversations")
    ticket = relationship("Ticket", back_populates="conversations")


class InteractionHistory(Base):
    __tablename__ = "interaction_history"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    interaction_type = Column(String(100), nullable=False, index=True)
    _interaction_metadata = Column("interaction_metadata", Text, nullable=False)  # Encrypted JSON
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        index=True
    )

    customer = relationship("Customer", back_populates="interactions")

    @property
    def interaction_metadata(self):
        try:
            decrypted = decrypt_text(self._interaction_metadata)
            return json.loads(decrypted)
        except (json.JSONDecodeError, Exception):
            try:
                return decrypt_text(self._interaction_metadata)
            except Exception:
                return {}

    @interaction_metadata.setter
    def interaction_metadata(self, value):
        if isinstance(value, (dict, list)):
            json_str = json.dumps(value)
        else:
            json_str = str(value)
        self._interaction_metadata = encrypt_text(json_str)


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # faq, troubleshooting, policy
    content = Column(Text, nullable=False)
    tags = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )


class AIGeneratedResponse(Base):
    __tablename__ = "ai_generated_responses"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    suggested_response = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False)
    _sources_used = Column("sources_used", Text, nullable=True)
    reasoning = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    ticket = relationship("Ticket", back_populates="ai_responses")

    @property
    def sources_used(self):
        if not self._sources_used:
            return []
        try:
            return json.loads(self._sources_used)
        except Exception:
            return [self._sources_used]

    @sources_used.setter
    def sources_used(self, value):
        if isinstance(value, list):
            self._sources_used = json.dumps(value)
        else:
            self._sources_used = str(value) if value else None


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    _details = Column("details", Text, nullable=False)  # JSON-serializable string (encrypted)
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        index=True
    )

    ticket = relationship("Ticket", back_populates="audit_logs")

    @property
    def details(self):
        """Decrypted details as a Python object (dict/list/etc)"""
        try:
            decrypted = decrypt_text(self._details)
            return json.loads(decrypted)
        except (json.JSONDecodeError, Exception):
            try:
                return decrypt_text(self._details)
            except Exception:
                return {}

    @details.setter
    def details(self, value):
        """Encrypt and store details as JSON string"""
        if isinstance(value, (dict, list)):
            json_str = json.dumps(value)
        else:
            json_str = str(value)
        self._details = encrypt_text(json_str)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(
        SQLEnum(Role, name="user_role", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=Role.AGENT,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )