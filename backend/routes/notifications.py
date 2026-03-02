from fastapi import APIRouter, Query
from database import get_database
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/business/{business_id}")
async def get_notifications(business_id: str, days: int = Query(7, ge=1, le=30), limit: int = Query(50, ge=1, le=200)):
    db = get_database()
    since = datetime.utcnow() - timedelta(days=days)
    notifications = []
    try:
        async for b in db.bookings.find({"business_id": business_id, "created_at": {"$gte": since}}).sort("created_at", -1).limit(20):
            name = b.get("customer_name") or b.get("guest_name") or "Guest"
            guests = b.get("party_size") or b.get("guests") or 1
            st = b.get("status", "confirmed")
            if st == "cancelled": text, icon = f"{name} cancelled booking", "x-circle"
            elif st == "no-show": text, icon = f"{name} no-show ({guests} covers)", "alert-triangle"
            else: text, icon = f"New booking: {name} for {guests}", "calendar"
            notifications.append({"id": str(b["_id"]), "type": "booking", "icon": icon, "text": text, "time": b.get("created_at", datetime.utcnow()).isoformat(), "read": False})
    except Exception as e: logger.warning(f"notif bookings: {e}")
    try:
        async for o in db.orders.find({"business_id": business_id, "created_at": {"$gte": since}, "source": "online"}).sort("created_at", -1).limit(20):
            num, total, name = o.get("order_number","?"), o.get("total",0) or 0, o.get("customer_name","Customer")
            notifications.append({"id": str(o["_id"]), "type": "order", "icon": "shopping-bag", "text": f"Online order #{num} from {name}", "time": o.get("created_at", datetime.utcnow()).isoformat(), "read": False})
    except Exception as e: logger.warning(f"notif orders: {e}")
    try:
        async for r in db.reviews.find({"business_id": business_id, "created_at": {"$gte": since}}).sort("created_at", -1).limit(10):
            notifications.append({"id": str(r["_id"]), "type": "review", "icon": "star", "text": f"{r.get('user_name','A diner')} left a {r.get('rating',0)}-star review", "time": r.get("created_at", datetime.utcnow()).isoformat(), "read": bool(r.get("owner_reply"))})
    except Exception as e: logger.warning(f"notif reviews: {e}")
    notifications.sort(key=lambda n: n["time"], reverse=True)
    notifications = notifications[:limit]
    today, yesterday = datetime.utcnow().date(), (datetime.utcnow() - timedelta(days=1)).date()
    grouped = {"today": [], "yesterday": [], "earlier": []}
    for n in notifications:
        try: nd = datetime.fromisoformat(n["time"]).date()
        except: nd = today
        if nd == today: grouped["today"].append(n)
        elif nd == yesterday: grouped["yesterday"].append(n)
        else: grouped["earlier"].append(n)
    return {"total": len(notifications), "grouped": grouped, "notifications": notifications}
