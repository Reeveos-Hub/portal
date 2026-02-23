from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date, time
from enum import Enum


class ReservationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SEATED = "seated"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"


class DepositStatus(str, Enum):
    NOT_REQUIRED = "not_required"
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"


class ReservationBase(BaseModel):
    business_id: str
    date: date
    time: time
    duration_minutes: int = 60
    party_size: int
    notes: Optional[str] = None
    special_requests: Optional[str] = None


class ReservationCreate(ReservationBase):
    table_id: Optional[str] = None
    staff_id: Optional[str] = None
    service_id: Optional[str] = None


class ReservationUpdate(BaseModel):
    date: Optional[date] = None
    time: Optional[time] = None
    duration_minutes: Optional[int] = None
    party_size: Optional[int] = None
    table_id: Optional[str] = None
    staff_id: Optional[str] = None
    status: Optional[ReservationStatus] = None
    notes: Optional[str] = None


class Reservation(ReservationBase):
    id: str = Field(alias="_id")
    user_id: str
    table_id: Optional[str] = None
    staff_id: Optional[str] = None
    service_id: Optional[str] = None
    status: ReservationStatus = ReservationStatus.PENDING
    deposit_amount: Optional[float] = None
    deposit_status: DepositStatus = DepositStatus.NOT_REQUIRED
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class ReservationResponse(BaseModel):
    id: str
    business_id: str
    user_id: str
    date: date
    time: time
    duration_minutes: int
    party_size: int
    table_id: Optional[str] = None
    staff_id: Optional[str] = None
    status: ReservationStatus
    deposit_amount: Optional[float] = None
    deposit_status: DepositStatus
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
