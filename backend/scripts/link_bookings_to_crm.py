"""
Link bookings to CRM clients.
For each booking, find a matching CRM client by name.
If no match, create the client in CRM.
Then set customerId on the booking.

Run from: cd /opt/rezvo-app/backend && python3 scripts/link_bookings_to_crm.py
"""
import asyncio
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, date
from bson import ObjectId

MONGO_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("MONGODB_DB", "rezvo")


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print(f"Connected to {DB_NAME}")
    print(f"Bookings: {await db.bookings.count_documents({})}")
    print(f"Clients: {await db.clients.count_documents({})}")

    # Get all businesses
    businesses = await db.businesses.find({}).to_list(100)
    print(f"Businesses: {len(businesses)}")

    linked = 0
    created = 0
    skipped = 0

    async for booking in db.bookings.find({}):
        # Get customer name from booking
        name = None
        if booking.get("customerName"):
            name = booking["customerName"]
        elif isinstance(booking.get("customer"), dict):
            name = booking["customer"].get("name")

        if not name or name == "Walk-in":
            skipped += 1
            continue

        # Already has customerId?
        if booking.get("customerId"):
            skipped += 1
            continue

        # Get business ID
        biz_id = booking.get("businessId") or booking.get("business_id") or ""
        if not biz_id:
            skipped += 1
            continue

        # Search for existing CRM client by name (case-insensitive exact match)
        existing = await db.clients.find_one({
            "businessId": str(biz_id),
            "name": {"$regex": f"^{name}$", "$options": "i"},
        })

        if existing:
            client_id = str(existing["_id"])
        else:
            # Create the CRM client
            phone = ""
            email = ""
            if isinstance(booking.get("customer"), dict):
                phone = booking["customer"].get("phone", "")
                email = booking["customer"].get("email", "")
            phone = phone or booking.get("customerPhone", "")
            email = email or booking.get("customerEmail", "")

            new_client = {
                "businessId": str(biz_id),
                "name": name,
                "email": email,
                "phone": phone,
                "tags": [],
                "notes": [],
                "active": True,
                "source": "booking_link_script",
                "stats": {
                    "totalBookings": 0,
                    "totalSpent": 0,
                    "lastVisit": None,
                    "firstVisit": None,
                },
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
            result = await db.clients.insert_one(new_client)
            client_id = str(result.inserted_id)
            created += 1
            print(f"  Created CRM client: {name} ({client_id})")

        # Link booking to client
        await db.bookings.update_one(
            {"_id": booking["_id"]},
            {"$set": {"customerId": client_id, "updatedAt": datetime.utcnow()}}
        )
        linked += 1

    print(f"\nDone. Linked: {linked}, Created: {created}, Skipped: {skipped}")

    # Now refresh stats for all newly linked clients
    print("Refreshing client stats...")
    async for c in db.clients.find({"source": "booking_link_script"}):
        cid = str(c["_id"])
        bid = c["businessId"]
        bookings = await db.bookings.find({
            "businessId": bid,
            "customerId": cid,
            "status": {"$nin": ["cancelled"]},
        }).to_list(1000)

        total_spent = 0
        dates = []
        for b in bookings:
            price = 0
            if isinstance(b.get("service"), dict):
                price = b["service"].get("price", 0)
            elif b.get("price"):
                price = b["price"]
            total_spent += price
            if b.get("date"):
                dates.append(b["date"])

        dates.sort()
        await db.clients.update_one({"_id": c["_id"]}, {"$set": {
            "stats.totalBookings": len(bookings),
            "stats.totalSpent": total_spent,
            "stats.firstVisit": dates[0] if dates else None,
            "stats.lastVisit": dates[-1] if dates else None,
            "updatedAt": datetime.utcnow(),
        }})

    print("Stats refreshed. All done.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
