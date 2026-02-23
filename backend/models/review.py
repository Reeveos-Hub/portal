from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class ReviewCategories(BaseModel):
    food: Optional[int] = None
    service: Optional[int] = None
    atmosphere: Optional[int] = None
    value: Optional[int] = None


class ReviewBase(BaseModel):
    business_id: str
    rating: int = Field(..., ge=1, le=5)
    body: Optional[str] = None
    categories: Optional[ReviewCategories] = None


class ReviewCreate(ReviewBase):
    reservation_id: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    body: Optional[str] = None
    categories: Optional[ReviewCategories] = None


class Review(ReviewBase):
    id: str = Field(alias="_id")
    user_id: str
    reservation_id: Optional[str] = None
    photos: List[str] = []
    helpful_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class ReviewResponse(BaseModel):
    id: str
    business_id: str
    user_id: str
    rating: int
    body: Optional[str] = None
    categories: Optional[ReviewCategories] = None
    photos: List[str] = []
    helpful_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
