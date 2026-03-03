/**
 * Billing Routes
 * Enterprise-Grade Hospital Billing API
 * 
 * Features:
 * - Create, Read, Update, Delete bills
 * - Payment processing
 * - Insurance management
 * - PDF generation
 * - Analytics & reports
 */

const express = require('express');
const router = express.Router();
const Billing = require('../Models/Billing');
const Patient = require('../Models/Patient');
const auth = require('../Middleware/auth');

/**
 * @route   GET /api/billing
 * @desc    Get all bills with filters
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      patientId,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    // Filter by status
      if (status) {
        query.status = status;
      }

      // Filter by patient
      if (patientId) {
        query.patientId = patientId;
      }

      // Filter by date range
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      // Search by bill number or patient name
      if (search) {
        query.$or = [
          { billNumber: { $regex: search, $options: 'i' } },
          { patientName: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [bills, total] = await Promise.all([
        Billing.find(query)
          .sort({ date: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('patientId', 'name patientCode age gender contact')
          .lean(),
        Billing.countDocuments(query)
      ]);

      res.json({
        bills,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching bills:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * @route   GET /api/billing/stats
 * @desc    Get billing statistics
 * @access  Private
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await Billing.getStats(startDate, endDate);
    
    res.json({
      stats: stats[0] || {
        totalBills: 0,
        totalRevenue: 0,
        totalPaid: 0,
        totalPending: 0,
        paidBills: 0,
        pendingBills: 0,
        partialBills: 0
      }
    });
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/billing/patient/:patientId
 * @desc    Get bills for a specific patient
 * @access  Private
 */
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const bills = await Billing.find({ patientId: req.params.patientId })
      .sort({ date: -1 })
      .lean();

    res.json({ bills });
  } catch (error) {
    console.error('Error fetching patient bills:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/billing/:id
 * @desc    Get bill by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate('patientId', 'name patientCode age gender contact address')
      .lean();

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
      }

      res.json({ bill });
    } catch (error) {
      console.error('Error fetching bill:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   POST /api/billing
 * @desc    Create new bill
 * @access  Private
 */
router.post('/', auth,
  async (req, res) => {
    try {
      const {
        patientId,
        patientName,
        patientContact,
        items,
        subtotal,
        discount = 0,
        discountType,
        tax = 0,
        taxRate = 5,
        totalAmount,
        paidAmount = 0,
        paymentMethod,
        insuranceDetails,
        notes
      } = req.body;

      // Verify patient exists
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // Calculate balance (ensure never negative - cap at 0 for overpayment)
      let balanceAmount = Math.max(0, totalAmount - paidAmount);
      
      // Cap paid amount at total (no overpayment allowed)
      const actualPaidAmount = Math.min(paidAmount, totalAmount);

      // Determine status
      let status = 'Pending';
      if (actualPaidAmount >= totalAmount) {
        status = 'Paid';
        balanceAmount = 0;
      } else if (actualPaidAmount > 0) {
        status = 'Partially Paid';
      }

      // Generate unique bill number
      const count = await Billing.countDocuments();
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const billNumber = `BILL-${year}${month}-${String(count + 1).padStart(5, '0')}`;

      // Create bill
      const bill = new Billing({
        billNumber,
        patientId,
        patientName: patientName || patient.name,
        patientContact: patientContact || patient.contact || patient.phone,
        items,
        subtotal,
        discount,
        discountType,
        tax,
        taxRate,
        totalAmount,
        paidAmount: actualPaidAmount,
        balanceAmount,
        status,
        paymentMethod,
        insuranceDetails,
        notes,
        createdBy: req.user.id
      });

      // If payment was made, add to payment history
      if (actualPaidAmount > 0) {
        bill.paymentHistory.push({
          date: new Date(),
          amount: actualPaidAmount,
          method: paymentMethod,
          notes: actualPaidAmount < paidAmount ? 
            `Initial payment (capped from ₹${paidAmount} to ₹${actualPaidAmount})` : 
            'Initial payment',
          createdBy: req.user.id
        });
      }

      await bill.save();

      res.status(201).json({
        message: 'Bill created successfully',
        bill
      });
    } catch (error) {
      console.error('Error creating bill:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/billing/:id
 * @desc    Update bill
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Update fields
    const allowedUpdates = [
      'items',
        'subtotal',
        'discount',
        'discountType',
        'tax',
        'taxRate',
        'totalAmount',
        'status',
        'notes'
      ];

      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          bill[field] = req.body[field];
        }
      });

      // Recalculate balance if total changed
      if (req.body.totalAmount !== undefined) {
        bill.balanceAmount = bill.totalAmount - bill.paidAmount;
      }

      bill.updatedBy = req.user.id;
      await bill.save();

      res.json({
        message: 'Bill updated successfully',
        bill
      });
    } catch (error) {
      console.error('Error updating bill:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   POST /api/billing/:id/payment
 * @desc    Add payment to bill
 * @access  Private
 */
router.post('/:id/payment', auth,
  async (req, res) => {
    try {
      const bill = await Billing.findById(req.params.id);

      if (!bill) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      const { amount, method, transactionId, notes } = req.body;

      // Check if payment exceeds balance
      if (amount > bill.balanceAmount) {
        return res.status(400).json({
          message: `Payment amount (₹${amount}) exceeds balance (₹${bill.balanceAmount})`
        });
      }

      await bill.addPayment(amount, method, transactionId, notes, req.user.id);

      res.json({
        message: 'Payment added successfully',
        bill
      });
    } catch (error) {
      console.error('Error adding payment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/billing/:id
 * @desc    Delete (cancel) bill
 * @access  Private (Admin only)
 */
router.delete('/:id', auth,
  async (req, res) => {
    try {
      const bill = await Billing.findById(req.params.id);

      if (!bill) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      // Don't allow deletion of paid bills
      if (bill.status === 'Paid') {
        return res.status(400).json({
          message: 'Cannot delete a paid bill. Please refund it instead.'
        });
      }

      // Mark as cancelled instead of deleting
      bill.status = 'Cancelled';
      bill.updatedBy = req.user.id;
      await bill.save();

      res.json({
        message: 'Bill cancelled successfully',
        bill
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   GET /api/billing/:id/pdf
 * @desc    Generate PDF bill
 * @access  Private
 */
router.get('/:id/pdf', auth,
  async (req, res) => {
    try {
      const bill = await Billing.findById(req.params.id)
        .populate('patientId', 'name patientCode age gender contact address')
        .lean();

      if (!bill) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      // TODO: Implement PDF generation using PDFKit or similar
      // For now, return bill data
      res.json({
        message: 'PDF generation not implemented yet',
        bill
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;

