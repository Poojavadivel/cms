from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from backend.db import get_db
from backend.dev_store import get_timetable as get_dev_timetable
from backend.dev_store import list_timetables as list_dev_timetables
from backend.dev_store import upsert_timetable as upsert_dev_timetable
from backend.schemas.academics import TimetableRecord
from backend.utils.mongo import serialize_doc

router = APIRouter(prefix="/api/academics/timetable", tags=["academics:timetable"])


@router.get("")
async def list_timetables():
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": list_dev_timetables()}
        raise
    records = []
    async for record in db["academic_timetables"].find().sort("classId", 1):
        records.append(serialize_doc(record))
    return {"success": True, "data": records}


@router.get("/{class_id}")
async def get_timetable(class_id: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            record = get_dev_timetable(class_id)
            if not record:
                raise HTTPException(status_code=404, detail="Timetable not found")
            return {"success": True, "data": record}
        raise
    record = await db["academic_timetables"].find_one({"classId": class_id})
    if not record:
        raise HTTPException(status_code=404, detail="Timetable not found")
    return {"success": True, "data": serialize_doc(record)}


@router.put("/{class_id}")
async def upsert_timetable(class_id: str, payload: TimetableRecord):
    data = payload.model_dump()
    data["classId"] = class_id

    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": upsert_dev_timetable(class_id, data)}
        raise

    updated = await db["academic_timetables"].find_one_and_update(
        {"classId": class_id},
        {"$set": data},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return {"success": True, "data": serialize_doc(updated)}
