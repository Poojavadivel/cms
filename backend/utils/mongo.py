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
        if "id" not in document:
            document["id"] = mongo_id
        else:
            document["mongoId"] = mongo_id

    return document
