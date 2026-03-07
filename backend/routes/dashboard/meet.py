"""
ReeveOS — Google Meet Video Consultation API
=============================================
Each business connects their OWN Google account via OAuth.
When a client books a "Virtual Consultation", the system:
1. Creates a Google Calendar event on the business's calendar
2. Auto-generates a Google Meet link
3. Sends the link via email + SMS to both parties

OAuth flow:
- Business clicks "Connect Google" in portal settings
- Redirected to Google consent screen
- Google redirects back with auth code
- We exchange for access + refresh tokens
- Stored per-business in MongoDB (encrypted)

No ReeveOS platform Google account needed — each business uses their own.
"""
from fastapi import APIRouter, Depends, Body, Query, HTTPException, Request
from fastapi.responses import RedirectResponse
from datetime import datetime, timedelta
from typing import Optional
from database import get_database
from middleware.tenant import verify_business_access, TenantContext
from config import settings
import httpx
import logging
import os

logger = logging.getLogger("google_meet")
router = APIRouter(prefix="/meet", tags=["Google Meet / Video Consultations"])

# Google OAuth config — set in .env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://portal.rezvo.app/api/meet/callback")
GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar"


# ═══════════════════════════════════════════════════════════════
# OAUTH — Business connects their Google account
# ═══════════════════════════════════════════════════════════════

@router.get("/connect/{business_id}")
async def start_google_oauth(
    business_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Start Google OAuth flow — redirects business owner to Google consent screen."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(500, "Google OAuth not configured. Add GOOGLE_CLIENT_ID to .env")

    # State parameter includes business_id so we know who to link on callback
    state = f"{tenant.business_id}:{tenant.user_id}"

    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope={GOOGLE_SCOPES}"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={state}"
    )
    return {"auth_url": auth_url}


@router.get("/callback")
async def google_oauth_callback(code: str = None, state: str = None, error: str = None):
    """Google redirects here after user consents. Exchange code for tokens."""
    if error:
        return RedirectResponse(f"/dashboard/settings?google_error={error}")

    if not code or not state:
        return RedirectResponse("/dashboard/settings?google_error=missing_params")

    parts = state.split(":")
    business_id = parts[0] if len(parts) >= 1 else ""
    user_id = parts[1] if len(parts) >= 2 else ""

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        resp = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })

    if resp.status_code != 200:
        logger.error(f"Google token exchange failed: {resp.text}")
        return RedirectResponse(f"/dashboard/settings?google_error=token_exchange_failed")

    tokens = resp.json()
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in", 3600)

    # Get user's email from Google
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
    google_email = user_resp.json().get("email", "") if user_resp.status_code == 200 else ""

    # Store tokens in DB (per business — tenant isolated)
    db = get_database()
    await db.google_integrations.update_one(
        {"business_id": business_id},
        {"$set": {
            "business_id": business_id,
            "connected_by": user_id,
            "google_email": google_email,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_expires_at": datetime.utcnow() + timedelta(seconds=expires_in),
            "connected_at": datetime.utcnow(),
            "status": "connected",
        }},
        upsert=True
    )

    logger.info(f"Google connected for business {business_id} ({google_email})")
    return RedirectResponse("/dashboard/video-meetings?google_connected=true")


@router.get("/status/{business_id}")
async def google_status(
    business_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Check if Google is connected for this business."""
    db = get_database()
    integration = await db.google_integrations.find_one({"business_id": tenant.business_id})
    if not integration or integration.get("status") != "connected":
        return {"connected": False}

    return {
        "connected": True,
        "email": integration.get("google_email", ""),
        "connected_at": integration.get("connected_at", ""),
    }


@router.delete("/disconnect/{business_id}")
async def disconnect_google(
    business_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Disconnect Google account."""
    db = get_database()
    await db.google_integrations.update_one(
        {"business_id": tenant.business_id},
        {"$set": {"status": "disconnected", "access_token": "", "refresh_token": ""}}
    )
    return {"status": "disconnected"}


# ═══════════════════════════════════════════════════════════════
# TOKEN REFRESH — internal helper
# ═══════════════════════════════════════════════════════════════

async def _get_valid_token(business_id: str) -> str:
    """Get a valid access token, refreshing if needed."""
    db = get_database()
    integration = await db.google_integrations.find_one({"business_id": business_id, "status": "connected"})
    if not integration:
        raise HTTPException(400, "Google not connected for this business")

    # Check if token is still valid (with 5 min buffer)
    expires_at = integration.get("token_expires_at")
    if expires_at and isinstance(expires_at, datetime) and expires_at > datetime.utcnow() + timedelta(minutes=5):
        return integration["access_token"]

    # Refresh the token
    refresh_token = integration.get("refresh_token")
    if not refresh_token:
        raise HTTPException(400, "Google refresh token missing — please reconnect")

    async with httpx.AsyncClient() as client:
        resp = await client.post("https://oauth2.googleapis.com/token", data={
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        })

    if resp.status_code != 200:
        logger.error(f"Google token refresh failed: {resp.text}")
        await db.google_integrations.update_one(
            {"business_id": business_id},
            {"$set": {"status": "expired"}}
        )
        raise HTTPException(400, "Google token expired — please reconnect")

    tokens = resp.json()
    new_access = tokens.get("access_token")
    expires_in = tokens.get("expires_in", 3600)

    await db.google_integrations.update_one(
        {"business_id": business_id},
        {"$set": {
            "access_token": new_access,
            "token_expires_at": datetime.utcnow() + timedelta(seconds=expires_in),
        }}
    )

    return new_access


# ═══════════════════════════════════════════════════════════════
# CREATE MEETING — auto-generates Google Meet link
# ═══════════════════════════════════════════════════════════════

@router.post("/business/{business_id}/create")
async def create_meeting(
    business_id: str,
    payload: dict = Body(...),
    tenant: TenantContext = Depends(verify_business_access),
):
    """
    Create a Google Calendar event with auto-generated Meet link.

    Payload:
    - title: "Virtual Consultation — Sarah M."
    - start_time: "2026-03-10T14:00:00Z"
    - duration_minutes: 30
    - client_name: "Sarah M."
    - client_email: "sarah@example.com"
    - staff_name: "Natalie"
    - staff_email: "natalie@rejuvenate.co.uk" (optional)
    - description: "Skin consultation — acne concerns"
    """
    token = await _get_valid_token(tenant.business_id)

    title = payload.get("title", "Virtual Consultation")
    start_iso = payload.get("start_time")
    duration = int(payload.get("duration_minutes", 30))
    client_name = payload.get("client_name", "")
    client_email = payload.get("client_email", "")
    staff_name = payload.get("staff_name", "")
    staff_email = payload.get("staff_email", "")
    description = payload.get("description", "")

    if not start_iso:
        raise HTTPException(400, "start_time required")

    start_dt = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
    end_dt = start_dt + timedelta(minutes=duration)

    # Build attendees
    attendees = []
    if client_email:
        attendees.append({"email": client_email, "displayName": client_name})
    if staff_email:
        attendees.append({"email": staff_email, "displayName": staff_name})

    event_body = {
        "summary": title,
        "description": f"{description}\n\nBooked via ReeveOS",
        "start": {"dateTime": start_dt.isoformat(), "timeZone": "Europe/London"},
        "end": {"dateTime": end_dt.isoformat(), "timeZone": "Europe/London"},
        "attendees": attendees,
        "conferenceData": {
            "createRequest": {
                "requestId": f"reeveos-{tenant.business_id}-{int(datetime.utcnow().timestamp())}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 60},
                {"method": "popup", "minutes": 15},
            ]
        },
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=event_body,
        )

    if resp.status_code not in (200, 201):
        logger.error(f"Google Calendar event creation failed: {resp.text}")
        raise HTTPException(500, f"Failed to create meeting: {resp.json().get('error', {}).get('message', 'Unknown error')}")

    event = resp.json()
    meet_link = event.get("hangoutLink", "")

    # Store meeting in our DB
    db = get_database()
    meeting_doc = {
        "business_id": tenant.business_id,
        "google_event_id": event.get("id", ""),
        "meet_link": meet_link,
        "title": title,
        "start_time": start_iso,
        "duration_minutes": duration,
        "client_name": client_name,
        "client_email": client_email,
        "staff_name": staff_name,
        "staff_email": staff_email,
        "description": description,
        "status": "scheduled",  # scheduled → in_progress → completed → reviewed
        # Audit tracking
        "actual_start": None,
        "actual_end": None,
        "actual_duration_minutes": None,
        "staff_joined_at": None,
        "client_joined_at": None,
        "staff_attended": False,
        "client_attended": False,
        # Post-consultation
        "consultation_notes": "",
        "outcome": "",  # successful, follow_up_needed, no_show_client, no_show_staff, cancelled, rescheduled
        "follow_up_date": None,
        "follow_up_notes": "",
        "treatment_recommended": "",
        "products_recommended": [],
        # Audit trail
        "events": [
            {"action": "created", "at": datetime.utcnow().isoformat(), "by": staff_name or "System"}
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.video_meetings.insert_one(meeting_doc)
    meeting_doc["id"] = str(result.inserted_id)

    # Log to client timeline
    try:
        from helpers.timeline import log_event
        await log_event(
            db, tenant.business_id, "",
            event="clinical.video_consultation_scheduled",
            summary=f"Video consultation scheduled — {client_name} with {staff_name}",
            details={"meeting_id": meeting_doc["id"], "start_time": start_iso, "duration": duration, "meet_link": meet_link},
            actor={"type": "staff", "name": staff_name or "System"},
            client_name=client_name,
        )
    except Exception:
        pass

    return {
        "meeting": {
            "id": meeting_doc["id"],
            "meet_link": meet_link,
            "google_event_id": event.get("id", ""),
            "start_time": start_iso,
            "duration_minutes": duration,
        }
    }


# ═══════════════════════════════════════════════════════════════
# TRACKING — start, join, end, record outcome
# ═══════════════════════════════════════════════════════════════

@router.post("/business/{business_id}/meetings/{meeting_id}/start")
async def start_meeting(
    business_id: str,
    meeting_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Staff marks meeting as started (or auto-triggered when they join)."""
    from bson import ObjectId
    db = get_database()
    now = datetime.utcnow()

    meeting = await db.video_meetings.find_one({"_id": ObjectId(meeting_id), "business_id": tenant.business_id})
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    update = {
        "status": "in_progress",
        "actual_start": now.isoformat(),
        "staff_joined_at": now.isoformat(),
        "staff_attended": True,
        "updated_at": now,
    }
    await db.video_meetings.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": update, "$push": {"events": {"action": "started", "at": now.isoformat(), "by": "Staff"}}}
    )
    return {"status": "started", "actual_start": now.isoformat()}


@router.post("/business/{business_id}/meetings/{meeting_id}/client-joined")
async def client_joined(
    business_id: str,
    meeting_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Record that client has joined the meeting."""
    from bson import ObjectId
    db = get_database()
    now = datetime.utcnow()

    await db.video_meetings.update_one(
        {"_id": ObjectId(meeting_id), "business_id": tenant.business_id},
        {"$set": {"client_joined_at": now.isoformat(), "client_attended": True, "updated_at": now},
         "$push": {"events": {"action": "client_joined", "at": now.isoformat(), "by": "Client"}}}
    )
    return {"status": "client_joined"}


@router.post("/business/{business_id}/meetings/{meeting_id}/end")
async def end_meeting(
    business_id: str,
    meeting_id: str,
    payload: dict = Body({}),
    tenant: TenantContext = Depends(verify_business_access),
):
    """End meeting and record duration. Optionally include notes + outcome."""
    from bson import ObjectId
    db = get_database()
    now = datetime.utcnow()

    meeting = await db.video_meetings.find_one({"_id": ObjectId(meeting_id), "business_id": tenant.business_id})
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    # Calculate actual duration
    actual_start = meeting.get("actual_start")
    actual_duration = None
    if actual_start:
        try:
            start_dt = datetime.fromisoformat(actual_start)
            actual_duration = round((now - start_dt).total_seconds() / 60, 1)
        except Exception:
            pass

    update = {
        "status": "completed",
        "actual_end": now.isoformat(),
        "actual_duration_minutes": actual_duration,
        "updated_at": now,
    }

    # Optional immediate notes
    if payload.get("notes"):
        update["consultation_notes"] = payload["notes"]
    if payload.get("outcome"):
        update["outcome"] = payload["outcome"]

    await db.video_meetings.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": update, "$push": {"events": {"action": "ended", "at": now.isoformat(), "by": "Staff", "duration_minutes": actual_duration}}}
    )

    # Log to client timeline
    try:
        from helpers.timeline import log_event
        await log_event(
            db, tenant.business_id, "",
            event="clinical.video_consultation_completed",
            summary=f"Video consultation completed — {meeting.get('client_name', '')} ({actual_duration or '?'} min)",
            details={"meeting_id": meeting_id, "duration": actual_duration, "outcome": payload.get("outcome", "")},
            actor={"type": "staff", "name": meeting.get("staff_name", "System")},
            client_name=meeting.get("client_name", ""),
        )
    except Exception:
        pass

    return {"status": "completed", "actual_duration_minutes": actual_duration}


@router.post("/business/{business_id}/meetings/{meeting_id}/review")
async def review_meeting(
    business_id: str,
    meeting_id: str,
    payload: dict = Body(...),
    tenant: TenantContext = Depends(verify_business_access),
):
    """Post-consultation review — notes, outcome, recommendations, follow-up."""
    from bson import ObjectId
    db = get_database()
    now = datetime.utcnow()

    update = {
        "status": "reviewed",
        "consultation_notes": payload.get("notes", ""),
        "outcome": payload.get("outcome", ""),
        "treatment_recommended": payload.get("treatment_recommended", ""),
        "products_recommended": payload.get("products_recommended", []),
        "follow_up_date": payload.get("follow_up_date"),
        "follow_up_notes": payload.get("follow_up_notes", ""),
        "updated_at": now,
    }

    await db.video_meetings.update_one(
        {"_id": ObjectId(meeting_id), "business_id": tenant.business_id},
        {"$set": update, "$push": {"events": {"action": "reviewed", "at": now.isoformat(), "by": "Staff", "outcome": payload.get("outcome", "")}}}
    )

    # Create follow-up task if needed
    if payload.get("follow_up_date"):
        meeting = await db.video_meetings.find_one({"_id": ObjectId(meeting_id)})
        if meeting:
            await db.client_tasks.insert_one({
                "business_id": tenant.business_id,
                "client_id": "",
                "client_name": meeting.get("client_name", ""),
                "title": f"Follow-up: {meeting.get('title', 'Video consultation')}",
                "description": payload.get("follow_up_notes", ""),
                "due_date": payload["follow_up_date"],
                "status": "pending",
                "assigned_to": meeting.get("staff_name", ""),
                "assigned_name": meeting.get("staff_name", ""),
                "type": "follow_up",
                "source": "video_consultation",
                "source_id": meeting_id,
                "created_at": now,
            })

    # Log to timeline
    try:
        from helpers.timeline import log_event
        meeting = await db.video_meetings.find_one({"_id": ObjectId(meeting_id)})
        await log_event(
            db, tenant.business_id, "",
            event="clinical.video_consultation_reviewed",
            summary=f"Consultation reviewed — {meeting.get('client_name', '')} — Outcome: {payload.get('outcome', 'N/A')}",
            details={"meeting_id": meeting_id, "outcome": payload.get("outcome"), "treatment": payload.get("treatment_recommended"), "follow_up": payload.get("follow_up_date")},
            actor={"type": "staff", "name": meeting.get("staff_name", "System")},
            client_name=meeting.get("client_name", ""),
        )
    except Exception:
        pass

    return {"status": "reviewed"}


@router.get("/business/{business_id}/meetings/{meeting_id}")
async def get_meeting_detail(
    business_id: str,
    meeting_id: str,
    tenant: TenantContext = Depends(verify_business_access),
):
    """Get full meeting detail with audit trail."""
    from bson import ObjectId
    db = get_database()

    meeting = await db.video_meetings.find_one({"_id": ObjectId(meeting_id), "business_id": tenant.business_id})
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    meeting["id"] = str(meeting.pop("_id"))
    return {"meeting": meeting}


# ═══════════════════════════════════════════════════════════════
# LIST MEETINGS — upcoming video consultations
# ═══════════════════════════════════════════════════════════════

@router.get("/business/{business_id}/meetings")
async def list_meetings(
    business_id: str,
    upcoming_only: bool = False,
    status: Optional[str] = None,
    limit: int = 50,
    tenant: TenantContext = Depends(verify_business_access),
):
    """List video meetings with full audit trail."""
    db = get_database()
    match = {"business_id": tenant.business_id}
    if upcoming_only:
        match["start_time"] = {"$gte": datetime.utcnow().isoformat()}
    if status:
        match["status"] = status

    meetings = []
    async for m in db.video_meetings.find(match).sort("start_time", -1).limit(limit):
        m["id"] = str(m.pop("_id"))
        meetings.append(m)

    # Stats
    total = await db.video_meetings.count_documents({"business_id": tenant.business_id})
    completed = await db.video_meetings.count_documents({"business_id": tenant.business_id, "status": {"$in": ["completed", "reviewed"]}})
    total_minutes = 0
    async for m in db.video_meetings.find({"business_id": tenant.business_id, "actual_duration_minutes": {"$ne": None}}):
        total_minutes += m.get("actual_duration_minutes", 0)

    no_shows = await db.video_meetings.count_documents({"business_id": tenant.business_id, "outcome": {"$in": ["no_show_client", "no_show_staff"]}})

    return {
        "meetings": meetings,
        "stats": {
            "total": total,
            "completed": completed,
            "total_minutes": round(total_minutes, 1),
            "total_hours": round(total_minutes / 60, 1),
            "no_shows": no_shows,
            "avg_duration": round(total_minutes / completed, 1) if completed > 0 else 0,
        }
    }


# ═══════════════════════════════════════════════════════════════
# PUBLIC — client gets their meeting link (no auth needed)
# ═══════════════════════════════════════════════════════════════

@router.get("/public/join/{meeting_id}")
async def get_meeting_link(meeting_id: str):
    """Client clicks this to get redirected to their Google Meet."""
    from bson import ObjectId
    db = get_database()
    try:
        meeting = await db.video_meetings.find_one({"_id": ObjectId(meeting_id)})
    except Exception:
        raise HTTPException(404, "Meeting not found")

    if not meeting:
        raise HTTPException(404, "Meeting not found")

    meet_link = meeting.get("meet_link", "")
    if not meet_link:
        raise HTTPException(400, "No video link available for this meeting")

    return RedirectResponse(meet_link)


# ═══════════════════════════════════════════════════════════════
# SETUP GUIDE — returns instructions for connecting Google
# ═══════════════════════════════════════════════════════════════

@router.get("/setup-guide")
async def setup_guide():
    """Returns the setup guide content for the portal UI."""
    return {
        "title": "Connect Google Meet for Video Consultations",
        "steps": [
            {
                "step": 1,
                "title": "You need a Google account",
                "description": "Any Google account works — Gmail, Google Workspace, or Google One. Free accounts get unlimited 1-on-1 video calls. Google Workspace accounts get 24-hour group meetings.",
                "action": None,
            },
            {
                "step": 2,
                "title": "Click 'Connect Google' below",
                "description": "You'll be redirected to Google's sign-in page. Sign in with the Google account you want to use for video consultations. This is usually your business email.",
                "action": "connect",
            },
            {
                "step": 3,
                "title": "Allow calendar access",
                "description": "Google will ask you to allow ReeveOS to create calendar events. This is how we auto-generate Meet links when clients book virtual consultations. We only create events — we never read or delete your existing calendar.",
                "action": None,
            },
            {
                "step": 4,
                "title": "You're connected",
                "description": "Once connected, any booking marked as 'Virtual Consultation' will automatically create a Google Meet link. The link is sent to both you and the client via email and SMS.",
                "action": None,
            },
        ],
        "faq": [
            {"q": "Do I need Google Workspace?", "a": "No. Any free Google account works. 1-on-1 consultations have no time limit on free accounts."},
            {"q": "What about group consultations?", "a": "Free accounts are limited to 60 minutes for 3+ participants. Google Workspace starts at £5.50/month for unlimited group meetings."},
            {"q": "Can I disconnect?", "a": "Yes, any time from Settings. We'll stop creating calendar events immediately."},
            {"q": "Is my calendar data safe?", "a": "We only CREATE events for video consultations. We never read, modify, or delete any of your existing calendar events."},
        ],
    }
