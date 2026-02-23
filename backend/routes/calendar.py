"""
Run 3: Calendar API — day/week/month views, staff columns
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from database import get_database
from middleware.auth import get_current_staff
from datetime import datetime, date, timedelta
from bson import ObjectId

router = APIRouter(prefix="/calendar", tags=["calendar"])

STATUS_COLOURS = {
    "confirmed": "#22C55E",
    "checked_in": "#3B82F6",
    "completed": "#6B7280",
    "cancelled": "#EF4444",
    "no_show": "#991B1B",
    "pending": "#F59E0B",
}


async def _get_business(db, business_id: str, user: dict):
    try:
        b = await db.businesses.find_one({"_id": ObjectId(business_id)})
    except Exception:
        b = await db.businesses.find_one({"_id": business_id})
    if not b:
        raise HTTPException(404, "Business not found")
    owner = str(b.get("owner_id", ""))
    uid = str(user.get("_id", ""))
    if owner and owner != uid and str(user.get("role", "")).lower() not in ("staff", "admin", "owner"):
        raise HTTPException(403, "Not authorized")
    return b


@router.get("/business/{business_id}")
async def get_calendar(
    business_id: str,
    date_param: str = Query(..., alias="date"),
    view: str = Query("day"),
    user: dict = Depends(get_current_staff),
):
    """Run 3: Calendar data for day view (services)."""
    db = get_database()
    business = await _get_business(db, business_id, user)

    try:
        d = datetime.strptime(date_param, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "Invalid date")

    staff_list = [st for st in business.get("staff", []) if st.get("active", True)]
    if not staff_list:
        staff_list = [{"id": "default", "name": "All", "avatar": None}]

    cursor = db.bookings.find({
        "businessId": business_id,
        "date": date_param,
        "status": {"$nin": ["cancelled"]},
    }).sort("time", 1)

    bookings_raw = await cursor.to_list(length=200)

    bs = business.get("booking_settings") or {}
    open_t = bs.get("opening_hours") or {}
    open_str = "09:00"
    close_str = "17:00"

    bookings = []
    for b in bookings_raw:
        svc = b.get("service") or {}
        staff = next((st for st in staff_list if st.get("id") == b.get("staffId")), {})
        bookings.append({
            "id": b.get("_id"),
            "staffId": b.get("staffId") or "default",
            "time": b.get("time", ""),
            "endTime": b.get("endTime"),
            "duration": svc.get("duration", 60),
            "customerName": (b.get("customer") or {}).get("name", ""),
            "service": svc.get("name", "Booking"),
            "status": b.get("status", "confirmed"),
            "colour": STATUS_COLOURS.get(b.get("status"), "#22C55E"),
        })

    return {
        "date": date_param,
        "view": view,
        "openingHours": {"open": open_str, "close": close_str},
        "staff": [{"id": st.get("id"), "name": st.get("name"), "avatar": st.get("avatar")} for st in staff_list],
        "bookings": bookings,
    }


@router.get("/business/{business_id}/restaurant")
async def get_calendar_restaurant(
    business_id: str,
    date_param: str = Query(..., alias="date"),
    view: str = Query("day"),
    user: dict = Depends(get_current_staff),
):
    """Run 3: Calendar for restaurant (service periods)."""
    db = get_database()
    business = await _get_business(db, business_id, user)

    try:
        datetime.strptime(date_param, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "Invalid date")

    cursor = db.bookings.find({
        "businessId": business_id,
        "date": date_param,
        "status": {"$nin": ["cancelled"]},
    }).sort("time", 1)

    bookings_raw = await cursor.to_list(length=200)

    bookings = []
    for b in bookings_raw:
        bookings.append({
            "id": b.get("_id"),
            "time": b.get("time", ""),
            "partySize": b.get("partySize", 2),
            "customerName": (b.get("customer") or {}).get("name", ""),
            "tableId": b.get("tableId"),
            "status": b.get("status", "confirmed"),
            "occasion": b.get("occasion"),
        })

    return {
        "date": date_param,
        "servicePeriods": [
            {"name": "Lunch", "start": "12:00", "end": "14:30"},
            {"name": "Dinner", "start": "18:00", "end": "22:00"},
        ],
        "bookings": bookings,
        "covers": {"lunch": sum(1 for b in bookings if "12:00" <= (b.get("time") or "") < "15:00"), "dinner": sum(1 for b in bookings if (b.get("time") or "") >= "18:00"), "total": len(bookings), "capacity": 86},
    }
