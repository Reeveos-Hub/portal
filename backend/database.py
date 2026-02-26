from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from fastapi import HTTPException
from config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]
    print(f"Connected to MongoDB: {settings.mongodb_db_name}")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")


def get_database():
    return db


def safe_object_id(id_str: str, label: str = "Resource") -> ObjectId:
    """Convert string to ObjectId safely, raising 400 on invalid format."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(400, f"Invalid {label} ID format: {id_str}")
