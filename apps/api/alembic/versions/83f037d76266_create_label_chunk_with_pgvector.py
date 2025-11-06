"""create label_chunk with pgvector

Revision ID: create_label_chunk_with_pgvector
Revises: 
Create Date: 2025-11-05

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "create_label_chunk_with_pgvector"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1) Ensure pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 2) Create table (raw SQL so we can specify vector(384) precisely)
    op.execute("""
        CREATE TABLE IF NOT EXISTS label_chunk (
            id          BIGSERIAL PRIMARY KEY,
            rx_cui      TEXT NULL,
            section     TEXT NULL,
            source_url  TEXT NULL,
            snippet     TEXT NOT NULL,
            emb         VECTOR(384) NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    # 3) Helpful secondary indexes (cheap)
    op.execute("CREATE INDEX IF NOT EXISTS label_chunk_rx_cui_idx ON label_chunk (rx_cui);")
    op.execute("CREATE INDEX IF NOT EXISTS label_chunk_section_idx ON label_chunk (section);")

    # 4) IVFFlat ANN index on embeddings (requires ANALYZE after bulk load for best results)
    op.execute("""
        CREATE INDEX IF NOT EXISTS label_chunk_emb_idx
        ON label_chunk USING ivfflat (emb vector_l2_ops) WITH (lists = 100);
    """)

    # op.execute("CREATE INDEX IF NOT EXISTS label_chunk_source_url_idx ON label_chunk (source_url);")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS label_chunk_emb_idx;")
    op.execute("DROP INDEX IF EXISTS label_chunk_rx_cui_idx;")
    op.execute("DROP INDEX IF EXISTS label_chunk_section_idx;")
    op.execute("DROP TABLE IF EXISTS label_chunk;")
    # op.execute("DROP EXTENSION IF EXISTS vector;")  
