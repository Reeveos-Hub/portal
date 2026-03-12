"""
CMS Bridge — Connects the React frontend to Payload CMS data
=============================================================
Reads from reeveos_cms (Payload) database.
Serves the SAME endpoint paths the frontend already calls.
Replaces the old website_builder.py routes.

SECURITY: Full tenant isolation. business_id → tenant mapping.
Every request verified through existing auth + tenant middleware.
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from database import get_database
from middleware.tenant import verify_business_access, TenantContext
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
import logging, re, os

logger = logging.getLogger("cms_bridge")
router = APIRouter(prefix="/website", tags=["Website Builder"])

SLUG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9\-]{0,98}[a-z0-9]$|^[a-z0-9]$")

# ─── CMS Database Connection ────────────────────────────────────────
_cms_client = None
_cms_db = None

def get_cms_db():
    """Get the CMS database (reeveos_cms — separate from main app)."""
    global _cms_client, _cms_db
    if _cms_db is None:
        uri = os.getenv("CMS_DATABASE_URI", "mongodb://127.0.0.1:27017")
        _cms_client = AsyncIOMotorClient(uri)
        _cms_db = _cms_client["reeveos_cms"]
    return _cms_db


# ─── Tenant Mapping ─────────────────────────────────────────────────
async def _get_or_create_tenant(business_id: str):
    """
    Map a business_id to a CMS tenant.
    Looks up the business name from the main DB, then finds/creates
    a tenant in the CMS DB. Full isolation — CMS never reads main app data
    except the business name for mapping.
    """
    cms = get_cms_db()
    main_db = get_database()

    # Check if we already have a tenant linked to this business
    tenant = await cms.tenants.find_one({"businessId": business_id})
    if tenant:
        return tenant

    # Look up business name from main DB (one-time read for mapping)
    business = await main_db.businesses.find_one({"_id": ObjectId(business_id)})
    if not business:
        raise HTTPException(404, "Business not found")

    biz_name = business.get("name", "My Business")

    # Check if tenant exists by name (from seed script)
    tenant = await cms.tenants.find_one({"name": biz_name})
    if tenant:
        # Link it to this business_id for future lookups
        await cms.tenants.update_one(
            {"_id": tenant["_id"]},
            {"$set": {"businessId": business_id}}
        )
        return tenant

    # Create a new tenant
    slug = re.sub(r"[^a-z0-9]+", "-", biz_name.lower()).strip("-")
    now = datetime.now(timezone.utc)
    new_tenant = {
        "name": biz_name,
        "businessId": business_id,
        "subdomain": slug,
        "customDomain": None,
        "brandColors": {
            "primary": "#111111",
            "secondary": "#C9A84C",
            "background": "#FFFFFF",
            "text": "#111111",
            "accent": "#C9A84C",
        },
        "fonts": {"heading": "Figtree", "body": "Figtree"},
        "navigation": [],
        "footer": {"businessName": biz_name},
        "seoDefaults": {"titleSuffix": f" | {biz_name}"},
        "integrations": {},
        "createdAt": now,
        "updatedAt": now,
    }
    result = await cms.tenants.insert_one(new_tenant)
    new_tenant["_id"] = result.inserted_id
    return new_tenant


def _serialize(doc):
    """Convert MongoDB doc to JSON-safe dict."""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    if "tenant" in doc and isinstance(doc["tenant"], ObjectId):
        doc["tenant"] = str(doc["tenant"])
    # Convert puckData (Payload) → puck_data (frontend)
    if "puckData" in doc:
        doc["puck_data"] = doc.pop("puckData")
    return doc


# ─── PAGES: LIST ─────────────────────────────────────────────────────
@router.get("/business/{business_id}/pages")
async def list_pages(
    business_id: str,
    ctx: TenantContext = Depends(verify_business_access),
):
    cms = get_cms_db()
    tenant = await _get_or_create_tenant(business_id)
    tid = tenant["_id"]

    cursor = cms.pages.find(
        {"tenant": tid},
        {"puckData": 0},  # Don't send full page data in list
    ).sort("order", 1)

    pages = []
    async for doc in cursor:
        pages.append(_serialize(doc))
    return pages


# ─── PAGES: GET SINGLE ──────────────────────────────────────────────
@router.get("/business/{business_id}/pages/{slug}")
async def get_page(
    business_id: str,
    slug: str,
    ctx: TenantContext = Depends(verify_business_access),
):
    cms = get_cms_db()
    tenant = await _get_or_create_tenant(business_id)
    tid = tenant["_id"]

    page = await cms.pages.find_one({"tenant": tid, "slug": slug})
    if not page:
        raise HTTPException(404, f"Page '{slug}' not found")
    return _serialize(page)


# ─── PAGES: CREATE ───────────────────────────────────────────────────
@router.post("/business/{business_id}/pages")
async def create_page(
    business_id: str,
    body: dict = Body(...),
    ctx: TenantContext = Depends(verify_business_access),
):
    cms = get_cms_db()
    tenant = await _get_or_create_tenant(business_id)
    tid = tenant["_id"]

    title = body.get("title", "New Page")
    slug = body.get("slug", "")
    if not slug:
        slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "page"

    if not SLUG_PATTERN.match(slug):
        raise HTTPException(400, "Invalid slug format")

    # Check duplicate
    existing = await cms.pages.find_one({"tenant": tid, "slug": slug})
    if existing:
        raise HTTPException(409, f"Page '{slug}' already exists")

    now = datetime.now(timezone.utc)
    puck_data = body.get("puck_data", {"content": [], "root": {"props": {}}})
    count = await cms.pages.count_documents({"tenant": tid})

    new_page = {
        "tenant": tid,
        "title": title,
        "slug": slug,
        "status": "draft",
        "puckData": puck_data,
        "seo": {"title": title, "description": ""},
        "excerpt": "",
        "order": count,
        "createdAt": now,
        "updatedAt": now,
    }
    result = await cms.pages.insert_one(new_page)
    new_page["_id"] = result.inserted_id
    return _serialize(new_page)


# ─── PAGES: UPDATE (SAVE) ───────────────────────────────────────────
@router.put("/business/{business_id}/pages/{slug}")
async def update_page(
    business_id: str,
    slug: str,
    body: dict = Body(...),
    ctx: TenantContext = Depends(verify_business_access),
):
    cms = get_cms_db()
    tenant = await _get_or_create_tenant(business_id)
    tid = tenant["_id"]

    page = await cms.pages.find_one({"tenant": tid, "slug": slug})
    if not page:
        raise HTTPException(404, f"Page '{slug}' not found")

    update = {"updatedAt": datetime.now(timezone.utc)}

    if "puck_data" in body:
        update["puckData"] = body["puck_data"]
    if "title" in body:
        update["title"] = body["title"]
    if "seo" in body:
        update["seo"] = body["seo"]
    if "status" in body:
        update["status"] = body["status"]

    await cms.pages.update_one({"_id": page["_id"]}, {"$set": update})

    updated = await cms.pages.find_one({"_id": page["_id"]})
    return _serialize(updated)


# ─── PAGES: DELETE ───────────────────────────────────────────────────
@router.delete("/business/{business_id}/pages/{slug}")
async def delete_page(
    business_id: str,
    slug: str,
    ctx: TenantContext = Depends(verify_business_access),
):
    cms = get_cms_db()
    tenant = await _get_or_create_tenant(business_id)
    tid = tenant["_id"]

    result = await cms.pages.delete_one({"tenant": tid, "slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(404, f"Page '{slug}' not found")
    return {"deleted": True, "slug": slug}


# ─── PAGES: PUBLISH ─────────────────────────────────────────────────
@router.post("/business/{business_id}/pages/{slug}/publish")
async def publish_page(
    business_id: str,
    slug: str,
    ctx: TenantContext = Depends(verify_business_access),
):
    cms = get_cms_db()
    tenant = await _get_or_create_tenant(business_id)
    tid = tenant["_id"]

    result = await cms.pages.update_one(
        {"tenant": tid, "slug": slug},
        {"$set": {
            "status": "published",
            "publishedAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(404, f"Page '{slug}' not found")
    return {"published": True, "slug": slug}


# ─── PAGES: DUPLICATE ───────────────────────────────────────────────
@router.post("/business/{business_id}/pages/{slug}/duplicate")
async def duplicate_page(
    business_id: str,
    slug: str,
    ctx: TenantContext = Depends(verify_business_access),
):
    cms = get_cms_db()
    tenant = await _get_or_create_tenant(business_id)
    tid = tenant["_id"]

    original = await cms.pages.find_one({"tenant": tid, "slug": slug})
    if not original:
        raise HTTPException(404, f"Page '{slug}' not found")

    # Generate unique slug
    base = f"{slug}-copy"
    new_slug = base
    counter = 1
    while await cms.pages.find_one({"tenant": tid, "slug": new_slug}):
        new_slug = f"{base}-{counter}"
        counter += 1

    now = datetime.now(timezone.utc)
    count = await cms.pages.count_documents({"tenant": tid})
    copy = {
        "tenant": tid,
        "title": f"{original['title']} (Copy)",
        "slug": new_slug,
        "status": "draft",
        "puckData": original.get("puckData", {"content": [], "root": {"props": {}}}),
        "seo": original.get("seo", {}),
        "excerpt": original.get("excerpt", ""),
        "order": count,
        "createdAt": now,
        "updatedAt": now,
    }
    result = await cms.pages.insert_one(copy)
    copy["_id"] = result.inserted_id
    return _serialize(copy)


# ─── SETTINGS: GET ───────────────────────────────────────────────────
@router.get("/business/{business_id}/settings")
async def get_settings(
    business_id: str,
    ctx: TenantContext = Depends(verify_business_access),
):
    cms = get_cms_db()
    tenant = await _get_or_create_tenant(business_id)

    # Return tenant data as settings
    return {
        "id": str(tenant["_id"]),
        "name": tenant.get("name", ""),
        "subdomain": tenant.get("subdomain", ""),
        "customDomain": tenant.get("customDomain"),
        "brand_colors": tenant.get("brandColors", {}),
        "fonts": tenant.get("fonts", {}),
        "logo": tenant.get("logo"),
        "favicon": tenant.get("favicon"),
        "navigation": tenant.get("navigation", []),
        "footer": tenant.get("footer", {}),
        "seo_defaults": tenant.get("seoDefaults", {}),
        "integrations": tenant.get("integrations", {}),
    }


# ─── SETTINGS: UPDATE ───────────────────────────────────────────────
@router.put("/business/{business_id}/settings")
async def update_settings(
    business_id: str,
    body: dict = Body(...),
    ctx: TenantContext = Depends(verify_business_access),
):
    cms = get_cms_db()
    tenant = await _get_or_create_tenant(business_id)

    update = {"updatedAt": datetime.now(timezone.utc)}

    # Map frontend field names to Payload field names
    field_map = {
        "subdomain": "subdomain",
        "custom_domain": "customDomain",
        "brand_colors": "brandColors",
        "fonts": "fonts",
        "logo": "logo",
        "favicon": "favicon",
        "navigation": "navigation",
        "footer": "footer",
        "seo_defaults": "seoDefaults",
        "integrations": "integrations",
        "name": "name",
    }

    for frontend_key, cms_key in field_map.items():
        if frontend_key in body:
            update[cms_key] = body[frontend_key]

    await cms.tenants.update_one({"_id": tenant["_id"]}, {"$set": update})

    # Return updated settings
    updated = await cms.tenants.find_one({"_id": tenant["_id"]})
    return {
        "id": str(updated["_id"]),
        "subdomain": updated.get("subdomain", ""),
        "name": updated.get("name", ""),
        "updated": True,
    }
