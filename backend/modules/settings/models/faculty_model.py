from pydantic import BaseModel


class FacultySettings(BaseModel):
    user_id: str
    name: str
    email: str
    phone: str
    assignment_submission: bool
    student_doubt: bool
    assignment_reminder: bool


class FacultyProfileUpdate(BaseModel):
    name: str
    email: str
    phone: str


class FacultyTogglesUpdate(BaseModel):
    assignment_submission: bool
    student_doubt: bool
    assignment_reminder: bool
