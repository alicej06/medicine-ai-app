# apps/api/src/schemas/auth.py
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

from .medication import UserMedicationOut


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    role: Optional[str] = None
    medications: List[UserMedicationOut] = []

    class Config:
        from_attributes = True  
