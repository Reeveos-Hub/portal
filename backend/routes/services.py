from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database
from middleware.auth import get_current_owner
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/services", tags=["services"])


class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: Optional[str] = None


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    category: Optional[str] = None
    active: Optional[bool] = None


@router.post("/business/{business_id}/services")
async def add_service(
    business_id: str,
    service_data: ServiceCreate,
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
    
    service_dict = service_data.model_dump()
    service_dict["id"] = f"service_{datetime.utcnow().timestamp()}"
    service_dict["active"] = True
    service_dict["created_at"] = datetime.utcnow()
    
    await db.businesses.update_one(
        {"_id": business_id},
        {
            "$push": {"menu": service_dict},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return service_dict


@router.get("/business/{business_id}/services")
async def get_services(business_id: str):
    db = get_database()
    
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    services = business.get("menu", [])
    
    return services


@router.patch("/business/{business_id}/services/{service_id}")
async def update_service(
    business_id: str,
    service_id: str,
    service_update: ServiceUpdate,
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
    
    services = business.get("menu", [])
    service_index = None
    for i, service in enumerate(services):
        if service.get("id") == service_id:
            service_index = i
            break
    
    if service_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    update_data = service_update.model_dump(exclude_unset=True)
    services[service_index].update(update_data)
    
    await db.businesses.update_one(
        {"_id": business_id},
        {"$set": {"menu": services, "updated_at": datetime.utcnow()}}
    )
    
    return services[service_index]


@router.delete("/business/{business_id}/services/{service_id}")
async def delete_service(
    business_id: str,
    service_id: str,
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
    
    services = business.get("menu", [])
    services = [service for service in services if service.get("id") != service_id]
    
    await db.businesses.update_one(
        {"_id": business_id},
        {"$set": {"menu": services, "updated_at": datetime.utcnow()}}
    )
    
    return {"detail": "Service deleted successfully"}
