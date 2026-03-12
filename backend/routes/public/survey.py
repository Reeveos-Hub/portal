"""
Public Survey API — Beautician Market Research
================================================
Public endpoint for survey submissions (no auth).
Admin endpoints for viewing responses (requires admin auth).

Collection: survey_responses in reeveos_app

GDPR notes:
- IP logged for abuse prevention (legitimate interest)
- Contact details collected with explicit consent checkbox
- No data shared with third parties
- Responses deletable via admin endpoint
"""
from fastapi import APIRouter, HTTPException, Request, Depends, Query
from database import get_database
from middleware.rate_limit import limiter
from middleware.auth import get_current_admin
from bson import ObjectId
from datetime import datetime
from typing import Optional
import logging
import re

logger = logging.getLogger("survey")

router = APIRouter(prefix="/api/public/survey", tags=["Survey"])
admin_router = APIRouter(
    prefix="/admin/surveys",
    tags=["Admin — Surveys"],
    dependencies=[Depends(get_current_admin)],
)


def _serialize(doc):
    """Convert MongoDB doc to JSON-safe dict."""
    if doc is None:
        return None
    d = dict(doc)
    for k, v in d.items():
        if isinstance(v, ObjectId):
            d[k] = str(v)
        elif isinstance(v, datetime):
            d[k] = v.isoformat()
    return d


# ════════════════════════════════════════════════════════
# PUBLIC — Submit survey (no auth, rate-limited)
# ════════════════════════════════════════════════════════

VALID_FIELDS = {
    "name", "business_name", "business_type", "business_type_other",
    "team_size", "current_platform", "current_platform_other",
    "platform_cost", "platform_rating", "pain_points", "pain_points_other",
    "wishlist", "payment_processing", "payment_processing_other",
    "interest", "contact", "contact_phone", "contact_email", "contact_instagram",
    "gdpr_consent",
}


@router.post("")
@limiter.limit("10/minute")
async def submit_survey(request: Request, body: dict):
    """
    Accept a beautician market research survey submission.
    Rate-limited to 10/minute per IP.
    """
    db = get_database()

    # ── Validate required fields ──
    name = (body.get("name") or "").strip()
    business_name = (body.get("business_name") or "").strip()
    contact = (body.get("contact") or "").strip()
    contact_phone = (body.get("contact_phone") or "").strip()
    contact_email = (body.get("contact_email") or "").strip()
    contact_instagram = (body.get("contact_instagram") or "").strip()
    gdpr_consent = body.get("gdpr_consent", False)

    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Name is required (at least 2 characters)")
    if not business_name or len(business_name) < 2:
        raise HTTPException(status_code=400, detail="Business name is required (at least 2 characters)")

    # Phone validation — UK mobile (07) or landline (01/02/03)
    if contact_phone:
        phone_clean = re.sub(r'[\s\-\+]', '', contact_phone)
        uk_phone_re = re.compile(r'^(?:(?:44|0)7\d{9}|(?:44|0)[123]\d{8,9})$')
        if not uk_phone_re.match(phone_clean):
            raise HTTPException(status_code=400, detail="Please enter a valid UK phone number")

    # Email validation
    email_re = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
    if contact_email and not email_re.match(contact_email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address")

    # Must have phone + at least email or instagram
    if not contact and not contact_phone:
        raise HTTPException(status_code=400, detail="A UK phone number is required")
    if not contact and not contact_email and not contact_instagram:
        raise HTTPException(status_code=400, detail="Please provide email or Instagram alongside your phone number")
    if not gdpr_consent:
        raise HTTPException(status_code=400, detail="GDPR consent is required")

    # ── Sanitise — only accept known fields, strip strings ──
    clean = {}
    for key in VALID_FIELDS:
        val = body.get(key)
        if val is None:
            continue
        if isinstance(val, str):
            clean[key] = val.strip()[:1000]  # Cap at 1000 chars
        elif isinstance(val, list):
            clean[key] = [str(v).strip()[:200] for v in val[:20]]  # Cap list items
        elif isinstance(val, bool):
            clean[key] = val
        elif isinstance(val, (int, float)):
            clean[key] = val

    # ── Build document ──
    doc = {
        **clean,
        "ip": request.client.host if request.client else "",
        "user_agent": (request.headers.get("user-agent") or "")[:500],
        "source": "reeveos.link",
        "status": "new",  # new → contacted → converted → closed
        "notes": "",
        "created_at": datetime.utcnow(),
    }

    result = await db.survey_responses.insert_one(doc)
    doc_id = str(result.inserted_id)

    logger.info(f"Survey submitted: {name} / {business_name} (id={doc_id})")

    # ── Send email notification ──
    try:
        from helpers.email import send_email, wrap_html

        # Count total responses for context
        total = await db.survey_responses.count_documents({})

        rating_text = clean.get("platform_rating", "—")
        pain_list = clean.get("pain_points", [])
        pain_html = "".join(f"<li>{p}</li>" for p in pain_list) if pain_list else "<li>None selected</li>"
        interest_list = clean.get("interest", [])
        interest_html = "".join(f"<li>{i}</li>" for i in interest_list) if interest_list else "<li>None selected</li>"

        html = wrap_html(f"""
            <div style="padding:20px 0;">
                <h2 style="color:#C9A84C;margin-bottom:4px;">New Survey Response #{total}</h2>
                <p style="color:#999;font-size:13px;margin-bottom:24px;">Beautician Market Research — reeveos.link</p>

                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:10px 0;color:#999;width:140px;">Name</td>
                        <td style="padding:10px 0;color:#fff;font-weight:600;">{clean.get('name', '—')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:10px 0;color:#999;">Business</td>
                        <td style="padding:10px 0;color:#fff;font-weight:600;">{clean.get('business_name', '—')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:10px 0;color:#999;">Type</td>
                        <td style="padding:10px 0;color:#fff;">{clean.get('business_type', '—')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:10px 0;color:#999;">Team size</td>
                        <td style="padding:10px 0;color:#fff;">{clean.get('team_size', '—')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:10px 0;color:#999;">Current platform</td>
                        <td style="padding:10px 0;color:#fff;">{clean.get('current_platform', '—')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:10px 0;color:#999;">Monthly cost</td>
                        <td style="padding:10px 0;color:#fff;">{clean.get('platform_cost', '—')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:10px 0;color:#999;">Happiness</td>
                        <td style="padding:10px 0;color:#fff;">{rating_text}/5</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:10px 0;color:#999;">Card processor</td>
                        <td style="padding:10px 0;color:#fff;">{clean.get('payment_processing', '—')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:10px 0;color:#999;">Phone</td>
                        <td style="padding:10px 0;color:#C9A84C;font-weight:600;">{clean.get('contact_phone', '—')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:10px 0;color:#999;">Email</td>
                        <td style="padding:10px 0;color:#C9A84C;font-weight:600;">{clean.get('contact_email', '—')}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #333;">
                        <td style="padding:10px 0;color:#999;">Instagram</td>
                        <td style="padding:10px 0;color:#C9A84C;font-weight:600;">{clean.get('contact_instagram', '—')}</td>
                    </tr>
                </table>

                <div style="margin-top:20px;">
                    <p style="color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Frustrations</p>
                    <ul style="color:#fff;font-size:14px;padding-left:18px;">{pain_html}</ul>
                </div>

                <div style="margin-top:16px;">
                    <p style="color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Interested in</p>
                    <ul style="color:#fff;font-size:14px;padding-left:18px;">{interest_html}</ul>
                </div>

                {"<div style='margin-top:16px;'><p style=color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;>Dream platform</p><p style=color:#fff;font-size:14px;>" + clean.get('wishlist', '') + "</p></div>" if clean.get('wishlist') else ""}

                <div style="margin-top:24px;padding:16px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.2);border-radius:8px;">
                    <p style="color:#C9A84C;font-weight:700;margin-bottom:4px;">Total responses: {total}</p>
                    <p style="color:#999;font-size:13px;">View all: <a href="https://portaladmin.rezvo.app/surveys" style="color:#C9A84C;">Admin Panel → Surveys</a></p>
                </div>
            </div>
        """)

        # Send to both Ambassador and Grant
        notify_emails = ["ibbyonline@gmail.com", "grantwoods@live.com"]
        for email_addr in notify_emails:
            await send_email(
                to=email_addr,
                subject=f"📋 New survey: {clean.get('name', 'Unknown')} — {clean.get('business_name', 'Unknown')}",
                html=html,
                tags=[{"name": "category", "value": "survey-notification"}],
            )

    except Exception as e:
        # Don't fail the submission if email fails
        logger.warning(f"Survey notification email failed: {e}")

    return {"ok": True, "id": doc_id}


# ════════════════════════════════════════════════════════
# ADMIN — View / manage survey responses
# ════════════════════════════════════════════════════════

@admin_router.get("")
async def list_surveys(
    status: Optional[str] = Query(None, description="Filter: new, contacted, converted, closed"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    sort: str = Query("newest", description="newest or oldest"),
):
    """List all survey responses with optional status filter."""
    db = get_database()
    query = {}
    if status:
        query["status"] = status

    sort_dir = -1 if sort == "newest" else 1
    cursor = db.survey_responses.find(query).sort("created_at", sort_dir).skip(skip).limit(limit)
    docs = await cursor.to_list(limit)

    total = await db.survey_responses.count_documents(query)
    total_all = await db.survey_responses.count_documents({})

    # Quick stats
    new_count = await db.survey_responses.count_documents({"status": "new"})
    contacted_count = await db.survey_responses.count_documents({"status": "contacted"})
    converted_count = await db.survey_responses.count_documents({"status": "converted"})

    return {
        "responses": [_serialize(d) for d in docs],
        "total": total,
        "stats": {
            "total": total_all,
            "new": new_count,
            "contacted": contacted_count,
            "converted": converted_count,
        },
    }


@admin_router.get("/{survey_id}")
async def get_survey(survey_id: str):
    """Get a single survey response by ID."""
    db = get_database()
    try:
        doc = await db.survey_responses.find_one({"_id": ObjectId(survey_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid survey ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Survey not found")

    return _serialize(doc)


@admin_router.put("/{survey_id}/status")
async def update_survey_status(survey_id: str, body: dict):
    """Update survey response status (new → contacted → converted → closed)."""
    db = get_database()
    new_status = (body.get("status") or "").strip().lower()
    valid_statuses = {"new", "contacted", "converted", "closed"}
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid_statuses)}")

    try:
        result = await db.survey_responses.update_one(
            {"_id": ObjectId(survey_id)},
            {"$set": {"status": new_status, "updated_at": datetime.utcnow()}},
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid survey ID")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Survey not found")

    return {"ok": True, "status": new_status}


@admin_router.put("/{survey_id}/notes")
async def update_survey_notes(survey_id: str, body: dict):
    """Add/update notes on a survey response."""
    db = get_database()
    notes = (body.get("notes") or "").strip()[:5000]

    try:
        result = await db.survey_responses.update_one(
            {"_id": ObjectId(survey_id)},
            {"$set": {"notes": notes, "updated_at": datetime.utcnow()}},
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid survey ID")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Survey not found")

    return {"ok": True}


@admin_router.delete("/{survey_id}")
async def delete_survey(survey_id: str):
    """Delete a survey response (GDPR — right to erasure)."""
    db = get_database()
    try:
        result = await db.survey_responses.delete_one({"_id": ObjectId(survey_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid survey ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Survey not found")

    logger.info(f"Survey deleted (GDPR): {survey_id}")
    return {"ok": True, "deleted": True}


@admin_router.get("/export/csv")
async def export_surveys_csv():
    """Export all survey responses as CSV."""
    import csv
    import io
    from fastapi.responses import StreamingResponse

    db = get_database()
    docs = await db.survey_responses.find({}).sort("created_at", -1).to_list(10000)

    output = io.StringIO()
    fields = [
        "created_at", "name", "business_name", "business_type", "team_size",
        "current_platform", "platform_cost", "platform_rating",
        "pain_points", "wishlist", "payment_processing", "interest",
        "contact_phone", "contact_email", "contact_instagram",
        "contact", "status", "notes",
    ]
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()

    for doc in docs:
        row = {}
        for f in fields:
            val = doc.get(f, "")
            if isinstance(val, list):
                val = "; ".join(str(v) for v in val)
            elif isinstance(val, datetime):
                val = val.strftime("%Y-%m-%d %H:%M")
            elif isinstance(val, ObjectId):
                val = str(val)
            row[f] = val
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=survey_responses_{datetime.utcnow().strftime('%Y%m%d')}.csv"},
    )
