"""Fix audit_logs timestamp column

Revision ID: 003_fix_audit_log_timestamp
Revises: 002_add_audit_log_table
Create Date: 2026-07-22 03:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003_fix_audit_log_timestamp'
down_revision: Union[str, None] = '002_add_audit_log_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename the 'created_at' column to 'timestamp' in the audit_logs table
    op.alter_column('audit_logs', 'created_at', new_column_name='timestamp')


def downgrade() -> None:
    # Rename the 'timestamp' column back to 'created_at'
    op.alter_column('audit_logs', 'timestamp', new_column_name='created_at')