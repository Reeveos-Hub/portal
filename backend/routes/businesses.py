from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database
from models.business import BusinessCreate, BusinessUpdate, BusinessResponse, RezvoTier
from middleware.auth import get_current_owner
from datetime import datetime
from typing import List
import re

router = APIRouter(prefix="/businesses", tags=["businesses"])


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = re.sub(r'^-+|-+$', '', text)
    return text


@router.post("/", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
async def create_business(
    business_data: BusinessCreate,
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    
    slug = slugify(business_data.name)
    
    existing = await db.businesses.find_one({"slug": slug})
    if existing:
        slug = f"{slug}-{datetime.utcnow().timestamp()}"
    
    business_dict = business_data.model_dump()
    business_dict.update({
        "slug": slug,
        "claimed": True,
        "owner_id": str(current_user["_id"]),
        "rezvo_tier": RezvoTier.FREE.value,
        "tier": business_data.tier.value,
        "promoted": False,
        "notify_count": 0,
        "rating": None,
        "review_count": 0,
        "photo_refs": [],
        "staff": [],
        "menu": [],
        "custom_photos": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    result = await db.businesses.insert_one(business_dict)
    business_id = str(result.inserted_id)
    
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$addToSet": {"business_ids": business_id}}
    )
    
    business_dict["_id"] = business_id
    
    return BusinessResponse(
        id=business_id,
        name=business_dict["name"],
        slug=business_dict["slug"],
        category=business_dict["category"],
        address=business_dict["address"],
        phone=business_dict.get("phone"),
        website=business_dict.get("website"),
        lat=business_dict["lat"],
        lng=business_dict["lng"],
        rating=business_dict.get("rating"),
        review_count=business_dict["review_count"],
        price_level=business_dict.get("price_level"),
        photo_refs=business_dict["photo_refs"],
        claimed=business_dict["claimed"],
        rezvo_tier=RezvoTier(business_dict["rezvo_tier"]),
        tier=business_dict["tier"],
        promoted=business_dict["promoted"],
        opening_hours=business_dict.get("opening_hours")
    )


@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business(business_id: str):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    return BusinessResponse(
        id=str(business["_id"]),
        name=business["name"],
        slug=business["slug"],
        category=business["category"],
        address=business["address"],
        phone=business.get("phone"),
        website=business.get("website"),
        lat=business["lat"],
        lng=business["lng"],
        rating=business.get("rating"),
        review_count=business["review_count"],
        price_level=business.get("price_level"),
        photo_refs=business.get("photo_refs", []),
        claimed=business["claimed"],
        rezvo_tier=RezvoTier(business["rezvo_tier"]),
        tier=business.get("tier"),
        promoted=business.get("promoted", False),
        opening_hours=business.get("opening_hours")
    )


@router.patch("/{business_id}", response_model=BusinessResponse)
async def update_business(
    business_id: str,
    business_update: BusinessUpdate,
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
            detail="Not authorized to update this business"
        )
    
    update_data = business_update.model_dump(exclude_unset=True)
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
    
    return BusinessResponse(
        id=str(updated_business["_id"]),
        name=updated_business["name"],
        slug=updated_business["slug"],
        category=updated_business["category"],
        address=updated_business["address"],
        phone=updated_business.get("phone"),
        website=updated_business.get("website"),
        lat=updated_business["lat"],
        lng=updated_business["lng"],
        rating=updated_business.get("rating"),
        review_count=updated_business["review_count"],
        price_level=updated_business.get("price_level"),
        photo_refs=updated_business.get("photo_refs", []),
        claimed=updated_business["claimed"],
        rezvo_tier=RezvoTier(updated_business["rezvo_tier"]),
        tier=updated_business.get("tier"),
        promoted=updated_business.get("promoted", False),
        opening_hours=updated_business.get("opening_hours")
    )


@router.delete("/{business_id}")
async def delete_business(
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
            detail="Not authorized to delete this business"
        )
    
    await db.businesses.delete_one({"_id": business_id})
    
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$pull": {"business_ids": business_id}}
    )
    
    return {"detail": "Business deleted successfully"}


@router.post("/{business_id}/claim")
async def claim_business(
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
    
    if business.get("claimed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Business already claimed"
        )
    
    await db.businesses.update_one(
        {"_id": business_id},
        {
            "$set": {
                "claimed": True,
                "owner_id": str(current_user["_id"]),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$addToSet": {"business_ids": business_id}}
    )
    
    return {"detail": "Business claimed successfully"}


@router.get("/owner/my-businesses")
async def get_my_businesses(current_user: dict = Depends(get_current_owner)):
    db = get_database()
    
    businesses = await db.businesses.find(
        {"owner_id": str(current_user["_id"])}
    ).to_list(length=None)
    
    return businesses
