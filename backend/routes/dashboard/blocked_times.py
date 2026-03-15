"""
2A: Block Time on Calendar
==========================
Blocked time slots per staff member — lunch breaks, meetings, training, personal time.
Supports repeat rules (none, daily, weekly).
All endpoints tenant-isolated via verify_business_access.
"""

from datetime import datetime, date, timedelta
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from database import get_database
from middleware.auth import get_current_user
from middleware.tenant import verify_business_access, TenantContext
from bson import ObjectId
import uuid
import logging

logger = logging.getLogger("blocked_times")
router = APIRouter(prefix="/blocked-times", tags=["blocked-times"])

VALID_PRESETS = {"lunch", "staff_meeting", "training", "personal", "custom", "closure", "bank_holiday"}
VALID_REPEAT_RULES = {"none", "daily", "weekly", "yearly"}


@router.post("/business/{business_id}")
async def create_blocked_time(
    business_id: str,
    payload: dict = Body(...),
    tenant: TenantContext = Depends(verify_business_access),
):
    """Create a blocked time slot on the calendar."""
    staff_id = (payload.get("staff_id") or "").strip()
    start_time = (payload.get("start_time") or "").strip()
    end_time = (payload.get("end_time") or "").strip()
    reason = (payload.get("reason") or "").strip()
    reason_preset = (payload.get("reason_preset") or "custom").strip().lower()
    repeat_rule = (payload.get("repeat_rule") or "none").strip().lower()
    block_date = (payload.get("date") or "").strip()

    if not start_time or not end_time:
        # All-day closures don't need times
        if reason_preset in ("closure", "bank_holiday"):
            start_time = "00:00"
            end_time = "23:59"
        else:
            raise HTTPException(400, "start_time and end_time are required")
    if not block_date:
        raise HTTPException(400, "date is required")
    if reason_preset not in VALID_PRESETS:
        raise HTTPException(400, f"Invalid reason_preset. Must be one of: {', '.join(sorted(VALID_PRESETS))}")
    if repeat_rule not in VALID_REPEAT_RULES:
        raise HTTPException(400, f"Invalid repeat_rule. Must be one of: {', '.join(sorted(VALID_REPEAT_RULES))}")
    if len(reason) > 200:
        raise HTTPException(400, "Reason must be 200 characters or fewer")

    # Validate time order
    if start_time >= end_time:
        raise HTTPException(400, "end_time must be after start_time")

    db = get_database()

    doc = {
        "business_id": business_id,
        "staff_id": staff_id,
        "date": block_date,
        "start_time": start_time,
        "end_time": end_time,
        "reason": reason,
        "reason_preset": reason_preset,
        "repeat_rule": repeat_rule,
        "created_by": tenant.user_id,
        "created_at": datetime.utcnow(),
    }

    result = await db.blocked_times.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc["_id"] = str(result.inserted_id)
    doc["created_at"] = doc["created_at"].isoformat()

    logger.info(f"Blocked time created: {doc['id']} business={business_id} staff={staff_id} {block_date} {start_time}-{end_time}")
    return {"ok": True, "block": doc}


@router.get("/business/{business_id}")
async def list_blocked_times(
    business_id: str,
    staff_id: str = Query(None),
    from_date: str = Query(None, alias="from"),
    to_date: str = Query(None, alias="to"),
    tenant: TenantContext = Depends(verify_business_access),
):
    """List blocked time slots, optionally filtered by staff and date range."""
    db = get_database()

    query = {"business_id": business_id}
    if staff_id:
        query["staff_id"] = staff_id

    # Date range filter: include exact matches + repeated blocks that could apply
    if from_date or to_date:
        date_filter = {}
        if from_date:
            date_filter["$gte"] = from_date
        if to_date:
            date_filter["$lte"] = to_date

        # For repeating blocks, we need blocks whose start date <= to_date
        # Non-repeating: date within range
        # Repeating: date <= to_date (they repeat forward)
        query["$or"] = [
            {"repeat_rule": "none", "date": date_filter},
            {"repeat_rule": {"$ne": "none"}, "date": {"$lte": to_date or "9999-12-31"}},
        ]

    cursor = db.blocked_times.find(query).sort("date", 1).sort("start_time", 1)
    docs = await cursor.to_list(length=500)

    blocks = []
    for d in docs:
        block = {
            "id": str(d["_id"]),
            "business_id": d.get("business_id", ""),
            "staff_id": d.get("staff_id", ""),
            "date": d.get("date", ""),
            "start_time": d.get("start_time", ""),
            "end_time": d.get("end_time", ""),
            "reason": d.get("reason", ""),
            "reason_preset": d.get("reason_preset", "custom"),
            "repeat_rule": d.get("repeat_rule", "none"),
            "created_by": d.get("created_by", ""),
            "created_at": d.get("created_at").isoformat() if d.get("created_at") else "",
        }

        # For repeating blocks within a date range, expand occurrences
        if block["repeat_rule"] != "none" and from_date and to_date:
            expanded = _expand_repeating_block(block, from_date, to_date)
            blocks.extend(expanded)
        else:
            blocks.append(block)

    return {"blocks": blocks}


def _expand_repeating_block(block: dict, from_date: str, to_date: str) -> list:
    """Expand a repeating block into individual occurrences within the date range."""
    try:
        base = date.fromisoformat(block["date"])
        start = date.fromisoformat(from_date)
        end = date.fromisoformat(to_date)
    except ValueError:
        return [block]

    if block["repeat_rule"] == "daily":
        delta = timedelta(days=1)
    elif block["repeat_rule"] == "weekly":
        delta = timedelta(weeks=1)
    elif block["repeat_rule"] == "yearly":
        delta = timedelta(days=365)
    else:
        return [block]

    occurrences = []
    current = base
    # Walk forward to the first date in range
    if current < start:
        steps = ((start - current) // delta)
        current = current + delta * steps
        if current < start:
            current += delta

    while current <= end:
        occ = dict(block)
        occ["date"] = current.isoformat()
        occ["_expanded_from"] = block["id"]
        occurrences.append(occ)
        current += delta

    return occurrences


@router.delete("/business/{business_id}/{block_id}")
async def delete_blocked_time(
    business_id: str,
    block_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Delete a blocked time slot."""
    db = get_database()

    result = await db.blocked_times.delete_one({
        "_id": ObjectId(block_id),
        "business_id": business_id,
    })

    if result.deleted_count == 0:
        raise HTTPException(404, "Blocked time not found")

    logger.info(f"Blocked time deleted: {block_id} business={business_id}")
    return {"ok": True}


@router.post("/business/{business_id}/closure")
async def create_closure(
    business_id: str,
    payload: dict = Body(...),
    tenant: TenantContext = Depends(verify_business_access),
):
    """Create a business closure — blocks ALL staff for full day(s).
    Accepts a date range: start_date to end_date (inclusive)."""
    start_date = (payload.get("start_date") or payload.get("date") or "").strip()
    end_date = (payload.get("end_date") or start_date).strip()
    reason = (payload.get("reason") or "Business closed").strip()[:200]
    preset = (payload.get("reason_preset") or "closure").strip().lower()
    repeat = (payload.get("repeat_rule") or "none").strip().lower()

    if not start_date:
        raise HTTPException(400, "start_date is required")

    try:
        sd = date.fromisoformat(start_date)
        ed = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD.")

    if ed < sd:
        raise HTTPException(400, "end_date must be on or after start_date")
    if (ed - sd).days > 31:
        raise HTTPException(400, "Closure cannot exceed 31 days")

    db = get_database()
    created = []
    current = sd
    while current <= ed:
        doc = {
            "business_id": business_id,
            "staff_id": "",  # Empty = whole business
            "date": current.isoformat(),
            "start_time": "00:00",
            "end_time": "23:59",
            "reason": reason,
            "reason_preset": preset if preset in ("closure", "bank_holiday") else "closure",
            "repeat_rule": repeat if repeat in VALID_REPEAT_RULES else "none",
            "is_closure": True,
            "created_by": tenant.user_id,
            "created_at": datetime.utcnow(),
        }
        result = await db.blocked_times.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        created.append(doc["id"])
        current += timedelta(days=1)

    logger.info(f"Closure created: {len(created)} days for business={business_id} ({start_date} to {end_date})")
    return {"ok": True, "days_blocked": len(created), "ids": created}


@router.get("/business/{business_id}/closures")
async def list_closures(
    business_id: str,
    from_date: str = Query(None, alias="from"),
    to_date: str = Query(None, alias="to"),
    tenant: TenantContext = Depends(verify_business_access),
):
    """List business closures (whole-business blocks)."""
    db = get_database()
    query = {
        "business_id": business_id,
        "$or": [{"is_closure": True}, {"reason_preset": {"$in": ["closure", "bank_holiday"]}}],
    }
    if from_date:
        query["date"] = {"$gte": from_date}
    if to_date:
        query.setdefault("date", {})["$lte"] = to_date

    docs = await db.blocked_times.find(query).sort("date", 1).to_list(200)
    return {"closures": [
        {"id": str(d["_id"]), "date": d.get("date"), "reason": d.get("reason"), "reason_preset": d.get("reason_preset")}
        for d in docs
    ]}


async def is_business_closed(db, business_id: str, check_date: str) -> bool:
    """Check if a business has a closure on a given date. Used by booking flow."""
    closure = await db.blocked_times.find_one({
        "business_id": business_id,
        "date": check_date,
        "$or": [
            {"is_closure": True},
            {"reason_preset": {"$in": ["closure", "bank_holiday"]}},
            {"staff_id": "", "start_time": "00:00", "end_time": "23:59"},
        ],
    })
    return closure is not None
