from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from backend.db import get_db
from backend.dev_store import create_booking as create_dev_booking
from backend.dev_store import create_facility as create_dev_facility
from backend.dev_store import delete_facility as delete_dev_facility
from backend.dev_store import list_bookings as list_dev_bookings
from backend.dev_store import list_facilities as list_dev_facilities
from backend.dev_store import update_facility as update_dev_facility
from backend.schemas.academics import FacilityBooking, FacilityRecord
from backend.utils.mongo import parse_object_id, serialize_doc

router = APIRouter(prefix="/api/academics/facilities", tags=["academics:facility"])


@router.get("")
async def list_facilities(status: str | None = None, search: str | None = None):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": list_dev_facilities(status, search)}
        raise
    query = {}
    if status and status != "All":
        query["status"] = status
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    rows = []
    async for row in db["academic_facilities"].find(query).sort("name", 1):
        rows.append(serialize_doc(row))
    return {"success": True, "data": rows}


@router.post("")
async def create_facility(payload: FacilityRecord):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": create_dev_facility(payload.model_dump())}
        raise
    result = await db["academic_facilities"].insert_one(payload.model_dump())
    created = await db["academic_facilities"].find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(created)}


@router.put("/{facility_id}")
async def update_facility(facility_id: str, payload: FacilityRecord):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            updated = update_dev_facility(facility_id, payload.model_dump())
            if not updated:
                raise HTTPException(status_code=404, detail="Facility not found")
            return {"success": True, "data": updated}
        raise
    updated = await db["academic_facilities"].find_one_and_update(
        {"_id": parse_object_id(facility_id)},
        {"$set": payload.model_dump()},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Facility not found")
    return {"success": True, "data": serialize_doc(updated)}


@router.delete("/{facility_id}")
async def delete_facility(facility_id: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            deleted = delete_dev_facility(facility_id)
            if not deleted:
                raise HTTPException(status_code=404, detail="Facility not found")
            return {"success": True, "message": "Facility deleted"}
        raise
    result = await db["academic_facilities"].delete_one({"_id": parse_object_id(facility_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Facility not found")
    return {"success": True, "message": "Facility deleted"}


@router.get("/bookings")
async def list_bookings(room: str | None = None):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": list_dev_bookings(room)}
        raise
    query = {"room": room} if room else {}
    rows = []
    async for row in db["academic_facility_bookings"].find(query).sort("date", -1):
        rows.append(serialize_doc(row))
    return {"success": True, "data": rows}


@router.post("/bookings")
async def create_booking(payload: FacilityBooking):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": create_dev_booking(payload.model_dump(mode="json"))}
        raise
    room = await db["academic_facilities"].find_one({"name": payload.room})
    if not room:
        raise HTTPException(status_code=404, detail="Room/facility not found")

    if room.get("status") == "Maintenance":
        raise HTTPException(status_code=400, detail="Facility under maintenance")

    result = await db["academic_facility_bookings"].insert_one(payload.model_dump())
    await db["academic_facilities"].update_one({"name": payload.room}, {"$set": {"status": "In Use"}})

    created = await db["academic_facility_bookings"].find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(created)}
