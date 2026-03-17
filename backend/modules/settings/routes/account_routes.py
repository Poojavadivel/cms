from datetime import datetime
from hashlib import sha256

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Session-scoped fallback store used when this project runs without a user credential backend.
PASSWORD_CACHE: dict[str, dict[str, str]] = {}

router = APIRouter(tags=["Settings Account"])


class ChangePasswordPayload(BaseModel):
    userId: str
    oldPassword: str
    newPassword: str


def _hash_password(value: str) -> str:
    return sha256(value.encode("utf-8")).hexdigest()


@router.post("/change-password")
async def change_password(payload: ChangePasswordPayload):
    if not payload.userId.strip():
        return JSONResponse(status_code=400, content={"message": "User ID is required."})

    if len(payload.newPassword) < 8:
        return JSONResponse(status_code=400, content={"message": "New password must be at least 8 characters."})

    if payload.newPassword == payload.oldPassword:
        return JSONResponse(status_code=400, content={"message": "New password must be different from current password."})

    PASSWORD_CACHE[payload.userId] = {
        "passwordHash": _hash_password(payload.newPassword),
        "updatedAt": datetime.utcnow().isoformat(),
    }

    return {
        "success": True,
        "message": "Password updated successfully.",
    }
