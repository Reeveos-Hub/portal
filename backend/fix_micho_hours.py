"""
One-time script to fix Micho's opening hours in the database.
Sets correct format that both Settings page and Booking page can read.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os

MICHO_HOURS = {
    "mon": {"open": True, "start": "16:00", "end": "23:00"},
    "tue": {"open": False, "start": "00:00", "end": "00:00"},
    "wed": {"open": True, "start": "16:00", "end": "23:00"},
    "thu": {"open": True, "start": "16:00", "end": "23:00"},
    "fri": {"open": True, "start": "12:00", "end": "23:00"},
    "sat": {"open": True, "start": "12:00", "end": "23:00"},
    "sun": {"open": True, "start": "12:00", "end": "21:00"},
}

# Also update service periods to match
MICHO_SERVICE_PERIODS = [
    {"name": "Lunch", "start": "12:00", "end": "15:00"},
    {"name": "Dinner", "start": "17:00", "end": "23:00"},
]

async def main():
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(uri)
    db = client[os.getenv("MONGODB_DB", "rezvo")]
    
    # Find Micho
    micho = await db.businesses.find_one({"slug": "micho-turkish-bar-grill-sheffield"})
    if not micho:
        print("❌ Micho not found")
        return
    
    print(f"Found Micho: {micho['_id']}")
    print(f"Current opening_hours: {micho.get('opening_hours', 'NOT SET')}")
    print(f"Current openingHours: {micho.get('openingHours', 'NOT SET')}")
    
    # Update with new format
    result = await db.businesses.update_one(
        {"_id": micho["_id"]},
        {"$set": {
            "openingHours": MICHO_HOURS,
            "booking_settings.service_periods": MICHO_SERVICE_PERIODS,
        }}
    )
    
    print(f"\n✅ Updated {result.modified_count} document(s)")
    
    # Verify
    updated = await db.businesses.find_one({"_id": micho["_id"]})
    print(f"\nNew openingHours:")
    for day, h in updated.get("openingHours", {}).items():
        status = f"{h['start']}-{h['end']}" if h.get('open') else "CLOSED"
        print(f"  {day}: {status}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
