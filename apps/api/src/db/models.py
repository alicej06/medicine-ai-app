# define our database tables as python classes (ORM models) that map direclty to postgres tables via sqlalchemy

# tables:
# - drug
# - interaction rule
# - label chunk

import uuid
from datetime import datetime

from sqlalchemy import Integer, String, Column, DateTime, Text, func, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base
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

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # the two drugs involved in the interaction (stored by RxCUI or name for now)
    a_rx_cui: Mapped[str] = mapped_column(String, index=True)
    b_rx_cui: Mapped[str] = mapped_column(String, index=True)

    severity: Mapped[str] = mapped_column(String)
    mechanism: Mapped[str] = mapped_column(Text)
    guidance: Mapped[str] = mapped_column(Text)



class LabelChunk(Base):
    __tablename__ = "label_chunk"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rx_cui: Mapped[str] = mapped_column(String, index=True)
    section: Mapped[str] = mapped_column(String)
    chunk_text: Mapped[str] = mapped_column(Text)


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    medications = relationship(
        "UserMedication",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    intake_logs = relationship(
        "MedicationIntakeLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserMedication(Base):
    __tablename__ = "user_medications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    rx_cui = Column(String(50), nullable=False)          # e.g. "8600"
    display_name = Column(String(255), nullable=False)   # e.g. "Metformin"
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    user = relationship("User", back_populates="medications")
    logs = relationship(       
        "MedicationIntakeLog",
        back_populates="user_medication",
        cascade="all, delete-orphan",
    )

class MedicationIntakeLog(Base):
    __tablename__ = "medication_intake_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_medication_id = Column(
        Integer,
        ForeignKey("user_medications.id", ondelete="CASCADE"),
        nullable=False,
    )
    taken_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    note = Column(Text, nullable=True)

    user_medication = relationship("UserMedication", back_populates="logs")
    user = relationship("User", back_populates="intake_logs")

