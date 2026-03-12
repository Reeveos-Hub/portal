"""
rooms.py — Treatment Room Management API
CRUD for treatment rooms, equipment, modes, and allocation priority.
Tenant-isolated: every query scoped to business_id.
"""
from fastapi import APIRouter, HTTPException, Depends
from database import get_database
from middleware.auth import get_current_owner
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter(prefix="/rooms", tags=["rooms"])


# ═══════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════
class RoomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    wing: str = Field(default="", max_length=100)
    num_beds: int = Field(default=1, ge=1, le=4)
    enabled_modes: List[str] = Field(default=["solo"])
    solo_priority: str = Field(default="1")  # "1","2","3","low","last"
    equipment: List[str] = Field(default=[])


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    wing: Optional[str] = None
    num_beds: Optional[int] = None
    enabled_modes: Optional[List[str]] = None
    solo_priority: Optional[str] = None
    equipment: Optional[List[str]] = None
    is_active: Optional[bool] = None


# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════
VALID_MODES = {"solo", "duo", "group"}
VALID_PRIORITIES = {"1", "2", "3", "low", "last"}
VALID_EQUIPMENT = {
    "medical_grade_laser", "steamer_unit", "led_panel",
    "microneedling_device", "rf_device", "cryotherapy_unit",
    "extraction_lamp", "magnifying_lamp", "hot_towel_cabinet",
    "ultrasonic_device", "oxygen_infusion", "ipl_device",
}


def _serialize(room: dict) -> dict:
    """Convert MongoDB room doc to JSON-safe format."""
    room["id"] = str(room.pop("_id"))
    room.pop("business_id", None)
    return room


async def _find_business(db, business_id: str, owner_id: str, role: str = ""):
    """Find and verify business ownership."""
    biz = await db.businesses.find_one({"_id": business_id})
    if not biz:
        try:
            biz = await db.businesses.find_one({"_id": ObjectId(business_id)})
        except Exception:
            pass
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    if role in ("business_owner", "platform_admin", "super_admin"):
        return biz
    if biz.get("owner_id") != owner_id and str(biz.get("owner_id")) != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return biz


# ═══════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.get("/business/{business_id}")
async def list_rooms(business_id: str, user=Depends(get_current_owner)):
    """List all active rooms for a business."""
    db = get_database()
    await _find_business(db, business_id, user["id"], user.get("role", ""))

    rooms = []
    cursor = db.rooms.find({
        "business_id": business_id,
        "is_active": True
    }).sort("solo_priority", 1)

    async for room in cursor:
        rooms.append(_serialize(room))

    return {"rooms": rooms, "total": len(rooms)}


@router.post("/business/{business_id}", status_code=201)
async def create_room(business_id: str, data: RoomCreate, user=Depends(get_current_owner)):
    """Create a new treatment room."""
    db = get_database()
    await _find_business(db, business_id, user["id"], user.get("role", ""))

    # Validate modes
    invalid_modes = set(data.enabled_modes) - VALID_MODES
    if invalid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid modes: {invalid_modes}")

    # Validate priority
    if data.solo_priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail=f"Invalid priority: {data.solo_priority}")

    # Check for duplicate name within business
    existing = await db.rooms.find_one({
        "business_id": business_id,
        "name": data.name,
        "is_active": True
    })
    if existing:
        raise HTTPException(status_code=409, detail=f"Room '{data.name}' already exists")

    now = datetime.now(timezone.utc)
    room_doc = {
        "business_id": business_id,
        "name": data.name,
        "wing": data.wing,
        "num_beds": data.num_beds,
        "enabled_modes": data.enabled_modes,
        "solo_priority": data.solo_priority,
        "equipment": data.equipment,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.rooms.insert_one(room_doc)
    room_doc["_id"] = result.inserted_id

    return {"room": _serialize(room_doc)}


@router.put("/business/{business_id}/{room_id}")
async def update_room(business_id: str, room_id: str, data: RoomUpdate, user=Depends(get_current_owner)):
    """Update a treatment room."""
    db = get_database()
    await _find_business(db, business_id, user["id"], user.get("role", ""))

    # Find room (tenant-scoped)
    room = await db.rooms.find_one({
        "_id": ObjectId(room_id),
        "business_id": business_id
    })
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    updates = {}
    if data.name is not None:
        # Check for duplicate name
        dup = await db.rooms.find_one({
            "business_id": business_id,
            "name": data.name,
            "is_active": True,
            "_id": {"$ne": ObjectId(room_id)}
        })
        if dup:
            raise HTTPException(status_code=409, detail=f"Room '{data.name}' already exists")
        updates["name"] = data.name

    if data.wing is not None:
        updates["wing"] = data.wing
    if data.num_beds is not None:
        if data.num_beds < 1 or data.num_beds > 4:
            raise HTTPException(status_code=400, detail="Beds must be 1-4")
        updates["num_beds"] = data.num_beds
    if data.enabled_modes is not None:
        invalid = set(data.enabled_modes) - VALID_MODES
        if invalid:
            raise HTTPException(status_code=400, detail=f"Invalid modes: {invalid}")
        updates["enabled_modes"] = data.enabled_modes
    if data.solo_priority is not None:
        if data.solo_priority not in VALID_PRIORITIES:
            raise HTTPException(status_code=400, detail=f"Invalid priority: {data.solo_priority}")
        updates["solo_priority"] = data.solo_priority
    if data.equipment is not None:
        updates["equipment"] = data.equipment
    if data.is_active is not None:
        updates["is_active"] = data.is_active

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates["updated_at"] = datetime.now(timezone.utc)

    await db.rooms.update_one(
        {"_id": ObjectId(room_id), "business_id": business_id},
        {"$set": updates}
    )

    updated = await db.rooms.find_one({"_id": ObjectId(room_id)})
    return {"room": _serialize(updated)}


@router.delete("/business/{business_id}/{room_id}")
async def delete_room(business_id: str, room_id: str, user=Depends(get_current_owner)):
    """Soft-delete a room (set is_active=False). We never hard-delete — GDPR audit trail."""
    db = get_database()
    await _find_business(db, business_id, user["id"], user.get("role", ""))

    room = await db.rooms.find_one({
        "_id": ObjectId(room_id),
        "business_id": business_id
    })
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    await db.rooms.update_one(
        {"_id": ObjectId(room_id), "business_id": business_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
    )

    return {"deleted": True, "room_id": room_id}


# ═══════════════════════════════════════════════════════════════
# ROOM ALLOCATION — called by book.py during booking creation
# ═══════════════════════════════════════════════════════════════
def _time_to_mins(t: str) -> int:
    """Convert HH:MM to minutes since midnight."""
    parts = t.split(":")
    return int(parts[0]) * 60 + int(parts[1])


async def find_best_room(db, business_id: str, date_str: str, time_str: str, duration_minutes: int, required_equipment: list = None):
    """
    Auto-allocate the best available room for a services booking.
    Same pattern as _find_best_table in book.py but for treatment rooms.
    
    Logic:
    1. Get all active rooms for the business
    2. Filter rooms that have ALL required equipment (if any)
    3. Check time conflicts with existing bookings on same date
    4. Return the highest-priority available room
    
    Returns: (room_id, room_name) or (None, None) if no room available.
    """
    required_equipment = required_equipment or []

    # Get all active rooms, sorted by priority
    rooms = []
    cursor = db.rooms.find({
        "business_id": business_id,
        "is_active": True
    })
    async for room in cursor:
        rooms.append(room)

    if not rooms:
        return None, None

    # Sort by priority: 1, 2, 3, low, last
    priority_order = {"1": 0, "2": 1, "3": 2, "low": 3, "last": 4}
    rooms.sort(key=lambda r: priority_order.get(r.get("solo_priority", "last"), 5))

    # Filter by equipment — room must have ALL required equipment
    if required_equipment:
        rooms = [r for r in rooms if all(eq in (r.get("equipment") or []) for eq in required_equipment)]

    if not rooms:
        return None, None

    # Get all non-cancelled bookings for this business on this date that have a roomId
    day_bookings = []
    cursor = db.bookings.find({
        "businessId": business_id,
        "date": date_str,
        "status": {"$nin": ["cancelled", "no_show"]},
        "roomId": {"$ne": None},
    })
    async for b in cursor:
        day_bookings.append(b)

    # Calculate requested time range
    req_start = _time_to_mins(time_str)
    req_end = req_start + duration_minutes

    # Check each room for conflicts
    for room in rooms:
        room_id = str(room["_id"])
        has_conflict = False

        for b in day_bookings:
            if b.get("roomId") != room_id:
                continue
            b_start = _time_to_mins(b.get("time", "12:00"))
            b_end = b_start + (b.get("duration") or 60)
            # Check overlap
            if req_start < b_end and req_end > b_start:
                has_conflict = True
                break

        if not has_conflict:
            return room_id, room.get("name", "Room")

    # All rooms occupied at this time
    return None, None
