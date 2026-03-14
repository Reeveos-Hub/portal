"""
ReeveOS Background Scheduler
============================
Runs periodic tasks:
- Process drip email queue (every 15 min)
- Send booking reminders (every hour)
- Process aftercare email queue (every 5 min)
- Check insights report expiry for drip emails (daily)
"""

import asyncio
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

_scheduler_task = None


async def _run_scheduler():
    """Main scheduler loop."""
    from routes.dashboard.marketing import process_drip_queue
    from database import get_database

    logger.info("Email scheduler started")

    drip_interval = 15 * 60     # 15 minutes
    reminder_interval = 60 * 60  # 1 hour
    aftercare_interval = 5 * 60  # 5 minutes
    quickcheck_interval = 6 * 60 * 60  # 6 hours (runs ~4x daily)
    insights_interval = 24 * 60 * 60  # 24 hours

    last_drip = datetime.utcnow()
    last_reminder = datetime.utcnow()
    last_aftercare = datetime.utcnow()
    last_quickcheck = datetime.utcnow()
    last_insights = datetime.utcnow()

    while True:
        try:
            now = datetime.utcnow()

            # ─── Process Drip Queue ─── #
            if (now - last_drip).total_seconds() >= drip_interval:
                try:
                    result = await process_drip_queue()
                    if result.get("processed", 0) > 0:
                        logger.info(f"Drip queue: processed {result['processed']} enrollments")
                    last_drip = now
                except Exception as e:
                    logger.error(f"Drip queue error: {e}")

            # ─── Send Booking Reminders ─── #
            if (now - last_reminder).total_seconds() >= reminder_interval:
                try:
                    await _send_booking_reminders()
                    last_reminder = now
                except Exception as e:
                    logger.error(f"Booking reminder error: {e}")

            # ─── Process Aftercare Email Queue ─── #
            if (now - last_aftercare).total_seconds() >= aftercare_interval:
                try:
                    await _process_aftercare_queue()
                    last_aftercare = now
                except Exception as e:
                    logger.error(f"Aftercare queue error: {e}")

            # ─── Medical Quick-Check (4 days before appointment) ─── #
            if (now - last_quickcheck).total_seconds() >= quickcheck_interval:
                try:
                    await _send_medical_quickchecks()
                    last_quickcheck = now
                except Exception as e:
                    logger.error(f"Medical quickcheck error: {e}")

            # ─── Insights Report Drip ─── #
            if (now - last_insights).total_seconds() >= insights_interval:
                try:
                    await _send_insights_drip_emails()
                    last_insights = now
                except Exception as e:
                    logger.error(f"Insights drip error: {e}")

            # ─── AI Agent Tasks ─── #
            try:
                from agent.scheduler import run_agent_tick
                await run_agent_tick()
            except Exception as e:
                logger.error(f"Agent tick error: {e}")

            await asyncio.sleep(60)  # Check every minute

        except asyncio.CancelledError:
            logger.info("Email scheduler stopped")
            break
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
            await asyncio.sleep(60)


async def _send_booking_reminders():
    """Send 24h and 2h booking reminders via new template system."""
    from database import get_database
    from helpers.notifications import send_templated_email, send_templated_sms, is_channel_enabled

    db = get_database()
    if not db:
        return

    now = datetime.utcnow()

    # 24-hour reminders
    window_24h_start = now + timedelta(hours=23, minutes=30)
    window_24h_end = now + timedelta(hours=24, minutes=30)

    bookings_24h = await db.bookings.find({
        "status": {"$in": ["confirmed", "pending"]},
        "date": {"$gte": window_24h_start.isoformat()[:10], "$lte": window_24h_end.isoformat()[:10]},
        "reminder_24h_sent": {"$ne": True},
    }).to_list(100)

    sent_count = 0
    for booking in bookings_24h:
        from models.normalize import normalize_booking
        nb = normalize_booking(booking)
        email = nb["customer"]["email"]
        phone = nb["customer"].get("phone", "")
        client_name = nb["customer"]["name"] or "there"

        business = await db.businesses.find_one({"_id": nb["businessId"]})
        if not business:
            from bson import ObjectId
            try:
                business = await db.businesses.find_one({"_id": ObjectId(nb["businessId"])})
            except Exception:
                pass
        if not business:
            continue

        svc = booking.get("service", {})
        svc_name = svc.get("name", "") if isinstance(svc, dict) else str(svc)
        biz_type = business.get("business_type", business.get("category", ""))
        template = "reminder_24h"

        data = {
            "client_name": client_name.split()[0] if client_name != "there" else "there",
            "business_name": business.get("name", ""),
            "service": svc_name or "your appointment",
            "date": nb["date"],
            "time": nb["time"],
            "link": f"https://portal.reeveos.app/book/{business.get('slug', '')}",
        }

        booking_id = str(booking["_id"])

        if email and is_channel_enabled(business, template, "email"):
            try:
                await send_templated_email(
                    to=email, template=template, business=business,
                    data=data, dedup_key=f"reminder24_{booking_id}",
                )
                sent_count += 1
            except Exception as e:
                logger.error(f"24h email reminder failed: {e}")

        if phone and is_channel_enabled(business, template, "sms"):
            try:
                await send_templated_sms(
                    to=phone, template=template, business=business,
                    data=data, dedup_key=f"sms_reminder24_{booking_id}",
                )
            except Exception as e:
                logger.error(f"24h SMS reminder failed: {e}")

        await db.bookings.update_one(
            {"_id": booking["_id"]},
            {"$set": {"reminder_24h_sent": True}},
        )

    if sent_count:
        logger.info(f"Sent {sent_count} booking reminders (24h)")


async def _process_aftercare_queue():
    """
    Process queued aftercare emails — sent 15-30 min after appointment completion.
    Now uses new template system.
    """
    from database import get_database
    from helpers.notifications import send_templated_email, is_channel_enabled

    db = get_database()
    if not db:
        return

    now = datetime.utcnow()
    queue = await db.aftercare_queue.find({
        "sent": False,
        "send_after": {"$lte": now},
    }).to_list(50)

    if not queue:
        return

    sent_count = 0
    for item in queue:
        client_email = item.get("client_email")
        client_name = item.get("client_name", "")
        business_id = item.get("business_id")
        treatment_name = item.get("treatment_name", "your treatment")

        biz = await db.businesses.find_one({"_id": business_id}) if business_id else None
        if not biz:
            from bson import ObjectId
            try:
                biz = await db.businesses.find_one({"_id": ObjectId(business_id)})
            except Exception:
                pass
        biz = biz or {"business_name": "Your Clinic", "name": "Your Clinic", "address": "", "_id": ""}

        if not client_email:
            await db.aftercare_queue.update_one({"_id": item["_id"]}, {"$set": {"sent": True, "skipped": True}})
            continue

        if not is_channel_enabled(biz, "aftercare", "email"):
            await db.aftercare_queue.update_one({"_id": item["_id"]}, {"$set": {"sent": True, "skipped": True, "skip_reason": "disabled_in_preferences"}})
            continue

        try:
            await send_templated_email(
                to=client_email,
                template="aftercare",
                business=biz,
                data={
                    "client_name": client_name.split()[0] if client_name else "there",
                    "service": treatment_name,
                    "instructions": [],
                    "next_session": "",
                    "rebook_url": f"https://portal.reeveos.app/book/{biz.get('slug', '')}",
                },
                dedup_key=f"aftercare_{item.get('booking_id', '')}",
            )
            sent_count += 1
        except Exception as e:
            logger.error(f"Aftercare email failed for {client_email}: {e}")

        await db.aftercare_queue.update_one(
            {"_id": item["_id"]},
            {"$set": {"sent": True, "sent_at": now}}
        )

        # Insurance documentation log
        await db.aftercare_log.insert_one({
            "business_id": business_id,
            "booking_id": item.get("booking_id"),
            "client_email": client_email,
            "client_name": client_name,
            "treatment_type": item.get("treatment_type", ""),
            "treatment_name": treatment_name,
            "sent_at": now,
        })

    if sent_count:
        logger.info(f"Aftercare: sent {sent_count}/{len(queue)} emails")


async def _send_medical_quickchecks():
    """
    G5: 4 days before appointment, email client: 'Any medical changes?'
    If they respond yes → booking flagged → therapist alerted on the day.
    Only for services businesses with consultation forms.
    """
    from database import get_database
    from helpers.email import send_medical_quickcheck

    db = get_database()
    if not db:
        return

    now = datetime.utcnow()

    # Find bookings 4 days from now (window: 3.5 to 4.5 days)
    target_start = now + timedelta(days=3, hours=12)
    target_end = now + timedelta(days=4, hours=12)
    target_date_start = target_start.strftime("%Y-%m-%d")
    target_date_end = target_end.strftime("%Y-%m-%d")

    bookings = await db.bookings.find({
        "status": {"$in": ["confirmed", "pending"]},
        "date": {"$gte": target_date_start, "$lte": target_date_end},
        "type": "services",
        "medical_quickcheck_sent": {"$ne": True},
    }).to_list(100)

    sent = 0
    for booking in bookings:
        from models.normalize import normalize_booking
        nb = normalize_booking(booking)
        email = nb["customer"]["email"]
        name = nb["customer"]["name"] or "there"
        biz_id = nb["businessId"]

        if not email:
            continue

        # Check if this business uses consultation forms
        business = await db.businesses.find_one({"_id": biz_id})
        if not business:
            from bson import ObjectId
            try:
                business = await db.businesses.find_one({"_id": ObjectId(biz_id)})
            except Exception:
                pass
        if not business or business.get("category") == "restaurant":
            continue

        biz_name = business.get("name", "")
        service_name = ""
        svc = nb.get("service")
        if isinstance(svc, dict):
            service_name = svc.get("name", "your treatment")
        elif isinstance(svc, str):
            service_name = svc

        # Build quickcheck URL
        slug = business.get("slug", "")
        booking_id = str(booking["_id"])
        quickcheck_url = f"https://portal.rezvo.app/client/{slug}?quickcheck={booking_id}"

        try:
            await send_medical_quickcheck(
                to=email,
                client_name=name.split()[0] if name != "there" else "there",
                business_name=biz_name,
                booking_date=nb["date"],
                booking_time=nb["time"],
                service_name=service_name or "your treatment",
                quickcheck_url=quickcheck_url,
            )
            sent += 1
        except Exception as e:
            logger.error(f"Medical quickcheck email failed for {email}: {e}")

        await db.bookings.update_one(
            {"_id": booking["_id"]},
            {"$set": {"medical_quickcheck_sent": True, "medical_quickcheck_sent_at": now}}
        )

    if sent:
        logger.info(f"Medical quickchecks: sent {sent} emails")


async def _send_insights_drip_emails():
    """
    Check insights reports and send drip emails at:
    - 10 days before expiry
    - 5 days before expiry
    - 1 day before expiry
    """
    from database import get_database
    from helpers.email import send_insights_reminder

    db = get_database()
    if not db:
        return

    now = datetime.utcnow()

    # Find reports with owner emails that haven't been fully dripped
    reports = await db.insights_reports.find({
        "owner_email": {"$exists": True, "$ne": ""},
        "expires_at": {"$gte": now},
    }).to_list(200)

    sent_count = 0

    for report in reports:
        expires_at = report.get("expires_at")
        if not isinstance(expires_at, datetime):
            continue

        days_left = (expires_at - now).days
        drip_sent = report.get("drip_sent", [])

        # Determine which drip to send
        drip_day = None
        if days_left <= 1 and "1_day" not in drip_sent:
            drip_day = "1_day"
        elif days_left <= 5 and "5_day" not in drip_sent:
            drip_day = "5_day"
        elif days_left <= 10 and "10_day" not in drip_sent:
            drip_day = "10_day"

        if not drip_day:
            continue

        slug = report.get("slug", "")
        report_url = f"https://reeveos.app/insights/{slug}"

        await send_insights_reminder(
            to=report["owner_email"],
            owner_name=report.get("owner_name", "there"),
            business_name=report.get("business_name", "your business"),
            report_url=report_url,
            days_left=days_left,
        )

        # Mark drip as sent
        await db.insights_reports.update_one(
            {"_id": report["_id"]},
            {"$push": {"drip_sent": drip_day}},
        )
        sent_count += 1

    if sent_count:
        logger.info(f"Sent {sent_count} insights drip emails")


def start_scheduler():
    """Start the background scheduler. Call from app lifespan."""
    global _scheduler_task
    loop = asyncio.get_event_loop()
    _scheduler_task = loop.create_task(_run_scheduler())
    return _scheduler_task


def stop_scheduler():
    """Stop the background scheduler."""
    global _scheduler_task
    if _scheduler_task:
        _scheduler_task.cancel()
