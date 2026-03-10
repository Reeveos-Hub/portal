"""
Injection Point Mapping API — record injection sites on face/body diagrams.
Stores canvas data (JSON coordinates) per treatment session.
HIPAA/ICO compliant: data isolated per business, encrypted at rest.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Body
from database import get_database
from middleware.tenant_db import get_scoped_db
from middleware.tenant import verify_business_access, TenantContext
import uuid

router = APIRouter(prefix="/injection-mapping", tags=["injection-mapping"])


@router.post("/business/{business_id}/save")
async def save_mapping(business_id: str, payload: dict = Body(...), tenant: TenantContext = Depends(verify_business_access)):
    """Save injection point data for a treatment session."""
    sdb = get_scoped_db(tenant.business_id)
    client_id = payload.get("client_id")
    booking_id = payload.get("booking_id", "")
    treatment = payload.get("treatment", "")
    diagram_type = payload.get("diagram_type", "face_front")  # face_front, face_side_left, face_side_right, body_front, body_back
    points = payload.get("points", [])  # [{x, y, product, units, depth, notes}]
    canvas_data = payload.get("canvas_data")  # Full canvas JSON for advanced rendering

    if not client_id or not points:
        raise HTTPException(400, "client_id and points required")

    mapping = {
        "id": f"inj_{uuid.uuid4().hex[:10]}",
        "business_id": tenant.business_id,
        "client_id": client_id,
        "booking_id": booking_id,
        "treatment": treatment,
        "diagram_type": diagram_type,
        "points": points,
        "canvas_data": canvas_data,
        "practitioner_id": str(tenant.user_id),
        "created_at": datetime.utcnow(),
    }
    await sdb.injection_mappings.insert_one(mapping)
    mapping.pop("_id", None)
    return mapping


@router.get("/business/{business_id}/client/{client_id}")
async def get_client_mappings(business_id: str, client_id: str, tenant: TenantContext = Depends(verify_business_access)):
    """Get all injection mappings for a client."""
    sdb = get_scoped_db(tenant.business_id)
    mappings = []
    async for m in sdb.injection_mappings.find(
        {"business_id": tenant.business_id, "client_id": client_id}
    ).sort("created_at", -1).limit(50):
        m.pop("_id", None)
        mappings.append(m)
    return {"mappings": mappings, "total": len(mappings)}


@router.get("/business/{business_id}/mapping/{mapping_id}")
async def get_mapping_detail(business_id: str, mapping_id: str, tenant: TenantContext = Depends(verify_business_access)):
    """Get a specific injection mapping."""
    sdb = get_scoped_db(tenant.business_id)
    m = await sdb.injection_mappings.find_one({"business_id": tenant.business_id, "id": mapping_id})
    if not m:
        raise HTTPException(404, "Mapping not found")
    m.pop("_id", None)
    return m


@router.delete("/business/{business_id}/mapping/{mapping_id}")
async def delete_mapping(business_id: str, mapping_id: str, tenant: TenantContext = Depends(verify_business_access)):
    sdb = get_scoped_db(tenant.business_id)
    result = await sdb.injection_mappings.delete_one({"business_id": tenant.business_id, "id": mapping_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Mapping not found")
    return {"deleted": mapping_id}
