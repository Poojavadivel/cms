from typing import Optional

from pydantic import BaseModel


class PayrollRecord(BaseModel):
    staffName: str
    staffId: str
    name: Optional[str] = None
    designation: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    category: Optional[str] = None
    staffType: Optional[str] = None
    payMonth: Optional[str] = None
    payPeriodDetailed: Optional[str] = None
    grossPay: Optional[float] = 0
    deductions: Optional[float] = 0
    netPay: Optional[float] = 0
    status: Optional[str] = "Draft"
    basicSalary: Optional[float] = 0
    hra: Optional[float] = 0
    allowance: Optional[float] = 0
    bonus: Optional[float] = 0
    pf: Optional[float] = 0
    tax: Optional[float] = 0
    esi: Optional[float] = 0
    professionalTax: Optional[float] = 0
    tds: Optional[float] = 0


class PayrollUpdate(PayrollRecord):
    staffName: Optional[str] = None
    staffId: Optional[str] = None
