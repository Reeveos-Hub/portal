"""
Mothership Dashboard API — Salon owner overview of all operators.

Owner-only endpoints. Operators are BLOCKED from all of these.

GDPR: Aggregated data only — no individual client details exposed at this level.
Revenue figures are operator-level totals, not per-client breakdowns.
"""

from datetime import datetime, date, timedelta
from fastapi import APIRouter, HTTPException, Depends, Body, Query
from database import get_database
from middleware.tenant import verify_business_access, TenantContext
from middleware.operator_scope import get_operator_context, OperatorContext, assert_not_operator
from bson import ObjectId
import logging

router = APIRouter(prefix="/mothership", tags=["mothership"])
logger = logging.getLogger("mothership")


# ════════════════════════════════════════════════════════════════
# ENABLE/DISABLE MOTHERSHIP MODE
# ════════════════════════════════════════════════════════════════

@router.post("/business/{business_id}/enable")
async def enable_mothership(
    business_id: str,
    payload: dict = Body(...),
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """Enable self-employed operator mode for this business. Owner only."""
    assert_not_operator(op_ctx, "enable mothership mode")
    db = get_database()

    update = {
        "mothership_mode": True,
        "mothership_settings": {
            "commission_type": payload.get("commission_type", "percentage"),
            "default_commission_rate": float(payload.get("default_rate", 30)),
            "default_chair_rental": float(payload.get("chair_rental", 0)),
            "settlement_frequency": payload.get("settlement_frequency", "instant"),
            "shared_booking_enabled": payload.get("shared_booking", True),
            "updated_at": datetime.utcnow(),
        },
        "updated_at": datetime.utcnow(),
    }

    try:
        await db.businesses.update_one({"_id": ObjectId(business_id)}, {"$set": update})
    except Exception:
        await db.businesses.update_one({"_id": business_id}, {"$set": update})

    logger.info(f"MOTHERSHIP ENABLED: business={business_id} by user={op_ctx.tenant.user_id}")
    return {"status": "enabled", "settings": update["mothership_settings"]}


@router.post("/business/{business_id}/disable")
async def disable_mothership(
    business_id: str,
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """Disable mothership mode. Owner only. Operators remain but are paused."""
    assert_not_operator(op_ctx, "disable mothership mode")
    db = get_database()

    try:
        await db.businesses.update_one({"_id": ObjectId(business_id)}, {"$set": {"mothership_mode": False, "updated_at": datetime.utcnow()}})
    except Exception:
        await db.businesses.update_one({"_id": business_id}, {"$set": {"mothership_mode": False, "updated_at": datetime.utcnow()}})

    # Pause all operators (don't delete — data preserved)
    await db.operators.update_many(
        {"business_id": op_ctx.tenant.business_id, "status": "active"},
        {"$set": {"status": "paused", "paused_at": datetime.utcnow()}},
    )

    logger.info(f"MOTHERSHIP DISABLED: business={business_id} by user={op_ctx.tenant.user_id}")
    return {"status": "disabled"}


@router.get("/business/{business_id}/settings")
async def get_mothership_settings(
    business_id: str,
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """Get mothership settings. Owner only."""
    assert_not_operator(op_ctx, "view mothership settings")
    db = get_database()
    try:
        biz = await db.businesses.find_one({"_id": ObjectId(business_id)})
    except Exception:
        biz = await db.businesses.find_one({"_id": business_id})
    if not biz:
        raise HTTPException(404, "Business not found")
    return {
        "mothership_mode": biz.get("mothership_mode", False),
        "settings": biz.get("mothership_settings", {}),
    }


# ════════════════════════════════════════════════════════════════
# OWNER DASHBOARD
# ════════════════════════════════════════════════════════════════

@router.get("/business/{business_id}/dashboard")
async def mothership_dashboard(
    business_id: str,
    period: str = Query("week"),
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """
    Owner-only overview dashboard.
    Shows aggregated stats across ALL operators. No individual client data exposed.
    """
    assert_not_operator(op_ctx, "view mothership dashboard")
    db = get_database()

    today = date.today()
    if period == "week":
        start = today - timedelta(days=today.weekday())
    elif period == "month":
        start = today.replace(day=1)
    else:
        start = date(2020, 1, 1)

    bid = op_ctx.tenant.business_id

    # Get all active operators
    operators = []
    async for op in db.operators.find({"business_id": bid, "status": "active"}):
        operators.append({
            "id": op.get("id"),
            "name": op.get("name"),
            "email": op.get("email"),
            "avatar": op.get("avatar"),
            "commission_rate": op.get("commission_rate"),
            "commission_type": op.get("commission_type"),
        })

    op_ids = [o["id"] for o in operators]

    # Aggregate bookings per operator
    bookings_query = {
        "businessId": {"$in": [business_id, bid]},
        "date": {"$gte": start.isoformat()},
        "status": {"$in": ["completed", "checked_in", "confirmed", "pending"]},
    }

    total_revenue = 0
    total_bookings = 0
    total_salon_cut = 0
    operator_stats = {op_id: {"revenue": 0, "bookings": 0, "salon_cut": 0, "completed": 0} for op_id in op_ids}

    async for b in db.bookings.find(bookings_query):
        op_id = b.get("operator_id")
        split = b.get("revenue_split", {})
        amount = split.get("total", 0) or b.get("price", 0) or 0
        salon = split.get("salon_cut", 0)

        total_revenue += amount
        total_bookings += 1
        total_salon_cut += salon

        if op_id and op_id in operator_stats:
            operator_stats[op_id]["revenue"] += amount
            operator_stats[op_id]["bookings"] += 1
            operator_stats[op_id]["salon_cut"] += salon
            if b.get("status") == "completed":
                operator_stats[op_id]["completed"] += 1

    # Build leaderboard (sorted by revenue desc)
    leaderboard = []
    for op in operators:
        stats = operator_stats.get(op["id"], {})
        leaderboard.append({
            **op,
            "revenue": round(stats.get("revenue", 0), 2),
            "bookings": stats.get("bookings", 0),
            "salon_cut": round(stats.get("salon_cut", 0), 2),
            "operator_cut": round(stats.get("revenue", 0) - stats.get("salon_cut", 0), 2),
            "completed": stats.get("completed", 0),
        })
    leaderboard.sort(key=lambda x: x["revenue"], reverse=True)

    # Calculate utilisation (simplified: bookings / available hours)
    total_available_hours = len(operators) * 8 * (today - start).days if operators and (today - start).days > 0 else 1
    total_booked_hours = total_bookings  # Rough proxy: 1 booking ≈ 1 hour
    utilisation = min(100, round((total_booked_hours / max(1, total_available_hours)) * 100))

    return {
        "period": period,
        "period_start": start.isoformat(),
        "total_revenue": round(total_revenue, 2),
        "total_bookings": total_bookings,
        "salon_commission_earned": round(total_salon_cut, 2),
        "operator_count": len(operators),
        "utilisation_percent": utilisation,
        "leaderboard": leaderboard,
    }


# ════════════════════════════════════════════════════════════════
# SETTLEMENTS
# ════════════════════════════════════════════════════════════════

@router.get("/business/{business_id}/settlements")
async def list_settlements(
    business_id: str,
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """List settlement reports. Owner sees all. Operator sees only their own."""
    db = get_database()
    query = {"business_id": op_ctx.tenant.business_id}
    if op_ctx.is_operator and op_ctx.operator_id:
        query["operator_id"] = op_ctx.operator_id

    settlements = []
    async for s in db.settlements.find(query).sort("period_end", -1).limit(50):
        s.pop("_id", None)
        settlements.append(s)
    return {"settlements": settlements}


@router.post("/business/{business_id}/settlements/generate")
async def generate_settlement(
    business_id: str,
    payload: dict = Body(...),
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """Generate settlement report for a period. Owner only."""
    assert_not_operator(op_ctx, "generate settlements")
    db = get_database()

    period_start = payload.get("period_start", (date.today() - timedelta(days=7)).isoformat())
    period_end = payload.get("period_end", date.today().isoformat())
    bid = op_ctx.tenant.business_id

    # Get all operators
    operators = []
    async for op in db.operators.find({"business_id": bid, "status": "active"}):
        operators.append(op)

    settlements_created = []

    for op in operators:
        op_id = op.get("id")
        # Sum bookings for this operator in this period
        query = {
            "businessId": {"$in": [business_id, bid]},
            "operator_id": op_id,
            "date": {"$gte": period_start, "$lte": period_end},
            "status": "completed",
        }
        total = 0
        booking_refs = []
        async for b in db.bookings.find(query):
            split = b.get("revenue_split", {})
            amount = split.get("total", 0) or b.get("price", 0) or 0
            total += amount
            booking_refs.append({
                "booking_id": b.get("id") or str(b.get("_id", "")),
                "amount": amount,
                "date": b.get("date"),
                "service": b.get("service") if isinstance(b.get("service"), str) else (b.get("service", {}).get("name", "Service") if isinstance(b.get("service"), dict) else "Service"),
            })

        # Calculate split
        rate = op.get("commission_rate") or 30
        salon_cut = round(total * rate / 100, 2)
        operator_cut = round(total - salon_cut, 2)

        settlement = {
            "id": f"stl_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{op_id[:6]}",
            "business_id": bid,
            "operator_id": op_id,
            "operator_name": op.get("name"),
            "period_start": period_start,
            "period_end": period_end,
            "total_revenue": round(total, 2),
            "commission_rate": rate,
            "salon_cut": salon_cut,
            "operator_cut": operator_cut,
            "booking_count": len(booking_refs),
            "bookings": booking_refs,
            "status": "pending",
            "created_at": datetime.utcnow(),
        }
        await db.settlements.insert_one(settlement)
        settlement.pop("_id", None)
        settlements_created.append(settlement)

    logger.info(f"SETTLEMENTS GENERATED: {len(settlements_created)} for business={business_id} period={period_start} to {period_end}")
    return {"settlements": settlements_created, "count": len(settlements_created)}


@router.patch("/business/{business_id}/settlements/{settlement_id}/mark-paid")
async def mark_settlement_paid(
    business_id: str,
    settlement_id: str,
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """Mark a settlement as paid. Owner only."""
    assert_not_operator(op_ctx, "mark settlements paid")
    db = get_database()
    result = await db.settlements.update_one(
        {"business_id": op_ctx.tenant.business_id, "id": settlement_id},
        {"$set": {"status": "paid", "paid_at": datetime.utcnow(), "paid_by": op_ctx.tenant.user_id}},
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Settlement not found")
    return {"status": "paid", "settlement_id": settlement_id}
