from bson import ObjectId
from fastapi import HTTPException


def parse_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as error:
        raise HTTPException(status_code=400, detail="Invalid ID format") from error


def serialize_doc(document: dict | None) -> dict | None:
    if not document:
        return document

    if "_id" in document:
        mongo_id = str(document["_id"])
        del document["_id"]
        # Preserve an application-level id that already exists on the document
        # (e.g. student IDs like "STU-2024-1547") and always expose the raw
        # MongoDB ObjectId under `mongoId` for internal use.
        if "id" not in document:
            document["id"] = mongo_id
        document["mongoId"] = mongo_id

    return document
