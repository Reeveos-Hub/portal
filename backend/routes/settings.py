from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database
from middleware.auth import get_current_owner
from models.business import OpeningHours, BookingSettings
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/settings", tags=["settings"])


class BusinessSettings(BaseModel):
    opening_hours: Optional[OpeningHours] = None
    booking_settings: Optional[BookingSettings] = None


@router.get("/business/{business_id}")
async def get_business_settings(
    business_id: str,
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
    
    return {
        "opening_hours": business.get("opening_hours"),
        "booking_settings": business.get("booking_settings")
    }


@router.patch("/business/{business_id}")
async def update_business_settings(
    business_id: str,
    settings_update: BusinessSettings,
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
    
    update_data = settings_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    await db.businesses.update_one(
        {"_id": business_id},
        {"$set": update_data}
    )
    
    updated_business = await db.businesses.find_one({"_id": business_id})
    
    return {
        "opening_hours": updated_business.get("opening_hours"),
        "booking_settings": updated_business.get("booking_settings")
    }


@router.post("/business/{business_id}/upgrade-tier")
async def upgrade_tier(
    business_id: str,
    tier: str,
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
    
    valid_tiers = ["free", "pro", "premium"]
    if tier not in valid_tiers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier. Must be one of: {', '.join(valid_tiers)}"
        )
    
    await db.businesses.update_one(
        {"_id": business_id},
        {
            "$set": {
                "rezvo_tier": tier,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"detail": f"Tier upgraded to {tier}"}
