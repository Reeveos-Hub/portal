"""
Board update — 7 Mar 2026 FULL session + Natalie call requirements.
Run: cd /opt/rezvo-app && python3 backend/scripts/update_board_march7_v2.py
"""
import asyncio, os, sys
from datetime import datetime
from dotenv import load_dotenv
load_dotenv("/opt/rezvo-app/backend/.env")
sys.path.insert(0, "/opt/rezvo-app/backend")

async def main():
    from motor.motor_asyncio import AsyncIOMotorClient
    mongo_url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.rezvo
    now = datetime.utcnow()

    # Drop old board and rebuild clean
    await db.command_centre_tasks.delete_many({})
    print("Board cleared — rebuilding...\n")

    tasks = []

    # ═══════════════════════════════════════════
    # DONE — completed this session
    # ═══════════════════════════════════════════

    done = [
        ("Domain revert (Option A)", "infrastructure", "critical",
         "20 files reverted from reeveos.app → rezvo.app. Code matches VPS snapshot."),
        ("Bookings page — business-type labels", "frontend", "critical",
         "Salons: In Treatment/Client/Therapist. Restaurants: Seated/Guests/Table."),
        ("Calendar add-booking side panel", "frontend", "critical",
         "Right-side slide panel. Client/phone/email/treatment picker/therapist/date/time/notes."),
        ("Calendar click-to-book on empty slots", "frontend", "high",
         "Click any empty slot → side panel opens with date/time/therapist pre-filled."),
        ("Calendar click appointments (drag threshold)", "frontend", "high",
         "5px threshold so taps open popover, drags still work after movement."),
        ("Edit / Check In / Complete buttons wired", "frontend", "critical",
         "Edit opens side panel pre-filled. Check In toggles status. Complete toggles status."),
        ("Branded cancel confirmation modal", "frontend", "high",
         "Red warning icon, blur backdrop, 'Keep appointment' / 'Cancel appointment' buttons. No browser defaults."),
        ("Custom dropdowns — zero browser selects", "frontend", "high",
         "Treatment picker (name + price + duration per row) and therapist picker. Both branded."),
        ("Package tracking API + calendar dots", "backend + frontend", "high",
         "CRUD API. Calendar popover shows progress dots + remaining count."),
        ("Therapist notes on calendar popover", "backend + frontend", "medium",
         "Notes displayed in amber box. Calendar APIs return customerId, price, notes."),
        ("SupportBot — business-aware context", "backend + frontend", "critical",
         "Different data snapshots for restaurants vs services. Suggested questions adapt."),
        ("SupportBot — gold brand + dynamic industry label", "frontend", "high",
         "Gold #C9A84C branding. Reads business.category from DB: 'Skin Clinic assistant' etc."),
        ("SupportBot — single FAB (no duplicates)", "frontend", "high",
         "One FAB: New Appointment, Walk-in Client, Chat Support. Same animation as hospitality."),
        ("SupportBot — walk-in panel services-aware", "frontend", "high",
         "Services: Client name, Phone, Notes. No party size, no table. 'Check In Walk-in'."),
        ("SECURITY: Chatbot business data isolation", "security", "critical",
         "Auth token on requests. Server-side business_id. Zero cross-business data exposure."),
        ("Immutable audit trail", "backend", "critical",
         "booking_audit collection. Status changes + moves logged. Staff cannot delete. Owner-only API."),
        ("Cancellation enforcement", "backend", "high",
         "Checks cancellationNoticeHours. 24/48/72hr tiers. Returns 400 if within notice."),
        ("SMS wired via Sendly", "backend", "high",
         "Confirmation on booking + cancellation. Fails silently. Templates for confirm/cancel/reminder."),
        ("Seed data fix — staffId on bookings", "data", "critical",
         "991 bookings patched. Service field converted to dict. Upcoming bookings seeded."),
    ]

    for title, cat, pri, desc in done:
        tasks.append({
            "title": title, "status": "done", "category": cat,
            "priority": pri, "desc": desc, "session": "7-mar-2026",
            "created_at": now, "updated_at": now,
        })

    # ═══════════════════════════════════════════
    # HIGH PRIORITY — Natalie login target: end of next week
    # ═══════════════════════════════════════════

    high = [
        ("Service-swap on existing booking", "frontend + backend", "critical",
         "Natalie #1 pain. 'Swap microneedling to lymphatic' without cancel+rebook. Edit modal with service picker on existing booking.",
         "natalie-call"),
        ("Medical changes quick-update", "frontend + backend", "critical",
         "'Any medical changes since last visit?' shortcut instead of full 50-field form. If changes flagged → alert on booking day for therapist. Email 4 days before appointment.",
         "natalie-call"),
        ("First appointment +15min auto-buffer", "backend", "high",
         "New clients get extra 15min consultation time on first booking automatically. Natalie: 'first appointment needs more time for quick consultation'.",
         "natalie-call"),
        ("Consultation form expiry enforcement", "frontend + backend", "high",
         "Annual validity (Natalie prefers annual over 6-month). Green=valid, Amber=1 month warning, Red=expired. Block booking at expiry. Auto-prompt to re-review.",
         "natalie-call"),
        ("Contraindication auto-block on booking", "backend", "critical",
         "If client ticks pregnant/cold sore/etc in medical update → auto-block booking + notify clinic 'you may need to reschedule'. Red flags from spec already defined.",
         "natalie-call"),
        ("Treatment consent forms (2A-2D)", "frontend + backend", "high",
         "Per-treatment: Microneedling, Chemical Peel, RF Needling, Polynucleotides. Signed before each treatment/course. From spec doc.",
         "spec"),
        ("Aftercare auto-email", "backend", "medium",
         "15-30min after appointment marked completed. Treatment-specific content. Natalie has content on her website. Delivery logged for insurance.",
         "natalie-call"),
        ("Patch test tracking", "backend + frontend", "medium",
         "Auto-schedule 48hr patch test before first microneedling/peel. 'Pending Patch Test' status blocks check-in.",
         "spec"),
        ("Audit history page (sidebar)", "frontend", "medium",
         "New sidebar menu item under MANAGE. Owner sees immutable log of all staff changes. Filter by date/staff/booking.",
         "session"),
    ]

    for title, cat, pri, desc, src in high:
        tasks.append({
            "title": title, "status": "todo", "category": cat,
            "priority": pri, "desc": desc, "source": src,
            "target": "natalie-login", "created_at": now, "updated_at": now,
        })

    # ═══════════════════════════════════════════
    # MEDIUM PRIORITY — post-Natalie login
    # ═══════════════════════════════════════════

    medium = [
        ("Cancellation waitlist", "backend + frontend",
         "Toggle: 'Notify me of cancellations'. When slot opens → SMS/email opted-in clients. First-come-first-served.",
         "natalie-call"),
        ("Package purchase in client portal", "frontend",
         "Skin Commitment (6 treatments) + RF package visible in portal. One-click purchase. Klarna integration link.",
         "natalie-call"),
        ("Video consultation booking (Google Meet)", "frontend + backend",
         "Book virtual consultation slot. Embed Google Meet. Auto follow-up email with recommendations + booking link.",
         "natalie-call"),
        ("Client portal — treatment history + scan results", "frontend",
         "Clients see: packages (progress bar), past treatments, therapist notes, scan results, aftercare videos.",
         "natalie-call"),
        ("AI scan email integration", "infrastructure",
         "Configure Natalie's AI scanner mail relay via Google. Email scan results to client portal.",
         "natalie-call"),
        ("Smart diary optimisation", "backend",
         "AI looks at calendar gaps, suggests moves to fill slots. Auto-notify client: 'Can you come 15min later?' Natalie losing £10-20k/year on gaps.",
         "natalie-call"),
        ("Therapist private notes (persistent)", "frontend + backend",
         "Per-client notes visible to all staff: bed layout prefs, favourite products, samples given, personal details. Like restaurant guest profile.",
         "natalie-call"),
        ("Landing page generator", "frontend",
         "Impulse buyers vs researchers. Campaign-specific pages. Auto-generate from portal. Natalie's 3 buyer types: blue (impulse), red (facts), yellow (emotional).",
         "natalie-call"),
    ]

    for title, cat, desc, src in medium:
        tasks.append({
            "title": title, "status": "backlog", "category": cat,
            "priority": "medium", "desc": desc, "source": src,
            "created_at": now, "updated_at": now,
        })

    # ═══════════════════════════════════════════
    # LOW PRIORITY — future roadmap
    # ═══════════════════════════════════════════

    low = [
        ("Rebrand to reeveos.app domains", "infrastructure",
         "Deferred. Fix everything on rezvo.app first, then clean domain migration."),
        ("AI chatbot on public website", "frontend",
         "Natalie: chatbot on website directing to virtual consultation. 'Great to know — chat with a therapist about that.'"),
        ("Seasonal promotion auto-scheduler", "backend",
         "Valentine's → Mother's Day → Father's Day banners. Auto-publish/unpublish on date range."),
        ("Members gold club / loyalty tiers", "backend + frontend",
         "Package holders get 10% off products. Exclusive events: free tickets for members. Community-led skin education."),
        ("Training academy portal", "frontend",
         "Natalie's academy: subscribers at £12.50/mo. Course content, skin education videos, certification."),
    ]

    for title, cat, desc in low:
        tasks.append({
            "title": title, "status": "backlog", "category": cat,
            "priority": "low", "desc": desc,
            "created_at": now, "updated_at": now,
        })

    # Insert all
    if tasks:
        await db.command_centre_tasks.insert_many(tasks)

    d = len([t for t in tasks if t["status"] == "done"])
    t = len([t for t in tasks if t["status"] == "todo"])
    b = len([t for t in tasks if t["status"] == "backlog"])
    print(f"Board updated: {d} done, {t} todo (high priority), {b} backlog")
    print(f"Total: {len(tasks)} tasks")

asyncio.run(main())
