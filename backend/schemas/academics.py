from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class ExamBase(BaseModel):
    code: str
    name: str
    date: str
    time: str
    room: str
    type: str
    status: str = "Upcoming"
    duration: str
    maxMarks: str
    senderRole: Optional[str] = "faculty"


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    room: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    duration: Optional[str] = None
    maxMarks: Optional[str] = None
    senderRole: Optional[str] = None


class TimetableEntry(BaseModel):
    code: str = ""
    name: str = ""
    room: str = ""
    instructor: str = ""
    credits: int = 1
    type: str = "Lecture"
    theme: str = "blue"
    color: str = ""
    textColor: str = ""
    label: str = ""


class TimetableRecord(BaseModel):
    classId: str
    label: str
    dept: str
    semester: str
    section: str
    slots: List[List[Optional[TimetableEntry]]] = Field(default_factory=list)


class AttendanceRecord(BaseModel):
    personId: str
    name: str
    role: str
    courseOrDepartment: str
    present: int
    total: int


class WeeklyAttendancePoint(BaseModel):
    day: str
    attendance: float


class PlacementEntry(BaseModel):
    name: str
    company: str
    role: str
    package: str
    status: str = "Process"
    date: str


class FacilityRecord(BaseModel):
    name: str
    type: str
    capacity: int
    status: str = "Available"
    amenities: List[str] = Field(default_factory=list)


class FacilityBooking(BaseModel):
    room: str
    date: date
    timeFrom: str
    timeTo: str
    purpose: str
    requestedBy: Optional[str] = None
