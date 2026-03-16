from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument
from datetime import datetime

from backend.db import get_db
from backend.dev_store import create_exam as create_dev_exam
from backend.dev_store import create_notification as create_dev_notification
from backend.dev_store import delete_exam as delete_dev_exam
from backend.dev_store import list_items
from backend.dev_store import update_exam as update_dev_exam
from backend.schemas.academics import ExamCreate, ExamUpdate
from backend.schemas.notifications import NotificationAutoTrigger
from backend.utils.mongo import parse_object_id, serialize_doc
from backend.utils.websocket_manager import connection_manager

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
            created = create_dev_exam(payload.model_dump())
            if payload.notify:
                create_dev_notification(
                    {
                        "title": f"Exam Scheduled: {payload.name}",
                        "message": f"An exam '{payload.name}' has been scheduled on {payload.date} at {payload.time} in room {payload.room}. Duration: {payload.duration}. Max Marks: {payload.maxMarks}.",
                        "category": "exam",
                        "priority": "high",
                        "senderRole": "system",
                        "receiverRole": "student",
                        "receiverIds": payload.affectedStudentIds or None,
                        "triggerType": "exam_scheduled",
                        "relatedId": created.get("id"),
                        "createdAt": datetime.utcnow().isoformat(),
                        "updatedAt": None,
                    }
                )
            return {"success": True, "data": created}
        raise
    
    # Prepare exam document (exclude notify flag)
    exam_data = payload.model_dump(exclude={'notify'})
    
    result = await db["exams"].insert_one(exam_data)
    created = await db["exams"].find_one({"_id": result.inserted_id})
    created_doc = serialize_doc(created)
    
    # Send auto-notification if requested
    if payload.notify:
        notification = NotificationAutoTrigger(
            title=f"Exam Scheduled: {payload.name}",
            message=f"An exam '{payload.name}' has been scheduled on {payload.date} at {payload.time} in room {payload.room}. Duration: {payload.duration}. Max Marks: {payload.maxMarks}.",
            category="exam",
            priority="high",
            triggerType="exam_scheduled",
            relatedId=str(result.inserted_id),
            receiverIds=payload.affectedStudentIds or [],
        )
        
        notification_doc = {
            "title": notification.title,
            "message": notification.message,
            "category": notification.category,
            "priority": notification.priority,
            "senderRole": "system",
            "receiverRole": "student",
            "receiverIds": notification.receiverIds or None,
            "status": "unread",
            "triggerType": notification.triggerType,
            "relatedId": notification.relatedId,
            "createdAt": datetime.utcnow(),
            "updatedAt": None,
        }
        
        notif_result = await db["notifications"].insert_one(notification_doc)
        
        # Broadcast in real-time
        notification_payload = {
            "type": "notification",
            "notification": serialize_doc(await db["notifications"].find_one({"_id": notif_result.inserted_id})),
        }
        if payload.affectedStudentIds:
            await connection_manager.broadcast_to_many(payload.affectedStudentIds, notification_payload)
    
    return {"success": True, "data": created_doc}


@router.put("/{exam_id}")
async def update_exam(exam_id: str, payload: ExamUpdate):
    update_data = {key: value for key, value in payload.model_dump().items() if value is not None and key != 'notify'}
    notify = payload.notify
    
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

    # Send notification if requested
    if notify:
        exam_name = updated.get("name", "Exam")
        exam_date = updated.get("date", "TBD")
        exam_time = updated.get("time", "TBD")
        
        notification = NotificationAutoTrigger(
            title=f"Exam Updated: {exam_name}",
            message=f"The exam '{exam_name}' has been updated. New details - Date: {exam_date}, Time: {exam_time}. Please check the portal for complete details.",
            category="exam",
            priority="medium",
            triggerType="exam_updated",
            relatedId=exam_id,
            receiverIds=payload.affectedStudentIds or [],
        )
        
        notification_doc = {
            "title": notification.title,
            "message": notification.message,
            "category": notification.category,
            "priority": notification.priority,
            "senderRole": "system",
            "receiverRole": "student",
            "receiverIds": notification.receiverIds or None,
            "status": "unread",
            "triggerType": notification.triggerType,
            "relatedId": notification.relatedId,
            "createdAt": datetime.utcnow(),
            "updatedAt": None,
        }
        
        notif_result = await db["notifications"].insert_one(notification_doc)
        
        # Broadcast in real-time
        notification_payload = {
            "type": "notification",
            "notification": serialize_doc(await db["notifications"].find_one({"_id": notif_result.inserted_id})),
        }
        if payload.affectedStudentIds:
            await connection_manager.broadcast_to_many(payload.affectedStudentIds, notification_payload)

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
            create_dev_notification(
                {
                    "title": "Exam Canceled",
                    "message": "An exam has been canceled. Please check the Exams page for updated schedule.",
                    "category": "exam",
                    "priority": "high",
                    "senderRole": "system",
                    "receiverRole": "student",
                    "triggerType": "exam_canceled",
                    "relatedId": exam_id,
                    "createdAt": datetime.utcnow().isoformat(),
                    "updatedAt": None,
                }
            )
            return {"success": True, "message": "Exam deleted"}
        raise
    
    # Get exam details before deletion
    exam_obj_id = parse_object_id(exam_id)
    exam = await db["exams"].find_one({"_id": exam_obj_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Find all students who registered for this exam
    registrations = []
    async for reg in db["exam_registrations"].find({"examId": exam_id}):
        if "studentId" in reg:
            registrations.append(reg["studentId"])
    if not registrations and isinstance(exam.get("affectedStudentIds"), list):
        registrations = [str(student_id) for student_id in exam.get("affectedStudentIds", []) if student_id]
    
    # Delete the exam
    result = await db["exams"].delete_one({"_id": exam_obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Notify all registered students
    if registrations:
        notification_doc = {
            "title": f"Exam Canceled: {exam.get('name', 'Unknown')}",
            "message": f"The exam '{exam.get('name', 'Unknown')}' scheduled for {exam.get('date', 'N/A')} has been canceled. Please check with your department for further updates.",
            "category": "exam",
            "priority": "high",
            "senderRole": "system",
            "receiverRole": "student",
            "receiverIds": registrations,
            "status": "unread",
            "triggerType": "exam_canceled",
            "relatedId": exam_id,
            "createdAt": datetime.utcnow(),
            "updatedAt": None,
        }
        
        notif_result = await db["notifications"].insert_one(notification_doc)
        
        # Broadcast in real-time to registered students
        notification_payload = {
            "type": "notification",
            "notification": serialize_doc(await db["notifications"].find_one({"_id": notif_result.inserted_id})),
        }
        await connection_manager.broadcast_to_many(registrations, notification_payload)
    
    return {"success": True, "message": "Exam deleted"}
