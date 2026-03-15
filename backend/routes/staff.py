from fastapi import APIRouter

from backend.db import get_db
from backend.utils.mongo import serialize_doc

router = APIRouter(prefix="/api/staff", tags=["staff"])


@router.get("")
async def get_all_staff():
    db = get_db()
    staff = []
    async for member in db["staff_Details"].find():
        staff.append(serialize_doc(member))
    return staff
