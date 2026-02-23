from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    DINER = "diner"
    OWNER = "owner"
    STAFF = "staff"
    ADMIN = "admin"


class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.DINER


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None


class User(UserBase):
    id: str = Field(alias="_id")
    password_hash: str
    avatar: Optional[str] = None
    saved_businesses: List[str] = []
    booking_history: List[str] = []
    review_history: List[str] = []
    business_ids: List[str] = []
    stripe_connected: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: UserRole
    avatar: Optional[str] = None
    saved_businesses: List[str] = []
    business_ids: List[str] = []
    stripe_connected: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
