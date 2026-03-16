from fastapi import APIRouter, HTTPException

from backend.db import get_db
from backend.dev_store import create_student as create_dev_student
from backend.dev_store import get_student as get_dev_student
from backend.dev_store import list_students as list_dev_students
from backend.schemas.common import StudentRecord
from backend.utils.mongo import serialize_doc

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("")
async def list_students():
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return list_dev_students()
        raise
    rows = []
    async for row in db["students"].find().sort("_id", -1):
        rows.append(serialize_doc(row))
    return rows


@router.get("/{student_id}")
async def get_student(student_id: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            row = get_dev_student(student_id)
            if not row:
                raise HTTPException(status_code=404, detail="Student not found")
            return row
        raise
    row = await db["students"].find_one({"id": student_id})
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    return serialize_doc(row)


@router.post("", status_code=201)
async def create_student(payload: StudentRecord):
    data = payload.model_dump()

    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            existing = get_dev_student(data["id"])
            if existing:
                raise HTTPException(status_code=400, detail="Student with this id already exists")
            return create_dev_student(data)
        raise

    exists = await db["students"].find_one({"id": data["id"]})
    if exists:
        raise HTTPException(status_code=400, detail="Student with this id already exists")

    result = await db["students"].insert_one(data)
    created = await db["students"].find_one({"_id": result.inserted_id})
    return serialize_doc(created)
