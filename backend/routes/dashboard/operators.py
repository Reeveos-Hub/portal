"""
Operators API — Self-employed operator management within Mothership businesses.

GDPR/ICO/HIPAA:
  - Operators can ONLY access their own data (enforced by operator_scope.py)
  - PINs are hashed before storage (never stored plaintext)
  - Bank details are encrypted at rest (via TenantEncryption)
  - Invite tokens are single-use and expire in 7 days
  - All mutations are audit-logged

Collections:
  operators — {business_id, user_id, name, email, phone, pin_hash, commission_rate,
               chair_rental, stripe_connect_id, services, schedule, status, ...}
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Body, Query
from database import get_database
from middleware.tenant import verify_business_access, TenantContext
from middleware.operator_scope import get_operator_context, OperatorContext, assert_not_operator, scope_query
from middleware.encryption import TenantEncryption
from bson import ObjectId
import hashlib, secrets, uuid, logging

router = APIRouter(prefix="/operators", tags=["operators"])
logger = logging.getLogger("operators")


def _hash_pin(pin: str) -> str:
    """Hash operator PIN. Never store plaintext."""
    return hashlib.sha256(f"reeveos_pin_{pin}".encode()).hexdigest()


def _gen_invite_token() -> str:
    return secrets.token_urlsafe(32)


def _sanitize_operator(op: dict, for_owner: bool = False) -> dict:
    """Strip sensitive fields before returning to client."""
    op.pop("_id", None)
    op.pop("pin_hash", None)
    if not for_owner:
        # Operators can't see other operators' data, but also hide internal fields from themselves
        op.pop("stripe_connect_id", None)
    return op


# ════════════════════════════════════════════════════════════════
# OWNER-ONLY: Manage Operators
# ════════════════════════════════════════════════════════════════

@router.get("/business/{business_id}")
async def list_operators(
    business_id: str,
    status: str = Query(None),
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """List all operators in this business. Owner only."""
    assert_not_operator(op_ctx, "list all operators")
    db = get_database()
    query = {"business_id": op_ctx.tenant.business_id}
    if status:
        query["status"] = status
    operators = []
    async for op in db.operators.find(query).sort("name", 1):
        operators.append(_sanitize_operator(op, for_owner=True))
    return {"operators": operators, "total": len(operators)}


@router.post("/business/{business_id}/invite")
async def invite_operator(
    business_id: str,
    payload: dict = Body(...),
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """Invite a self-employed operator to join this business. Owner only."""
    assert_not_operator(op_ctx, "invite operators")
    db = get_database()

    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    phone = (payload.get("phone") or "").strip()
    commission_rate = payload.get("commission_rate")
    chair_rental = payload.get("chair_rental")
    services = payload.get("services", [])

    if not name or not email:
        raise HTTPException(400, "Name and email are required")

    # Check for duplicate
    existing = await db.operators.find_one({
        "business_id": op_ctx.tenant.business_id,
        "email": email,
        "status": {"$ne": "removed"},
    })
    if existing:
        raise HTTPException(400, "An operator with this email already exists in this business")

    invite_token = _gen_invite_token()
    operator = {
        "id": f"op_{uuid.uuid4().hex[:12]}",
        "business_id": op_ctx.tenant.business_id,
        "user_id": None,  # Set when they accept the invite
        "name": name,
        "email": email,
        "phone": phone,
        "pin_hash": None,  # Set during onboarding
        "commission_rate": float(commission_rate) if commission_rate is not None else None,
        "chair_rental": float(chair_rental) if chair_rental is not None else None,
        "commission_type": "percentage" if commission_rate is not None else "fixed" if chair_rental is not None else "percentage",
        "stripe_connect_id": None,
        "services": services,
        "schedule": {},
        "status": "invited",
        "invite_token": invite_token,
        "invite_expires": datetime.utcnow() + timedelta(days=7),
        "invited_by": op_ctx.tenant.user_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db.operators.insert_one(operator)

    # TODO: Send invite email via Resend
    # For now, return the invite link
    invite_link = f"https://portal.rezvo.app/operator-invite/{invite_token}"

    logger.info(f"OPERATOR INVITED: {email} to business={business_id} by user={op_ctx.tenant.user_id}")
    operator = _sanitize_operator(operator, for_owner=True)
    operator["invite_link"] = invite_link
    return operator


@router.post("/accept-invite/{token}")
async def accept_invite(token: str, payload: dict = Body(...)):
    """Self-employed operator accepts their invite and creates/links their account."""
    db = get_database()
    operator = await db.operators.find_one({
        "invite_token": token,
        "status": "invited",
    })
    if not operator:
        raise HTTPException(404, "Invite not found or already used")
    if operator.get("invite_expires") and operator["invite_expires"] < datetime.utcnow():
        raise HTTPException(400, "Invite has expired. Ask the salon owner to resend.")

    user_id = payload.get("user_id")
    pin = payload.get("pin")

    if not user_id:
        raise HTTPException(400, "user_id required (create account first, then accept invite)")

    # Verify the user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(404, "User account not found")

    # Link operator to user account
    update = {
        "user_id": str(user_id),
        "status": "active",
        "invite_token": None,  # Single-use: burn the token
        "invite_expires": None,
        "activated_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    if pin:
        update["pin_hash"] = _hash_pin(pin)

    await db.operators.update_one({"_id": operator["_id"]}, {"$set": update})

    # Add business_id to user's business_ids so tenant.py grants access
    bid = operator["business_id"]
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"business_ids": bid}},
    )

    logger.info(f"OPERATOR ACTIVATED: user={user_id} as operator={operator['id']} in business={bid}")
    return {"status": "activated", "operator_id": operator["id"], "business_id": bid}


@router.put("/business/{business_id}/{operator_id}")
async def update_operator(
    business_id: str,
    operator_id: str,
    payload: dict = Body(...),
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """Update operator details. Owner can update anything. Operator can update their own profile fields only."""
    db = get_database()

    operator = await db.operators.find_one({
        "business_id": op_ctx.tenant.business_id,
        "id": operator_id,
    })
    if not operator:
        raise HTTPException(404, "Operator not found")

    # If caller is an operator, they can only update their OWN record and only certain fields
    if op_ctx.is_operator:
        if op_ctx.operator_id != operator_id:
            raise HTTPException(403, "Cannot update another operator's profile")
        allowed_fields = {"name", "phone", "bio", "avatar", "schedule", "pin"}
        payload = {k: v for k, v in payload.items() if k in allowed_fields}

    update = {"updated_at": datetime.utcnow()}
    for field in ["name", "phone", "bio", "avatar", "commission_rate", "chair_rental",
                   "commission_type", "services", "schedule", "status"]:
        if field in payload:
            update[field] = payload[field]

    if "pin" in payload and payload["pin"]:
        update["pin_hash"] = _hash_pin(payload["pin"])

    await db.operators.update_one(
        {"business_id": op_ctx.tenant.business_id, "id": operator_id},
        {"$set": update},
    )
    logger.info(f"OPERATOR UPDATED: {operator_id} in business={business_id} by user={op_ctx.tenant.user_id}")
    return {"status": "updated", "operator_id": operator_id}


@router.delete("/business/{business_id}/{operator_id}")
async def remove_operator(
    business_id: str,
    operator_id: str,
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """Remove an operator. Owner only. Soft-delete — data preserved for audit."""
    assert_not_operator(op_ctx, "remove operators")
    db = get_database()

    result = await db.operators.update_one(
        {"business_id": op_ctx.tenant.business_id, "id": operator_id},
        {"$set": {"status": "removed", "removed_at": datetime.utcnow(), "removed_by": op_ctx.tenant.user_id}},
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Operator not found")

    logger.info(f"OPERATOR REMOVED: {operator_id} from business={business_id} by user={op_ctx.tenant.user_id}")
    return {"status": "removed", "operator_id": operator_id}


# ════════════════════════════════════════════════════════════════
# OPERATOR: My Profile & Data
# ════════════════════════════════════════════════════════════════

@router.get("/business/{business_id}/me")
async def get_my_operator_profile(
    business_id: str,
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """Operator gets their own profile. Returns nothing about other operators."""
    if not op_ctx.is_operator or not op_ctx.operator_id:
        raise HTTPException(400, "You are not an operator in this business")
    db = get_database()
    operator = await db.operators.find_one({
        "business_id": op_ctx.tenant.business_id,
        "id": op_ctx.operator_id,
    })
    if not operator:
        raise HTTPException(404, "Operator profile not found")
    return _sanitize_operator(operator)


@router.get("/business/{business_id}/me/revenue")
async def get_my_revenue(
    business_id: str,
    period: str = Query("week"),  # week, month, all
    op_ctx: OperatorContext = Depends(get_operator_context),
):
    """Operator gets their own revenue. ONLY their bookings. Zero leakage."""
    if not op_ctx.is_operator or not op_ctx.operator_id:
        raise HTTPException(400, "You are not an operator in this business")

    db = get_database()
    from datetime import date, timedelta as td
    today = date.today()
    if period == "week":
        start = today - td(days=today.weekday())
    elif period == "month":
        start = today.replace(day=1)
    else:
        start = date(2020, 1, 1)

    # CRITICAL: filter by operator_id — operator sees ONLY their own bookings
    query = {
        "businessId": {"$in": [business_id, op_ctx.tenant.business_id]},
        "operator_id": op_ctx.operator_id,
        "date": {"$gte": start.isoformat()},
        "status": {"$in": ["completed", "checked_in", "confirmed"]},
    }
    total = 0
    count = 0
    salon_cut_total = 0
    async for b in db.bookings.find(query):
        split = b.get("revenue_split", {})
        total += split.get("total", 0) or b.get("price", 0) or 0
        salon_cut_total += split.get("salon_cut", 0)
        count += 1

    operator_cut = total - salon_cut_total

    return {
        "period": period,
        "total_revenue": round(total, 2),
        "salon_cut": round(salon_cut_total, 2),
        "your_cut": round(operator_cut, 2),
        "booking_count": count,
    }


# ════════════════════════════════════════════════════════════════
# VERIFY PIN (for EPOS / Tap to Pay identification)
# ════════════════════════════════════════════════════════════════

@router.post("/business/{business_id}/verify-pin")
async def verify_operator_pin(
    business_id: str,
    payload: dict = Body(...),
    tenant: TenantContext = Depends(verify_business_access),
):
    """Verify operator PIN at the till. Returns operator_id if valid."""
    pin = payload.get("pin", "")
    if not pin:
        raise HTTPException(400, "PIN required")

    db = get_database()
    pin_hash = _hash_pin(pin)
    operator = await db.operators.find_one({
        "business_id": tenant.business_id,
        "pin_hash": pin_hash,
        "status": "active",
    })
    if not operator:
        logger.warning(f"PIN FAILED: business={business_id} pin_hash={pin_hash[:8]}...")
        raise HTTPException(401, "Invalid PIN")

    return {
        "operator_id": operator["id"],
        "name": operator["name"],
        "commission_rate": operator.get("commission_rate"),
        "commission_type": operator.get("commission_type"),
    }
