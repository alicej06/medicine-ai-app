"""normalize label_chunk: add snippet

Revision ID: ce28485f48fd
Revises: 99c623940c61
Create Date: 2025-11-05 21:25:06.858606

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce28485f48fd'
down_revision: Union[str, None] = '99c623940c61'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE label_chunk ADD COLUMN IF NOT EXISTS snippet TEXT;")
    # Backfill snippet from alternative columns if present
    op.execute("""
        DO $$
        DECLARE
            has_chunk_text boolean;
            has_text boolean;
            has_body boolean;
        BEGIN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='label_chunk' AND column_name='chunk_text'
            ) INTO has_chunk_text;

            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='label_chunk' AND column_name='text'
            ) INTO has_text;

            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='label_chunk' AND column_name='body'
            ) INTO has_body;

            IF has_chunk_text THEN
                UPDATE label_chunk SET snippet = COALESCE(snippet, chunk_text);
            END IF;
            IF has_text THEN
                UPDATE label_chunk SET snippet = COALESCE(snippet, text);
            END IF;
            IF has_body THEN
                UPDATE label_chunk SET snippet = COALESCE(snippet, body);
            END IF;
        END$$;
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE label_chunk DROP COLUMN IF EXISTS snippet;")

