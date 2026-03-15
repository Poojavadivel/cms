from copy import deepcopy
from uuid import uuid4


def _make_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


DEV_STORE = {
    "exams": [],
    "timetables": {},
    "placements": [],
    "facilities": [],
    "facility_bookings": [],
    "attendance": [],
    "attendance_weekly": [
        {"day": "Mon", "attendance": 92},
        {"day": "Tue", "attendance": 88},
        {"day": "Wed", "attendance": 90},
        {"day": "Thu", "attendance": 86},
        {"day": "Fri", "attendance": 94},
    ],
    "notifications": [],
    "students": [],
}


def list_items(key: str):
    return deepcopy(DEV_STORE[key])


def get_exam(exam_id: str):
    return next((item for item in DEV_STORE["exams"] if item["id"] == exam_id), None)


def create_exam(data: dict):
    item = {"id": _make_id("exam"), **deepcopy(data)}
    DEV_STORE["exams"].append(item)
    return deepcopy(item)


def update_exam(exam_id: str, patch: dict):
    item = get_exam(exam_id)
    if not item:
        return None
    item.update(deepcopy(patch))
    return deepcopy(item)


def delete_exam(exam_id: str):
    index = next((i for i, item in enumerate(DEV_STORE["exams"]) if item["id"] == exam_id), None)
    if index is None:
        return False
    del DEV_STORE["exams"][index]
    return True


def list_timetables():
    return deepcopy(list(DEV_STORE["timetables"].values()))


def get_timetable(class_id: str):
    record = DEV_STORE["timetables"].get(class_id)
    return deepcopy(record) if record else None


def upsert_timetable(class_id: str, data: dict):
    payload = deepcopy(data)
    payload["classId"] = class_id
    DEV_STORE["timetables"][class_id] = payload
    return deepcopy(payload)


def list_placements(status: str | None = None, search: str | None = None):
    items = deepcopy(DEV_STORE["placements"])
    if status and status != "All":
        items = [item for item in items if item.get("status") == status]
    if search:
        needle = search.lower()
        items = [item for item in items if needle in item.get("name", "").lower() or needle in item.get("company", "").lower()]
    return items


def create_placement(data: dict):
    item = {"id": _make_id("placement"), **deepcopy(data)}
    DEV_STORE["placements"].append(item)
    return deepcopy(item)


def update_placement(placement_id: str, data: dict):
    item = next((entry for entry in DEV_STORE["placements"] if entry["id"] == placement_id), None)
    if not item:
        return None
    item.update(deepcopy(data))
    return deepcopy(item)


def delete_placement(placement_id: str):
    index = next((i for i, item in enumerate(DEV_STORE["placements"]) if item["id"] == placement_id), None)
    if index is None:
        return False
    del DEV_STORE["placements"][index]
    return True


def list_facilities(status: str | None = None, search: str | None = None):
    items = deepcopy(DEV_STORE["facilities"])
    if status and status != "All":
        items = [item for item in items if item.get("status") == status]
    if search:
        needle = search.lower()
        items = [item for item in items if needle in item.get("name", "").lower()]
    return items


def create_facility(data: dict):
    item = {"id": _make_id("facility"), **deepcopy(data)}
    DEV_STORE["facilities"].append(item)
    return deepcopy(item)


def update_facility(facility_id: str, data: dict):
    item = next((entry for entry in DEV_STORE["facilities"] if entry["id"] == facility_id), None)
    if not item:
        return None
    item.update(deepcopy(data))
    return deepcopy(item)


def delete_facility(facility_id: str):
    index = next((i for i, item in enumerate(DEV_STORE["facilities"]) if item["id"] == facility_id), None)
    if index is None:
        return False
    del DEV_STORE["facilities"][index]
    return True


def list_bookings(room: str | None = None):
    items = deepcopy(DEV_STORE["facility_bookings"])
    if room:
        items = [item for item in items if item.get("room") == room]
    return items


def create_booking(data: dict):
    item = {"id": _make_id("booking"), **deepcopy(data)}
    DEV_STORE["facility_bookings"].append(item)
    return deepcopy(item)


def list_attendance(role: str | None = None, person_id: str | None = None):
    items = deepcopy(DEV_STORE["attendance"])
    if role:
        items = [item for item in items if item.get("role") == role]
    if person_id:
        items = [item for item in items if item.get("personId") == person_id]
    return items


def create_attendance(data: dict):
    item = {"id": _make_id("attendance"), **deepcopy(data)}
    DEV_STORE["attendance"].append(item)
    return deepcopy(item)


def list_weekly_attendance():
    return deepcopy(DEV_STORE["attendance_weekly"])


def list_notifications(role: str, limit: int | None = None, search: str | None = None):
    items = [
        item for item in DEV_STORE["notifications"]
        if item.get("receiverRole") in {role, "ALL"} or item.get("senderRole") == role
    ]
    if search:
        needle = search.lower()
        items = [item for item in items if needle in item.get("title", "").lower() or needle in item.get("message", "").lower()]
    items = sorted(items, key=lambda item: item.get("createdAt", ""), reverse=True)
    if limit and limit > 0:
        items = items[:limit]
    unread = sum(1 for item in items if item.get("status") == "unread")
    return deepcopy(items), unread


def unread_notifications(role: str):
    return sum(
        1 for item in DEV_STORE["notifications"]
        if (item.get("receiverRole") in {role, "ALL"} or item.get("senderRole") == role) and item.get("status") == "unread"
    )


def create_notification(data: dict):
    item = {"id": _make_id("notification"), "status": "unread", **deepcopy(data)}
    DEV_STORE["notifications"].append(item)
    return deepcopy(item)


def mark_notification_read(notification_id: str):
    item = next((entry for entry in DEV_STORE["notifications"] if entry["id"] == notification_id), None)
    if not item:
        return None
    item["status"] = "read"
    return deepcopy(item)


def mark_role_notifications_read(role: str):
    count = 0
    for item in DEV_STORE["notifications"]:
        if item.get("receiverRole") in {role, "ALL"} and item.get("status") == "unread":
            item["status"] = "read"
            count += 1
    return count


def delete_notification(notification_id: str):
    index = next((i for i, item in enumerate(DEV_STORE["notifications"]) if item["id"] == notification_id), None)
    if index is None:
        return False
    del DEV_STORE["notifications"][index]
    return True


def clear_notifications(role: str):
    before = len(DEV_STORE["notifications"])
    DEV_STORE["notifications"] = [
        item for item in DEV_STORE["notifications"]
        if item.get("receiverRole") not in {role, "ALL"}
    ]
    return before - len(DEV_STORE["notifications"])