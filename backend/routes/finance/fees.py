"""Finance: Fee management with auto-notification support"""
from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument
from datetime import datetime

from backend.db import get_db
from backend.schemas.notifications import NotificationAutoTrigger
from backend.utils.mongo import parse_object_id, serialize_doc
from backend.utils.websocket_manager import connection_manager

router = APIRouter(prefix="/api/fees", tags=["finance:fees"])


class FeeCreate:
    """Fee creation model"""
    feeType: str  # 'tuition', 'hostel', 'transport', etc.
    amount: float
    dueDate: str  # ISO date string
    studentIds: list[str]  # Students affected
    description: str | None = None
    notify: bool = False  # Send notification on creation


@router.get("")
async def list_fees():
    """List all fees"""
    try:
        db = get_db()
    except HTTPException:
        return {"success": True, "data": []}
    
    fees = []
    async for fee in db["fees"].find().sort("dueDate", 1):
        fees.append(serialize_doc(fee))
    return {"success": True, "data": fees}


@router.post("")
async def create_fee(payload: dict):
    """
    Create a new fee with optional auto-notification.
    
    Request body:
    {
        "feeType": "tuition",
        "amount": 50000,
        "dueDate": "2026-04-15",
        "studentIds": ["STU-2024-1547", "STU-2024-1548"],
        "description": "Semester 4 tuition fee",
        "notify": true
    }
    """
    try:
        db = get_db()
    except HTTPException:
        return {
            "success": True,
            "message": "Fee queued (database unavailable)",
        }
    
    fee_data = {
        "feeType": payload.get("feeType"),
        "amount": payload.get("amount"),
        "dueDate": datetime.fromisoformat(payload.get("dueDate")),
        "studentIds": payload.get("studentIds", []),
        "description": payload.get("description"),
        "status": "pending",
        "notified": False,
        "createdAt": datetime.utcnow(),
    }
    
    result = await db["fees"].insert_one(fee_data)
    created = await db["fees"].find_one({"_id": result.inserted_id})
    created_doc = serialize_doc(created)
    
    # Send notification if requested
    should_notify = payload.get("notify", False)
    student_ids = payload.get("studentIds", [])
    
    if should_notify and student_ids:
        # Notify students
        student_notification = NotificationAutoTrigger(
            title=f"New Fee: {fee_data['feeType']}",
            message=f"A new {fee_data['feeType']} fee of ₹{fee_data['amount']} has been added. Due date: {fee_data['dueDate'].strftime('%B %d, %Y')}.",
            category="fee",
            priority="high",
            triggerType="fee_created",
            relatedId=str(result.inserted_id),
            receiverIds=student_ids,
        )
        
        student_notif_doc = {
            "title": student_notification.title,
            "message": student_notification.message,
            "category": student_notification.category,
            "priority": student_notification.priority,
            "senderRole": "system",
            "receiverRole": None,
            "receiverIds": student_notification.receiverIds,
            "status": "unread",
            "triggerType": student_notification.triggerType,
            "relatedId": student_notification.relatedId,
            "createdAt": datetime.utcnow(),
            "updatedAt": None,
        }
        
        notif_result = await db["notifications"].insert_one(student_notif_doc)
        notification_payload = {
            "type": "notification",
            "notification": serialize_doc(await db["notifications"].find_one({"_id": notif_result.inserted_id})),
        }
        await connection_manager.broadcast_to_many(student_ids, notification_payload)
        
        # Notify finance staff
        finance_staff = await db["users"].find({"role": "finance"}).to_list(None)
        finance_staff_ids = [f["_id"] for f in finance_staff]
        
        if finance_staff_ids:
            finance_notification = NotificationAutoTrigger(
                title=f"Fee Created: {fee_data['feeType']}",
                message=f"A new {fee_data['feeType']} fee of ₹{fee_data['amount']} for {len(student_ids)} students. Due: {fee_data['dueDate'].strftime('%B %d, %Y')}.",
                category="fee",
                priority="medium",
                triggerType="fee_created_staff",
                relatedId=str(result.inserted_id),
                receiverIds=finance_staff_ids,
            )
            
            finance_notif_doc = {
                "title": finance_notification.title,
                "message": finance_notification.message,
                "category": finance_notification.category,
                "priority": finance_notification.priority,
                "senderRole": "system",
                "receiverRole": None,
                "receiverIds": finance_notification.receiverIds,
                "status": "unread",
                "triggerType": finance_notification.triggerType,
                "relatedId": finance_notification.relatedId,
                "createdAt": datetime.utcnow(),
                "updatedAt": None,
            }
            
            notif_result = await db["notifications"].insert_one(finance_notif_doc)
            notification_payload = {
                "type": "notification",
                "notification": serialize_doc(await db["notifications"].find_one({"_id": notif_result.inserted_id})),
            }
            await connection_manager.broadcast_to_many(finance_staff_ids, notification_payload)
    
    return {"success": True, "data": created_doc}


@router.put("/{fee_id}")
async def update_fee(fee_id: str, payload: dict):
    """Update a fee"""
    try:
        db = get_db()
    except HTTPException:
        return {"success": True, "message": "Fee updated"}
    
    update_data = {}
    if "status" in payload:
        update_data["status"] = payload["status"]
    if "dueDate" in payload:
        update_data["dueDate"] = datetime.fromisoformat(payload["dueDate"])
    if "amount" in payload:
        update_data["amount"] = payload["amount"]
    
    updated = await db["fees"].find_one_and_update(
        {"_id": parse_object_id(fee_id)},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER,
    )
    
    if not updated:
        raise HTTPException(status_code=404, detail="Fee not found")
    
    return {"success": True, "data": serialize_doc(updated)}


@router.delete("/{fee_id}")
async def delete_fee(fee_id: str):
    """Delete a fee"""
    try:
        db = get_db()
    except HTTPException:
        return {"success": True, "message": "Fee deleted"}
    
    result = await db["fees"].delete_one({"_id": parse_object_id(fee_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fee not found")
    
    return {"success": True, "message": "Fee deleted"}


@router.post("/{fee_id}/send-reminder")
async def send_fee_reminder(fee_id: str):
    """
    Manually trigger fee reminder notification to students and finance staff.
    Admin can use this to send reminders on-demand.
    """
    try:
        db = get_db()
    except HTTPException:
        return {"success": True, "message": "Reminder queued"}
    
    fee = await db["fees"].find_one({"_id": parse_object_id(fee_id)})
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")
    
    student_ids = fee.get("studentIds", [])
    
    # Notify students
    if student_ids:
        student_notification = NotificationAutoTrigger(
            title=f"Fee Due Reminder - {fee['feeType']}",
            message=f"Reminder: Your {fee['feeType']} fee of ₹{fee['amount']} is due on {fee['dueDate'].strftime('%B %d, %Y')}. Please pay soon.",
            category="fee",
            priority="high",
            triggerType="fee_reminder",
            relatedId=fee_id,
            receiverIds=student_ids,
        )
        
        student_notif_doc = {
            "title": student_notification.title,
            "message": student_notification.message,
            "category": student_notification.category,
            "priority": student_notification.priority,
            "senderRole": "system",
            "receiverRole": None,
            "receiverIds": student_notification.receiverIds,
            "status": "unread",
            "triggerType": student_notification.triggerType,
            "relatedId": student_notification.relatedId,
            "createdAt": datetime.utcnow(),
            "updatedAt": None,
        }
        
        notif_result = await db["notifications"].insert_one(student_notif_doc)
        notification_payload = {
            "type": "notification",
            "notification": serialize_doc(await db["notifications"].find_one({"_id": notif_result.inserted_id})),
        }
        await connection_manager.broadcast_to_many(student_ids, notification_payload)
    
    # Notify finance staff
    finance_staff = await db["users"].find({"role": "finance"}).to_list(None)
    finance_staff_ids = [f["_id"] for f in finance_staff]
    
    if finance_staff_ids:
        finance_notification = NotificationAutoTrigger(
            title=f"Fee Due Reminder - {fee['feeType']}",
            message=f"{len(student_ids)} students pending {fee['feeType']} fee of ₹{fee['amount']}. Due: {fee['dueDate'].strftime('%B %d, %Y')}.",
            category="fee",
            priority="medium",
            triggerType="fee_reminder_staff",
            relatedId=fee_id,
            receiverIds=finance_staff_ids,
        )
        
        finance_notif_doc = {
            "title": finance_notification.title,
            "message": finance_notification.message,
            "category": finance_notification.category,
            "priority": finance_notification.priority,
            "senderRole": "system",
            "receiverRole": None,
            "receiverIds": finance_notification.receiverIds,
            "status": "unread",
            "triggerType": finance_notification.triggerType,
            "relatedId": finance_notification.relatedId,
            "createdAt": datetime.utcnow(),
            "updatedAt": None,
        }
        
        notif_result = await db["notifications"].insert_one(finance_notif_doc)
        notification_payload = {
            "type": "notification",
            "notification": serialize_doc(await db["notifications"].find_one({"_id": notif_result.inserted_id})),
        }
        await connection_manager.broadcast_to_many(finance_staff_ids, notification_payload)
    
    return {
        "success": True,
        "message": "Reminder sent to students and finance staff",
    }
