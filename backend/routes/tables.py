from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database
from middleware.auth import get_current_owner
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/tables", tags=["tables"])


class FloorPlanUpdate(BaseModel):
    elements: Optional[List[Dict[str, Any]]] = None
    tables: Optional[List[Dict[str, Any]]] = None
    floors: Optional[List[Dict[str, Any]]] = None
    width: Optional[float] = 1000
    height: Optional[float] = 800


@router.get("/business/{business_id}/floor-plan")
async def get_floor_plan(
    business_id: str,
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    if business["owner_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    fp = business.get("floor_plan") or {}

    # Already has elements? Return as-is
    if "elements" in fp and fp["elements"]:
        return {"elements": fp["elements"], "width": fp.get("width", 1000), "height": fp.get("height", 800)}

    # Migrate from legacy 'tables' format
    if "tables" in fp and fp["tables"]:
        return {"elements": [{**t, "type": "table"} for t in fp["tables"]], "width": fp.get("width", 1000), "height": fp.get("height", 800)}

    # Migrate from 'floors' format (from the reverted rebuild)
    if "floors" in fp and fp["floors"]:
        all_elements = []
        for floor in fp["floors"]:
            zone_id = floor.get("id", "main")
            for el in floor.get("elements", []):
                all_elements.append({**el, "zone": zone_id, "type": el.get("type", "table")})
        return {"elements": all_elements, "width": fp.get("width", 1000), "height": fp.get("height", 800)}

    # Empty
    return {"elements": [], "width": 1000, "height": 800}


@router.put("/business/{business_id}/floor-plan")
async def update_floor_plan(
    business_id: str,
    floor_plan_data: FloorPlanUpdate,
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    if business["owner_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    data = floor_plan_data.model_dump(exclude_none=True)

    # Normalise: always store as {elements, width, height}
    if "tables" in data and "elements" not in data:
        data["elements"] = [{**t, "type": "table"} for t in data.pop("tables")]
    if "tables" in data:
        del data["tables"]
    if "floors" in data:
        del data["floors"]

    store = {"elements": data.get("elements", []), "width": data.get("width", 1000), "height": data.get("height", 800)}

    await db.businesses.update_one(
        {"_id": business_id},
        {"$set": {"floor_plan": store, "updated_at": datetime.utcnow()}}
    )
    return store


@router.post("/business/{business_id}/floor-plan")
async def save_floor_plan(
    business_id: str,
    floor_plan_data: FloorPlanUpdate,
    current_user: dict = Depends(get_current_owner)
):
    return await update_floor_plan(business_id, floor_plan_data, current_user)


@router.delete("/business/{business_id}/tables/{table_id}")
async def delete_table(
    business_id: str,
    table_id: str,
    current_user: dict = Depends(get_current_owner)
):
    db = get_database()
    business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    if business["owner_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    fp = business.get("floor_plan") or {}
    if "elements" in fp:
        fp["elements"] = [e for e in fp["elements"] if e.get("id") != table_id]
    if "tables" in fp:
        fp["tables"] = [t for t in fp["tables"] if t.get("id") != table_id]

    await db.businesses.update_one(
        {"_id": business_id},
        {"$set": {"floor_plan": fp, "updated_at": datetime.utcnow()}}
    )
    return {"detail": "Element deleted"}
