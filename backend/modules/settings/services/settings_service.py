from typing import Any

from fastapi import HTTPException
from pymongo import ReturnDocument

from backend.db import get_db

FACULTY_COLLECTION = "faculty_settings_v1"
FINANCE_COLLECTION = "finance_settings_v1"
FACULTY_FALLBACK_STORE: dict[str, dict[str, Any]] = {}
FINANCE_FALLBACK_STORE: dict[str, dict[str, Any]] = {}


def _strip_mongo_id(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if not document:
        return document
    document.pop("_id", None)
    return document


def _faculty_defaults(user_id: str) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "name": "",
        "email": "",
        "phone": "",
        "assignment_submission": False,
        "student_doubt": False,
        "assignment_reminder": False,
    }


def _finance_defaults(user_id: str) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "name": "",
        "email": "",
        "phone": "",
        "payment_notifications": False,
        "refund_alerts": False,
    }


def _get_fallback_store(collection_name: str) -> dict[str, dict[str, Any]]:
    if collection_name == FACULTY_COLLECTION:
        return FACULTY_FALLBACK_STORE
    return FINANCE_FALLBACK_STORE


def _get_or_create_fallback_settings(
    collection_name: str,
    user_id: str,
    default_data: dict[str, Any],
) -> dict[str, Any]:
    store = _get_fallback_store(collection_name)
    if user_id not in store:
        store[user_id] = dict(default_data)
    return dict(store[user_id])


def _update_fallback_settings(
    collection_name: str,
    user_id: str,
    default_data: dict[str, Any],
    fields: dict[str, Any],
) -> dict[str, Any]:
    store = _get_fallback_store(collection_name)
    current = dict(store.get(user_id, default_data))
    current.update(fields)
    store[user_id] = current
    return dict(current)


async def _get_or_create_settings(
    collection_name: str,
    user_id: str,
    default_data: dict[str, Any],
) -> dict[str, Any]:
    try:
        db = get_db()
    except HTTPException:
        return _get_or_create_fallback_settings(collection_name, user_id, default_data)

    collection = db[collection_name]

    existing = await collection.find_one({"user_id": user_id})

    if not existing:
        await collection.insert_one(default_data)
        return default_data

    return _strip_mongo_id(existing) or default_data


async def _update_settings(
    collection_name: str,
    user_id: str,
    default_data: dict[str, Any],
    fields: dict[str, Any],
) -> dict[str, Any]:
    try:
        db = get_db()
    except HTTPException:
        return _update_fallback_settings(collection_name, user_id, default_data, fields)

    collection = db[collection_name]

    updated = await collection.find_one_and_update(
        {"user_id": user_id},
        {"$set": fields},
        return_document=ReturnDocument.AFTER,
    )

    if not updated:
        data = {"user_id": user_id, **fields}
        await collection.insert_one(data)
        return data

    return _strip_mongo_id(updated) or {"user_id": user_id, **fields}


async def get_or_create_faculty_settings(user_id: str) -> dict[str, Any]:
    return await _get_or_create_settings(
        FACULTY_COLLECTION,
        user_id,
        _faculty_defaults(user_id),
    )


async def update_faculty_profile(user_id: str, profile_data: dict[str, Any]) -> dict[str, Any]:
    await get_or_create_faculty_settings(user_id)
    return await _update_settings(
        FACULTY_COLLECTION,
        user_id,
        _faculty_defaults(user_id),
        {
            "name": profile_data.get("name", ""),
            "email": profile_data.get("email", ""),
            "phone": profile_data.get("phone", ""),
        },
    )


async def update_faculty_toggles(user_id: str, toggles_data: dict[str, Any]) -> dict[str, Any]:
    await get_or_create_faculty_settings(user_id)
    return await _update_settings(
        FACULTY_COLLECTION,
        user_id,
        _faculty_defaults(user_id),
        {
            "assignment_submission": toggles_data.get("assignment_submission", False),
            "student_doubt": toggles_data.get("student_doubt", False),
            "assignment_reminder": toggles_data.get("assignment_reminder", False),
        },
    )


async def get_or_create_finance_settings(user_id: str) -> dict[str, Any]:
    return await _get_or_create_settings(
        FINANCE_COLLECTION,
        user_id,
        _finance_defaults(user_id),
    )


async def update_finance_profile(user_id: str, profile_data: dict[str, Any]) -> dict[str, Any]:
    await get_or_create_finance_settings(user_id)
    return await _update_settings(
        FINANCE_COLLECTION,
        user_id,
        _finance_defaults(user_id),
        {
            "name": profile_data.get("name", ""),
            "email": profile_data.get("email", ""),
            "phone": profile_data.get("phone", ""),
        },
    )


async def update_finance_toggles(user_id: str, toggles_data: dict[str, Any]) -> dict[str, Any]:
    await get_or_create_finance_settings(user_id)
    return await _update_settings(
        FINANCE_COLLECTION,
        user_id,
        _finance_defaults(user_id),
        {
            "payment_notifications": toggles_data.get("payment_notifications", False),
            "refund_alerts": toggles_data.get("refund_alerts", False),
        },
    )
