"""
Seed today's calendar with fully enriched CRM data for Natalie demo.
Run on VPS: cd /opt/rezvo-app/backend && python3 scripts/seed_natalie_demo.py
"""
import asyncio
import sys
sys.path.insert(0, '.')

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime

# Connect directly — don't rely on app startup
from config import settings
client = AsyncIOMotorClient(settings.mongodb_url)
db = client[settings.mongodb_db_name]

BIZ_SLUG = "rejuvenate-skin-experts"
TODAY = datetime.now().strftime("%Y-%m-%d")

# Staff IDs from the business record — we'll look these up
STAFF_NAMES = ["Natalie", "Grace", "Emily", "Jen"]

CLIENTS = [
    {
        "name": "Charlotte Davies",
        "phone": "07722 111 222",
        "email": "charlotte@gmail.com",
        "tags": ["VIP", "Package Holder"],
        "pipeline_stage": "loyal",
        "notes": "Sensitive left cheek — reduce pressure. Pigmentation improving.",
        "consultation_form_status": "valid",
        "preferences": {"bed_setup": "Calming music, Room 1 — natural light, Unscented products only"},
        "stats": {"total_visits": 28, "no_shows": 0, "cancellations": 1},
        "ltv": {"total": 2755},
        "alerts": [{"category": "preference", "text": "Prefers Room 1 with natural light. Sensitive left cheek.", "active": True}],
        "package": {"name": "Skin Commitment Course", "total_sessions": 6, "used_sessions": 5, "remaining": 1},
        "booking": {"service_name": "Microneedling", "time": "10:00", "duration": 60, "staff": "Natalie", "price": 120},
    },
    {
        "name": "Mary Richardson",
        "phone": "07912 345 678",
        "email": "mary.r@gmail.com",
        "tags": ["Package Holder"],
        "pipeline_stage": "active",
        "notes": "Holiday to Marbella next month — avoid peels 2 weeks before.",
        "consultation_form_status": "valid",
        "preferences": {"bed_setup": "Prefers Grace. Sauvignon Blanc on evening appointments."},
        "stats": {"total_visits": 12, "no_shows": 0, "cancellations": 0},
        "ltv": {"total": 2840},
        "alerts": [],
        "package": {"name": "Skin Commitment Course", "total_sessions": 6, "used_sessions": 4, "remaining": 2},
        "booking": {"service_name": "RF Needling", "time": "10:00", "duration": 75, "staff": "Grace", "price": 220},
    },
    {
        "name": "Sophie Williams",
        "phone": "07811 999 000",
        "email": "sophie.w@gmail.com",
        "tags": ["At Risk"],
        "pipeline_stage": "at_risk",
        "notes": "Cancelled twice. Handle with care. Was considering going back to Fresha.",
        "consultation_form_status": "expiring_soon",
        "preferences": {},
        "stats": {"total_visits": 4, "no_shows": 1, "cancellations": 2},
        "ltv": {"total": 480},
        "alerts": [{"category": "medical", "text": "Form expiring — needs renewal before next treatment.", "active": True}],
        "package": None,
        "booking": {"service_name": "Dermaplaning", "time": "13:00", "duration": 45, "staff": "Grace", "price": 75},
    },
    {
        "name": "Lisa Chen",
        "phone": "07855 444 333",
        "email": "lisa.c@gmail.com",
        "tags": ["Regular"],
        "pipeline_stage": "regular",
        "notes": "Previous significant reaction session 2 — lower concentration. Monitor closely.",
        "consultation_form_status": "valid",
        "preferences": {"bed_setup": "Lower concentration on all treatments — reacted in session 2"},
        "stats": {"total_visits": 15, "no_shows": 0, "cancellations": 0},
        "ltv": {"total": 3100},
        "alerts": [{"category": "medical", "text": "REACTION HISTORY: Had significant reaction in session 2. Use lower concentration.", "active": True}],
        "package": {"name": "Regeneration Course", "total_sessions": 6, "used_sessions": 3, "remaining": 3},
        "booking": {"service_name": "Polynucleotides", "time": "12:00", "duration": 60, "staff": "Emily", "price": 280},
    },
    {
        "name": "Emma Jones",
        "phone": "07247 160 123",
        "email": "emma.jones@gmail.com",
        "tags": ["New"],
        "pipeline_stage": "new",
        "notes": "First visit — referred by Charlotte Davies. Interested in a skin assessment.",
        "consultation_form_status": "none",
        "preferences": {},
        "stats": {"total_visits": 0, "no_shows": 0, "cancellations": 0},
        "ltv": {"total": 0},
        "alerts": [{"category": "operational", "text": "NEW CLIENT — no consultation form on file. Must complete before treatment.", "active": True}],
        "package": None,
        "booking": {"service_name": "Skin Consultation", "time": "14:00", "duration": 30, "staff": "Emily", "price": 0},
    },
    {
        "name": "Amy Lewis",
        "phone": "07900 123 456",
        "email": "amy.lewis@gmail.com",
        "tags": ["VIP", "Loyal"],
        "pipeline_stage": "loyal",
        "notes": "Getting married August — wants a treatment plan leading up to the day.",
        "consultation_form_status": "valid",
        "preferences": {"bed_setup": "Luxury products only. Prefers Natalie."},
        "stats": {"total_visits": 32, "no_shows": 0, "cancellations": 0},
        "ltv": {"total": 5200},
        "alerts": [{"category": "preference", "text": "Wedding August 2026 — treatment plan in progress.", "active": True}],
        "package": {"name": "Bridal Glow Package", "total_sessions": 8, "used_sessions": 3, "remaining": 5},
        "booking": {"service_name": "Chemical Peels", "time": "15:00", "duration": 45, "staff": "Natalie", "price": 95},
    },
]


async def run():
    print(f"Connecting to {settings.mongodb_url} / {settings.mongodb_db_name}")

    # Find business
    biz = await db.businesses.find_one({"slug": BIZ_SLUG})
    if not biz:
        print(f"ERROR: Business {BIZ_SLUG} not found")
        return

    biz_id = str(biz["_id"])
    print(f"Business: {biz['name']} ({biz_id})")

    # Map staff names to IDs
    staff_list = biz.get("staff", [])
    staff_map = {}
    for s in staff_list:
        staff_map[s.get("name", "")] = str(s.get("id", s.get("_id", "")))
    print(f"Staff: {staff_map}")

    # If no staff found in business record, check staff collection
    if not staff_map:
        async for s in db.staff.find({"businessId": biz_id}):
            staff_map[s.get("name", "")] = str(s["_id"])
        print(f"Staff from collection: {staff_map}")

    # Remove existing demo bookings for today (clean slate)
    del_result = await db.bookings.delete_many({"businessId": biz_id, "date": TODAY})
    print(f"Cleared {del_result.deleted_count} bookings for {TODAY}")

    created = 0
    for c in CLIENTS:
        # Find or create CRM client
        existing = await db.clients.find_one({"businessId": biz_id, "name": c["name"]})
        if existing:
            client_id = str(existing["_id"])
            # Update with enrichment data
            await db.clients.update_one({"_id": existing["_id"]}, {"$set": {
                "phone": c["phone"],
                "email": c["email"],
                "tags": c["tags"],
                "pipeline_stage": c["pipeline_stage"],
                "notes": c["notes"],
                "consultation_form_status": c["consultation_form_status"],
                "preferences": c["preferences"],
                "stats": c["stats"],
                "ltv": c["ltv"],
            }})
            print(f"  Updated CRM: {c['name']} ({client_id})")
        else:
            doc = {
                "businessId": biz_id,
                "name": c["name"],
                "phone": c["phone"],
                "email": c["email"],
                "tags": c["tags"],
                "pipeline_stage": c["pipeline_stage"],
                "notes": c["notes"],
                "consultation_form_status": c["consultation_form_status"],
                "preferences": c["preferences"],
                "stats": c["stats"],
                "ltv": c["ltv"],
                "createdAt": datetime.utcnow(),
            }
            result = await db.clients.insert_one(doc)
            client_id = str(result.inserted_id)
            print(f"  Created CRM: {c['name']} ({client_id})")

        # Create alerts
        if c["alerts"]:
            await db.staff_alerts.delete_many({"businessId": biz_id, "clientId": client_id})
            for alert in c["alerts"]:
                await db.staff_alerts.insert_one({
                    "businessId": biz_id,
                    "clientId": client_id,
                    "category": alert["category"],
                    "text": alert["text"],
                    "active": True,
                    "createdAt": datetime.utcnow(),
                })

        # Create package
        if c["package"]:
            existing_pkg = await db.packages.find_one({"businessId": biz_id, "clientId": client_id, "name": c["package"]["name"]})
            if not existing_pkg:
                await db.packages.insert_one({
                    "businessId": biz_id,
                    "clientId": client_id,
                    "name": c["package"]["name"],
                    "total_sessions": c["package"]["total_sessions"],
                    "used_sessions": c["package"]["used_sessions"],
                    "remaining": c["package"]["remaining"],
                    "status": "active",
                    "createdAt": datetime.utcnow(),
                })

        # Create booking for today
        bk = c["booking"]
        staff_id = staff_map.get(bk["staff"], "default")

        h, m = bk["time"].split(":")
        end_h = int(h) + bk["duration"] // 60
        end_m = int(m) + bk["duration"] % 60
        if end_m >= 60:
            end_h += 1
            end_m -= 60
        end_time = f"{end_h}:{str(end_m).zfill(2)}"

        booking_doc = {
            "businessId": biz_id,
            "date": TODAY,
            "time": bk["time"],
            "endTime": end_time,
            "duration": bk["duration"],
            "status": "confirmed",
            "source": "demo_seed",
            "customerId": client_id,
            "customerName": c["name"],
            "customer": {"name": c["name"], "phone": c["phone"], "email": c["email"]},
            "customerPhone": c["phone"],
            "customerEmail": c["email"],
            "staffId": staff_id,
            "service": {"id": f"svc_{created}", "name": bk["service_name"], "duration": bk["duration"]},
            "service_type": bk["service_name"],
            "price": bk["price"],
            "notes": "",
            "reference": f"DEMO-{created + 1:03d}",
            "roomId": None,
            "roomName": None,
            "is_new_client": c["pipeline_stage"] == "new",
            "createdAt": datetime.utcnow(),
        }
        await db.bookings.insert_one(booking_doc)
        created += 1
        print(f"  Booked: {c['name']} — {bk['service_name']} at {bk['time']} with {bk['staff']}")

    print(f"\nDone! {created} bookings created for {TODAY}")
    print("Enrichment data: tags, consultation status, preferences, notes, packages, alerts — all set")
    print("Calendar should show full CRM enrichment when you click any card")


if __name__ == "__main__":
    asyncio.run(run())
