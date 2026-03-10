"""
Loyalty & Rewards API — points, tiers, redemption.
Collections:
  loyalty_accounts — {client_id, business_id, points, tier, total_earned, total_redeemed, history[]}
  loyalty_config — {business_id, points_per_pound, tiers[], rewards[], active}
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Body
from database import get_database
from middleware.tenant_db import get_scoped_db
from middleware.tenant import verify_business_access, TenantContext
from bson import ObjectId

router = APIRouter(prefix="/loyalty", tags=["loyalty"])

DEFAULT_CONFIG = {
    "points_per_pound": 1,
    "tiers": [
        {"name": "Bronze", "min_points": 0, "color": "#CD7F32"},
        {"name": "Silver", "min_points": 200, "color": "#C0C0C0"},
        {"name": "Gold", "min_points": 500, "color": "#C9A84C"},
    ],
    "rewards": [
        {"id": "r1", "name": "£5 off next booking", "points_cost": 100, "discount_value": 500, "type": "discount"},
        {"id": "r2", "name": "£10 off next booking", "points_cost": 200, "discount_value": 1000, "type": "discount"},
        {"id": "r3", "name": "Free treatment upgrade", "points_cost": 500, "discount_value": 0, "type": "freebie"},
    ],
    "active": True,
}


def _get_tier(points, tiers):
    tier = tiers[0] if tiers else {"name": "Bronze", "color": "#CD7F32"}
    for t in sorted(tiers, key=lambda x: x.get("min_points", 0)):
        if points >= t.get("min_points", 0):
            tier = t
    return tier


# ─── CONFIG ───
@router.get("/business/{business_id}/config")
async def get_config(business_id: str, tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    config = await sdb.loyalty_config.find_one({"business_id": tenant.business_id})
    if not config:
        return DEFAULT_CONFIG
    config.pop("_id", None)
    return config


@router.put("/business/{business_id}/config")
async def update_config(business_id: str, payload: dict = Body(...), tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    payload["business_id"] = tenant.business_id
    payload["updated_at"] = datetime.utcnow()
    await sdb.loyalty_config.update_one(
        {"business_id": tenant.business_id},
        {"$set": payload},
        upsert=True,
    )
    return {"status": "updated"}


# ─── CLIENT ACCOUNT ───
@router.get("/business/{business_id}/client/{client_id}")
async def get_client_loyalty(business_id: str, client_id: str, tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    account = await sdb.loyalty_accounts.find_one({"business_id": tenant.business_id, "client_id": client_id})
    config = await sdb.loyalty_config.find_one({"business_id": tenant.business_id}) or DEFAULT_CONFIG
    if not account:
        account = {"client_id": client_id, "points": 0, "total_earned": 0, "total_redeemed": 0, "history": []}
    account.pop("_id", None)
    tier = _get_tier(account.get("total_earned", 0), config.get("tiers", DEFAULT_CONFIG["tiers"]))
    account["tier"] = tier
    account["available_rewards"] = [r for r in config.get("rewards", []) if account.get("points", 0) >= r.get("points_cost", 9999)]
    return account


# ─── EARN POINTS (called when appointment completes) ───
@router.post("/business/{business_id}/earn")
async def earn_points(business_id: str, payload: dict = Body(...), tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    client_id = payload.get("client_id")
    amount_pence = int(payload.get("amount", 0))
    booking_id = payload.get("booking_id", "")
    if not client_id or amount_pence <= 0:
        raise HTTPException(400, "client_id and amount required")

    config = await sdb.loyalty_config.find_one({"business_id": tenant.business_id}) or DEFAULT_CONFIG
    ppp = config.get("points_per_pound", 1)
    points = int((amount_pence / 100) * ppp)
    if points <= 0:
        return {"points_earned": 0}

    event = {
        "type": "earn",
        "points": points,
        "amount": amount_pence,
        "booking_id": booking_id,
        "timestamp": datetime.utcnow(),
    }

    await sdb.loyalty_accounts.update_one(
        {"business_id": tenant.business_id, "client_id": client_id},
        {
            "$inc": {"points": points, "total_earned": points},
            "$push": {"history": {"$each": [event], "$slice": -200}},
            "$setOnInsert": {"business_id": tenant.business_id, "client_id": client_id, "total_redeemed": 0},
        },
        upsert=True,
    )
    return {"points_earned": points, "booking_id": booking_id}


# ─── REDEEM REWARD ───
@router.post("/business/{business_id}/redeem")
async def redeem_reward(business_id: str, payload: dict = Body(...), tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    client_id = payload.get("client_id")
    reward_id = payload.get("reward_id")
    if not client_id or not reward_id:
        raise HTTPException(400, "client_id and reward_id required")

    config = await sdb.loyalty_config.find_one({"business_id": tenant.business_id}) or DEFAULT_CONFIG
    reward = next((r for r in config.get("rewards", []) if r.get("id") == reward_id), None)
    if not reward:
        raise HTTPException(404, "Reward not found")

    account = await sdb.loyalty_accounts.find_one({"business_id": tenant.business_id, "client_id": client_id})
    if not account or account.get("points", 0) < reward.get("points_cost", 9999):
        raise HTTPException(400, "Insufficient points")

    event = {
        "type": "redeem",
        "points": -reward["points_cost"],
        "reward": reward["name"],
        "reward_id": reward_id,
        "timestamp": datetime.utcnow(),
    }

    await sdb.loyalty_accounts.update_one(
        {"business_id": tenant.business_id, "client_id": client_id},
        {
            "$inc": {"points": -reward["points_cost"], "total_redeemed": reward["points_cost"]},
            "$push": {"history": {"$each": [event], "$slice": -200}},
        },
    )
    return {"redeemed": reward["name"], "points_spent": reward["points_cost"]}


# ─── LEADERBOARD ───
@router.get("/business/{business_id}/leaderboard")
async def leaderboard(business_id: str, tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    db = get_database()
    config = await sdb.loyalty_config.find_one({"business_id": tenant.business_id}) or DEFAULT_CONFIG
    tiers = config.get("tiers", DEFAULT_CONFIG["tiers"])

    accounts = []
    async for acc in sdb.loyalty_accounts.find({"business_id": tenant.business_id}).sort("total_earned", -1).limit(50):
        acc.pop("_id", None)
        acc.pop("history", None)
        acc["tier"] = _get_tier(acc.get("total_earned", 0), tiers)
        # Resolve client name
        client = await db.clients.find_one({"id": acc.get("client_id")}) or {}
        acc["client_name"] = client.get("name", "Client")
        accounts.append(acc)
    return {"clients": accounts}
