"""add source_url to label_chunk

Revision ID: 99c623940c61
Revises: 4d3ca4df861b
Create Date: 2025-11-05 21:07:51.120797

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99c623940c61'
down_revision: Union[str, None] = '4d3ca4df861b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE label_chunk ADD COLUMN IF NOT EXISTS source_url TEXT;")



def downgrade() -> None:
    op.execute("ALTER TABLE label_chunk DROP COLUMN IF EXISTS source_url;")

