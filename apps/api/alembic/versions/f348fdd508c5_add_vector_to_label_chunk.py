"""add vector to label_chunk

Revision ID: f348fdd508c5
Revises: f39dd96ef116
Create Date: 2025-10-23 15:22:23.044241

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f348fdd508c5'
down_revision: Union[str, None] = 'f39dd96ef116'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
