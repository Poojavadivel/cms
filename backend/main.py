import os
from contextlib import asynccontextmanager
from typing import Optional, List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from bson import ObjectId

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
PORT = int(os.getenv("PORT", 5000))

client: AsyncIOMotorClient = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    print(f"Connecting to MongoDB at {MONGODB_URI}...")
    try:
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Verify connection
        await client.admin.command('ping')
        
        # Determine database name
        try:
            db = client.get_database()
            if db.name == 'test' and "/test" not in MONGODB_URI:
                db = client["cms"]
        except Exception:
            db = client["cms"]
            
        print(f"Connected to MongoDB successfully (Database: {db.name})!")
    except Exception as e:
        print(f"FAILED to connect to MongoDB: {e}")
        print("Falling back to local if configured...")
    yield
    if client:
        client.close()
        print("Disconnected from MongoDB.")

app = FastAPI(title="CMS Payroll API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def fix_id(record: dict) -> dict:
    if not record: return record
    if "_id" in record:
        record["id"] = str(record["_id"])
        del record["_id"]
    # Map staffType to category for frontend compatibility
    if "staffType" in record and "category" not in record:
        record["category"] = record["staffType"]
    # Map role to designation for frontend compatibility
    if "role" in record and "designation" not in record:
        record["designation"] = record["role"]
    # Map name to staffName for payroll records
    if "name" in record and "staffName" not in record:
        record["staffName"] = record["name"]
    return record

# ─── Pydantic Models ────────────────────────────────────────────────────────

class PayrollRecord(BaseModel):
    staffName: str
    staffId: str
    name: Optional[str] = None # Added for Atlas compatibility
    designation: Optional[str] = None
    role: Optional[str] = None # Added for Atlas compatibility
    department: Optional[str] = None
    category: Optional[str] = None
    staffType: Optional[str] = None # Added for Atlas compatibility
    payMonth: Optional[str] = None
    payPeriodDetailed: Optional[str] = None
    grossPay: Optional[float] = 0
    deductions: Optional[float] = 0
    netPay: Optional[float] = 0
    status: Optional[str] = "Draft"
    basicSalary: Optional[float] = 0
    hra: Optional[float] = 0
    allowance: Optional[float] = 0
    bonus: Optional[float] = 0
    pf: Optional[float] = 0
    tax: Optional[float] = 0
    esi: Optional[float] = 0 # Added for screenshot compatibility
    professionalTax: Optional[float] = 0 # Added for screenshot compatibility
    tds: Optional[float] = 0 # Added for screenshot compatibility

class PayrollUpdate(PayrollRecord):
    staffName: Optional[str] = None
    staffId: Optional[str] = None

# ─── Staff Routes ────────────────────────────────────────────────────────────

@app.get("/api/staff")
async def get_all_staff():
    """Fetch all staff from cms.staff_Details collection."""
    staff = []
    async for member in db["staff_Details"].find():
        staff.append(fix_id(member))
    return staff

# ─── Payroll Routes ──────────────────────────────────────────────────────────

@app.get("/api/payroll")
async def get_all_payroll():
    records = []
    async for record in db["payroll"].find().sort("_id", -1):
        records.append(fix_id(record))
    return records


@app.post("/api/payroll", status_code=201)
async def create_payroll(record: PayrollRecord):
    data = record.model_dump()
    # Sync fields for Atlas schema consistency
    if not data.get("name"): data["name"] = data.get("staffName")
    if not data.get("staffType"): data["staffType"] = data.get("category")
    if not data.get("role"): data["role"] = data.get("designation")
    
    result = await db["payroll"].insert_one(data)
    created = await db["payroll"].find_one({"_id": result.inserted_id})
    return fix_id(created)


@app.post("/api/payroll/batch", status_code=201)
async def create_payroll_batch(records: List[PayrollRecord]):
    if not records:
        raise HTTPException(status_code=400, detail="Empty list provided")
    docs = [r.model_dump() for r in records]
    result = await db["payroll"].insert_many(docs)
    inserted = []
    async for record in db["payroll"].find({"_id": {"$in": result.inserted_ids}}):
        inserted.append(fix_id(record))
    return inserted


@app.put("/api/payroll/{record_id}")
async def update_payroll(record_id: str, update: PayrollUpdate):
    try:
        oid = ObjectId(record_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    result = await db["payroll"].find_one_and_update(
        {"_id": oid}, {"$set": update_data}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Record not found")
    return fix_id(result)


@app.delete("/api/payroll/{record_id}")
async def delete_payroll(record_id: str):
    try:
        oid = ObjectId(record_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    result = await db["payroll"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Record deleted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
