# apps/api/src/services/auth_service.py
from datetime import timedelta
from typing import Optional

from fastapi import HTTPException, status
from pydantic import EmailStr
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
)
from ..db.models import User


def get_user_by_email(db: Session, email: EmailStr) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(
    db: Session,
    *,
    email: EmailStr,
    password: str,
    name: str,
) -> User:
    existing = get_user_by_email(db, email=email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        name=name,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(
    db: Session,
    email: EmailStr,
    password: str,
) -> Optional[User]:
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_user_access_token(user: User) -> str:
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires,
    )
