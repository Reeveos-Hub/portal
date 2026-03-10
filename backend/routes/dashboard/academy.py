"""
Academy / Training Mode API — for practitioners running training courses.
Natalie's model: £12.50/mo per subscriber for access to her academy content.

Collections:
  academy_config — {business_id, active, name, description, price_monthly, features[]}
  academy_subscribers — {business_id, subscriber_email, subscriber_name, status, subscribed_at}
  academy_content — {business_id, title, type, content, order, published}
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Body, Query
from database import get_database
from middleware.tenant_db import get_scoped_db
from middleware.tenant import verify_business_access, TenantContext
import uuid

router = APIRouter(prefix="/academy", tags=["academy"])


@router.get("/business/{business_id}/config")
async def get_academy_config(business_id: str, tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    config = await sdb.academy_config.find_one({"business_id": tenant.business_id})
    if not config:
        return {"active": False, "name": "", "description": "", "price_monthly": 1250, "features": [], "subscriber_count": 0}
    config.pop("_id", None)
    count = await sdb.academy_subscribers.count_documents({"business_id": tenant.business_id, "status": "active"})
    config["subscriber_count"] = count
    return config


@router.put("/business/{business_id}/config")
async def update_academy_config(business_id: str, payload: dict = Body(...), tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    payload["business_id"] = tenant.business_id
    payload["updated_at"] = datetime.utcnow()
    await sdb.academy_config.update_one({"business_id": tenant.business_id}, {"$set": payload}, upsert=True)
    return {"status": "updated"}


# ─── CONTENT ───
@router.get("/business/{business_id}/content")
async def list_content(business_id: str, tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    items = []
    async for c in sdb.academy_content.find({"business_id": tenant.business_id}).sort("order", 1):
        c.pop("_id", None)
        items.append(c)
    return {"content": items}


@router.post("/business/{business_id}/content")
async def add_content(business_id: str, payload: dict = Body(...), tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    item = {
        "id": f"acad_{uuid.uuid4().hex[:10]}",
        "business_id": tenant.business_id,
        "title": payload.get("title", "")[:200],
        "type": payload.get("type", "lesson"),  # lesson, video, quiz, resource, document
        "content": payload.get("content", ""),
        "order": payload.get("order", 0),
        "published": payload.get("published", False),
        "created_at": datetime.utcnow(),
    }
    await sdb.academy_content.insert_one(item)
    item.pop("_id", None)
    return item


@router.delete("/business/{business_id}/content/{content_id}")
async def delete_content(business_id: str, content_id: str, tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    result = await sdb.academy_content.delete_one({"business_id": tenant.business_id, "id": content_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Content not found")
    return {"deleted": content_id}


# ─── SUBSCRIBERS ───
@router.get("/business/{business_id}/subscribers")
async def list_subscribers(business_id: str, tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    subs = []
    async for s in sdb.academy_subscribers.find({"business_id": tenant.business_id}).sort("subscribed_at", -1):
        s.pop("_id", None)
        subs.append(s)
    return {"subscribers": subs, "total": len(subs), "active": sum(1 for s in subs if s.get("status") == "active")}


@router.post("/business/{business_id}/subscribers")
async def add_subscriber(business_id: str, payload: dict = Body(...), tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    sub = {
        "id": f"sub_{uuid.uuid4().hex[:10]}",
        "business_id": tenant.business_id,
        "subscriber_email": (payload.get("email") or "").strip().lower(),
        "subscriber_name": (payload.get("name") or "").strip(),
        "status": "active",
        "subscribed_at": datetime.utcnow(),
    }
    # Check for duplicate
    existing = await sdb.academy_subscribers.find_one({
        "business_id": tenant.business_id,
        "subscriber_email": sub["subscriber_email"],
    })
    if existing:
        raise HTTPException(400, "Already subscribed")
    await sdb.academy_subscribers.insert_one(sub)
    sub.pop("_id", None)
    return sub
