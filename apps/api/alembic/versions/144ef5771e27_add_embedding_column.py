"""add embedding column

Revision ID: 144ef5771e27
Revises: f348fdd508c5
Create Date: 2025-10-26 17:52:47.478649

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '144ef5771e27'
down_revision: Union[str, None] = 'f348fdd508c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE label_chunk ADD COLUMN emb vector(384);")


def downgrade() -> None:
     op.execute("ALTER TABLE label_chunk DROP COLUMN emb;")
