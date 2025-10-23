# define our database tables as python classes (ORM models) that map direclty to postgres tables via sqlalchemy

# tables:
# - drug
# - interaction rule
# - label chunk

from sqlalchemy import Integer, String, DateTime, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
class Drug(Base):
    __tablename__ = "drug"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # the RxNorm id for the drug
    rx_cui: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    generic_name: Mapped[str] = mapped_column(String, index=True)
    brand_names: Mapped[list[str] | None] = mapped_column(ARRAY(String), default =[])
    extra: Mapped[dict | None] = mapped_column(JSONB, default={})
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())


class InteractionRule(Base):
    __tablename__ = "interaction_rule"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement = True)
    # the two drugs involved in the interaction (stored by RxCUI)
    a_rx_cui: Mapped[str] = mapped_column(String, index=True)
    b_rx_cui: Mapped[str] = mapped_column(String, index=True)

    severity: Mapped[str] = mapped_column(String)
    mechanism: Mapped[str] = mapped_column(Text)
    guidance: Mapped[str] = mapped_column(Text)
    evidence_ids: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=[])


class LabelChunk(Base):
    __tablename__ = "label_chunk"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rx_cui: Mapped[str] = mapped_column(String, index=True)
    section: Mapped[str] = mapped_column(String)
    chunk_text: Mapped[str] = mapped_column(Text)
