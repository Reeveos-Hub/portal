"""
One-time migration: unify reservations → bookings collection
and normalize field names to camelCase.

Run: python scripts/migrate_bookings.py

Safe to run multiple times — idempotent.
"""

import asyncio
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient


MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "rezvo"

# snake_case → camelCase field mapping
FIELD_MAP = {
    "business_id": "businessId",
    "user_id": "userId",
    "party_size": "partySize",
    "table_id": "tableId",
    "staff_id": "staffId",
    "service_id": "serviceId",
    "created_at": "createdAt",
    "updated_at": "updatedAt",
    "duration_minutes": "duration",
    "deposit_amount": "depositAmount",
    "deposit_status": "depositStatus",
    "special_requests": "notes",
    "client_name": "customer.name",
    "client_email": "customer.email",
    "client_phone": "customer.phone",
}


async def migrate():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    
    # Step 1: Copy reservations → bookings (if any exist)
    res_count = await db.reservations.count_documents({})
    if res_count > 0:
        print(f"Found {res_count} docs in 'reservations' collection")
        cursor = db.reservations.find({})
        copied = 0
        async for doc in cursor:
            existing = await db.bookings.find_one({"_id": doc["_id"]})
            if not existing:
                await db.bookings.insert_one(doc)
                copied += 1
        print(f"  Copied {copied} docs to 'bookings' (skipped {res_count - copied} duplicates)")
    else:
        print("No docs in 'reservations' — nothing to copy")
    
    # Step 2: Normalize field names in bookings collection
    bookings_count = await db.bookings.count_documents({})
    print(f"\nNormalizing {bookings_count} docs in 'bookings' collection...")
    
    normalized = 0
    cursor = db.bookings.find({})
    async for doc in cursor:
        updates = {}
        unsets = {}
        
        for old_key, new_key in FIELD_MAP.items():
            if old_key in doc and new_key not in doc:
                # Handle nested fields like "customer.name"
                if "." in new_key:
                    parent, child = new_key.split(".", 1)
                    if parent not in doc:
                        updates[parent] = {}
                    if isinstance(doc.get(parent), dict):
                        if child not in doc[parent]:
                            updates[f"{parent}.{child}"] = doc[old_key]
                    else:
                        updates[f"{parent}.{child}"] = doc[old_key]
                else:
                    updates[new_key] = doc[old_key]
                # Keep old field for backward compat — don't unset
        
        # Ensure businessId exists (critical for tenant isolation)
        if "businessId" not in doc and "business_id" in doc:
            updates["businessId"] = doc["business_id"]
        
        # Ensure createdAt exists
        if "createdAt" not in doc and "created_at" in doc:
            updates["createdAt"] = doc["created_at"]
        
        if updates:
            await db.bookings.update_one({"_id": doc["_id"]}, {"$set": updates})
            normalized += 1
    
    print(f"  Normalized {normalized} docs")
    
    # Step 3: Create indexes on bookings collection
    print("\nCreating indexes...")
    await db.bookings.create_index([("businessId", 1), ("date", 1)])
    await db.bookings.create_index([("businessId", 1), ("status", 1)])
    await db.bookings.create_index([("businessId", 1), ("tableId", 1), ("date", 1)])
    await db.bookings.create_index([("reference", 1)])
    await db.bookings.create_index([("customer.email", 1)])
    await db.bookings.create_index([("customerId", 1)])
    print("  Done")
    
    # Step 4: Summary
    final_count = await db.bookings.count_documents({})
    print(f"\n✅ Migration complete. {final_count} total bookings.")
    print(f"   Old 'reservations' collection has {res_count} docs (safe to drop when ready)")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
