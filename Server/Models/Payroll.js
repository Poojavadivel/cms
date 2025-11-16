// Server/Models/Payroll.js
// Enterprise-grade Payroll model with comprehensive salary calculation

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

// ==================== Salary Component Sub-Schema ====================
const SalaryComponentSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['earning', 'deduction', 'reimbursement'], required: true },
  amount: { type: Number, default: 0 },
  isPercentage: { type: Boolean, default: false },
  percentageOf: { type: String, default: 'basic' }, // 'basic', 'gross', 'ctc'
  isTaxable: { type: Boolean, default: true },
  isStatutory: { type: Boolean, default: false }, // PF, ESI, PT etc
  calculationFormula: { type: String, default: '' }, // optional formula
  description: { type: String, default: '' }
}, { _id: false });

// ==================== Attendance Summary Sub-Schema ====================
const AttendanceSummarySchema = new Schema({
  totalDays: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  halfDays: { type: Number, default: 0 },
  lateDays: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  leaves: {
    casual: { type: Number, default: 0 },
    sick: { type: Number, default: 0 },
    earned: { type: Number, default: 0 },
    unpaid: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  holidays: { type: Number, default: 0 },
  weekends: { type: Number, default: 0 }
}, { _id: false });

// ==================== Statutory Compliance Sub-Schema ====================
const StatutoryComplianceSchema = new Schema({
  pfNumber: { type: String, default: '' },
  esiNumber: { type: String, default: '' },
  uanNumber: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  aadharNumber: { type: String, default: '' },
  pfApplicable: { type: Boolean, default: true },
  esiApplicable: { type: Boolean, default: false },
  ptApplicable: { type: Boolean, default: true },
  employeePF: { type: Number, default: 0 },
  employerPF: { type: Number, default: 0 },
  employeeESI: { type: Number, default: 0 },
  employerESI: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  tdsDeducted: { type: Number, default: 0 }
}, { _id: false });

// ==================== Loan/Advance Sub-Schema ====================
const LoanAdvanceSchema = new Schema({
  type: { type: String, enum: ['loan', 'advance', 'recovery'], default: 'advance' },
  amount: { type: Number, default: 0 },
  installmentAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now }
}, { _id: false });

// ==================== Main Payroll Schema ====================
const PayrollSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },

  // Staff Reference
  staffId: { type: String, required: true, index: true, ref: 'Staff' },
  staffName: { type: String, required: true, index: true },
  staffCode: { type: String, default: '', index: true },
  department: { type: String, default: '', index: true },
  designation: { type: String, default: '' },
  email: { type: String, default: '' },
  contact: { type: String, default: '' },

  // Pay Period
  payPeriodMonth: { type: Number, required: true, min: 1, max: 12, index: true },
  payPeriodYear: { type: Number, required: true, min: 2000, max: 2100, index: true },
  payPeriodStart: { type: Date, required: true },
  payPeriodEnd: { type: Date, required: true },
  paymentDate: { type: Date, default: null },
  
  // Status
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'approved', 'processed', 'paid', 'rejected', 'on_hold'], 
    default: 'draft',
    index: true 
  },

  // Salary Structure
  basicSalary: { type: Number, default: 0, required: true },
  earnings: [SalaryComponentSchema],
  deductions: [SalaryComponentSchema],
  reimbursements: [SalaryComponentSchema],

  // Calculated Amounts
  totalEarnings: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  totalReimbursements: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  ctc: { type: Number, default: 0 }, // Cost to Company (annual)
  
  // Attendance
  attendance: { type: AttendanceSummarySchema, default: () => ({}) },

  // Statutory
  statutory: { type: StatutoryComplianceSchema, default: () => ({}) },

  // Loans & Advances
  loansAdvances: [LoanAdvanceSchema],
  totalLoanDeduction: { type: Number, default: 0 },

  // Additional Fields
  overtimePay: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  incentives: { type: Number, default: 0 },
  arrears: { type: Number, default: 0 },
  lossOfPayDays: { type: Number, default: 0 },
  lossOfPayAmount: { type: Number, default: 0 },

  // Payment Details
  paymentMode: { type: String, enum: ['bank_transfer', 'cash', 'cheque', 'online'], default: 'bank_transfer' },
  bankName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  transactionId: { type: String, default: '' },
  chequeNumber: { type: String, default: '' },

  // Approval Workflow
  submittedBy: { type: String, default: '' },
  submittedAt: { type: Date, default: null },
  approvedBy: { type: String, default: '' },
  approvedAt: { type: Date, default: null },
  rejectedBy: { type: String, default: '' },
  rejectedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' },

  // Notes & Remarks
  notes: { type: String, default: '' },
  internalNotes: { type: String, default: '' },
  adminRemarks: { type: String, default: '' },

  // Audit Trail
  revisionNumber: { type: Number, default: 1 },
  previousRevisionId: { type: String, default: '' },
  isRevision: { type: Boolean, default: false },
  
  // Tags & Categories
  tags: [{ type: String }],
  payrollGroup: { type: String, default: 'regular' }, // regular, contract, temporary, consultant

  // Documents
  attachments: [{
    fileName: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Additional Metadata
  metadata: { type: Schema.Types.Mixed, default: {} },

  // History tracking
  historyLog: [{
    action: { type: String },
    performedBy: { type: String },
    performedAt: { type: Date, default: Date.now },
    changes: { type: Schema.Types.Mixed },
    remarks: { type: String }
  }]

}, Object.assign({}, commonOptions, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}));

// ==================== Indexes ====================
PayrollSchema.index({ staffId: 1, payPeriodYear: -1, payPeriodMonth: -1 });
PayrollSchema.index({ payPeriodYear: -1, payPeriodMonth: -1, status: 1 });
PayrollSchema.index({ status: 1, paymentDate: -1 });
PayrollSchema.index({ department: 1, payPeriodYear: -1, payPeriodMonth: -1 });
PayrollSchema.index({ staffCode: 1 });
PayrollSchema.index({ 'metadata.payrollCode': 1 });

// ==================== Virtual Fields ====================
PayrollSchema.virtual('payPeriodDisplay').get(function() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[this.payPeriodMonth - 1]} ${this.payPeriodYear}`;
});

// ==================== Instance Methods ====================

// Calculate total earnings
PayrollSchema.methods.calculateTotalEarnings = function() {
  let total = this.basicSalary;
  this.earnings.forEach(earning => {
    if (earning.isPercentage) {
      const base = earning.percentageOf === 'basic' ? this.basicSalary : 
                   earning.percentageOf === 'gross' ? this.grossSalary : this.ctc;
      total += (base * earning.amount) / 100;
    } else {
      total += earning.amount;
    }
  });
  total += this.overtimePay + this.bonus + this.incentives + this.arrears;
  return total;
};

// Calculate total deductions
PayrollSchema.methods.calculateTotalDeductions = function() {
  let total = 0;
  this.deductions.forEach(deduction => {
    if (deduction.isPercentage) {
      const base = deduction.percentageOf === 'basic' ? this.basicSalary : 
                   deduction.percentageOf === 'gross' ? this.grossSalary : this.ctc;
      total += (base * deduction.amount) / 100;
    } else {
      total += deduction.amount;
    }
  });
  total += this.statutory.employeePF + this.statutory.employeeESI + 
           this.statutory.professionalTax + this.statutory.tdsDeducted + 
           this.totalLoanDeduction + this.lossOfPayAmount;
  return total;
};

// Calculate net salary
PayrollSchema.methods.calculateNetSalary = function() {
  this.totalEarnings = this.calculateTotalEarnings();
  this.grossSalary = this.totalEarnings;
  this.totalDeductions = this.calculateTotalDeductions();
  this.netSalary = this.grossSalary - this.totalDeductions + this.totalReimbursements;
  return this.netSalary;
};

// Add history entry
PayrollSchema.methods.addHistory = function(action, performedBy, changes = {}, remarks = '') {
  this.historyLog.push({
    action,
    performedBy,
    performedAt: new Date(),
    changes,
    remarks
  });
};

// ==================== Static Methods ====================

// Generate unique payroll code
PayrollSchema.statics.generatePayrollCode = async function(year, month) {
  const prefix = `PAY${year}${String(month).padStart(2, '0')}`;
  const lastPayroll = await this.findOne({ 
    'metadata.payrollCode': new RegExp(`^${prefix}`) 
  }).sort({ 'metadata.payrollCode': -1 }).lean();

  let nextNumber = 1;
  if (lastPayroll && lastPayroll.metadata && lastPayroll.metadata.payrollCode) {
    const match = lastPayroll.metadata.payrollCode.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }
  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
};

// Calculate statutory deductions (PF, ESI, PT)
PayrollSchema.statics.calculateStatutory = function(basicSalary, grossSalary, options = {}) {
  const statutory = {};
  
  // PF Calculation (12% employee + 12% employer on basic, max 15000)
  if (options.pfApplicable !== false) {
    const pfBase = Math.min(basicSalary, 15000);
    statutory.employeePF = Math.round((pfBase * 12) / 100);
    statutory.employerPF = Math.round((pfBase * 12) / 100);
  }
  
  // ESI Calculation (0.75% employee + 3.25% employer on gross, if gross < 21000)
  if (options.esiApplicable && grossSalary < 21000) {
    statutory.employeeESI = Math.round((grossSalary * 0.75) / 100);
    statutory.employerESI = Math.round((grossSalary * 3.25) / 100);
  }
  
  // Professional Tax (varies by state, default Karnataka slab)
  if (options.ptApplicable !== false) {
    if (grossSalary <= 15000) {
      statutory.professionalTax = 200;
    } else if (grossSalary <= 20000) {
      statutory.professionalTax = 300;
    } else {
      statutory.professionalTax = 200; // Karnataka max PT
    }
  }
  
  return statutory;
};

// ==================== Pre-save Middleware ====================
PayrollSchema.pre('save', function(next) {
  // Auto-calculate net salary before saving
  if (this.isModified('basicSalary') || this.isModified('earnings') || 
      this.isModified('deductions') || this.isModified('statutory')) {
    this.calculateNetSalary();
  }
  
  // Set gross salary
  if (!this.grossSalary) {
    this.grossSalary = this.totalEarnings;
  }
  
  next();
});

module.exports = mongoose.model('Payroll', PayrollSchema);
