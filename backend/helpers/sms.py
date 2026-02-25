"""
Rezvo SMS Service
=================
SMS notifications via Sendly.live API.
Credit-based: buy credits, pay per SMS.
No monthly fee.

API inferred from Sendly PHP SDK:
  - Auth: Bearer sk_live_v1_xxx
  - Endpoint: POST https://api.sendly.live/v1/messages
  - Payload: { "to": "+447...", "text": "..." }
"""

import logging
import httpx
from typing import Optional, Dict
from config import settings

logger = logging.getLogger(__name__)

SENDLY_BASE_URL = "https://api.sendly.live/v1"


async def send_sms(to: str, body: str) -> Dict:
    """
    Send an SMS via Sendly.live API.
    `to` should be E.164 format, e.g. +447700900000
    Returns: {"success": True/False, "id": "...", "error": "..."}
    """
    api_key = settings.sendly_api_key
    if not api_key:
        logger.warning("Sendly API key not configured — SMS not sent")
        return {"success": False, "error": "SMS service not configured"}

    # Normalise UK numbers
    to = normalise_uk_phone(to)
    if not to:
        return {"success": False, "error": "Invalid phone number"}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{SENDLY_BASE_URL}/messages",
                json={"to": to, "text": body},
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )

            if resp.status_code in (200, 201, 202):
                data = resp.json()
                msg_id = data.get("id") or data.get("messageId") or data.get("sid", "unknown")
                logger.info(f"SMS sent to {to}: {msg_id}")
                return {"success": True, "id": msg_id, "to": to}
            else:
                error_text = resp.text[:200]
                logger.error(f"Sendly SMS failed ({resp.status_code}): {error_text}")
                return {"success": False, "error": f"Sendly API error {resp.status_code}: {error_text}", "to": to}

    except Exception as e:
        logger.error(f"SMS failed to {to}: {str(e)}")
        return {"success": False, "error": str(e), "to": to}


def normalise_uk_phone(phone: str) -> Optional[str]:
    """Convert UK phone to E.164 format."""
    if not phone:
        return None
    # Strip spaces, dashes, dots, parens
    phone = phone.replace(" ", "").replace("-", "").replace(".", "").replace("(", "").replace(")", "").strip()
    # Already E.164
    if phone.startswith("+") and len(phone) >= 12:
        return phone
    # UK format: 07xxx → +447xxx
    if phone.startswith("07") and len(phone) == 11:
        return f"+44{phone[1:]}"
    # Already has 44 prefix without +
    if phone.startswith("44") and len(phone) >= 12:
        return f"+{phone}"
    # International format without +
    if phone.startswith("00"):
        return f"+{phone[2:]}"
    return None


# ─── SMS Templates ─── #

def booking_confirmation_sms(
    client_name: str,
    business_name: str,
    booking_date: str,
    booking_time: str,
    party_size: int = 0,
    reference: str = "",
) -> str:
    """Customer booking confirmation SMS."""
    party = f" for {party_size}" if party_size else ""
    return (
        f"Hi {client_name}! Your booking at {business_name} is confirmed.\n"
        f"{booking_date} at {booking_time}{party}\n"
        f"Ref: {reference}\n"
        f"- Powered by Rezvo"
    )


def new_booking_alert_sms(
    client_name: str,
    booking_date: str,
    booking_time: str,
    party_size: int = 0,
    channel: str = "online",
) -> str:
    """Owner/staff new booking alert SMS."""
    party = f" ({party_size} guests)" if party_size else ""
    return (
        f"New booking: {client_name}{party}\n"
        f"{booking_date} at {booking_time}\n"
        f"Via: {channel}\n"
        f"- Rezvo"
    )


def booking_cancelled_sms(
    client_name: str,
    business_name: str,
    booking_date: str,
    booking_time: str,
) -> str:
    """Customer cancellation confirmation SMS."""
    return (
        f"Hi {client_name}, your booking at {business_name} on "
        f"{booking_date} at {booking_time} has been cancelled.\n"
        f"- Rezvo"
    )


def booking_reminder_sms(
    client_name: str,
    business_name: str,
    booking_date: str,
    booking_time: str,
) -> str:
    """Booking reminder SMS (24h before)."""
    return (
        f"Reminder: {client_name}, your booking at {business_name} is "
        f"tomorrow at {booking_time}.\n"
        f"See you there! - Rezvo"
    )
