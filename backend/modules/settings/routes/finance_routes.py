from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from backend.modules.settings.models.finance_model import FinanceProfileUpdate, FinanceTogglesUpdate
from backend.modules.settings.services.settings_service import (
    get_or_create_finance_settings,
    update_finance_profile,
    update_finance_toggles,
)
from backend.modules.settings.websocket.settings_ws import broadcast

router = APIRouter(prefix="/finance", tags=["Finance Settings"])


def _model_to_dict(model: BaseModel) -> dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


@router.get("/{user_id}/profile")
async def get_finance_profile(user_id: str):
    """GET /api/settings/finance/{user_id}/profile — used by userSettingsApi.getProfile"""
    print("Finance settings API called", user_id)
    return await get_or_create_finance_settings(user_id)


@router.put("/{user_id}/profile")
async def put_finance_profile_v2(user_id: str, payload: dict):
    """PUT /api/settings/finance/{user_id}/profile — used by userSettingsApi.updateProfile"""
    data = await update_finance_profile(user_id, payload)
    await broadcast({"module": "settings", "user_id": user_id, "type": "UPDATED"})
    return {"status": "success", "data": data}


@router.get("/{user_id}")
async def get_finance_settings(user_id: str):
    data = await get_or_create_finance_settings(user_id)
    return {"status": "success", "data": data}


@router.put("/profile/{user_id}")
async def put_finance_profile(user_id: str, payload: FinanceProfileUpdate):
    data = await update_finance_profile(user_id, _model_to_dict(payload))
    await broadcast(
        {
            "module": "settings",
            "user_id": user_id,
            "type": "UPDATED",
        }
    )
    return {"status": "success", "data": data}


@router.put("/toggles/{user_id}")
async def put_finance_toggles(user_id: str, payload: FinanceTogglesUpdate):
    data = await update_finance_toggles(user_id, _model_to_dict(payload))
    await broadcast(
        {
            "module": "settings",
            "user_id": user_id,
            "type": "UPDATED",
        }
    )
    return {"status": "success", "data": data}
