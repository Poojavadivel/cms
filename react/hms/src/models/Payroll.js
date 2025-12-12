/**
 * Payroll Management Models
 * Comprehensive payroll system with salary components, attendance, statutory compliance
 */

export class SalaryComponent {
  constructor({
    name,
    type,
    amount = 0,
    isPercentage = false,
    percentageOf = 'basic',
    isTaxable = true,
    isStatutory = false,
    calculationFormula = '',
    description = '',
  }) {
    this.name = name;
    this.type = type;
    this.amount = amount;
    this.isPercentage = isPercentage;
    this.percentageOf = percentageOf;
    this.isTaxable = isTaxable;
    this.isStatutory = isStatutory;
    this.calculationFormula = calculationFormula;
    this.description = description;
  }

  static fromJSON(json) {
    return new SalaryComponent({
      name: json.name?.toString() || '',
      type: json.type?.toString() || 'earning',
      amount: parseFloat(json.amount) || 0,
      isPercentage: json.isPercentage === true,
      percentageOf: json.percentageOf?.toString() || 'basic',
      isTaxable: json.isTaxable !== false,
      isStatutory: json.isStatutory === true,
      calculationFormula: json.calculationFormula?.toString() || '',
      description: json.description?.toString() || '',
    });
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      amount: this.amount,
      isPercentage: this.isPercentage,
      percentageOf: this.percentageOf,
      isTaxable: this.isTaxable,
      isStatutory: this.isStatutory,
      calculationFormula: this.calculationFormula,
      description: this.description,
    };
  }
}

export class AttendanceSummary {
  constructor({
    totalDays = 0,
    presentDays = 0,
    absentDays = 0,
    halfDays = 0,
    lateDays = 0,
    overtimeHours = 0,
    leaves = {},
    holidays = 0,
    weekends = 0,
  }) {
    this.totalDays = totalDays;
    this.presentDays = presentDays;
    this.absentDays = absentDays;
    this.halfDays = halfDays;
    this.lateDays = lateDays;
    this.overtimeHours = overtimeHours;
    this.leaves = leaves;
    this.holidays = holidays;
    this.weekends = weekends;
  }

  static fromJSON(json) {
    const parseLeaves = (l) => {
      if (l && typeof l === 'object') {
        return Object.entries(l).reduce((acc, [k, v]) => {
          acc[k] = parseInt(v) || 0;
          return acc;
        }, {});
      }
      return { casual: 0, sick: 0, earned: 0, unpaid: 0, other: 0 };
    };

    return new AttendanceSummary({
      totalDays: parseInt(json.totalDays) || 0,
      presentDays: parseInt(json.presentDays) || 0,
      absentDays: parseInt(json.absentDays) || 0,
      halfDays: parseInt(json.halfDays) || 0,
      lateDays: parseInt(json.lateDays) || 0,
      overtimeHours: parseFloat(json.overtimeHours) || 0,
      leaves: parseLeaves(json.leaves),
      holidays: parseInt(json.holidays) || 0,
      weekends: parseInt(json.weekends) || 0,
    });
  }

  toJSON() {
    return {
      totalDays: this.totalDays,
      presentDays: this.presentDays,
      absentDays: this.absentDays,
      halfDays: this.halfDays,
      lateDays: this.lateDays,
      overtimeHours: this.overtimeHours,
      leaves: this.leaves,
      holidays: this.holidays,
      weekends: this.weekends,
    };
  }
}

export class StatutoryCompliance {
  constructor({
    pfNumber = '',
    esiNumber = '',
    uanNumber = '',
    panNumber = '',
    aadharNumber = '',
    pfApplicable = true,
    esiApplicable = false,
    ptApplicable = true,
    employeePF = 0,
    employerPF = 0,
    employeeESI = 0,
    employerESI = 0,
    professionalTax = 0,
    tdsDeducted = 0,
  }) {
    this.pfNumber = pfNumber;
    this.esiNumber = esiNumber;
    this.uanNumber = uanNumber;
    this.panNumber = panNumber;
    this.aadharNumber = aadharNumber;
    this.pfApplicable = pfApplicable;
    this.esiApplicable = esiApplicable;
    this.ptApplicable = ptApplicable;
    this.employeePF = employeePF;
    this.employerPF = employerPF;
    this.employeeESI = employeeESI;
    this.employerESI = employerESI;
    this.professionalTax = professionalTax;
    this.tdsDeducted = tdsDeducted;
  }

  static fromJSON(json) {
    return new StatutoryCompliance({
      pfNumber: json.pfNumber?.toString() || '',
      esiNumber: json.esiNumber?.toString() || '',
      uanNumber: json.uanNumber?.toString() || '',
      panNumber: json.panNumber?.toString() || '',
      aadharNumber: json.aadharNumber?.toString() || '',
      pfApplicable: json.pfApplicable !== false,
      esiApplicable: json.esiApplicable === true,
      ptApplicable: json.ptApplicable !== false,
      employeePF: parseFloat(json.employeePF) || 0,
      employerPF: parseFloat(json.employerPF) || 0,
      employeeESI: parseFloat(json.employeeESI) || 0,
      employerESI: parseFloat(json.employerESI) || 0,
      professionalTax: parseFloat(json.professionalTax) || 0,
      tdsDeducted: parseFloat(json.tdsDeducted) || 0,
    });
  }

  toJSON() {
    return {
      pfNumber: this.pfNumber,
      esiNumber: this.esiNumber,
      uanNumber: this.uanNumber,
      panNumber: this.panNumber,
      aadharNumber: this.aadharNumber,
      pfApplicable: this.pfApplicable,
      esiApplicable: this.esiApplicable,
      ptApplicable: this.ptApplicable,
      employeePF: this.employeePF,
      employerPF: this.employerPF,
      employeeESI: this.employeeESI,
      employerESI: this.employerESI,
      professionalTax: this.professionalTax,
      tdsDeducted: this.tdsDeducted,
    };
  }
}

export class LoanAdvance {
  constructor({
    type = 'advance',
    amount = 0,
    installmentAmount = 0,
    remainingAmount = 0,
    description = '',
    date = null,
  }) {
    this.type = type;
    this.amount = amount;
    this.installmentAmount = installmentAmount;
    this.remainingAmount = remainingAmount;
    this.description = description;
    this.date = date ? new Date(date) : new Date();
  }

  static fromJSON(json) {
    return new LoanAdvance({
      type: json.type?.toString() || 'advance',
      amount: parseFloat(json.amount) || 0,
      installmentAmount: parseFloat(json.installmentAmount) || 0,
      remainingAmount: parseFloat(json.remainingAmount) || 0,
      description: json.description?.toString() || '',
      date: json.date ? new Date(json.date) : new Date(),
    });
  }

  toJSON() {
    return {
      type: this.type,
      amount: this.amount,
      installmentAmount: this.installmentAmount,
      remainingAmount: this.remainingAmount,
      description: this.description,
      date: this.date.toISOString(),
    };
  }
}

export class Payroll {
  constructor({
    id,
    staffId,
    staffName,
    staffCode = '',
    department = '',
    designation = '',
    email = '',
    contact = '',
    payPeriodMonth,
    payPeriodYear,
    payPeriodStart,
    payPeriodEnd,
    paymentDate = null,
    status = 'draft',
    basicSalary = 0,
    earnings = [],
    deductions = [],
    reimbursements = [],
    totalEarnings = 0,
    totalDeductions = 0,
    totalReimbursements = 0,
    grossSalary = 0,
    netSalary = 0,
    ctc = 0,
    attendance = null,
    statutory = null,
    loansAdvances = [],
    totalLoanDeduction = 0,
    overtimePay = 0,
    bonus = 0,
    incentives = 0,
    arrears = 0,
    lossOfPayDays = 0,
    lossOfPayAmount = 0,
    paymentMode = 'bank_transfer',
    bankName = '',
    accountNumber = '',
    ifscCode = '',
    transactionId = '',
    chequeNumber = '',
    submittedBy = '',
    submittedAt = null,
    approvedBy = '',
    approvedAt = null,
    rejectedBy = '',
    rejectedAt = null,
    rejectionReason = '',
    notes = '',
    internalNotes = '',
    adminRemarks = '',
    revisionNumber = 1,
    previousRevisionId = '',
    isRevision = false,
    tags = [],
    payrollGroup = 'regular',
    metadata = {},
    createdAt = null,
    updatedAt = null,
    isSelected = false,
  }) {
    this.id = id;
    this.staffId = staffId;
    this.staffName = staffName;
    this.staffCode = staffCode;
    this.department = department;
    this.designation = designation;
    this.email = email;
    this.contact = contact;
    this.payPeriodMonth = payPeriodMonth;
    this.payPeriodYear = payPeriodYear;
    this.payPeriodStart = new Date(payPeriodStart);
    this.payPeriodEnd = new Date(payPeriodEnd);
    this.paymentDate = paymentDate ? new Date(paymentDate) : null;
    this.status = status;
    this.basicSalary = basicSalary;
    this.earnings = earnings;
    this.deductions = deductions;
    this.reimbursements = reimbursements;
    this.totalEarnings = totalEarnings;
    this.totalDeductions = totalDeductions;
    this.totalReimbursements = totalReimbursements;
    this.grossSalary = grossSalary;
    this.netSalary = netSalary;
    this.ctc = ctc;
    this.attendance = attendance || new AttendanceSummary({});
    this.statutory = statutory || new StatutoryCompliance({});
    this.loansAdvances = loansAdvances;
    this.totalLoanDeduction = totalLoanDeduction;
    this.overtimePay = overtimePay;
    this.bonus = bonus;
    this.incentives = incentives;
    this.arrears = arrears;
    this.lossOfPayDays = lossOfPayDays;
    this.lossOfPayAmount = lossOfPayAmount;
    this.paymentMode = paymentMode;
    this.bankName = bankName;
    this.accountNumber = accountNumber;
    this.ifscCode = ifscCode;
    this.transactionId = transactionId;
    this.chequeNumber = chequeNumber;
    this.submittedBy = submittedBy;
    this.submittedAt = submittedAt ? new Date(submittedAt) : null;
    this.approvedBy = approvedBy;
    this.approvedAt = approvedAt ? new Date(approvedAt) : null;
    this.rejectedBy = rejectedBy;
    this.rejectedAt = rejectedAt ? new Date(rejectedAt) : null;
    this.rejectionReason = rejectionReason;
    this.notes = notes;
    this.internalNotes = internalNotes;
    this.adminRemarks = adminRemarks;
    this.revisionNumber = revisionNumber;
    this.previousRevisionId = previousRevisionId;
    this.isRevision = isRevision;
    this.tags = tags;
    this.payrollGroup = payrollGroup;
    this.metadata = metadata;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.isSelected = isSelected;
  }

  static fromJSON(json) {
    const parseDate = (v) => {
      if (!v) return null;
      if (v instanceof Date) return v;
      try {
        return new Date(v);
      } catch {
        return null;
      }
    };

    const parseStringList = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v.map(e => e.toString());
      return [];
    };

    const parseMetadata = (m) => {
      if (!m) return {};
      if (typeof m === 'object') return { ...m };
      return {};
    };

    const parseSalaryComponentList = (v) => {
      if (!v || !Array.isArray(v)) return [];
      return v.map(e => {
        if (typeof e === 'object') {
          return SalaryComponent.fromJSON(e);
        }
        return null;
      }).filter(Boolean);
    };

    const parseLoanAdvanceList = (v) => {
      if (!v || !Array.isArray(v)) return [];
      return v.map(e => {
        if (typeof e === 'object') {
          return LoanAdvance.fromJSON(e);
        }
        return null;
      }).filter(Boolean);
    };

    return new Payroll({
      id: json._id?.toString() || json.id?.toString() || '',
      staffId: json.staffId?.toString() || '',
      staffName: json.staffName?.toString() || '',
      staffCode: json.staffCode?.toString() || '',
      department: json.department?.toString() || '',
      designation: json.designation?.toString() || '',
      email: json.email?.toString() || '',
      contact: json.contact?.toString() || '',
      payPeriodMonth: parseInt(json.payPeriodMonth) || 0,
      payPeriodYear: parseInt(json.payPeriodYear) || 0,
      payPeriodStart: parseDate(json.payPeriodStart) || new Date(),
      payPeriodEnd: parseDate(json.payPeriodEnd) || new Date(),
      paymentDate: parseDate(json.paymentDate),
      status: json.status?.toString() || 'draft',
      basicSalary: parseFloat(json.basicSalary) || 0,
      earnings: parseSalaryComponentList(json.earnings),
      deductions: parseSalaryComponentList(json.deductions),
      reimbursements: parseSalaryComponentList(json.reimbursements),
      totalEarnings: parseFloat(json.totalEarnings) || 0,
      totalDeductions: parseFloat(json.totalDeductions) || 0,
      totalReimbursements: parseFloat(json.totalReimbursements) || 0,
      grossSalary: parseFloat(json.grossSalary) || 0,
      netSalary: parseFloat(json.netSalary) || 0,
      ctc: parseFloat(json.ctc) || 0,
      attendance: json.attendance ? AttendanceSummary.fromJSON(json.attendance) : null,
      statutory: json.statutory ? StatutoryCompliance.fromJSON(json.statutory) : null,
      loansAdvances: parseLoanAdvanceList(json.loansAdvances),
      totalLoanDeduction: parseFloat(json.totalLoanDeduction) || 0,
      overtimePay: parseFloat(json.overtimePay) || 0,
      bonus: parseFloat(json.bonus) || 0,
      incentives: parseFloat(json.incentives) || 0,
      arrears: parseFloat(json.arrears) || 0,
      lossOfPayDays: parseInt(json.lossOfPayDays) || 0,
      lossOfPayAmount: parseFloat(json.lossOfPayAmount) || 0,
      paymentMode: json.paymentMode?.toString() || 'bank_transfer',
      bankName: json.bankName?.toString() || '',
      accountNumber: json.accountNumber?.toString() || '',
      ifscCode: json.ifscCode?.toString() || '',
      transactionId: json.transactionId?.toString() || '',
      chequeNumber: json.chequeNumber?.toString() || '',
      submittedBy: json.submittedBy?.toString() || '',
      submittedAt: parseDate(json.submittedAt),
      approvedBy: json.approvedBy?.toString() || '',
      approvedAt: parseDate(json.approvedAt),
      rejectedBy: json.rejectedBy?.toString() || '',
      rejectedAt: parseDate(json.rejectedAt),
      rejectionReason: json.rejectionReason?.toString() || '',
      notes: json.notes?.toString() || '',
      internalNotes: json.internalNotes?.toString() || '',
      adminRemarks: json.adminRemarks?.toString() || '',
      revisionNumber: parseInt(json.revisionNumber) || 1,
      previousRevisionId: json.previousRevisionId?.toString() || '',
      isRevision: json.isRevision === true,
      tags: parseStringList(json.tags),
      payrollGroup: json.payrollGroup?.toString() || 'regular',
      metadata: parseMetadata(json.metadata),
      createdAt: parseDate(json.createdAt),
      updatedAt: parseDate(json.updatedAt),
      isSelected: json.isSelected === true,
    });
  }

  toJSON() {
    return {
      ...(this.id && { _id: this.id }),
      staffId: this.staffId,
      staffName: this.staffName,
      staffCode: this.staffCode,
      department: this.department,
      designation: this.designation,
      email: this.email,
      contact: this.contact,
      payPeriodMonth: this.payPeriodMonth,
      payPeriodYear: this.payPeriodYear,
      payPeriodStart: this.payPeriodStart.toISOString(),
      payPeriodEnd: this.payPeriodEnd.toISOString(),
      ...(this.paymentDate && { paymentDate: this.paymentDate.toISOString() }),
      status: this.status,
      basicSalary: this.basicSalary,
      earnings: this.earnings.map(e => e.toJSON()),
      deductions: this.deductions.map(e => e.toJSON()),
      reimbursements: this.reimbursements.map(e => e.toJSON()),
      totalEarnings: this.totalEarnings,
      totalDeductions: this.totalDeductions,
      totalReimbursements: this.totalReimbursements,
      grossSalary: this.grossSalary,
      netSalary: this.netSalary,
      ctc: this.ctc,
      attendance: this.attendance.toJSON(),
      statutory: this.statutory.toJSON(),
      loansAdvances: this.loansAdvances.map(e => e.toJSON()),
      totalLoanDeduction: this.totalLoanDeduction,
      overtimePay: this.overtimePay,
      bonus: this.bonus,
      incentives: this.incentives,
      arrears: this.arrears,
      lossOfPayDays: this.lossOfPayDays,
      lossOfPayAmount: this.lossOfPayAmount,
      paymentMode: this.paymentMode,
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      ifscCode: this.ifscCode,
      transactionId: this.transactionId,
      chequeNumber: this.chequeNumber,
      submittedBy: this.submittedBy,
      ...(this.submittedAt && { submittedAt: this.submittedAt.toISOString() }),
      approvedBy: this.approvedBy,
      ...(this.approvedAt && { approvedAt: this.approvedAt.toISOString() }),
      rejectedBy: this.rejectedBy,
      ...(this.rejectedAt && { rejectedAt: this.rejectedAt.toISOString() }),
      rejectionReason: this.rejectionReason,
      notes: this.notes,
      internalNotes: this.internalNotes,
      adminRemarks: this.adminRemarks,
      revisionNumber: this.revisionNumber,
      previousRevisionId: this.previousRevisionId,
      isRevision: this.isRevision,
      tags: this.tags,
      payrollGroup: this.payrollGroup,
      metadata: this.metadata,
      ...(this.createdAt && { createdAt: this.createdAt.toISOString() }),
      ...(this.updatedAt && { updatedAt: this.updatedAt.toISOString() }),
      isSelected: this.isSelected,
    };
  }

  get payPeriodDisplay() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (this.payPeriodMonth >= 1 && this.payPeriodMonth <= 12) {
      return `${months[this.payPeriodMonth - 1]} ${this.payPeriodYear}`;
    }
    return `${this.payPeriodMonth}/${this.payPeriodYear}`;
  }

  get payrollCode() {
    return this.metadata.payrollCode?.toString() || '';
  }

  toString() {
    return `Payroll(id: ${this.id}, staffName: ${this.staffName}, period: ${this.payPeriodDisplay}, status: ${this.status}, netSalary: ${this.netSalary})`;
  }
}
