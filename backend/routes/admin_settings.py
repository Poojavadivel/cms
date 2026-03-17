from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from passlib.context import CryptContext
from pymongo import ReturnDocument
from pydantic import BaseModel

from backend.db import get_db

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/api/admin", tags=["admin:settings"])

ADMIN_PROFILE_COLLECTION = "admin_profile_settings_v1"
ADMIN_SYSTEM_COLLECTION = "admin_system_settings_v1"
ADMIN_ACADEMIC_COLLECTION = "admin_academic_settings_v1"
ADMIN_PASSWORD_COLLECTION = "admin_credentials_v1"

ADMIN_PROFILE_FALLBACK: dict[str, dict[str, Any]] = {}
ADMIN_SYSTEM_FALLBACK: dict[str, Any] = {
    "collegeName": "MIT Connect",
    "collegeLogo": "",
    "collegeLogoFileName": "mit-logo.png",
    "address": "Main Administrative Block, Coimbatore",
    "contactEmail": "info@mitconnect.edu",
    "phoneNumber": "9876543210",
}
ADMIN_ACADEMIC_FALLBACK: dict[str, Any] = {
    "departments": "Computer Science, Mechanical, Civil, ECE",
    "courses": "B.Tech CSE, B.Tech ECE, MBA",
    "semesters": 2,
}
ADMIN_PASSWORD_FALLBACK: dict[str, dict[str, str]] = {}


class AdminProfileUpdate(BaseModel):
    name: str
    email: str
    phone: str = ""
    department: str = "Campus Administration"
    address: str = ""
    profilePhoto: str = ""
    avatar: str = ""


class AdminPasswordUpdate(BaseModel):
    userId: str
    currentPassword: str
    newPassword: str


class AdminSystemUpdate(BaseModel):
    collegeName: str
    collegeLogo: str = ""
    collegeLogoFileName: str = ""
    address: str
    contactEmail: str
    phoneNumber: str


class AdminAcademicUpdate(BaseModel):
    departments: str
    courses: str
    semesters: int


def _strip_mongo_id(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if not document:
        return document
    document.pop("_id", None)
    return document


def _default_admin_profile(user_id: str) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "name": "Admin User",
        "email": "admin@mitconnect.edu",
        "phone": "",
        "department": "Campus Administration",
        "address": "",
        "adminId": user_id,
        "profilePhoto": "",
        "avatar": "",
    }


def _password_hash(password: str) -> str:
    return _pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return _pwd_context.verify(plain, hashed)
    except Exception:
        return False


@router.get("/profile/{user_id}")
async def get_admin_profile(user_id: str):
    default_data = _default_admin_profile(user_id)

    try:
        db = get_db()
    except HTTPException:
        if user_id not in ADMIN_PROFILE_FALLBACK:
            ADMIN_PROFILE_FALLBACK[user_id] = dict(default_data)
        return {"status": "success", "data": dict(ADMIN_PROFILE_FALLBACK[user_id])}

    collection = db[ADMIN_PROFILE_COLLECTION]
    existing = await collection.find_one({"user_id": user_id})
    if not existing:
        await collection.insert_one(default_data)
        return {"status": "success", "data": default_data}

    return {"status": "success", "data": _strip_mongo_id(existing) or default_data}


@router.put("/profile/{user_id}")
async def update_admin_profile(user_id: str, payload: AdminProfileUpdate):
    profile_data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    profile_data["user_id"] = user_id
    profile_data["adminId"] = user_id

    try:
        db = get_db()
    except HTTPException:
        current = dict(ADMIN_PROFILE_FALLBACK.get(user_id, _default_admin_profile(user_id)))
        current.update(profile_data)
        ADMIN_PROFILE_FALLBACK[user_id] = current
        return {"status": "success", "data": dict(current)}

    collection = db[ADMIN_PROFILE_COLLECTION]
    updated = await collection.find_one_and_update(
        {"user_id": user_id},
        {"$set": profile_data},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return {"status": "success", "data": _strip_mongo_id(updated) or profile_data}


@router.put("/change-password")
async def change_admin_password(payload: AdminPasswordUpdate):
    if len(payload.newPassword) < 8:
        return JSONResponse(status_code=400, content={"message": "New password must be at least 8 characters."})

    if payload.newPassword == payload.currentPassword:
        return JSONResponse(status_code=400, content={"message": "New password must be different from current password."})

    try:
        db = get_db()
    except HTTPException:
        existing = ADMIN_PASSWORD_FALLBACK.get(payload.userId)
        if existing:
            if not _verify_password(payload.currentPassword, existing["passwordHash"]):
                return JSONResponse(status_code=400, content={"message": "Current password is incorrect."})
        hashed = _password_hash(payload.newPassword)
        ADMIN_PASSWORD_FALLBACK[payload.userId] = {
            "user_id": payload.userId,
            "passwordHash": hashed,
            "updatedAt": datetime.utcnow().isoformat(),
        }
        return {"success": True, "message": "Password updated successfully."}

    collection = db[ADMIN_PASSWORD_COLLECTION]
    existing = await collection.find_one({"user_id": payload.userId})
    if existing:
        if not _verify_password(payload.currentPassword, existing.get("passwordHash", "")):
            return JSONResponse(status_code=400, content={"message": "Current password is incorrect."})

    hashed = _password_hash(payload.newPassword)
    update_data = {
        "user_id": payload.userId,
        "passwordHash": hashed,
        "updatedAt": datetime.utcnow().isoformat(),
    }
    await collection.find_one_and_update(
        {"user_id": payload.userId},
        {"$set": update_data},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return {"success": True, "message": "Password updated successfully."}


@router.get("/system")
async def get_admin_system_settings():
    try:
        db = get_db()
    except HTTPException:
        return {"status": "success", "data": dict(ADMIN_SYSTEM_FALLBACK)}

    collection = db[ADMIN_SYSTEM_COLLECTION]
    existing = await collection.find_one({"scope": "default"})
    if not existing:
        default_data = {"scope": "default", **ADMIN_SYSTEM_FALLBACK}
        await collection.insert_one(default_data)
        default_data.pop("scope", None)
        return {"status": "success", "data": default_data}

    existing = _strip_mongo_id(existing) or {"scope": "default", **ADMIN_SYSTEM_FALLBACK}
    existing.pop("scope", None)
    return {"status": "success", "data": existing}


@router.put("/system")
async def update_admin_system_settings(payload: AdminSystemUpdate):
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()

    try:
        db = get_db()
    except HTTPException:
        ADMIN_SYSTEM_FALLBACK.update(data)
        return {"status": "success", "data": dict(ADMIN_SYSTEM_FALLBACK)}

    collection = db[ADMIN_SYSTEM_COLLECTION]
    updated = await collection.find_one_and_update(
        {"scope": "default"},
        {"$set": {"scope": "default", **data}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    updated = _strip_mongo_id(updated) or {"scope": "default", **data}
    updated.pop("scope", None)
    return {"status": "success", "data": updated}


@router.get("/academic")
async def get_admin_academic_settings():
    try:
        db = get_db()
    except HTTPException:
        return {"status": "success", "data": dict(ADMIN_ACADEMIC_FALLBACK)}

    collection = db[ADMIN_ACADEMIC_COLLECTION]
    existing = await collection.find_one({"scope": "default"})
    if not existing:
        default_data = {"scope": "default", **ADMIN_ACADEMIC_FALLBACK}
        await collection.insert_one(default_data)
        default_data.pop("scope", None)
        return {"status": "success", "data": default_data}

    existing = _strip_mongo_id(existing) or {"scope": "default", **ADMIN_ACADEMIC_FALLBACK}
    existing.pop("scope", None)
    return {"status": "success", "data": existing}


@router.put("/academic")
async def update_admin_academic_settings(payload: AdminAcademicUpdate):
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    data["semesters"] = max(1, int(data.get("semesters", 1)))

    try:
        db = get_db()
    except HTTPException:
        ADMIN_ACADEMIC_FALLBACK.update(data)
        return {"status": "success", "data": dict(ADMIN_ACADEMIC_FALLBACK)}

    collection = db[ADMIN_ACADEMIC_COLLECTION]
    updated = await collection.find_one_and_update(
        {"scope": "default"},
        {"$set": {"scope": "default", **data}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    updated = _strip_mongo_id(updated) or {"scope": "default", **data}
    updated.pop("scope", None)
    return {"status": "success", "data": updated}
