from pydantic import BaseModel, Field
from typing import Optional


class LocationBase(BaseModel):
    name: str
    slug: str
    county: Optional[str] = None
    region: str
    lat: float
    lng: float
    population: Optional[int] = None


class Location(LocationBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True


class LocationResponse(BaseModel):
    id: str
    name: str
    slug: str
    county: Optional[str] = None
    region: str
    lat: float
    lng: float

    class Config:
        from_attributes = True
