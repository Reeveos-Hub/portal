"""
Run 3: Dashboard API — summary, today's bookings, activity feed
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from database import get_database
from middleware.auth import get_current_staff
from middleware.tenant import verify_business_access, TenantContext
from datetime import datetime, date, timedelta
from bson import ObjectId

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


async def _ensure_business_access(db, business_id: str, user: dict):
    try:
        business = await db.businesses.find_one({"_id": ObjectId(business_id)})
    except Exception:
        business = None
    if not business:
        business = await db.businesses.find_one({"_id": business_id})
    if not business:
        raise HTTPException(404, "Business not found")
    owner = str(business.get("owner_id", ""))
    uid = str(user.get("_id", ""))
    if owner and owner != uid and str(user.get("role", "")).lower() not in ("staff", "admin", "owner"):
        raise HTTPException(403, "Not authorized")
    return business


async def _query_all_bookings(db, business_id: str):
    """Query both appointments and bookings collections with all field name variants."""
    bid_values = [business_id]
    try:
        bid_values.append(ObjectId(business_id))
    except Exception:
        pass

    all_docs = []
    seen_ids = set()
    for coll_name in ["appointments", "bookings"]:
        coll = db[coll_name]
        for field in ["business_id", "businessId"]:
            try:
                cursor = coll.find({field: {"$in": bid_values}})
                docs = await cursor.to_list(length=10000)
                for doc in docs:
                    doc_id = str(doc.get("_id", ""))
                    if doc_id not in seen_ids:
                        seen_ids.add(doc_id)
                        all_docs.append(doc)
            except Exception:
                pass
    return all_docs


def _extract_booking_fields(b):
    """Normalize booking fields from both seed data and form data formats."""
    customer_name = ""
    if b.get("customer") and isinstance(b["customer"], dict):
        customer_name = b["customer"].get("name", "")
    elif b.get("client_name"):
        customer_name = b["client_name"]
    elif b.get("guest_name"):
        customer_name = b["guest_name"]

    service_name = "Booking"
    if b.get("service") and isinstance(b["service"], dict):
        service_name = b["service"].get("name", "Booking")
    elif b.get("service_name"):
        service_name = b["service_name"]
    elif isinstance(b.get("service"), str):
        service_name = b["service"]

    price = 0
    if b.get("service") and isinstance(b["service"], dict):
        price = b["service"].get("price", 0)
    elif b.get("price"):
        price = b["price"]

    time_val = b.get("time") or b.get("start_time") or ""
    staff_id = b.get("staffId") or b.get("staff_id") or ""
    staff_name = b.get("staffName") or b.get("staff_name") or ""

    return {
        "customer_name": customer_name,
        "service_name": service_name,
        "price": price,
        "time": time_val,
        "staff_id": staff_id,
        "staff_name": staff_name,
    }


@router.get("/business/{business_id}/summary")
async def get_dashboard_summary(
    business_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    db = get_database()
    business = await _ensure_business_access(db, business_id, {"_id": tenant.user_id, "role": tenant.role})
    today_str = date.today().isoformat()

    all_bookings = await _query_all_bookings(db, business_id)

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
        _extract_booking_fields(b)["price"]
        for b in today_bookings
        if b.get("status") in ("confirmed", "checked_in", "completed")
    )
    revenue_week = sum(
        _extract_booking_fields(b)["price"]
        for b in week_bookings
        if b.get("status") in ("confirmed", "checked_in", "completed")
    )

    completed_today = len([b for b in today_bookings if b.get("status") == "completed"])
    cancelled_today = len([b for b in all_bookings if b.get("date") == today_str and b.get("status") == "cancelled"])

    upcoming = [b for b in today_bookings if b.get("status") in ("confirmed", "checked_in", "pending")]
    upcoming.sort(key=lambda x: x.get("time") or x.get("start_time") or "")

    next_bkg = None
    now = datetime.now().strftime("%H:%M")
    for b in upcoming:
        btime = b.get("time") or b.get("start_time") or ""
        if btime >= now:
            next_bkg = b
            break
    if not next_bkg and upcoming:
        next_bkg = upcoming[-1]

    new_clients = len([b for b in today_bookings if b.get("is_new_client", False)])

    next_fields = _extract_booking_fields(next_bkg) if next_bkg else {}

    return {
        "today": {
            "date": today_str,
            "bookings": len(today_bookings),
            "revenue": revenue_today,
            "newClients": new_clients,
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
            "id": str(next_bkg.get("_id", "")),
            "customerName": next_fields.get("customer_name", ""),
            "service": next_fields.get("service_name", "Booking"),
            "time": next_fields.get("time", ""),
            "staff": next_fields.get("staff_name") or _staff_name(business, next_fields.get("staff_id")),
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
    tenant: TenantContext = Depends(verify_business_access),
):
    db = get_database()
    business = await _ensure_business_access(db, business_id, {"_id": tenant.user_id, "role": tenant.role})
    today_str = date.today().isoformat()

    all_bookings = await _query_all_bookings(db, business_id)
    today_bookings = [
        b for b in all_bookings
        if b.get("date") == today_str and b.get("status") != "cancelled"
    ]
    today_bookings.sort(key=lambda x: x.get("time") or x.get("start_time") or "")

    now = datetime.now().strftime("%H:%M")
    found_next = False

    result = []
    for b in today_bookings:
        fields = _extract_booking_fields(b)
        btime = fields["time"]
        is_next = not found_next and btime >= now
        if is_next:
            found_next = True
        result.append({
            "id": str(b.get("_id", "")),
            "time": btime,
            "endTime": b.get("endTime") or b.get("end_time"),
            "customerName": fields["customer_name"],
            "service": fields["service_name"],
            "staff": fields["staff_name"] or _staff_name(business, fields["staff_id"]),
            "status": b.get("status", "confirmed"),
            "isNext": is_next,
        })

    return {"bookings": result}


@router.get("/business/{business_id}/activity")
async def get_activity_feed(
    business_id: str,
    limit: int = Query(20, ge=1, le=50),
    tenant: TenantContext = Depends(verify_business_access),
):
    db = get_database()
    # Access verified by tenant guard
    await _ensure_business_access(db, business_id, {"_id": tenant.user_id, "role": tenant.role})

    bid_values = [business_id]
    try:
        bid_values.append(ObjectId(business_id))
    except Exception:
        pass
    
    cursor = db.activity_log.find({"$or": [{"businessId": {"$in": bid_values}}, {"business_id": {"$in": bid_values}}]}).sort("timestamp", -1).limit(limit)
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
