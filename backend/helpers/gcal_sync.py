"""
Google Calendar Sync
====================
Push bookings to the business's connected Google Calendar.
Reuses OAuth tokens from the Google Meet integration (routes/dashboard/meet.py).

One-way sync: ReeveOS → Google Calendar.
Creates/updates/deletes events when bookings change.
Silently skips if Google is not connected (no errors to the user).
"""

import logging
import httpx
from datetime import datetime, timedelta
from database import get_database

logger = logging.getLogger("gcal_sync")

GCAL_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events"


async def _get_token(business_id: str) -> str | None:
    """Get a valid Google access token. Returns None if not connected (no error)."""
    try:
        from routes.dashboard.meet import _get_valid_token
        return await _get_valid_token(business_id)
    except Exception:
        return None


def _booking_to_gcal_event(booking: dict, business: dict) -> dict:
    """Convert a ReeveOS booking to a Google Calendar event payload."""
    biz_name = business.get("name", "")
    customer = booking.get("customer", {})
    cust_name = customer.get("name", "Client")
    service = booking.get("service", {})
    svc_name = service.get("name", "") if isinstance(service, dict) else str(service)

    date_str = booking.get("date", "")
    time_str = booking.get("time", "09:00")
    duration = booking.get("duration", 60)

    # Build datetime strings (Google wants RFC3339)
    try:
        start_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        end_dt = start_dt + timedelta(minutes=duration)
    except (ValueError, TypeError):
        return None

    summary = f"{cust_name} — {svc_name}" if svc_name else f"{cust_name} — Appointment"
    description_parts = [
        f"Client: {cust_name}",
        f"Service: {svc_name}" if svc_name else "",
        f"Duration: {duration} min",
        f"Ref: {booking.get('reference', '')}",
        f"Notes: {booking.get('notes', '')}" if booking.get("notes") else "",
        f"\nManaged by {biz_name} via ReeveOS",
    ]

    return {
        "summary": summary,
        "description": "\n".join(p for p in description_parts if p),
        "start": {
            "dateTime": start_dt.strftime("%Y-%m-%dT%H:%M:%S"),
            "timeZone": "Europe/London",
        },
        "end": {
            "dateTime": end_dt.strftime("%Y-%m-%dT%H:%M:%S"),
            "timeZone": "Europe/London",
        },
        "reminders": {"useDefault": False, "overrides": [
            {"method": "popup", "minutes": 30},
        ]},
        "transparency": "opaque",
        "status": "confirmed",
    }


async def sync_booking_to_gcal(booking: dict, business: dict):
    """Create or update a Google Calendar event for a booking.
    Stores gcal_event_id on the booking for future updates/deletes.
    Silently does nothing if Google is not connected."""
    biz_id = str(business.get("_id", ""))
    token = await _get_token(biz_id)
    if not token:
        return  # Not connected, skip silently

    event = _booking_to_gcal_event(booking, business)
    if not event:
        return

    booking_id = str(booking.get("_id", ""))
    existing_gcal_id = booking.get("gcal_event_id")

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            if existing_gcal_id:
                # Update existing event
                resp = await client.put(
                    f"{GCAL_API}/{existing_gcal_id}",
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                    json=event,
                )
            else:
                # Create new event
                resp = await client.post(
                    GCAL_API,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                    json=event,
                )

            if resp.status_code in (200, 201):
                gcal_id = resp.json().get("id")
                if gcal_id and not existing_gcal_id:
                    # Store the Google Calendar event ID on the booking
                    db = get_database()
                    await db.bookings.update_one(
                        {"_id": booking["_id"]},
                        {"$set": {"gcal_event_id": gcal_id}},
                    )
                logger.info(f"GCal sync: {'updated' if existing_gcal_id else 'created'} event for booking {booking_id}")
            else:
                logger.warning(f"GCal sync failed ({resp.status_code}): {resp.text[:200]}")
    except Exception as e:
        logger.warning(f"GCal sync error for booking {booking_id}: {e}")


async def delete_gcal_event(booking: dict, business: dict):
    """Delete a Google Calendar event when a booking is cancelled.
    Silently does nothing if not connected or no event exists."""
    gcal_id = booking.get("gcal_event_id")
    if not gcal_id:
        return

    biz_id = str(business.get("_id", ""))
    token = await _get_token(biz_id)
    if not token:
        return

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.delete(
                f"{GCAL_API}/{gcal_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code in (200, 204):
                logger.info(f"GCal sync: deleted event {gcal_id}")
            else:
                logger.warning(f"GCal delete failed ({resp.status_code}): {resp.text[:200]}")
    except Exception as e:
        logger.warning(f"GCal delete error: {e}")
