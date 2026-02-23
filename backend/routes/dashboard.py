"""
Run 3: Dashboard API — summary, today's bookings, activity feed
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from database import get_database
from middleware.auth import get_current_staff
from datetime import datetime, date, timedelta

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


async def _ensure_business_access(db, business_id: str, user: dict):
    from bson import ObjectId
    try:
        business = await db.businesses.find_one({"_id": ObjectId(business_id)})
    except Exception:
        business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(404, "Business not found")
    owner = str(business.get("owner_id", ""))
    uid = str(user.get("_id", ""))
    if owner and owner != uid and str(user.get("role", "")).lower() not in ("staff", "admin", "owner"):
        raise HTTPException(403, "Not authorized")
    return business


@router.get("/business/{business_id}/summary")
async def get_dashboard_summary(
    business_id: str,
    user: dict = Depends(get_current_staff),
):
    db = get_database()
    business = await _ensure_business_access(db, business_id, user)
    today_str = date.today().isoformat()

    # Use bookings collection (Run 2)
    cursor = db.bookings.find({"businessId": business_id})
    all_bookings = await cursor.to_list(length=10000)

    today_bookings = [b for b in all_bookings if b.get("date") == today_str and b.get("status") != "cancelled"]
    week_start = date.today() - timedelta(days=date.today().weekday())
    week_end = week_start + timedelta(days=6)
    week_bookings = [
        b for b in all_bookings
        if b.get("status") != "cancelled"
        and b.get("date")
        and week_start.isoformat() <= b["date"] <= week_end.isoformat()
    ]

    revenue_today = sum(
        (b.get("service") or {}).get("price", 0) or 0
        for b in today_bookings
        if b.get("status") in ("confirmed", "checked_in", "completed")
    )
    revenue_week = sum(
        (b.get("service") or {}).get("price", 0) or 0
        for b in week_bookings
        if b.get("status") in ("confirmed", "checked_in", "completed")
    )

    completed_today = len([b for b in today_bookings if b.get("status") == "completed"])
    cancelled_today = len([b for b in all_bookings if b.get("date") == today_str and b.get("status") == "cancelled"])

    upcoming = [b for b in today_bookings if b.get("status") in ("confirmed", "checked_in", "pending")]
    upcoming.sort(key=lambda x: x.get("time", ""))

    next_bkg = None
    now = datetime.now().strftime("%H:%M")
    for b in upcoming:
        if (b.get("time") or "") >= now:
            next_bkg = b
            break
    if not next_bkg and upcoming:
        next_bkg = upcoming[-1]

    customers_today = set(b.get("customer", {}).get("email", "") for b in today_bookings if b.get("customer"))

    return {
        "today": {
            "date": today_str,
            "bookings": len(today_bookings),
            "revenue": revenue_today,
            "newClients": len(customers_today),
            "completedBookings": completed_today,
            "upcomingBookings": len(upcoming),
            "cancelledToday": cancelled_today,
            "noShows": len([b for b in today_bookings if b.get("status") == "no_show"]),
        },
        "period": {
            "label": "This week",
            "bookings": len(week_bookings),
            "revenue": revenue_week,
            "bookingsChange": 0,
            "revenueChange": 0,
        },
        "nextBooking": {
            "id": next_bkg.get("_id"),
            "customerName": (next_bkg.get("customer") or {}).get("name", ""),
            "service": (next_bkg.get("service") or {}).get("name", "Booking"),
            "time": next_bkg.get("time", ""),
            "staff": _staff_name(business, next_bkg.get("staffId")),
        } if next_bkg else None,
    }


def _staff_name(business, staff_id):
    if not staff_id:
        return None
    for s in business.get("staff", []):
        if s.get("id") == staff_id:
            return s.get("name")
    return None


@router.get("/business/{business_id}/today")
async def get_today_bookings(
    business_id: str,
    user: dict = Depends(get_current_staff),
):
    db = get_database()
    business = await _ensure_business_access(db, business_id, user)
    today_str = date.today().isoformat()

    cursor = db.bookings.find({
        "businessId": business_id,
        "date": today_str,
        "status": {"$ne": "cancelled"},
    }).sort("time", 1)

    bookings = await cursor.to_list(length=100)
    now = datetime.now().strftime("%H:%M")
    found_next = False

    result = []
    for b in bookings:
        is_next = not found_next and (b.get("time") or "") >= now
        if is_next:
            found_next = True
        result.append({
            "id": b.get("_id"),
            "time": b.get("time", ""),
            "endTime": b.get("endTime"),
            "customerName": (b.get("customer") or {}).get("name", ""),
            "service": (b.get("service") or {}).get("name", ""),
            "staff": _staff_name(business, b.get("staffId")),
            "status": b.get("status", "confirmed"),
            "isNext": is_next,
        })

    return {"bookings": result}


@router.get("/business/{business_id}/activity")
async def get_activity_feed(
    business_id: str,
    limit: int = Query(20, ge=1, le=50),
    user: dict = Depends(get_current_staff),
):
    db = get_database()
    await _ensure_business_access(db, business_id, user)

    cursor = db.activity_log.find({"businessId": business_id}).sort("timestamp", -1).limit(limit)
    events = await cursor.to_list(length=limit)

    return {
        "events": [
            {
                "id": str(e.get("_id", "")),
                "type": e.get("type", ""),
                "message": e.get("message", ""),
                "timestamp": e.get("timestamp"),
                "bookingId": e.get("bookingId"),
            }
            for e in events
        ]
    }
