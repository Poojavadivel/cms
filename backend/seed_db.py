import os
from pymongo import MongoClient
from dotenv import load_dotenv
from urllib.parse import urlsplit

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/cms")


def mask_mongodb_uri(uri: str | None) -> str:
    if not uri:
        return "<not configured>"

    try:
        parts = urlsplit(uri)
        host = parts.hostname or "unknown-host"
        scheme = parts.scheme or "mongodb"
        return f"{scheme}://{host}"
    except Exception:
        return "<configured>"

def seed():
    print(f"Connecting to {mask_mongodb_uri(MONGODB_URI)}...")
    client = MongoClient(MONGODB_URI)
    db = client.get_database()
    
    # 1. Seed Staff Details
    print("Seeding staff_detail collection...")
    staff_data = [
        {
            "staffName": "Garitharan D",
            "staffId": "STAFF001",
            "designation": "Software Engineer",
            "department": "Engineering",
            "category": "Full-time"
        },
        {
            "staffName": "Jane Doe",
            "staffId": "STAFF002",
            "designation": "HR Manager",
            "department": "HR",
            "category": "Full-time"
        },
        {
            "staffName": "John Smith",
            "staffId": "STAFF003",
            "designation": "Accountant",
            "department": "Finance",
            "category": "Contract"
        }
    ]
    db.staff_detail.delete_many({}) # Clear existing
    db.staff_detail.insert_many(staff_data)
    
    # 2. Seed Payroll
    print("Seeding payroll collection...")
    payroll_data = [
        {
            "staffName": "Garitharan D",
            "staffId": "STAFF001",
            "designation": "Software Engineer",
            "department": "Engineering",
            "category": "Full-time",
            "payMonth": "March 2024",
            "grossPay": 5000,
            "deductions": 500,
            "netPay": 4500,
            "status": "Paid",
            "basicSalary": 3000,
            "hra": 1000,
            "allowance": 500,
            "bonus": 500,
            "pf": 300,
            "tax": 200
        }
    ]
    db.payroll.delete_many({}) # Clear existing
    db.payroll.insert_many(payroll_data)
    
    print("Database seeded successfully!")
    client.close()

if __name__ == "__main__":
    seed()
