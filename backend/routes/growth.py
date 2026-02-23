from fastapi import APIRouter, HTTPException, status, Depends, Query
from database import get_database
from middleware.auth import get_current_owner
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/growth", tags=["growth"])


class LeadCreate(BaseModel):
    business_id: str
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None
    message: Optional[str] = None


@router.post("/leads")
async def create_lead(lead_data: LeadCreate):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": lead_data.business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    lead_dict = lead_data.model_dump()
    lead_dict["created_at"] = datetime.utcnow()
    lead_dict["status"] = "new"
    lead_dict["contacted"] = False
    
    result = await db.leads.insert_one(lead_dict)
    
    return {"detail": "Lead submitted successfully", "id": str(result.inserted_id)}


@router.get("/business/{business_id}/leads")
async def get_business_leads(
    business_id: str,
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
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
    
    total = await db.leads.count_documents({"business_id": business_id})
    
    leads = await db.leads.find({"business_id": business_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(length=None)
    
    return {
        "total": total,
        "limit": limit,
        "skip": skip,
        "results": leads
    }


@router.get("/business/{business_id}/notify-count")
async def get_notify_count(business_id: str):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    return {
        "business_id": business_id,
        "notify_count": business.get("notify_count", 0),
        "threshold": 25
    }


@router.post("/business/{business_id}/send-warm-lead-email")
async def send_warm_lead_email(
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
    
    if business.get("notify_count", 0) < 25:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough notifications to send warm lead email"
        )
    
    return {"detail": "Warm lead email sent successfully"}
