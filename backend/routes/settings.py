from copy import deepcopy
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/settings", tags=["settings"])


class ChangePasswordPayload(BaseModel):
    userId: str
    oldPassword: str
    newPassword: str


class UpdateEmailPayload(BaseModel):
    role: str
    userId: str
    email: str


class LogoutAllPayload(BaseModel):
    role: str | None = None
    userId: str


SETTINGS_STORE: dict[str, dict] = {}


def _key(role: str | None, user_id: str) -> str:
    normalized_role = (role or "user").strip().lower() or "user"
    return f"{normalized_role}:{user_id}"


def _default_profile(role: str | None, user_id: str) -> dict:
    normalized_role = (role or "User").capitalize()
    return {
        "name": f"{normalized_role} User",
        "email": f"{user_id.lower()}@educore.local",
        "phone": "",
        "department": "",
        "designation": normalized_role,
        "profilePhoto": "",
        "avatar": "",
    }


def _default_notifications() -> dict:
    return {
        "emailAlerts": True,
        "smsAlerts": False,
        "pushAlerts": True,
        "assignmentReminders": True,
        "attendanceWarnings": True,
        "examUpdates": True,
        "feeReminders": True,
        "placementAlerts": True,
    }


def _default_preferences() -> dict:
    return {
        "appearance": {
            "theme": "light",
            "fontSize": "medium",
            "accentColor": "blue",
            "layoutDensity": "comfortable",
        },
        "language": {
            "language": "English",
            "region": "India",
            "timezone": "Asia/Kolkata",
            "dateFormat": "DD/MM/YYYY",
        },
        "privacy": {
            "profileVisible": True,
            "searchable": True,
            "allowDirectMessages": True,
        },
        "accessibility": {
            "highContrast": False,
            "reduceMotion": False,
            "textToSpeech": False,
            "largeClickTargets": False,
        },
        "teaching": {
            "preferredMode": "Hybrid",
            "officeHours": "",
            "autoPublishGrades": False,
        },
    }


def _default_security(user_id: str) -> dict:
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    return {
        "sessions": [
            {
                "id": f"sess-{user_id}-1",
                "device": "Windows • Chrome",
                "location": "Current device",
                "lastSeen": now_iso,
                "active": True,
            }
        ],
        "loginHistory": [
            {
                "timestamp": now_iso,
                "ip": "127.0.0.1",
                "status": "success",
            }
        ],
    }


def _ensure_user(role: str | None, user_id: str) -> dict:
    key = _key(role, user_id)
    if key not in SETTINGS_STORE:
        defaults = _default_preferences()
        SETTINGS_STORE[key] = {
            "role": (role or "user").lower(),
            "userId": user_id,
            "profile": _default_profile(role, user_id),
            "notifications": _default_notifications(),
            "appearance": defaults["appearance"],
            "language": defaults["language"],
            "privacy": defaults["privacy"],
            "accessibility": defaults["accessibility"],
            "teaching": defaults["teaching"],
            "sessions": _default_security(user_id)["sessions"],
            "loginHistory": _default_security(user_id)["loginHistory"],
            "deleteRequests": [],
        }
    return SETTINGS_STORE[key]


def _merge_section(store: dict, section: str, payload: dict) -> dict:
    current = store.get(section, {})
    current.update(payload)
    store[section] = current
    return deepcopy(current)


@router.post("/change-password")
async def change_password(payload: ChangePasswordPayload):
    if len(payload.newPassword or "") < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    _ensure_user(None, payload.userId)
    return {"success": True, "message": "Password updated successfully."}


@router.put("/email")
async def update_email(payload: UpdateEmailPayload):
    user = _ensure_user(payload.role, payload.userId)
    user["profile"]["email"] = payload.email
    return {"success": True, "message": "Email updated", "data": deepcopy(user["profile"]) }


@router.post("/logout-all")
async def logout_all(payload: LogoutAllPayload):
    user = _ensure_user(payload.role, payload.userId)
    sessions = user.get("sessions", [])
    for session in sessions:
        session["active"] = False
        session["lastSeen"] = datetime.now(timezone.utc).isoformat()
    user["sessions"] = sessions
    return {"success": True, "message": "All sessions logged out", "data": deepcopy(user["sessions"])}


@router.get("/{role}/{user_id}/profile")
@router.get("/{user_id}/profile")
async def get_profile(role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    return deepcopy(user["profile"])


@router.put("/{role}/{user_id}/profile")
@router.put("/{user_id}/profile")
async def update_profile(payload: dict, role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    updated = _merge_section(user, "profile", payload)
    return {"success": True, "message": "Profile updated", "data": updated}


@router.get("/{role}/{user_id}/notifications")
@router.get("/{user_id}/notifications")
async def get_notifications(role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    return deepcopy(user["notifications"])


@router.put("/{role}/{user_id}/notifications")
@router.put("/{user_id}/notifications")
async def update_notifications(payload: dict, role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    updated = _merge_section(user, "notifications", payload)
    return {"success": True, "message": "Notification settings updated", "data": updated}


@router.get("/{role}/{user_id}/sessions")
@router.get("/{user_id}/sessions")
async def get_sessions(role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    return deepcopy(user.get("sessions", []))


@router.get("/{role}/{user_id}/login-history")
@router.get("/{user_id}/login-history")
async def get_login_history(role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    return deepcopy(user.get("loginHistory", []))


@router.get("/{role}/{user_id}/appearance")
@router.get("/{user_id}/appearance")
async def get_appearance(role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    return deepcopy(user["appearance"])


@router.put("/{role}/{user_id}/appearance")
@router.put("/{user_id}/appearance")
async def update_appearance(payload: dict, role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    updated = _merge_section(user, "appearance", payload)
    return {"success": True, "message": "Appearance updated", "data": updated}


@router.get("/{role}/{user_id}/language")
@router.get("/{user_id}/language")
async def get_language(role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    return deepcopy(user["language"])


@router.put("/{role}/{user_id}/language")
@router.put("/{user_id}/language")
async def update_language(payload: dict, role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    updated = _merge_section(user, "language", payload)
    return {"success": True, "message": "Language updated", "data": updated}


@router.get("/{role}/{user_id}/privacy")
@router.get("/{user_id}/privacy")
async def get_privacy(role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    return deepcopy(user["privacy"])


@router.put("/{role}/{user_id}/privacy")
@router.put("/{user_id}/privacy")
async def update_privacy(payload: dict, role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    updated = _merge_section(user, "privacy", payload)
    return {"success": True, "message": "Privacy updated", "data": updated}


@router.get("/{role}/{user_id}/accessibility")
@router.get("/{user_id}/accessibility")
async def get_accessibility(role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    return deepcopy(user["accessibility"])


@router.put("/{role}/{user_id}/accessibility")
@router.put("/{user_id}/accessibility")
async def update_accessibility(payload: dict, role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    updated = _merge_section(user, "accessibility", payload)
    return {"success": True, "message": "Accessibility updated", "data": updated}


@router.get("/faculty/{user_id}/teaching")
async def get_teaching_preferences(user_id: str):
    user = _ensure_user("faculty", user_id)
    return deepcopy(user["teaching"])


@router.put("/faculty/{user_id}/teaching")
async def update_teaching_preferences(user_id: str, payload: dict):
    user = _ensure_user("faculty", user_id)
    updated = _merge_section(user, "teaching", payload)
    return {"success": True, "message": "Teaching preferences updated", "data": updated}


@router.get("/{role}/{user_id}/export-data")
@router.get("/{user_id}/export-data")
async def export_user_data(role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    snapshot = {
        "profile": user["profile"],
        "notifications": user["notifications"],
        "appearance": user["appearance"],
        "language": user["language"],
        "privacy": user["privacy"],
        "accessibility": user["accessibility"],
    }
    file_name = f"settings-{user_id}.json"
    return {"success": True, "fileName": file_name, "data": snapshot}


@router.post("/{role}/{user_id}/delete-request")
@router.post("/{user_id}/delete-request")
async def request_account_deletion(payload: dict, role: str | None = None, user_id: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User id is required")
    user = _ensure_user(role, user_id)
    reason = str(payload.get("reason", "")).strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Reason is required")

    request_data = {
        "reason": reason,
        "requestedAt": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
    }
    user["deleteRequests"].append(request_data)

    return {"success": True, "message": "Deletion request submitted", "data": deepcopy(request_data)}
