"""
Client Timeline Engine
Logs every customer touch point to an immutable timeline.
Every interaction, booking, payment, message, form — all tracked here.

Usage:
    from helpers.timeline import log_event
    await log_event(db, business_id, client_id, "booking.completed", 
        summary="Completed Microneedling Facial with Natalie",
        details={"booking_id": "...", "service": "...", "price": 65},
        actor={"type": "system", "name": "System"})
"""
from datetime import datetime
from typing import Optional


# ═══════════════════════════════════════════════════════════════
# EVENT TYPES — every trackable customer touch point
# ═══════════════════════════════════════════════════════════════

EVENT_TYPES = {
    # Booking lifecycle
    "booking.created": "Booking created",
    "booking.confirmed": "Booking confirmed",
    "booking.rescheduled": "Booking rescheduled",
    "booking.checked_in": "Checked in",
    "booking.completed": "Treatment completed",
    "booking.cancelled": "Booking cancelled",
    "booking.no_show": "No-show",
    "booking.walk_in": "Walk-in visit",
    "booking.service_swapped": "Service changed on booking",

    # Clinical
    "clinical.consultation_submitted": "Consultation form submitted",
    "clinical.consultation_reviewed": "Consultation form reviewed by staff",
    "clinical.consultation_expired": "Consultation form expired",
    "clinical.consent_signed": "Treatment consent signed",
    "clinical.medical_update": "Medical details updated",
    "clinical.patch_test_done": "Patch test completed",
    "clinical.aftercare_sent": "Aftercare instructions sent",
    "clinical.contraindication_flagged": "Contraindication flagged",
    "clinical.photo_uploaded": "Treatment photo uploaded",

    # Communication
    "comms.sms_sent": "SMS sent",
    "comms.email_sent": "Email sent",
    "comms.portal_message_sent": "Portal message sent (by business)",
    "comms.portal_message_received": "Portal message received (from client)",
    "comms.phone_call": "Phone call logged",
    "comms.dm_received": "DM/social message logged",
    "comms.walkin_enquiry": "Walk-in enquiry logged",
    "comms.whatsapp": "WhatsApp message logged",

    # Financial
    "financial.payment_received": "Payment received",
    "financial.refund_issued": "Refund issued",
    "financial.invoice_sent": "Invoice sent",
    "financial.tip_received": "Tip received",

    # Packages
    "package.enquired": "Package enquiry",
    "package.quoted": "Package quote sent",
    "package.purchased": "Package purchased",
    "package.session_used": "Package session used",
    "package.expiring": "Package expiring soon",
    "package.renewed": "Package renewed",
    "package.lapsed": "Package lapsed (expired unused)",

    # Products / Retail
    "retail.product_purchased": "Product purchased",
    "retail.product_recommended": "Product recommended",
    "retail.reorder_reminder": "Reorder reminder sent",

    # Academy / Courses
    "academy.course_enquired": "Course enquiry",
    "academy.course_enrolled": "Course enrollment",
    "academy.module_completed": "Course module completed",
    "academy.course_completed": "Course completed",
    "academy.certification_issued": "Certification issued",

    # Pipeline / CRM
    "pipeline.stage_changed": "Pipeline stage changed",
    "pipeline.value_updated": "Pipeline value updated",
    "pipeline.task_created": "Follow-up task created",
    "pipeline.task_completed": "Follow-up task completed",

    # Profile
    "profile.client_created": "Client record created",
    "profile.details_updated": "Client details updated",
    "profile.tag_added": "Tag added",
    "profile.tag_removed": "Tag removed",
    "profile.vip_toggled": "VIP status changed",
    "profile.note_added": "Note added",
    "profile.client_merged": "Client records merged",
    "profile.preference_updated": "Client preference updated",

    # Portal
    "portal.signup": "Client portal signup",
    "portal.login": "Client portal login",
    "portal.booking_made": "Booking made via portal",

    # Marketing
    "marketing.campaign_sent": "Marketing campaign sent",
    "marketing.email_opened": "Marketing email opened",
    "marketing.review_requested": "Review request sent",
    "marketing.review_received": "Review received",
    "marketing.referral_made": "Referral made by this client",
    "marketing.referral_converted": "Referral converted to booking",

    # GDPR
    "gdpr.data_exported": "Client data exported (GDPR)",
    "gdpr.erasure_requested": "Data erasure requested",
    "gdpr.consent_granted": "Consent granted",
    "gdpr.consent_withdrawn": "Consent withdrawn",
}


# ═══════════════════════════════════════════════════════════════
# CORE LOGGING FUNCTION
# ═══════════════════════════════════════════════════════════════

async def log_event(
    db,
    business_id: str,
    client_id: str,
    event: str,
    summary: str = "",
    details: dict = None,
    actor: dict = None,
    client_name: str = "",
    revenue_impact: float = 0,
    metadata: dict = None,
):
    """
    Log a client timeline event. Immutable. Cannot be deleted by staff.
    
    Args:
        db: Database instance (scoped)
        business_id: The business ID
        client_id: The client ID
        event: Event type key from EVENT_TYPES (e.g. "booking.completed")
        summary: Human-readable summary ("Completed Microneedling with Natalie")
        details: Structured data (booking_id, price, service, etc.)
        actor: Who did it {"type": "staff"|"system"|"client", "name": "...", "id": "..."}
        client_name: Client name for quick display
        revenue_impact: Financial value (+65.00 for payment, -65.00 for refund)
        metadata: Any extra structured data
    """
    if not summary:
        summary = EVENT_TYPES.get(event, event)

    if not actor:
        actor = {"type": "system", "name": "System"}

    category = event.split(".")[0] if "." in event else "other"

    doc = {
        "business_id": business_id,
        "client_id": client_id,
        "client_name": client_name,
        "event": event,
        "category": category,
        "summary": summary,
        "details": details or {},
        "actor": actor,
        "revenue_impact": revenue_impact,
        "metadata": metadata or {},
        "timestamp": datetime.utcnow(),
        "immutable": True,
    }

    await db.client_timeline.insert_one(doc)
    return doc


# ═══════════════════════════════════════════════════════════════
# BATCH LOGGING — for seeding / migration
# ═══════════════════════════════════════════════════════════════

async def log_events_batch(db, events: list):
    """Insert multiple timeline events at once."""
    if not events:
        return
    now = datetime.utcnow()
    for e in events:
        e.setdefault("timestamp", now)
        e.setdefault("immutable", True)
        e.setdefault("category", e.get("event", "").split(".")[0] if "." in e.get("event", "") else "other")
        e.setdefault("actor", {"type": "system", "name": "System"})
        e.setdefault("details", {})
        e.setdefault("metadata", {})
        e.setdefault("revenue_impact", 0)
    await db.client_timeline.insert_many(events)


# ═══════════════════════════════════════════════════════════════
# CLIENT HEALTH SCORE CALCULATOR
# ═══════════════════════════════════════════════════════════════

def calculate_health_score(client: dict, bookings: list = None) -> int:
    """
    Calculate a 0-100 health score for a client.
    Higher = healthier relationship, lower = at risk of churning.
    """
    score = 50  # Start neutral

    stats = client.get("stats", {})
    visits = stats.get("totalBookings", 0) or stats.get("visits", 0) or 0
    spend = stats.get("totalSpent", 0) or stats.get("spend", 0) or 0
    no_shows = stats.get("noShows", 0) or stats.get("noShows", 0) or 0
    last_visit = stats.get("lastVisit") or client.get("lastVisit") or client.get("last_visit")

    # Visit frequency bonus (up to +20)
    if visits >= 10:
        score += 20
    elif visits >= 5:
        score += 15
    elif visits >= 3:
        score += 10
    elif visits >= 1:
        score += 5

    # Spend bonus (up to +15)
    if spend >= 1000:
        score += 15
    elif spend >= 500:
        score += 10
    elif spend >= 200:
        score += 5

    # No-show penalty (up to -20)
    if no_shows >= 3:
        score -= 20
    elif no_shows >= 2:
        score -= 10
    elif no_shows >= 1:
        score -= 5

    # Recency (up to +15 or -20)
    if last_visit:
        try:
            if isinstance(last_visit, str):
                from dateutil.parser import parse as parse_date
                lv = parse_date(last_visit)
            else:
                lv = last_visit
            days_since = (datetime.utcnow() - lv).days
            if days_since <= 14:
                score += 15
            elif days_since <= 30:
                score += 10
            elif days_since <= 60:
                score += 5
            elif days_since <= 90:
                score -= 5
            elif days_since <= 180:
                score -= 15
            else:
                score -= 20
        except Exception:
            pass

    # Has active package bonus
    if client.get("active_package"):
        score += 10

    # VIP bonus
    if client.get("vip"):
        score += 5

    # Consultation form status
    form_status = client.get("consultation_form_status")
    if form_status == "expired":
        score -= 10
    elif form_status == "valid":
        score += 5

    # Tags
    tags = client.get("tags") or []
    if "VIP" in tags:
        score += 5
    if "At Risk" in tags:
        score -= 10

    # Clamp
    return max(0, min(100, score))


# ═══════════════════════════════════════════════════════════════
# PIPELINE AUTO-ASSIGNMENT
# ═══════════════════════════════════════════════════════════════

def auto_assign_pipeline_stage(client: dict) -> str:
    """
    Determine the correct pipeline stage based on client data.
    Returns stage ID string.
    """
    stats = client.get("stats", {})
    visits = stats.get("totalBookings", 0) or stats.get("visits", 0) or 0
    last_visit = stats.get("lastVisit") or client.get("lastVisit") or client.get("last_visit")
    has_package = client.get("active_package") is not None
    has_form = client.get("consultation_form_status") in ("valid", "pending_review")

    # Check lapsed (12+ weeks no visit)
    if visits > 0 and last_visit:
        try:
            if isinstance(last_visit, str):
                from dateutil.parser import parse as parse_date
                lv = parse_date(last_visit)
            else:
                lv = last_visit
            days_since = (datetime.utcnow() - lv).days
            if days_since >= 84:  # 12 weeks
                return "lapsed"
            if days_since >= 42:  # 6 weeks
                return "at_risk"
        except Exception:
            pass

    # Active package holder
    if has_package:
        return "package_holder"

    # Regular (3+ completed visits)
    if visits >= 3:
        return "regular"

    # First treatment (1-2 completed)
    if visits >= 1:
        return "first_treatment"

    # Consultation submitted but no completed booking
    if has_form:
        return "consultation"

    # Default
    return "new_lead"


# ═══════════════════════════════════════════════════════════════
# PIPELINE STAGE DEFINITIONS
# ═══════════════════════════════════════════════════════════════

CRM_PIPELINE_STAGES = [
    {"id": "new_lead", "label": "New Lead", "color": "#6B7280", "description": "No bookings yet, no consultation form"},
    {"id": "consultation", "label": "Consultation", "color": "#3B82F6", "description": "Form submitted, awaiting first visit"},
    {"id": "first_treatment", "label": "First Treatment", "color": "#F59E0B", "description": "1-2 completed appointments"},
    {"id": "regular", "label": "Regular", "color": "#10B981", "description": "3+ completed appointments"},
    {"id": "package_holder", "label": "Package Holder", "color": "#8B5CF6", "description": "Active package or course"},
    {"id": "at_risk", "label": "At Risk", "color": "#EF4444", "description": "No visit in 6+ weeks"},
    {"id": "lapsed", "label": "Lapsed", "color": "#9CA3AF", "description": "No visit in 12+ weeks"},
]
