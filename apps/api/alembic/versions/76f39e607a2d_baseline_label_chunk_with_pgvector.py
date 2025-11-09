"""baseline: label_chunk with pgvector

Revision ID: 76f39e607a2d
Revises: 
Create Date: 2025-11-09 10:30:44.215501

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'baseline_label_chunk_pgvector'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1) pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 2) table
    op.execute("""
        CREATE TABLE label_chunk (
            id          BIGSERIAL PRIMARY KEY,
            rx_cui      TEXT NULL,
            section     TEXT NULL,
            source_url  TEXT NULL,
            snippet     TEXT NOT NULL,
            emb         VECTOR(384) NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    # 3) small indexes
    op.execute("CREATE INDEX IF NOT EXISTS label_chunk_rx_cui_idx ON label_chunk (rx_cui);")
    op.execute("CREATE INDEX IF NOT EXISTS label_chunk_section_idx ON label_chunk (section);")

    # 4) ANN index
    op.execute("""
        CREATE INDEX IF NOT EXISTS label_chunk_emb_idx
        ON label_chunk USING ivfflat (emb vector_l2_ops) WITH (lists = 100);
    """)

def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS label_chunk_emb_idx;")
    op.execute("DROP INDEX IF EXISTS label_chunk_rx_cui_idx;")
    op.execute("DROP INDEX IF EXISTS label_chunk_section_idx;")
    op.execute("DROP TABLE IF EXISTS label_chunk;")

