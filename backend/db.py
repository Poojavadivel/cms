import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import urlsplit

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

client: AsyncIOMotorClient | None = None
db = None


def mask_mongodb_uri(uri: str | None) -> str:
    if not uri:
        return "<not configured>"

    try:
        parts = urlsplit(uri)
        host = parts.hostname or "unknown-host"
        scheme = parts.scheme or "mongodb"
        return f"{scheme}://{host}"
    except Exception:
        return "<configured>"


@asynccontextmanager
async def lifespan(app):
    global client, db

    print(f"Connecting to MongoDB at {mask_mongodb_uri(MONGODB_URI)}...")
    try:
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        await client.admin.command("ping")

        try:
            db = client.get_database()
            if db.name == "test" and "/test" not in str(MONGODB_URI):
                db = client["cms"]
        except Exception:
            db = client["cms"]

        print(f"Connected to MongoDB successfully (Database: {db.name})")
    except Exception as error:
        print(f"FAILED to connect to MongoDB: {error}")
        db = None

    yield

    if client:
        client.close()
        print("Disconnected from MongoDB.")


def get_db():
    if db is None:
        raise HTTPException(status_code=503, detail="Database is not available")
    return db
