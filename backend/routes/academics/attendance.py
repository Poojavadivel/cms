from fastapi import APIRouter, HTTPException

from backend.db import get_db
from backend.dev_store import create_attendance as create_dev_attendance
from backend.dev_store import list_attendance as list_dev_attendance
from backend.dev_store import list_weekly_attendance
from backend.schemas.academics import AttendanceRecord, WeeklyAttendancePoint
from backend.utils.mongo import serialize_doc

router = APIRouter(prefix="/api/academics/attendance", tags=["academics:attendance"])


@router.get("")
async def list_attendance(role: str | None = None, person_id: str | None = None):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": list_dev_attendance(role, person_id)}
        raise
    query = {}
    if role:
        query["role"] = role
    if person_id:
        query["personId"] = person_id

    records = []
    async for record in db["academic_attendance"].find(query).sort("name", 1):
        records.append(serialize_doc(record))
    return {"success": True, "data": records}


@router.post("")
async def create_attendance(payload: AttendanceRecord):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": create_dev_attendance(payload.model_dump())}
        raise
    result = await db["academic_attendance"].insert_one(payload.model_dump())
    created = await db["academic_attendance"].find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(created)}


@router.get("/weekly")
async def get_weekly_attendance(role: str | None = None):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": list_weekly_attendance()}
        raise
    query = {"role": role} if role else {}
    points = []
    async for point in db["academic_attendance_weekly"].find(query).sort("day", 1):
        points.append(serialize_doc(point))

    if points:
        return {"success": True, "data": points}

    default_points = [
        WeeklyAttendancePoint(day="Mon", attendance=92).model_dump(),
        WeeklyAttendancePoint(day="Tue", attendance=88).model_dump(),
        WeeklyAttendancePoint(day="Wed", attendance=90).model_dump(),
        WeeklyAttendancePoint(day="Thu", attendance=86).model_dump(),
        WeeklyAttendancePoint(day="Fri", attendance=94).model_dump(),
    ]
    return {"success": True, "data": default_points}
