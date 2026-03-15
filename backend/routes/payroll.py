from typing import List

from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from backend.db import get_db
from backend.schemas.payroll import PayrollRecord, PayrollUpdate
from backend.utils.mongo import parse_object_id, serialize_doc

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


def normalize_payroll_document(document):
    record = serialize_doc(document)
    if not record:
        return record

    if "staffType" in record and "category" not in record:
        record["category"] = record["staffType"]

    if "role" in record and "designation" not in record:
        record["designation"] = record["role"]

    if "name" in record and "staffName" not in record:
        record["staffName"] = record["name"]

    return record


@router.get("")
async def get_all_payroll():
    db = get_db()
    records = []
    async for record in db["payroll"].find().sort("_id", -1):
        records.append(normalize_payroll_document(record))
    return records


@router.post("", status_code=201)
async def create_payroll(record: PayrollRecord):
    db = get_db()
    data = record.model_dump()

    if not data.get("name"):
        data["name"] = data.get("staffName")

    if not data.get("staffType"):
        data["staffType"] = data.get("category")

    if not data.get("role"):
        data["role"] = data.get("designation")

    result = await db["payroll"].insert_one(data)
    created = await db["payroll"].find_one({"_id": result.inserted_id})
    return normalize_payroll_document(created)


@router.post("/batch", status_code=201)
async def create_payroll_batch(records: List[PayrollRecord]):
    db = get_db()
    if not records:
        raise HTTPException(status_code=400, detail="Empty list provided")

    docs = [record.model_dump() for record in records]
    result = await db["payroll"].insert_many(docs)

    inserted = []
    async for record in db["payroll"].find({"_id": {"$in": result.inserted_ids}}):
        inserted.append(normalize_payroll_document(record))

    return inserted


@router.put("/{record_id}")
async def update_payroll(record_id: str, update: PayrollUpdate):
    db = get_db()
    oid = parse_object_id(record_id)
    update_data = {key: value for key, value in update.model_dump().items() if value is not None}

    result = await db["payroll"].find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Record not found")

    return normalize_payroll_document(result)


@router.delete("/{record_id}")
async def delete_payroll(record_id: str):
    db = get_db()
    oid = parse_object_id(record_id)
    result = await db["payroll"].delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")

    return {"message": "Record deleted"}
