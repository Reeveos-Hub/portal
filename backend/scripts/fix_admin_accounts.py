"""
Fix admin accounts:
1. Reset peter.griffin8222@gmail.com password to Rezvo2024!
2. Update Grant Woods name (was Grant Wood)
Run: cd /opt/rezvo-app && python3 backend/scripts/fix_admin_accounts.py
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os

MONGO_URI = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "rezvo")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    # 1. Reset Ambassador password
    ambassador = await db.users.find_one({"email": "peter.griffin8222@gmail.com"})
    if ambassador:
        new_hash = pwd_context.hash("Rezvo2024!")
        await db.users.update_one(
            {"_id": ambassador["_id"]},
            {"$set": {
                "password_hash": new_hash,
                "role": "platform_admin",
                "updated_at": datetime.utcnow(),
            }},
        )
        print(f"peter.griffin8222@gmail.com: password reset to Rezvo2024!, role=platform_admin")
    else:
        print("peter.griffin8222@gmail.com NOT FOUND")

    # 2. Fix Grant's name
    grant = await db.users.find_one({"email": "grantwoods@live.com"})
    if grant:
        await db.users.update_one(
            {"_id": grant["_id"]},
            {"$set": {
                "name": "Grant Woods",
                "updated_at": datetime.utcnow(),
            }},
        )
        print(f"grantwoods@live.com: name updated to Grant Woods")
    else:
        print("grantwoods@live.com NOT FOUND")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
