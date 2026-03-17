from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    title: str
    message: str
    senderRole: str
    receiverRole: str
    module: str
    priority: str
    actionId: Optional[str] = None
    relatedData: dict[str, Any] = Field(default_factory=dict)
    department: Optional[str] = None


class StudentRecord(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    cgpa: Optional[float] = None
    attendancePct: Optional[float] = None
    feeStatus: Optional[str] = None
    status: Optional[str] = "Active"
    avatar: Optional[str] = None
    enrollDate: Optional[datetime] = None
    dob: Optional[datetime] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    guardian: Optional[str] = None
    guardianPhone: Optional[str] = None
    subjects: list[dict[str, Any]] = Field(default_factory=list)
    fees: list[dict[str, Any]] = Field(default_factory=list)
    documents: list[dict[str, Any]] = Field(default_factory=list)
    attendanceMonthly: list[dict[str, Any]] = Field(default_factory=list)
