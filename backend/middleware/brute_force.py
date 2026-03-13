"""
ReeveOS Brute Force Protection
===============================
Account-level lockout after repeated failed login attempts.

This is SEPARATE from the IP-based rate limiter (slowapi).
Rate limiter caps requests per IP. This module locks the ACCOUNT
regardless of how many IPs the attacker uses.

Defence in depth:
  Layer 1: slowapi rate limit (5/min per IP) — stops casual scripts
  Layer 2: This module (5 failures per email in 15 min → 30 min lockout) — stops distributed attacks
  Layer 3: (Future) 2FA — stops credential stuffing entirely

MongoDB collection: login_attempts
  {email, ip, success: bool, timestamp, user_agent}

Index: {email: 1, timestamp: -1} — fast lookups for recent failures.
TTL index on timestamp (24h) — auto-cleanup, no manual purging needed.
"""
from datetime import datetime, timedelta
from database import get_database
from fastapi import HTTPException, Request
import logging

logger = logging.getLogger("brute_force")

# ─── Configuration ───
MAX_ATTEMPTS = 5           # Failures before lockout
LOCKOUT_WINDOW_MINUTES = 15   # Window to count failures in
LOCKOUT_DURATION_MINUTES = 30  # How long the lockout lasts


async def ensure_indexes():
    """Create indexes on first run. Safe to call multiple times (idempotent)."""
    db = get_database()
    try:
        # Fast lookups for recent failures by email
        await db.login_attempts.create_index(
            [("email", 1), ("timestamp", -1)],
            name="email_timestamp_idx",
        )
        # Auto-delete old attempts after 24 hours (GDPR: don't keep login attempts forever)
        await db.login_attempts.create_index(
            "timestamp",
            expireAfterSeconds=86400,  # 24 hours
            name="ttl_cleanup",
        )
    except Exception as e:
        # Index already exists or MongoDB not ready — log and continue
        logger.debug(f"Index creation note: {e}")


async def check_lockout(email: str):
    """
    Check if this email is locked out. Call BEFORE attempting authentication.
    Raises HTTP 429 if locked out. Returns silently if OK to proceed.
    """
    if not email:
        return

    email_lower = email.lower().strip()
    db = get_database()

    # Count recent failures for this email
    window_start = datetime.utcnow() - timedelta(minutes=LOCKOUT_WINDOW_MINUTES)
    recent_failures = await db.login_attempts.count_documents({
        "email": email_lower,
        "success": False,
        "timestamp": {"$gte": window_start},
    })

    if recent_failures >= MAX_ATTEMPTS:
        # Check if the LAST failure is within lockout duration
        last_failure = await db.login_attempts.find_one(
            {"email": email_lower, "success": False},
            sort=[("timestamp", -1)],
        )
        if last_failure:
            lockout_expires = last_failure["timestamp"] + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            if datetime.utcnow() < lockout_expires:
                remaining = (lockout_expires - datetime.utcnow()).seconds // 60
                logger.warning(
                    f"LOCKOUT: {email_lower} — {recent_failures} failed attempts, "
                    f"locked for {remaining} more minutes"
                )
                raise HTTPException(
                    status_code=429,
                    detail=f"Account temporarily locked due to too many failed attempts. "
                           f"Try again in {remaining + 1} minutes.",
                )


async def record_attempt(email: str, request: Request, success: bool):
    """
    Record a login attempt (success or failure).
    On success: clear the failure counter so the user isn't locked out next time.
    """
    if not email:
        return

    email_lower = email.lower().strip()
    db = get_database()

    # Get IP and user agent for audit trail
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")[:200]  # Cap length

    # Log the attempt
    await db.login_attempts.insert_one({
        "email": email_lower,
        "ip": ip,
        "user_agent": user_agent,
        "success": success,
        "timestamp": datetime.utcnow(),
    })

    if success:
        # Clear recent failures for this email — they successfully logged in
        window_start = datetime.utcnow() - timedelta(minutes=LOCKOUT_WINDOW_MINUTES)
        await db.login_attempts.delete_many({
            "email": email_lower,
            "success": False,
            "timestamp": {"$gte": window_start},
        })
        logger.info(f"LOGIN OK: {email_lower} from {ip}")
    else:
        logger.warning(f"LOGIN FAIL: {email_lower} from {ip}")
