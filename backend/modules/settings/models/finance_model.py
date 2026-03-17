from pydantic import BaseModel


class FinanceSettings(BaseModel):
    user_id: str
    name: str
    email: str
    phone: str
    payment_notifications: bool
    refund_alerts: bool


class FinanceProfileUpdate(BaseModel):
    name: str
    email: str
    phone: str


class FinanceTogglesUpdate(BaseModel):
    payment_notifications: bool
    refund_alerts: bool
