"""Background task scheduler for auto-triggered notifications"""
from datetime import datetime, timedelta
from backend.db import db
from backend.routes.notifications_enhanced import create_auto_notification
from backend.schemas.notifications import NotificationAutoTrigger
import asyncio


async def check_fee_deadlines():
    """
    Scheduled task: runs daily to check if any fees have deadlines 7 days away.
    Sends reminder to students and finance staff.
    """
    if not db:
        return
    
    # Find fees with deadline in the next 7 days (within 6-8 days range)
    seven_days_from_now = datetime.utcnow() + timedelta(days=7)
    six_days_from_now = datetime.utcnow() + timedelta(days=6)
    
    fees = await db["fees"].find({
        "dueDate": {
            "$gte": six_days_from_now,
            "$lte": seven_days_from_now
        },
        "notified": {"$ne": True}  # Only notify once
    }).to_list(None)
    
    for fee in fees:
        student_ids = fee.get("studentIds", [])
        
        # Get all finance staff
        finance_staff = await db["users"].find({"role": "finance"}).to_list(None)
        finance_staff_ids = [f["_id"] for f in finance_staff]
        
        # Create notification for students
        if student_ids:
            student_notification = NotificationAutoTrigger(
                title=f"Fee Due Reminder - {fee['feeType']}",
                message=f"Your {fee['feeType']} fee of ₹{fee['amount']} is due on {fee['dueDate'].strftime('%B %d, %Y')}. Please pay before the deadline.",
                category="fee",
                priority="high",
                triggerType="fee_due_7days",
                relatedId=str(fee["_id"]),
                receiverIds=student_ids,
            )
            await create_auto_notification(student_notification)
        
        # Create notification for finance staff
        if finance_staff_ids:
            finance_notification = NotificationAutoTrigger(
                title=f"Fee Due Reminder - {fee['feeType']}",
                message=f"{len(student_ids)} students have {fee['feeType']} fee pending, due on {fee['dueDate'].strftime('%B %d, %Y')}.",
                category="fee",
                priority="medium",
                triggerType="fee_due_7days_staff",
                relatedId=str(fee["_id"]),
                receiverIds=finance_staff_ids,
            )
            await create_auto_notification(finance_notification)
        
        # Mark as notified
        await db["fees"].update_one(
            {"_id": fee["_id"]},
            {"$set": {"notified": True}}
        )


async def scheduler_loop():
    """
    Main scheduler loop.
    Runs every 24 hours to check for pending notifications.
    """
    while True:
        try:
            await check_fee_deadlines()
        except Exception as e:
            print(f"Error in notification scheduler: {e}")
        
        # Wait 24 hours before next check
        await asyncio.sleep(86400)


def start_scheduler():
    """Start the background notification scheduler"""
    # This should be called during app startup
    asyncio.create_task(scheduler_loop())
