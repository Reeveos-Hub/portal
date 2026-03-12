"""
Documents API — CRM document storage for reports, exports & AI-generated files.

Every generated file (CSV, PDF, DOCX) is saved here. Business owners can
download, preview, send to accountant, and filter/search their documents.

Security:
- Full tenant isolation via verify_business_access
- Files stored per-business: /opt/rezvo-app/uploads/documents/{business_id}/
- Downloads verify business ownership before streaming
- Soft delete preserves audit trail (GDPR)
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse, StreamingResponse
from database import get_database
from middleware.tenant import verify_business_access, TenantContext
from datetime import datetime
from typing import Optional
from bson import ObjectId
import os
import logging
import mimetypes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_ROOT = "/opt/rezvo-app/uploads/documents"

# Ensure upload root exists
os.makedirs(UPLOAD_ROOT, exist_ok=True)


def _business_dir(business_id: str) -> str:
    """Get or create the per-business document directory."""
    path = os.path.join(UPLOAD_ROOT, str(business_id))
    os.makedirs(path, exist_ok=True)
    return path


def _safe_doc(doc: dict) -> dict:
    """Serialize a document record for JSON response."""
    if not doc:
        return {}
    return {
        "id": str(doc["_id"]),
        "business_id": str(doc.get("business_id", "")),
        "name": doc.get("name", ""),
        "type": doc.get("type", ""),          # report | export | form
        "format": doc.get("format", ""),      # pdf | docx | csv
        "tag": doc.get("tag", ""),            # financial | clients | bookings | forms | staff | audit
        "size": doc.get("size", 0),
        "size_display": _format_size(doc.get("size", 0)),
        "created_by": doc.get("created_by", ""),
        "created_by_type": doc.get("created_by_type", "user"),  # user | ai
        "created_at": doc.get("created_at", ""),
        "file_path": doc.get("file_path", ""),
        "report_id": doc.get("report_id", ""),
        "query_text": doc.get("query_text", ""),  # AI query that created it
        "deleted": doc.get("deleted", False),
    }


def _format_size(size_bytes: int) -> str:
    """Human-readable file size."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.0f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


# ═══════════════════════════════════════
# LIST DOCUMENTS
# ═══════════════════════════════════════

@router.get("/business/{business_id}")
async def list_documents(
    business_id: str,
    type: Optional[str] = Query(None, description="Filter: report|export|form"),
    tag: Optional[str] = Query(None, description="Filter: financial|clients|bookings|forms|staff|audit"),
    search: Optional[str] = Query(None, description="Search document names"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    tenant: TenantContext = Depends(verify_business_access),
):
    """List all documents for this business with optional filters."""
    db = get_database()
    bid = tenant.business_id

    query = {"business_id": bid, "deleted": {"$ne": True}}

    if type:
        query["type"] = type
    if tag:
        query["tag"] = tag
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    total = await db.crm_documents.count_documents(query)

    docs = await db.crm_documents.find(query).sort(
        "created_at", -1
    ).skip((page - 1) * limit).limit(limit).to_list(length=limit)

    return {
        "documents": [_safe_doc(d) for d in docs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


# ═══════════════════════════════════════
# GET SINGLE DOCUMENT
# ═══════════════════════════════════════

@router.get("/business/{business_id}/{document_id}")
async def get_document(
    business_id: str,
    document_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Get a single document's metadata."""
    db = get_database()
    bid = tenant.business_id

    doc = await db.crm_documents.find_one({
        "_id": ObjectId(document_id),
        "business_id": bid,
        "deleted": {"$ne": True},
    })

    if not doc:
        raise HTTPException(404, "Document not found")

    return _safe_doc(doc)


# ═══════════════════════════════════════
# DOWNLOAD DOCUMENT
# ═══════════════════════════════════════

@router.get("/business/{business_id}/{document_id}/download")
async def download_document(
    business_id: str,
    document_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Download a document file. Verifies tenant ownership before streaming."""
    db = get_database()
    bid = tenant.business_id

    doc = await db.crm_documents.find_one({
        "_id": ObjectId(document_id),
        "business_id": bid,
        "deleted": {"$ne": True},
    })

    if not doc:
        raise HTTPException(404, "Document not found")

    file_path = doc.get("file_path", "")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(404, "File not found on disk")

    # Security: verify file is within the expected business directory
    expected_dir = _business_dir(bid)
    real_path = os.path.realpath(file_path)
    if not real_path.startswith(os.path.realpath(expected_dir)):
        logger.error(f"Path traversal attempt: {file_path} not in {expected_dir}")
        raise HTTPException(403, "Access denied")

    filename = doc.get("name", "document")
    ext = doc.get("format", "")
    if ext and not filename.endswith(f".{ext}"):
        filename = f"{filename}.{ext}"

    media_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    return FileResponse(
        path=real_path,
        filename=filename,
        media_type=media_type,
    )


# ═══════════════════════════════════════
# SOFT DELETE DOCUMENT
# ═══════════════════════════════════════

@router.delete("/business/{business_id}/{document_id}")
async def delete_document(
    business_id: str,
    document_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Soft-delete a document. File stays on disk for audit trail (GDPR)."""
    db = get_database()
    bid = tenant.business_id

    result = await db.crm_documents.update_one(
        {"_id": ObjectId(document_id), "business_id": bid},
        {"$set": {"deleted": True, "deleted_at": datetime.utcnow().isoformat()}},
    )

    if result.modified_count == 0:
        raise HTTPException(404, "Document not found")

    return {"success": True, "message": "Document deleted"}


# ═══════════════════════════════════════
# SEND TO ACCOUNTANT
# ═══════════════════════════════════════

@router.post("/business/{business_id}/{document_id}/send")
async def send_to_accountant(
    business_id: str,
    document_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Email a document to the business's configured accountant email."""
    db = get_database()
    bid = tenant.business_id

    # Get the document
    doc = await db.crm_documents.find_one({
        "_id": ObjectId(document_id),
        "business_id": bid,
        "deleted": {"$ne": True},
    })
    if not doc:
        raise HTTPException(404, "Document not found")

    # Get business details + accountant email
    business = await db.businesses.find_one({"_id": bid})
    if not business:
        # Try ObjectId
        if ObjectId.is_valid(bid):
            business = await db.businesses.find_one({"_id": ObjectId(bid)})
    if not business:
        raise HTTPException(404, "Business not found")

    accountant_email = business.get("accountant_email", "")
    if not accountant_email:
        raise HTTPException(400, "No accountant email configured. Go to Accounts to set one.")

    business_name = business.get("name", "Your business")

    # Verify the file exists
    file_path = doc.get("file_path", "")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(404, "File not found on disk")

    # Build email with attachment
    import base64
    from helpers.email import send_email, NOREPLY_FROM

    with open(file_path, "rb") as f:
        file_content = base64.b64encode(f.read()).decode("utf-8")

    doc_name = doc.get("name", "Document")
    doc_format = doc.get("format", "pdf")
    filename = f"{doc_name}.{doc_format}"

    html = f"""
    <div style="font-family: 'Figtree', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="padding: 24px; background: #111111; border-radius: 12px 12px 0 0;">
            <h1 style="color: #C9A84C; font-size: 20px; margin: 0;">R.</h1>
        </div>
        <div style="padding: 24px; background: #ffffff; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #111111; font-size: 14px; margin: 0 0 12px;">
                <strong>{business_name}</strong> has sent you a document via ReeveOS.
            </p>
            <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; font-size: 13px; color: #374151;">
                    <strong>Document:</strong> {doc_name}<br>
                    <strong>Format:</strong> {doc_format.upper()}<br>
                    <strong>Date:</strong> {doc.get('created_at', 'N/A')}
                </p>
            </div>
            <p style="color: #6B7280; font-size: 12px; margin: 16px 0 0;">
                The document is attached to this email.
            </p>
        </div>
        <p style="color: #9CA3AF; font-size: 10px; text-align: center; margin-top: 16px;">
            Sent via ReeveOS &middot; reeveos.app
        </p>
    </div>
    """

    # Resend supports attachments via the SDK
    import resend
    from config import settings

    if not settings.resend_api_key:
        raise HTTPException(503, "Email service not configured")

    try:
        result = resend.Emails.send({
            "from_": NOREPLY_FROM,
            "to": [accountant_email],
            "subject": f"{doc_name} — {business_name}",
            "html": html,
            "attachments": [{
                "filename": filename,
                "content": file_content,
            }],
        })

        logger.info(f"Document sent to accountant {accountant_email}: {result.get('id', 'unknown')}")

        # Log the send event
        await db.crm_documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$push": {"send_log": {
                "sent_to": accountant_email,
                "sent_at": datetime.utcnow().isoformat(),
                "sent_by": tenant.user_email,
                "resend_id": result.get("id", ""),
            }}}
        )

        return {"success": True, "sent_to": accountant_email}

    except Exception as e:
        logger.error(f"Failed to send document to accountant: {str(e)}")
        raise HTTPException(500, f"Failed to send email: {str(e)}")


# ═══════════════════════════════════════
# SAVE DOCUMENT (internal — used by report generator)
# ═══════════════════════════════════════

async def save_document(
    db,
    business_id: str,
    name: str,
    file_bytes: bytes,
    format: str,
    type: str = "report",
    tag: str = "",
    created_by: str = "",
    created_by_type: str = "user",
    report_id: str = "",
    query_text: str = "",
) -> dict:
    """
    Save a generated file to disk and create a crm_documents record.
    Called by the report generator, not directly by API routes.
    Returns the saved document record.
    """
    # Create business directory
    biz_dir = _business_dir(business_id)

    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_name = "".join(c for c in name if c.isalnum() or c in " -_").strip()
    safe_name = safe_name.replace(" ", "_")[:100]
    filename = f"{safe_name}_{timestamp}.{format}"
    file_path = os.path.join(biz_dir, filename)

    # Write file
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Create document record
    doc = {
        "business_id": business_id,
        "name": name,
        "type": type,
        "format": format,
        "tag": tag,
        "size": len(file_bytes),
        "created_by": created_by,
        "created_by_type": created_by_type,
        "created_at": datetime.utcnow().isoformat(),
        "file_path": file_path,
        "report_id": report_id,
        "query_text": query_text,
        "deleted": False,
    }

    result = await db.crm_documents.insert_one(doc)
    doc["_id"] = result.inserted_id

    logger.info(f"Document saved: {name} ({format}) for business {business_id}")

    return _safe_doc(doc)


# ═══════════════════════════════════════
# INDEXES (called at startup)
# ═══════════════════════════════════════

async def ensure_indexes(db):
    """Create indexes for efficient document queries."""
    try:
        await db.crm_documents.create_index([
            ("business_id", 1), ("deleted", 1), ("created_at", -1)
        ])
        await db.crm_documents.create_index([
            ("business_id", 1), ("type", 1), ("deleted", 1)
        ])
        await db.crm_documents.create_index([
            ("business_id", 1), ("tag", 1), ("deleted", 1)
        ])
        await db.crm_documents.create_index([
            ("business_id", 1), ("name", "text")
        ])
        logger.info("crm_documents indexes ensured")
    except Exception as e:
        logger.warning(f"crm_documents index creation: {e}")
