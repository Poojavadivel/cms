from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class NotificationPreference(BaseModel):
    """User notification preferences/subscriptions"""
    userId: str
    role: str
    category: str  # 'exam', 'fee', 'announcement', 'attendance', 'system'
    enabled: bool = True


class NotificationBase(BaseModel):
    """Shared notification fields"""
    title: str
    message: str
    category: Literal['exam', 'fee', 'announcement', 'attendance', 'system', 'alert']
    priority: Literal['low', 'medium', 'high', 'critical'] = 'medium'
    senderRole: str  # 'admin', 'faculty', 'finance', 'system'


class NotificationCreate(NotificationBase):
    """Manual notification creation (admin/faculty/finance)"""
    receiverRole: str | Literal['ALL']  # 'student', 'faculty', 'admin', 'finance', 'ALL'
    receiverIds: list[str] | None = None  # specific user IDs (for targeted notifications)


class NotificationAutoTrigger(NotificationBase):
    """Auto-generated notification (exam, fee, etc.)"""
    category: Literal['exam', 'fee', 'attendance', 'system']
    triggerType: str  # 'exam_scheduled', 'fee_due', 'attendance_low', etc.
    relatedId: str | None = None  # exam_id, fee_id, etc.
    receiverIds: list[str]  # specific user IDs
    senderRole: Literal['system'] = 'system'


class NotificationUpdate(BaseModel):
    """Update notification status"""
    status: Literal['read', 'unread']


class NotificationPreferenceUpdate(BaseModel):
    """Update preference for a category"""
    category: str
    enabled: bool


class NotificationResponse(BaseModel):
    """Notification response model"""
    id: str = Field(alias='_id')
    title: str
    message: str
    category: str
    priority: str
    senderRole: str
    receiverRole: str | None = None
    receiverIds: list[str] | None = None
    status: Literal['read', 'unread'] = 'unread'
    triggerType: str | None = None
    relatedId: str | None = None
    createdAt: datetime
    updatedAt: datetime | None = None

    class Config:
        populate_by_name = True
