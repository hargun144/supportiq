"""Initial schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-07-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enum types
    customer_tier = sa.Enum('free', 'premium', 'enterprise', name='customer_tier')
    agent_specialty = sa.Enum('billing', 'technical', 'complaint', 'general', name='agent_specialty')
    ticket_channel = sa.Enum('email', 'chat', 'phone', 'social', name='ticket_channel')
    ticket_status = sa.Enum('open', 'in_progress', 'resolved', 'escalated', name='ticket_status')
    ticket_category = sa.Enum('billing', 'technical', 'complaint', 'general', name='ticket_category')

    # Create customers table
    op.create_table(
        'customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('tier', customer_tier, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_customers_id'), 'customers', ['id'], unique=False)
    op.create_index(op.f('ix_customers_email'), 'customers', ['email'], unique=True)

    # Create agents table
    op.create_table(
        'agents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('specialty', agent_specialty, nullable=False),
        sa.Column('current_load', sa.Integer(), server_default='0', nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_agents_id'), 'agents', ['id'], unique=False)

    # Create tickets table
    op.create_table(
        'tickets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=True),
        sa.Column('channel', ticket_channel, nullable=False),
        sa.Column('message_text', sa.Text(), nullable=False),
        sa.Column('category', ticket_category, nullable=True),
        sa.Column('priority_score', sa.Integer(), nullable=True),
        sa.Column('risk_score', sa.Integer(), nullable=True),
        sa.Column('status', ticket_status, server_default='open', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tickets_id'), 'tickets', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tickets_id'), table_name='tickets')
    op.drop_table('tickets')
    op.drop_index(op.f('ix_agents_id'), table_name='agents')
    op.drop_table('agents')
    op.drop_index(op.f('ix_customers_email'), table_name='customers')
    op.drop_index(op.f('ix_customers_id'), table_name='customers')
    op.drop_table('customers')

    sa.Enum(name='ticket_category').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='ticket_status').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='ticket_channel').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='agent_specialty').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='customer_tier').drop(op.get_bind(), checkfirst=False)
