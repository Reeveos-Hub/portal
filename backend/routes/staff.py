from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database
from middleware.auth import get_current_owner
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, time

router = APIRouter(prefix="/staff", tags=["staff"])


class StaffCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str = "stylist"
    specialties: List[str] = []
    bio: Optional[str] = None


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    specialties: Optional[List[str]] = None
    bio: Optional[str] = None
    active: Optional[bool] = None


class StaffSchedule(BaseModel):
    staff_id: str
    day: str
    start_time: time
    end_time: time
    available: bool = True


@router.post("/business/{business_id}/staff")
async def add_staff_member(
    business_id: str,
    staff_data: StaffCreate,
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    if business["owner_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if business.get("tier") not in ["team", "venue"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staff management only available for team and venue tiers"
        )
    
    staff_dict = staff_data.model_dump()
    staff_dict["id"] = f"staff_{datetime.utcnow().timestamp()}"
    staff_dict["active"] = True
    staff_dict["created_at"] = datetime.utcnow()
    
    await db.businesses.update_one(
        {"_id": business_id},
        {
            "$push": {"staff": staff_dict},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return staff_dict


@router.get("/business/{business_id}/staff")
async def get_staff_members(business_id: str):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    staff = business.get("staff", [])
    
    return staff


@router.patch("/business/{business_id}/staff/{staff_id}")
async def update_staff_member(
    business_id: str,
    staff_id: str,
    staff_update: StaffUpdate,
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    if business["owner_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    staff = business.get("staff", [])
    staff_index = None
    for i, member in enumerate(staff):
        if member.get("id") == staff_id:
            staff_index = i
            break
    
    if staff_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
    
    update_data = staff_update.model_dump(exclude_unset=True)
    staff[staff_index].update(update_data)
    
    await db.businesses.update_one(
        {"_id": business_id},
        {"$set": {"staff": staff, "updated_at": datetime.utcnow()}}
    )
    
    return staff[staff_index]


@router.delete("/business/{business_id}/staff/{staff_id}")
async def delete_staff_member(
    business_id: str,
    staff_id: str,
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    if business["owner_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    staff = business.get("staff", [])
    staff = [member for member in staff if member.get("id") != staff_id]
    
    await db.businesses.update_one(
        {"_id": business_id},
        {"$set": {"staff": staff, "updated_at": datetime.utcnow()}}
    )
    
    return {"detail": "Staff member removed successfully"}
