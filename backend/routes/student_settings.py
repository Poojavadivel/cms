from typing import Any

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument
from pydantic import BaseModel

from backend.db import get_db

router = APIRouter(prefix="/api/student/settings", tags=["student:settings"])
legacy_router = APIRouter(prefix="/api/settings/student", tags=["student:settings"])

STUDENT_SETTINGS_COLLECTION = "student_settings_v1"
STUDENT_SETTINGS_FALLBACK: dict[str, dict[str, Any]] = {}


class StudentSettingsUpdate(BaseModel):
    name: str
    email: str
    phone: str = ""
    department: str = ""
    address: str = ""
    profilePhoto: str = ""
    avatar: str = ""


def _default_student_settings(user_id: str) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "name": "",
        "email": "",
        "phone": "",
        "department": "",
        "address": "",
        "profilePhoto": "",
        "avatar": "",
    }


def _strip_mongo_id(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if not document:
        return document
    document.pop("_id", None)
    return document


async def _get_student_settings_data(user_id: str) -> dict[str, Any]:
    default_data = _default_student_settings(user_id)

    try:
        db = get_db()
    except HTTPException:
        if user_id not in STUDENT_SETTINGS_FALLBACK:
            STUDENT_SETTINGS_FALLBACK[user_id] = dict(default_data)
        return dict(STUDENT_SETTINGS_FALLBACK[user_id])

    collection = db[STUDENT_SETTINGS_COLLECTION]
    existing = await collection.find_one({"user_id": user_id})
    if not existing:
        await collection.insert_one(default_data)
        return default_data

    return _strip_mongo_id(existing) or default_data


async def _update_student_settings_data(user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    data["user_id"] = user_id

    try:
        db = get_db()
    except HTTPException:
        current = dict(STUDENT_SETTINGS_FALLBACK.get(user_id, _default_student_settings(user_id)))
        current.update(data)
        STUDENT_SETTINGS_FALLBACK[user_id] = current
        return dict(current)

    collection = db[STUDENT_SETTINGS_COLLECTION]
    updated = await collection.find_one_and_update(
        {"user_id": user_id},
        {"$set": data},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return _strip_mongo_id(updated) or data


@router.get("/{user_id}")
async def get_student_settings(user_id: str):
    return await _get_student_settings_data(user_id)


@router.put("/{user_id}")
async def update_student_settings(user_id: str, payload: StudentSettingsUpdate):
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    updated = await _update_student_settings_data(user_id, data)
    return {"status": "success", "data": updated}


@legacy_router.get("/{user_id}/profile")
async def legacy_get_student_profile(user_id: str):
    return await _get_student_settings_data(user_id)


@legacy_router.put("/{user_id}/profile")
async def legacy_update_student_profile(user_id: str, payload: StudentSettingsUpdate):
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    updated = await _update_student_settings_data(user_id, data)
    return {"status": "success", "data": updated}
