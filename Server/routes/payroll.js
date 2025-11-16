// routes/payroll.js
const express = require('express');
const { Payroll, Staff } = require('../Models');
const auth = require('../Middleware/Auth');
const router = express.Router();

// ------------------------------
// Helper: Admin guard
// ------------------------------
function requireAdmin(req, res) {
  const role = req.user && req.user.role;
  console.log('requireAdmin: checking role for user:', req.user ? { id: req.user._id, role } : 'anonymous');

  if (!role || (role !== 'admin' && role !== 'superadmin')) {
    console.log('requireAdmin: forbidden - role missing or insufficient:', role);
    res.status(403).json({
      success: false,
      message: 'Forbidden: admin role required',
      errorCode: 1002,
    });
    return false;
  }
  console.log('requireAdmin: allowed');
  return true;
}

// ------------------------------
// Helper: Build payload
// ------------------------------
function buildPayrollPayload(body = {}) {
  const payload = {};
  
  // Basic fields
  const basicFields = [
    'staffId', 'staffName', 'staffCode', 'department', 'designation', 'email', 'contact',
    'payPeriodMonth', 'payPeriodYear', 'payPeriodStart', 'payPeriodEnd', 'paymentDate',
    'status', 'basicSalary', 'earnings', 'deductions', 'reimbursements',
    'totalEarnings', 'totalDeductions', 'totalReimbursements', 'grossSalary', 'netSalary', 'ctc',
    'attendance', 'statutory', 'loansAdvances', 'totalLoanDeduction',
    'overtimePay', 'bonus', 'incentives', 'arrears', 'lossOfPayDays', 'lossOfPayAmount',
    'paymentMode', 'bankName', 'accountNumber', 'ifscCode', 'transactionId', 'chequeNumber',
    'submittedBy', 'submittedAt', 'approvedBy', 'approvedAt', 'rejectedBy', 'rejectedAt', 'rejectionReason',
    'notes', 'internalNotes', 'adminRemarks', 'tags', 'payrollGroup', 'attachments', 'metadata'
  ];

  basicFields.forEach(field => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  // Date conversions
  ['payPeriodStart', 'payPeriodEnd', 'paymentDate', 'submittedAt', 'approvedAt', 'rejectedAt'].forEach(field => {
    if (payload[field] && typeof payload[field] === 'string') {
      payload[field] = new Date(payload[field]);
    }
  });

  // Number conversions
  ['payPeriodMonth', 'payPeriodYear', 'basicSalary', 'totalEarnings', 'totalDeductions', 
   'totalReimbursements', 'grossSalary', 'netSalary', 'ctc', 'totalLoanDeduction',
   'overtimePay', 'bonus', 'incentives', 'arrears', 'lossOfPayDays', 'lossOfPayAmount'].forEach(field => {
    if (payload[field] !== undefined) {
      payload[field] = Number(payload[field]) || 0;
    }
  });

  return payload;
}

// ------------------------------
// CREATE Payroll
// ------------------------------
router.post('/', auth, async (req, res) => {
  try {
    console.log('PAYROLL CREATE: by user:', req.user ? (req.user._id ?? req.user.id) : 'unknown');
    if (!requireAdmin(req, res)) return;

    const body = req.body || {};
    console.log('PAYROLL CREATE: raw body:', body);

    // Validate required fields
    if (!body.staffId) {
      return res.status(400).json({ success: false, message: 'Missing required field: staffId', errorCode: 2006 });
    }
    if (!body.payPeriodMonth || !body.payPeriodYear) {
      return res.status(400).json({ success: false, message: 'Missing pay period information', errorCode: 2006 });
    }

    // Check if payroll already exists for this staff and period
    const existing = await Payroll.findOne({
      staffId: body.staffId,
      payPeriodMonth: body.payPeriodMonth,
      payPeriodYear: body.payPeriodYear
    }).lean();

    if (existing && body.allowDuplicate !== true) {
      return res.status(409).json({ 
        success: false, 
        message: 'Payroll already exists for this staff and period',
        errorCode: 2008,
        existingPayroll: existing
      });
    }

    // Fetch staff details if not provided
    let staffData = {};
    if (!body.staffName || !body.staffCode) {
      try {
        const staff = await Staff.findById(body.staffId).lean();
        if (staff) {
          staffData = {
            staffName: staff.name,
            staffCode: staff.metadata?.staffCode || staff.patientFacingId || '',
            department: staff.department || '',
            designation: staff.designation || '',
            email: staff.email || '',
            contact: staff.contact || ''
          };
        }
      } catch (err) {
        console.log('Could not fetch staff details:', err.message);
      }
    }

    // Generate payroll code
    const payrollCode = await Payroll.generatePayrollCode(body.payPeriodYear, body.payPeriodMonth);
    console.log('PAYROLL CREATE: generated payrollCode =', payrollCode);

    // Calculate pay period dates if not provided
    if (!body.payPeriodStart || !body.payPeriodEnd) {
      const year = body.payPeriodYear;
      const month = body.payPeriodMonth - 1; // JS months are 0-indexed
      body.payPeriodStart = new Date(year, month, 1);
      body.payPeriodEnd = new Date(year, month + 1, 0); // Last day of month
    }

    const payload = buildPayrollPayload(Object.assign({}, staffData, body));
    payload.metadata = payload.metadata || {};
    payload.metadata.payrollCode = payrollCode;

    // Calculate statutory if not provided
    if (!payload.statutory || Object.keys(payload.statutory).length === 0) {
      const statutoryCalc = Payroll.calculateStatutory(
        payload.basicSalary || 0,
        payload.grossSalary || payload.basicSalary || 0,
        {
          pfApplicable: body.pfApplicable !== false,
          esiApplicable: body.esiApplicable === true,
          ptApplicable: body.ptApplicable !== false
        }
      );
      payload.statutory = Object.assign({}, payload.statutory || {}, statutoryCalc);
    }

    // Add creation history
    const userId = req.user._id || req.user.id || 'system';
    payload.historyLog = [{
      action: 'created',
      performedBy: userId,
      performedAt: new Date(),
      remarks: 'Payroll record created'
    }];

    const created = await Payroll.create(payload);
    
    // Calculate net salary
    created.calculateNetSalary();
    await created.save();

    console.log('PAYROLL CREATE: created payroll id:', created._id);

    return res.status(201).json({ success: true, payroll: created });
  } catch (err) {
    console.error('PAYROLL CREATE error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create payroll', errorCode: 5000, error: err.message });
  }
});

// ------------------------------
// LIST Payroll (with filters)
// ------------------------------
router.get('/', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const department = (req.query.department || '').trim();
    const status = (req.query.status || '').trim();
    const month = req.query.month ? parseInt(req.query.month, 10) : null;
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const staffId = (req.query.staffId || '').trim();
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));

    const filter = {};

    if (department) filter.department = department;
    if (status) filter.status = status;
    if (month) filter.payPeriodMonth = month;
    if (year) filter.payPeriodYear = year;
    if (staffId) filter.staffId = staffId;

    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { staffName: regex },
        { staffCode: regex },
        { department: regex },
        { designation: regex },
        { 'metadata.payrollCode': regex }
      ];
    }

    const skip = page * limit;

    const [items, total] = await Promise.all([
      Payroll.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ payPeriodYear: -1, payPeriodMonth: -1, createdAt: -1 })
        .lean(),
      Payroll.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, payroll: items, total, page, limit });
  } catch (err) {
    console.error('PAYROLL LIST error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payroll list', errorCode: 5001 });
  }
});

// ------------------------------
// GET Payroll by ID
// ------------------------------
router.get('/:id', auth, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).lean();
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found', errorCode: 2007 });
    return res.status(200).json({ success: true, payroll });
  } catch (err) {
    console.error('PAYROLL GET error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payroll', errorCode: 5002 });
  }
});

// ------------------------------
// UPDATE Payroll
// ------------------------------
router.put('/:id', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    
    const body = req.body || {};
    const updatePayload = buildPayrollPayload(body);
    
    const existing = await Payroll.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Payroll not found', errorCode: 2007 });

    // Add update history
    const userId = req.user._id || req.user.id || 'system';
    existing.addHistory('updated', userId, updatePayload, body.updateReason || 'Payroll updated');

    // Update fields
    Object.keys(updatePayload).forEach(key => {
      existing[key] = updatePayload[key];
    });

    existing.updatedAt = Date.now();

    // Recalculate if salary components changed
    existing.calculateNetSalary();
    
    await existing.save();

    return res.status(200).json({ success: true, payroll: existing });
  } catch (err) {
    console.error('PAYROLL UPDATE error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update payroll', errorCode: 5003 });
  }
});

// ------------------------------
// APPROVE Payroll
// ------------------------------
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found', errorCode: 2007 });

    if (payroll.status === 'approved' || payroll.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Payroll already approved or paid', errorCode: 2009 });
    }

    const userId = req.user._id || req.user.id || 'system';
    payroll.status = 'approved';
    payroll.approvedBy = userId;
    payroll.approvedAt = new Date();
    payroll.addHistory('approved', userId, {}, req.body.approvalRemarks || 'Payroll approved');

    await payroll.save();

    return res.status(200).json({ success: true, payroll });
  } catch (err) {
    console.error('PAYROLL APPROVE error:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve payroll', errorCode: 5004 });
  }
});

// ------------------------------
// REJECT Payroll
// ------------------------------
router.patch('/:id/reject', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found', errorCode: 2007 });

    const userId = req.user._id || req.user.id || 'system';
    payroll.status = 'rejected';
    payroll.rejectedBy = userId;
    payroll.rejectedAt = new Date();
    payroll.rejectionReason = req.body.reason || 'Not specified';
    payroll.addHistory('rejected', userId, {}, payroll.rejectionReason);

    await payroll.save();

    return res.status(200).json({ success: true, payroll });
  } catch (err) {
    console.error('PAYROLL REJECT error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject payroll', errorCode: 5004 });
  }
});

// ------------------------------
// PROCESS Payment
// ------------------------------
router.patch('/:id/process-payment', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found', errorCode: 2007 });

    if (payroll.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Payroll must be approved before processing payment', errorCode: 2010 });
    }

    const userId = req.user._id || req.user.id || 'system';
    payroll.status = 'processed';
    payroll.paymentDate = new Date();
    
    if (req.body.transactionId) payroll.transactionId = req.body.transactionId;
    if (req.body.chequeNumber) payroll.chequeNumber = req.body.chequeNumber;
    if (req.body.paymentMode) payroll.paymentMode = req.body.paymentMode;

    payroll.addHistory('payment_processed', userId, req.body, 'Payment processed');

    await payroll.save();

    return res.status(200).json({ success: true, payroll });
  } catch (err) {
    console.error('PAYROLL PROCESS PAYMENT error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process payment', errorCode: 5004 });
  }
});

// ------------------------------
// MARK as PAID
// ------------------------------
router.patch('/:id/mark-paid', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found', errorCode: 2007 });

    const userId = req.user._id || req.user.id || 'system';
    payroll.status = 'paid';
    
    if (!payroll.paymentDate) {
      payroll.paymentDate = new Date();
    }

    payroll.addHistory('marked_paid', userId, {}, req.body.remarks || 'Marked as paid');

    await payroll.save();

    return res.status(200).json({ success: true, payroll });
  } catch (err) {
    console.error('PAYROLL MARK PAID error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark as paid', errorCode: 5004 });
  }
});

// ------------------------------
// CALCULATE Net Salary (recalculate)
// ------------------------------
router.post('/:id/calculate', auth, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found', errorCode: 2007 });

    payroll.calculateNetSalary();
    await payroll.save();

    return res.status(200).json({ 
      success: true, 
      payroll,
      calculations: {
        totalEarnings: payroll.totalEarnings,
        totalDeductions: payroll.totalDeductions,
        grossSalary: payroll.grossSalary,
        netSalary: payroll.netSalary
      }
    });
  } catch (err) {
    console.error('PAYROLL CALCULATE error:', err);
    return res.status(500).json({ success: false, message: 'Failed to calculate salary', errorCode: 5004 });
  }
});

// ------------------------------
// BULK CREATE Payroll for all staff
// ------------------------------
router.post('/bulk/generate', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { month, year, department, staffIds } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required', errorCode: 2006 });
    }

    // Build filter for staff
    const staffFilter = {};
    if (department) staffFilter.department = department;
    if (staffIds && Array.isArray(staffIds) && staffIds.length > 0) {
      staffFilter._id = { $in: staffIds };
    }

    const staffList = await Staff.find(staffFilter).lean();
    
    if (staffList.length === 0) {
      return res.status(404).json({ success: false, message: 'No staff found', errorCode: 2007 });
    }

    const userId = req.user._id || req.user.id || 'system';
    const created = [];
    const errors = [];

    for (const staff of staffList) {
      try {
        // Check if payroll already exists
        const existing = await Payroll.findOne({
          staffId: staff._id,
          payPeriodMonth: month,
          payPeriodYear: year
        }).lean();

        if (existing) {
          errors.push({ staffId: staff._id, staffName: staff.name, error: 'Payroll already exists' });
          continue;
        }

        // Get basic salary from staff metadata or default
        const basicSalary = staff.metadata?.basicSalary || staff.metadata?.salary || 0;

        if (basicSalary === 0) {
          errors.push({ staffId: staff._id, staffName: staff.name, error: 'No basic salary defined' });
          continue;
        }

        const payrollCode = await Payroll.generatePayrollCode(year, month);

        // Calculate period dates
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0);

        const payrollData = {
          staffId: staff._id,
          staffName: staff.name,
          staffCode: staff.metadata?.staffCode || staff.patientFacingId || '',
          department: staff.department || '',
          designation: staff.designation || '',
          email: staff.email || '',
          contact: staff.contact || '',
          payPeriodMonth: month,
          payPeriodYear: year,
          payPeriodStart: periodStart,
          payPeriodEnd: periodEnd,
          basicSalary: basicSalary,
          status: 'draft',
          metadata: { payrollCode },
          historyLog: [{
            action: 'bulk_created',
            performedBy: userId,
            performedAt: new Date(),
            remarks: 'Bulk payroll generation'
          }]
        };

        // Calculate statutory
        const statutory = Payroll.calculateStatutory(basicSalary, basicSalary);
        payrollData.statutory = statutory;

        const payroll = await Payroll.create(payrollData);
        payroll.calculateNetSalary();
        await payroll.save();

        created.push(payroll);
      } catch (err) {
        errors.push({ staffId: staff._id, staffName: staff.name, error: err.message });
      }
    }

    return res.status(200).json({ 
      success: true, 
      created: created.length,
      errors: errors.length,
      payrolls: created,
      errorDetails: errors
    });
  } catch (err) {
    console.error('PAYROLL BULK CREATE error:', err);
    return res.status(500).json({ success: false, message: 'Failed to bulk create payroll', errorCode: 5000 });
  }
});

// ------------------------------
// GET Summary/Statistics
// ------------------------------
router.get('/summary/stats', auth, async (req, res) => {
  try {
    const month = req.query.month ? parseInt(req.query.month, 10) : null;
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const department = (req.query.department || '').trim();

    const filter = {};
    if (month) filter.payPeriodMonth = month;
    if (year) filter.payPeriodYear = year;
    if (department) filter.department = department;

    const stats = await Payroll.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalGross: { $sum: '$grossSalary' },
          totalNet: { $sum: '$netSalary' },
          totalDeductions: { $sum: '$totalDeductions' }
        }
      }
    ]);

    const summary = {
      total: 0,
      draft: 0,
      pending: 0,
      approved: 0,
      processed: 0,
      paid: 0,
      rejected: 0,
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalDeductions: 0
    };

    stats.forEach(stat => {
      summary.total += stat.count;
      summary[stat._id] = stat.count;
      summary.totalGrossSalary += stat.totalGross || 0;
      summary.totalNetSalary += stat.totalNet || 0;
      summary.totalDeductions += stat.totalDeductions || 0;
    });

    return res.status(200).json({ success: true, summary, stats });
  } catch (err) {
    console.error('PAYROLL SUMMARY error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch summary', errorCode: 5001 });
  }
});

// ------------------------------
// DELETE Payroll
// ------------------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found', errorCode: 2007 });

    // Prevent deletion of paid payroll
    if (payroll.status === 'paid' || payroll.status === 'processed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete processed or paid payroll', 
        errorCode: 2011 
      });
    }

    await Payroll.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({ success: true, deletedId: req.params.id });
  } catch (err) {
    console.error('PAYROLL DELETE error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete payroll', errorCode: 5005 });
  }
});

module.exports = router;
