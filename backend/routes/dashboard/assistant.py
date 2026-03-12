"""
ReeveOS Assistant — Chat API
=============================
Phase 1: Read-only chat with business context.
Uses the existing agent runner with business-scoped tools.
GOLDEN RULE: NO DELETE TOOLS. Create/Read/Update only.
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from database import get_database
from middleware.auth import get_current_staff
from middleware.tenant import verify_business_access, TenantContext
from agent.runner import run_agent, register_tool, TOOL_REGISTRY
from datetime import datetime, date, timedelta
from bson import ObjectId
import logging

logger = logging.getLogger("assistant")
router = APIRouter(prefix="/assistant", tags=["ReeveOS Assistant"])


# ═══════════════════════════════════════
# BUSINESS CONTEXT BUILDER
# ═══════════════════════════════════════

async def _build_business_context(db, business_id: str, user: dict) -> str:
    """Build rich context about the business for the AI system prompt."""
    business = await db.businesses.find_one({"_id": ObjectId(business_id)}) if ObjectId.is_valid(business_id) else None
    if not business:
        business = await db.businesses.find_one({"_id": business_id})
    if not business:
        return "Business context unavailable."

    bname = business.get("name", "Unknown Business")
    btype = business.get("type", "services")

    # Get service count
    svc_count = await db.services.count_documents({"business_id": business_id})

    # Get staff
    staff_cursor = db.staff.find({"business_id": business_id}, {"name": 1, "role": 1})
    staff_list = []
    async for s in staff_cursor:
        staff_list.append(f"{s.get('name', 'Unknown')} ({s.get('role', 'staff')})")

    # Today's bookings count
    today_str = date.today().isoformat()
    today_count = await db.bookings.count_documents({
        "business_id": business_id, "date": today_str, "status": {"$ne": "cancelled"}
    })

    # Total clients
    client_count = await db.clients.count_documents({"business_id": business_id})

    # Recent revenue (last 7 days)
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    revenue_pipeline = [
        {"$match": {"business_id": business_id, "date": {"$gte": week_ago}, "status": {"$in": ["confirmed", "completed", "checked_in"]}}},
        {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$price", 0]}}}},
    ]
    rev_result = await db.bookings.aggregate(revenue_pipeline).to_list(1)
    weekly_revenue = rev_result[0]["total"] if rev_result else 0

    context = f"""BUSINESS CONTEXT:
- Business: {bname}
- Type: {btype}
- {svc_count} services configured
- Staff: {', '.join(staff_list) if staff_list else 'No staff configured'}
- Today's appointments: {today_count}
- Total clients: {client_count}
- Revenue (last 7 days): £{weekly_revenue:.0f}
- Current user: {user.get('name', 'Unknown')} ({user.get('email', '')})
- Today: {date.today().strftime('%A %d %B %Y')}
"""
    return context


# ═══════════════════════════════════════
# REGISTER BUSINESS-SCOPED READ TOOLS
# ═══════════════════════════════════════

def _register_assistant_tools():
    """Register read-only tools for the assistant. Called once at startup."""

    # Skip if already registered
    if "assistant_get_bookings" in TOOL_REGISTRY:
        return

    async def _get_bookings(business_id: str = "", date_from: str = "", date_to: str = "",
                            status: str = "", limit: int = 20, **kwargs):
        db = get_database()
        query = {}
        if business_id:
            query["business_id"] = business_id
        if status:
            query["status"] = status
        if date_from:
            query["date"] = {"$gte": date_from}
        if date_to:
            query.setdefault("date", {})["$lte"] = date_to

        bookings = []
        async for b in db.bookings.find(query).sort("date", -1).limit(limit):
            b["_id"] = str(b["_id"])
            bookings.append({
                "id": b["_id"],
                "date": b.get("date", ""),
                "time": b.get("time", ""),
                "customer": b.get("customerName", b.get("customer", {}).get("name", "Unknown")),
                "service": b.get("service", {}).get("name", "") if isinstance(b.get("service"), dict) else b.get("service_name", b.get("serviceName", "")),
                "staff": b.get("staffName", b.get("staff_name", "")),
                "status": b.get("status", ""),
                "price": b.get("price", 0),
            })
        return {"bookings": bookings, "count": len(bookings)}

    register_tool(
        "assistant_get_bookings",
        "Get bookings/appointments with optional filters. Returns list with customer name, service, time, status, price.",
        {"type": "object", "properties": {
            "business_id": {"type": "string", "description": "Business ID (injected automatically)"},
            "date_from": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
            "date_to": {"type": "string", "description": "End date (YYYY-MM-DD)"},
            "status": {"type": "string", "description": "Filter: confirmed, pending, cancelled, completed, checked_in"},
            "limit": {"type": "integer", "description": "Max results (default 20)"},
        }},
        _get_bookings, tier="auto"
    )

    async def _get_clients(business_id: str = "", search: str = "", days_since_visit: int = 0,
                           limit: int = 20, sort_by: str = "last_visit", **kwargs):
        db = get_database()
        query = {}
        if business_id:
            query["business_id"] = business_id
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search}},
            ]

        clients = []
        async for c in db.clients.find(query).sort("last_visit", -1).limit(limit):
            c["_id"] = str(c["_id"])
            last_visit = c.get("last_visit", "")
            if days_since_visit > 0 and last_visit:
                cutoff = (date.today() - timedelta(days=days_since_visit)).isoformat()
                if last_visit > cutoff:
                    continue
            clients.append({
                "id": c["_id"],
                "name": c.get("name", "Unknown"),
                "email": c.get("email", ""),
                "phone": c.get("phone", ""),
                "visits": c.get("visits", c.get("visit_count", 0)),
                "total_spend": c.get("total_spend", 0),
                "last_visit": last_visit,
                "tags": c.get("tags", []),
            })
        return {"clients": clients, "count": len(clients)}

    register_tool(
        "assistant_get_clients",
        "Get clients from CRM with optional filters. Can filter by name, days since last visit, search term. Returns name, contact, visits, spend, last visit.",
        {"type": "object", "properties": {
            "business_id": {"type": "string", "description": "Business ID"},
            "search": {"type": "string", "description": "Search by name, email, or phone"},
            "days_since_visit": {"type": "integer", "description": "Only return clients who haven't visited in X days"},
            "limit": {"type": "integer", "description": "Max results (default 20)"},
        }},
        _get_clients, tier="auto"
    )

    async def _get_services(business_id: str = "", **kwargs):
        db = get_database()
        services = []
        async for s in db.services.find({"business_id": business_id}).sort("name", 1):
            s["_id"] = str(s["_id"])
            services.append({
                "id": s["_id"],
                "name": s.get("name", ""),
                "price": s.get("price", 0),
                "duration": s.get("duration", 0),
                "category": s.get("category", ""),
                "active": s.get("active", True),
            })
        return {"services": services, "count": len(services)}

    register_tool(
        "assistant_get_services",
        "Get all services/treatments offered by the business. Returns name, price, duration, category.",
        {"type": "object", "properties": {
            "business_id": {"type": "string", "description": "Business ID"},
        }},
        _get_services, tier="auto"
    )

    async def _get_staff(business_id: str = "", **kwargs):
        db = get_database()
        staff = []
        async for s in db.staff.find({"business_id": business_id}):
            s["_id"] = str(s["_id"])
            staff.append({
                "id": s["_id"],
                "name": s.get("name", ""),
                "role": s.get("role", ""),
                "email": s.get("email", ""),
                "phone": s.get("phone", ""),
                "active": s.get("active", True),
            })
        return {"staff": staff, "count": len(staff)}

    register_tool(
        "assistant_get_staff",
        "Get staff members and their roles. Returns name, role, contact info.",
        {"type": "object", "properties": {
            "business_id": {"type": "string", "description": "Business ID"},
        }},
        _get_staff, tier="auto"
    )

    async def _get_revenue(business_id: str = "", period: str = "week", **kwargs):
        db = get_database()
        if period == "today":
            start = date.today().isoformat()
        elif period == "week":
            start = (date.today() - timedelta(days=7)).isoformat()
        elif period == "month":
            start = (date.today() - timedelta(days=30)).isoformat()
        elif period == "quarter":
            start = (date.today() - timedelta(days=90)).isoformat()
        else:
            start = (date.today() - timedelta(days=7)).isoformat()

        pipeline = [
            {"$match": {
                "business_id": business_id,
                "date": {"$gte": start},
                "status": {"$in": ["confirmed", "completed", "checked_in"]},
            }},
            {"$group": {
                "_id": None,
                "total_revenue": {"$sum": {"$ifNull": ["$price", 0]}},
                "total_bookings": {"$sum": 1},
                "completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
                "no_shows": {"$sum": {"$cond": [{"$eq": ["$status", "no_show"]}, 1, 0]}},
            }},
        ]
        result = await db.bookings.aggregate(pipeline).to_list(1)
        data = result[0] if result else {"total_revenue": 0, "total_bookings": 0, "completed": 0, "no_shows": 0}

        # Previous period for comparison
        period_days = {"today": 1, "week": 7, "month": 30, "quarter": 90}.get(period, 7)
        prev_start = (date.today() - timedelta(days=period_days * 2)).isoformat()
        prev_end = start
        prev_pipeline = [
            {"$match": {"business_id": business_id, "date": {"$gte": prev_start, "$lt": prev_end}, "status": {"$in": ["confirmed", "completed", "checked_in"]}}},
            {"$group": {"_id": None, "total_revenue": {"$sum": {"$ifNull": ["$price", 0]}}, "total_bookings": {"$sum": 1}}},
        ]
        prev_result = await db.bookings.aggregate(prev_pipeline).to_list(1)
        prev = prev_result[0] if prev_result else {"total_revenue": 0, "total_bookings": 0}

        return {
            "period": period,
            "revenue": data.get("total_revenue", 0),
            "bookings": data.get("total_bookings", 0),
            "completed": data.get("completed", 0),
            "no_shows": data.get("no_shows", 0),
            "avg_booking_value": round(data.get("total_revenue", 0) / max(data.get("total_bookings", 0), 1)),
            "prev_revenue": prev.get("total_revenue", 0),
            "prev_bookings": prev.get("total_bookings", 0),
            "revenue_change": round(((data.get("total_revenue", 0) - prev.get("total_revenue", 0)) / max(prev.get("total_revenue", 0), 1)) * 100) if prev.get("total_revenue", 0) else 0,
        }

    register_tool(
        "assistant_get_revenue",
        "Get revenue analytics for a period: today, week, month, or quarter. Returns revenue, bookings count, completion rate, comparison to previous period.",
        {"type": "object", "properties": {
            "business_id": {"type": "string", "description": "Business ID"},
            "period": {"type": "string", "description": "today, week, month, or quarter (default: week)"},
        }},
        _get_revenue, tier="auto"
    )

    async def _get_consultation_stats(business_id: str = "", **kwargs):
        db = get_database()
        total = await db.consultation_submissions.count_documents({"business_id": business_id})
        blocked = await db.consultation_submissions.count_documents({"business_id": business_id, "status": "blocked"})
        flagged = await db.consultation_submissions.count_documents({"business_id": business_id, "status": "flagged"})
        clear = await db.consultation_submissions.count_documents({"business_id": business_id, "status": {"$in": ["clear", "signed"]}})
        pending = await db.consultation_submissions.count_documents({"business_id": business_id, "reviewed": False})
        expiring = await db.consultation_submissions.count_documents({
            "business_id": business_id,
            "expires_at": {"$lte": datetime.utcnow() + timedelta(days=30), "$gte": datetime.utcnow()},
        })
        return {
            "total": total, "blocked": blocked, "flagged": flagged,
            "clear": clear, "pending_review": pending, "expiring_soon": expiring,
        }

    register_tool(
        "assistant_get_consultation_stats",
        "Get consultation form statistics: total submissions, blocked, flagged, clear, pending review, expiring soon.",
        {"type": "object", "properties": {
            "business_id": {"type": "string", "description": "Business ID"},
        }},
        _get_consultation_stats, tier="auto"
    )

    async def _get_today_schedule(business_id: str = "", **kwargs):
        db = get_database()
        today_str = date.today().isoformat()
        bookings = []
        async for b in db.bookings.find({
            "business_id": business_id, "date": today_str, "status": {"$ne": "cancelled"}
        }).sort("time", 1):
            b["_id"] = str(b["_id"])
            bookings.append({
                "time": b.get("time", ""),
                "customer": b.get("customerName", b.get("customer", {}).get("name", "Client")),
                "service": b.get("service", {}).get("name", "") if isinstance(b.get("service"), dict) else b.get("service_name", b.get("serviceName", "")),
                "staff": b.get("staffName", b.get("staff_name", "")),
                "status": b.get("status", ""),
                "phone": b.get("phone", b.get("customer", {}).get("phone", "")),
            })
        return {"date": today_str, "bookings": bookings, "count": len(bookings)}

    register_tool(
        "assistant_get_today_schedule",
        "Get today's full schedule — all bookings sorted by time. Returns customer, service, staff, status for each.",
        {"type": "object", "properties": {
            "business_id": {"type": "string", "description": "Business ID"},
        }},
        _get_today_schedule, tier="auto"
    )

    async def _get_popular_services(business_id: str = "", days: int = 30, **kwargs):
        db = get_database()
        start = (date.today() - timedelta(days=days)).isoformat()
        pipeline = [
            {"$match": {"business_id": business_id, "date": {"$gte": start}, "status": {"$ne": "cancelled"}}},
            {"$group": {"_id": {"$ifNull": [
                {"$cond": [{"$isArray": "$service"}, None, {"$ifNull": ["$service.name", "$service_name"]}]},
                "$serviceName"
            ]}, "count": {"$sum": 1}, "revenue": {"$sum": {"$ifNull": ["$price", 0]}}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        results = await db.bookings.aggregate(pipeline).to_list(10)
        return {"services": [{"name": r["_id"] or "Unknown", "bookings": r["count"], "revenue": r["revenue"]} for r in results], "period_days": days}

    register_tool(
        "assistant_get_popular_services",
        "Get most popular services/treatments ranked by booking count. Shows bookings and revenue per service.",
        {"type": "object", "properties": {
            "business_id": {"type": "string", "description": "Business ID"},
            "days": {"type": "integer", "description": "Look back period in days (default 30)"},
        }},
        _get_popular_services, tier="auto"
    )


# Register tools on import
_register_assistant_tools()


# ═══════════════════════════════════════
# CHAT ENDPOINT
# ═══════════════════════════════════════

@router.post("/chat")
async def assistant_chat(
    payload: dict = Body(...),
    user: dict = Depends(get_current_staff),
):
    """
    Chat with the ReeveOS Assistant.
    Payload: { "message": "Who's booked tomorrow?", "history": [...] }
    Returns: { "response": "...", "tool_calls": [...], "tokens_used": int }
    """
    message = payload.get("message", "").strip()
    if not message:
        raise HTTPException(400, "Message is required")

    db = get_database()

    # Get business ID from user context
    bid = str(user.get("business_id", ""))
    if not bid:
        bids = user.get("business_ids", [])
        if bids:
            bid = str(bids[0])
    if not bid:
        # Try to find from businesses collection
        biz = await db.businesses.find_one({"owner_id": str(user.get("_id", ""))})
        if biz:
            bid = str(biz["_id"])
    if not bid:
        raise HTTPException(400, "No business context found")

    # Build business context
    biz_context = await _build_business_context(db, bid, user)

    # Build system prompt
    system_prompt = f"""You are the ReeveOS Assistant — an AI business operator for independent high street businesses.
You help business owners manage their appointments, clients, revenue, staff, and operations through conversation.

{biz_context}

RULES:
1. You can NEVER delete anything. Only create, read, and update.
2. Always scope queries to this business only.
3. Be concise and action-oriented. Give numbers, not waffle.
4. When showing data, format it clearly with names, dates, and amounts.
5. If you don't have enough data to answer, say so honestly.
6. Use £ for currency (UK business).
7. When using tools, always pass business_id="{bid}".
8. Speak naturally — you're a helpful colleague, not a robot.

AVAILABLE ACTIONS:
- Look up bookings (today, tomorrow, any date range)
- Search clients by name, find who hasn't visited recently
- Check revenue for any period (today, week, month, quarter)
- View staff and their roles
- Check consultation form status (flagged, blocked, clear)
- See today's full schedule
- Find most popular services"""

    # Include conversation history if provided
    history = payload.get("history", [])
    messages = []
    for h in history[-10:]:  # Last 10 messages max
        if h.get("role") in ("user", "assistant"):
            messages.append({"role": h["role"], "content": h["content"]})

    # Run through agent
    tools_list = [
        "assistant_get_bookings", "assistant_get_clients", "assistant_get_services",
        "assistant_get_staff", "assistant_get_revenue", "assistant_get_consultation_stats",
        "assistant_get_today_schedule", "assistant_get_popular_services",
    ]

    result = await run_agent(
        task=message,
        system_prompt=system_prompt,
        tools=tools_list,
        max_turns=5,
        task_type="assistant_chat",
    )

    # Log the interaction
    await db.assistant_conversations.insert_one({
        "user_id": str(user.get("_id", "")),
        "business_id": bid,
        "message": message,
        "response": result.get("result", ""),
        "tool_calls": result.get("tool_calls", []),
        "tokens_used": result.get("tokens_used", 0),
        "model_used": "haiku",
        "timestamp": datetime.utcnow(),
    })

    return {
        "response": result.get("result", "I couldn't process that request."),
        "tool_calls": result.get("tool_calls", []),
        "tokens_used": result.get("tokens_used", 0),
        "duration": result.get("duration", 0),
    }
