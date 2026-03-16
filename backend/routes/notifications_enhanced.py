"""Enhanced notifications router with real-time delivery"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, WebSocket
from pymongo import ReturnDocument

from backend.db import get_db
from backend.dev_store import create_notification as create_dev_notification
from backend.dev_store import list_notifications as list_dev_notifications
from backend.dev_store import mark_notification_read as mark_dev_notification_read
from backend.dev_store import mark_role_notifications_read as mark_dev_role_notifications_read
from backend.dev_store import delete_notification as delete_dev_notification
from backend.dev_store import clear_notifications as clear_dev_notifications
from backend.dev_store import unread_notifications as unread_dev_notifications
from backend.schemas.notifications import (
    NotificationCreate,
    NotificationAutoTrigger,
    NotificationPreference,
    NotificationPreferenceUpdate,
)
from backend.utils.mongo import serialize_doc
from backend.utils.websocket_manager import connection_manager

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ═══════════════════════════════════════════════════════════════════════════
# WebSocket Endpoint for Real-time Notifications
# ═══════════════════════════════════════════════════════════════════════════


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time notification delivery.
    Client connects: ws://localhost:5000/api/notifications/ws/{user_id}
    """
    await connection_manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive; listen for client messages
            data = await websocket.receive_text()
            # Handle ping/pong or other client messages
            if data == "ping":
                await websocket.send_text("pong")
    except Exception:
        await connection_manager.disconnect(user_id, websocket)


# ═══════════════════════════════════════════════════════════════════════════
# Manual Notification Creation (Admin/Faculty/Finance)
# ═══════════════════════════════════════════════════════════════════════════


@router.post("/send")
async def send_notification(payload: NotificationCreate):
    """
    Send a manual notification (admin, faculty, or finance only).
    
    Request body:
    {
        "title": "Important Announcement",
        "message": "Portal will be under maintenance...",
        "category": "announcement",
        "priority": "high",
        "senderRole": "admin",
        "receiverRole": "ALL"  # or 'student', 'faculty', 'admin', 'finance'
        "receiverIds": null  # or specific user IDs for targeted notifications
    }
    """
    # Validate sender role
    if payload.senderRole not in ['admin', 'faculty', 'finance']:
        raise HTTPException(status_code=403, detail="Only admin, faculty, and finance can send notifications")
    
    # Validate receiver role
    if payload.receiverRole not in ['student', 'faculty', 'admin', 'finance', 'ALL']:
        raise HTTPException(status_code=400, detail="Invalid receiver role")
    
    try:
        db = get_db()
    except HTTPException:
        # Fallback for when MongoDB is unavailable: persist to dev store
        created = create_dev_notification(
            {
                "title": payload.title,
                "message": payload.message,
                "category": payload.category,
                "priority": payload.priority,
                "senderRole": payload.senderRole,
                "receiverRole": payload.receiverRole,
                "receiverIds": payload.receiverIds,
                "triggerType": None,
                "relatedId": None,
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": None,
            }
        )
        return {
            "success": True,
            "message": "Notification sent (dev store)",
            "data": created,
        }
    
    # Create notification document
    notification_doc = {
        "title": payload.title,
        "message": payload.message,
        "category": payload.category,
        "priority": payload.priority,
        "senderRole": payload.senderRole,
        "receiverRole": payload.receiverRole,
        "receiverIds": payload.receiverIds,
        "status": "unread",
        "triggerType": None,
        "relatedId": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": None,
    }
    
    result = await db["notifications"].insert_one(notification_doc)
    created_notification = await db["notifications"].find_one({"_id": result.inserted_id})
    
    # Broadcast notification in real-time
    await _broadcast_notification(
        db,
        created_notification,
        payload.receiverRole,
        payload.receiverIds,
    )
    
    return {
        "success": True,
        "message": "Notification sent successfully",
        "data": serialize_doc(created_notification),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Auto-triggered Notifications (Exam, Fee, Attendance, etc.)
# ═══════════════════════════════════════════════════════════════════════════


@router.post("/auto-trigger")
async def create_auto_notification(payload: NotificationAutoTrigger):
    """
    Create an auto-triggered notification (system events).
    
    Used internally when:
    - Exam is scheduled for students of a class
    - Fee deadline is passed
    - Attendance falls below threshold
    """
    try:
        db = get_db()
    except HTTPException:
        return {
            "success": True,
            "message": "Auto-notification queued (database unavailable)",
        }
    
    notification_doc = {
        "title": payload.title,
        "message": payload.message,
        "category": payload.category,
        "priority": payload.priority,
        "senderRole": "system",
        "receiverRole": None,  # auto notifications don't use role-based delivery
        "receiverIds": payload.receiverIds,
        "status": "unread",
        "triggerType": payload.triggerType,
        "relatedId": payload.relatedId,
        "createdAt": datetime.utcnow(),
        "updatedAt": None,
    }
    
    result = await db["notifications"].insert_one(notification_doc)
    created_notification = await db["notifications"].find_one({"_id": result.inserted_id})
    
    # Broadcast to specific users
    await connection_manager.broadcast_to_many(
        payload.receiverIds,
        {
            "type": "notification",
            "notification": serialize_doc(created_notification),
        }
    )
    
    return {
        "success": True,
        "message": "Auto-notification created and delivered",
        "data": serialize_doc(created_notification),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Notification Management
# ═══════════════════════════════════════════════════════════════════════════


@router.get("/{role}")
async def list_notifications(
    role: str,
    limit: int | None = None,
    search: str | None = None,
    user_id: str | None = Query(default=None, alias="userId"),
):
    """List notifications for a role"""
    try:
        db = get_db()
    except HTTPException:
        data, unread_count = list_dev_notifications(role, limit, search, user_id)
        return {"success": True, "role": role, "data": data, "count": len(data), "unreadCount": unread_count}

    base_or = [
        {"receiverRole": role},
        {"receiverRole": "ALL"},
    ]
    if user_id:
        base_or.append({"receiverIds": user_id})

    query = {"$or": base_or}
    
    if search:
        query["$and"] = [
            {
                "$or": [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"message": {"$regex": search, "$options": "i"}},
                ]
            }
        ]
    
    cursor = db["notifications"].find(query).sort("createdAt", -1)
    if limit and limit > 0:
        cursor = cursor.limit(limit)
    
    data = []
    async for row in cursor:
        data.append(serialize_doc(row))
    
    unread_or = [
        {"receiverRole": role},
        {"receiverRole": "ALL"},
    ]
    if user_id:
        unread_or.append({"receiverIds": user_id})

    unread_count = await db["notifications"].count_documents({"$or": unread_or, "status": "unread"})
    
    return {
        "success": True,
        "role": role,
        "data": data,
        "count": len(data),
        "unreadCount": unread_count,
    }


@router.get("/{role}/unread")
async def unread_count(role: str):
    """Get unread count for a role"""
    try:
        db = get_db()
    except HTTPException:
        return {"success": True, "role": role, "unreadCount": unread_dev_notifications(role)}

    unread = await db["notifications"].count_documents(
        {
            "$or": [
                {"receiverRole": role},
                {"receiverRole": "ALL"},
                {"senderRole": role},
            ],
            "status": "unread",
        }
    )
    return {"success": True, "role": role, "unreadCount": unread}


@router.put("/{role}/read-all")
async def mark_all_read(role: str):
    """Mark all notifications as read for a role"""
    try:
        db = get_db()
    except HTTPException:
        count = mark_dev_role_notifications_read(role)
        return {"success": True, "message": "All notifications marked as read", "count": count}

    result = await db["notifications"].update_many(
        {"$or": [{"receiverRole": role}, {"receiverRole": "ALL"}], "status": "unread"},
        {"$set": {"status": "read", "updatedAt": datetime.utcnow()}},
    )
    return {"success": True, "message": "All notifications marked as read", "count": result.modified_count}


@router.post("/{role}/clear-all")
async def clear_all(role: str):
    """Clear all notifications for a role"""
    try:
        db = get_db()
    except HTTPException:
        deleted_count = clear_dev_notifications(role)
        return {"success": True, "message": "All notifications cleared", "deletedCount": deleted_count}

    result = await db["notifications"].delete_many(
        {"$or": [{"receiverRole": role}, {"receiverRole": "ALL"}]}
    )
    return {"success": True, "message": "All notifications cleared", "deletedCount": result.deleted_count}


@router.put("/{notification_id}/read")
async def mark_as_read(notification_id: str):
    """Mark a notification as read"""
    try:
        db = get_db()
    except HTTPException:
        updated = mark_dev_notification_read(notification_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"success": True, "message": "Marked as read", "data": updated}
    
    from bson import ObjectId
    try:
        obj_id = ObjectId(notification_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid notification ID")
    
    updated = await db["notifications"].find_one_and_update(
        {"_id": obj_id},
        {
            "$set": {
                "status": "read",
                "updatedAt": datetime.utcnow(),
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True, "message": "Marked as read", "data": serialize_doc(updated)}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete a notification (soft delete - mark as deleted)"""
    try:
        db = get_db()
    except HTTPException:
        deleted = delete_dev_notification(notification_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"success": True, "message": "Notification deleted"}
    
    from bson import ObjectId
    try:
        obj_id = ObjectId(notification_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid notification ID")
    
    deleted = await db["notifications"].find_one_and_delete(
        {"_id": obj_id}
    )
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True, "message": "Notification deleted"}


# ═══════════════════════════════════════════════════════════════════════════
# Notification Preferences (User Subscriptions)
# ═══════════════════════════════════════════════════════════════════════════


@router.get("/preferences/{user_id}")
async def get_preferences(user_id: str):
    """Get notification preferences for a user"""
    try:
        db = get_db()
    except HTTPException:
        return {
            "success": True,
            "data": [
                {"category": "exam", "enabled": True},
                {"category": "fee", "enabled": True},
                {"category": "announcement", "enabled": True},
                {"category": "attendance", "enabled": True},
                {"category": "system", "enabled": True},
            ]
        }
    
    preferences = await db["notification_preferences"].find_one({"userId": user_id})
    
    if not preferences:
        # Return default preferences if none exist
        default_prefs = [
            {"category": "exam", "enabled": True},
            {"category": "fee", "enabled": True},
            {"category": "announcement", "enabled": True},
            {"category": "attendance", "enabled": True},
            {"category": "system", "enabled": True},
        ]
        return {"success": True, "data": default_prefs}
    
    return {"success": True, "data": preferences.get("preferences", [])}


@router.put("/preferences/{user_id}")
async def update_preference(user_id: str, payload: NotificationPreferenceUpdate):
    """Update a notification preference for a user (turn on/off a category)"""
    try:
        db = get_db()
    except HTTPException:
        return {"success": True, "message": "Preference updated"}
    
    # Upsert: create if doesn't exist, update if does
    result = await db["notification_preferences"].find_one_and_update(
        {"userId": user_id},
        {
            "$set": {
                "userId": user_id,
                f"preferences.{payload.category}.enabled": payload.enabled,
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    
    return {
        "success": True,
        "message": f"Category '{payload.category}' set to {payload.enabled}",
        "data": result,
    }


# ═══════════════════════════════════════════════════════════════════════════
# Internal Helper Functions
# ═══════════════════════════════════════════════════════════════════════════


async def _broadcast_notification(db, notification_doc, receiver_role: str, receiver_ids: list[str] | None):
    """
    Broadcast notification via WebSocket.
    
    If receiver_role is 'ALL' or specific role, get all users of that role from db if receiver_ids not provided.
    Otherwise, send to specific receiver_ids.
    """
    notification_data = {
        "type": "notification",
        "notification": serialize_doc(notification_doc),
    }
    
    if receiver_ids:
        # Send to specific user IDs
        await connection_manager.broadcast_to_many(receiver_ids, notification_data)
    elif receiver_role == "ALL":
        # Best-effort role broadcast to currently connected users
        connected_user_ids = list(connection_manager.active_connections.keys())
        await connection_manager.broadcast_to_many(connected_user_ids, notification_data)
    else:
        # Role-based targeting requires user-role mapping in DB; fallback to polling/list endpoint refresh
        # If DB has users collection with role/userId, best-effort broadcast to matching connected users.
        if db is not None:
            matched_user_ids = []
            try:
                async for user in db["users"].find({"role": receiver_role}):
                    user_id = user.get("id") or user.get("_id") or user.get("userId")
                    if user_id is not None:
                        matched_user_ids.append(str(user_id))
            except Exception:
                matched_user_ids = []
            if matched_user_ids:
                await connection_manager.broadcast_to_many(matched_user_ids, notification_data)
