from datetime import datetime

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from passlib.context import CryptContext
from pydantic import BaseModel

# Session-scoped fallback store used when this project runs without a user credential backend.
PASSWORD_CACHE: dict[str, dict[str, str]] = {}

router = APIRouter(tags=["Settings Account"])

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class ChangePasswordPayload(BaseModel):
    userId: str
    oldPassword: str
    newPassword: str


def _hash_password(value: str) -> str:
    return _pwd_context.hash(value)


def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return _pwd_context.verify(plain, hashed)
    except Exception:
        return False


@router.post("/change-password")
async def change_password(payload: ChangePasswordPayload):
    if not payload.userId.strip():
        return JSONResponse(status_code=400, content={"message": "User ID is required."})

    if len(payload.newPassword) < 8:
        return JSONResponse(status_code=400, content={"message": "New password must be at least 8 characters."})

    if payload.newPassword == payload.oldPassword:
        return JSONResponse(status_code=400, content={"message": "New password must be different from current password."})

    existing = PASSWORD_CACHE.get(payload.userId)
    if existing:
        if not _verify_password(payload.oldPassword, existing["passwordHash"]):
            return JSONResponse(status_code=400, content={"message": "Current password is incorrect."})

    PASSWORD_CACHE[payload.userId] = {
        "passwordHash": _hash_password(payload.newPassword),
        "updatedAt": datetime.utcnow().isoformat(),
    }

    return {
        "success": True,
        "message": "Password updated successfully.",
    }
