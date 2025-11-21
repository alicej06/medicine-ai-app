"""add medication intake log

Revision ID: df81f8126aa3
Revises: add_users_and_user_medications
Create Date: 2025-11-15 20:58:26.295152

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'add_medication_intake_log'
down_revision: Union[str, None] = 'add_users_and_user_medications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
     op.create_table(
        "medication_intake_logs",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_medication_id",
            sa.Integer,
            sa.ForeignKey("user_medications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "taken_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column("note", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("medication_intake_logs")

