"""
Client Photos API — Before & After photo management.
Stores photo metadata in MongoDB, files in /opt/rezvo-app/uploads/photos/
GDPR: consent_given must be True before any photo is shared/exported.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Body, UploadFile, File, Form
from database import get_database
from middleware.tenant_db import get_scoped_db
from middleware.tenant import verify_business_access, TenantContext
from bson import ObjectId
import os, uuid, aiofiles

router = APIRouter(prefix="/client-photos", tags=["client-photos"])

UPLOAD_DIR = "/opt/rezvo-app/uploads/photos"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/business/{business_id}/upload")
async def upload_photo(
    business_id: str,
    client_id: str = Form(...),
    photo_type: str = Form("before"),  # before, after, progress
    service_name: str = Form(""),
    treatment_date: str = Form(""),
    notes: str = Form(""),
    consent_given: bool = Form(False),
    file: UploadFile = File(...),
    tenant: TenantContext = Depends(verify_business_access),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, WebP allowed")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large (max 10MB)")

    # Create dirs
    biz_dir = os.path.join(UPLOAD_DIR, tenant.business_id, client_id)
    os.makedirs(biz_dir, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex[:12]}.{ext}"
    filepath = os.path.join(biz_dir, filename)

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    sdb = get_scoped_db(tenant.business_id)
    photo_doc = {
        "id": f"photo_{uuid.uuid4().hex[:10]}",
        "business_id": tenant.business_id,
        "client_id": client_id,
        "type": photo_type,
        "service_name": service_name,
        "treatment_date": treatment_date or datetime.utcnow().strftime("%Y-%m-%d"),
        "notes": notes[:500],
        "consent_given": consent_given,
        "filename": filename,
        "filepath": filepath,
        "url": f"/uploads/photos/{tenant.business_id}/{client_id}/{filename}",
        "uploaded_at": datetime.utcnow(),
        "uploaded_by": str(tenant.user_id),
    }
    await sdb.client_photos.insert_one(photo_doc)
    photo_doc.pop("_id", None)
    photo_doc.pop("filepath", None)
    return photo_doc


@router.get("/business/{business_id}/client/{client_id}")
async def get_client_photos(
    business_id: str, client_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    sdb = get_scoped_db(tenant.business_id)
    photos = []
    async for p in sdb.client_photos.find(
        {"business_id": tenant.business_id, "client_id": client_id}
    ).sort("uploaded_at", -1):
        p.pop("_id", None)
        p.pop("filepath", None)
        photos.append(p)

    # Group by treatment date for side-by-side view
    by_date = {}
    for p in photos:
        key = p.get("treatment_date", "unknown")
        if key not in by_date:
            by_date[key] = {"date": key, "service": p.get("service_name", ""), "before": None, "after": None, "progress": []}
        if p["type"] == "before" and not by_date[key]["before"]:
            by_date[key]["before"] = p
        elif p["type"] == "after" and not by_date[key]["after"]:
            by_date[key]["after"] = p
        else:
            by_date[key]["progress"].append(p)

    return {
        "photos": photos,
        "comparisons": sorted(by_date.values(), key=lambda x: x["date"], reverse=True),
        "total": len(photos),
    }


@router.delete("/business/{business_id}/{photo_id}")
async def delete_photo(
    business_id: str, photo_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    sdb = get_scoped_db(tenant.business_id)
    photo = await sdb.client_photos.find_one({"business_id": tenant.business_id, "id": photo_id})
    if not photo:
        raise HTTPException(404, "Photo not found")
    # Delete file
    filepath = photo.get("filepath", "")
    if filepath and os.path.exists(filepath):
        os.remove(filepath)
    await sdb.client_photos.delete_one({"business_id": tenant.business_id, "id": photo_id})
    return {"deleted": photo_id}


@router.patch("/business/{business_id}/{photo_id}/consent")
async def update_consent(
    business_id: str, photo_id: str,
    payload: dict = Body(...),
    tenant: TenantContext = Depends(verify_business_access),
):
    """GDPR: Update consent status for photo sharing."""
    sdb = get_scoped_db(tenant.business_id)
    consent = bool(payload.get("consent_given", False))
    result = await sdb.client_photos.update_one(
        {"business_id": tenant.business_id, "id": photo_id},
        {"$set": {"consent_given": consent, "consent_updated_at": datetime.utcnow()}},
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Photo not found")
    return {"photo_id": photo_id, "consent_given": consent}
