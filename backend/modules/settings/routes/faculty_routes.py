from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from backend.modules.settings.models.faculty_model import FacultyProfileUpdate, FacultyTogglesUpdate
from backend.modules.settings.services.settings_service import (
    get_or_create_faculty_settings,
    update_faculty_profile,
    update_faculty_toggles,
)
from backend.modules.settings.websocket.settings_ws import broadcast

router = APIRouter(prefix="/faculty", tags=["Faculty Settings"])


def _model_to_dict(model: BaseModel) -> dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


@router.get("/{user_id}/profile")
async def get_faculty_profile(user_id: str):
    """GET /api/settings/faculty/{user_id}/profile — used by userSettingsApi.getProfile"""
    return await get_or_create_faculty_settings(user_id)


@router.put("/{user_id}/profile")
async def put_faculty_profile_v2(user_id: str, payload: FacultyProfileUpdate):
    """PUT /api/settings/faculty/{user_id}/profile — used by userSettingsApi.updateProfile"""
    data = await update_faculty_profile(user_id, _model_to_dict(payload))
    await broadcast({"module": "settings", "user_id": user_id, "type": "UPDATED"})
    return {"status": "success", "data": data}


@router.get("/{user_id}")
async def get_faculty_settings(user_id: str):
    data = await get_or_create_faculty_settings(user_id)
    return {"status": "success", "data": data}


@router.put("/profile/{user_id}")
async def put_faculty_profile(user_id: str, payload: FacultyProfileUpdate):
    data = await update_faculty_profile(user_id, _model_to_dict(payload))
    await broadcast(
        {
            "module": "settings",
            "user_id": user_id,
            "type": "UPDATED",
        }
    )
    return {"status": "success", "data": data}


@router.put("/toggles/{user_id}")
async def put_faculty_toggles(user_id: str, payload: FacultyTogglesUpdate):
    data = await update_faculty_toggles(user_id, _model_to_dict(payload))
    await broadcast(
        {
            "module": "settings",
            "user_id": user_id,
            "type": "UPDATED",
        }
    )
    return {"status": "success", "data": data}
