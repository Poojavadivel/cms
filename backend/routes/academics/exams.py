from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from backend.db import get_db
from backend.dev_store import create_exam as create_dev_exam
from backend.dev_store import delete_exam as delete_dev_exam
from backend.dev_store import list_items
from backend.dev_store import update_exam as update_dev_exam
from backend.schemas.academics import ExamCreate, ExamUpdate
from backend.utils.mongo import parse_object_id, serialize_doc

router = APIRouter(prefix="/api/exams", tags=["academics:exams"])


@router.get("")
async def list_exams():
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": list_items("exams")}
        raise
    exams = []
    async for exam in db["exams"].find().sort("date", 1):
        exams.append(serialize_doc(exam))
    return {"success": True, "data": exams}


@router.post("")
async def create_exam(payload: ExamCreate):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": create_dev_exam(payload.model_dump())}
        raise
    result = await db["exams"].insert_one(payload.model_dump())
    created = await db["exams"].find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(created)}


@router.put("/{exam_id}")
async def update_exam(exam_id: str, payload: ExamUpdate):
    update_data = {key: value for key, value in payload.model_dump().items() if value is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            updated = update_dev_exam(exam_id, update_data)
            if not updated:
                raise HTTPException(status_code=404, detail="Exam not found")
            return {"success": True, "data": updated}
        raise

    updated = await db["exams"].find_one_and_update(
        {"_id": parse_object_id(exam_id)},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER,
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Exam not found")

    return {"success": True, "data": serialize_doc(updated)}


@router.delete("/{exam_id}")
async def delete_exam(exam_id: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            deleted = delete_dev_exam(exam_id)
            if not deleted:
                raise HTTPException(status_code=404, detail="Exam not found")
            return {"success": True, "message": "Exam deleted"}
        raise
    result = await db["exams"].delete_one({"_id": parse_object_id(exam_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"success": True, "message": "Exam deleted"}
