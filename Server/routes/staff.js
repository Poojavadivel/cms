// routes/staff.js
const express = require('express');
const { User } = require('../Models/models'); // use User model
const auth = require('../Middleware/Auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// ------------------------------
// Helper: Admin guard
// ------------------------------
function requireAdmin(req, res) {
  const role = req.user && req.user.role;
  if (!role || (role !== 'admin' && role !== 'superadmin')) {
    res.status(403).json({
      success: false,
      message: 'Forbidden: admin role required',
      errorCode: 1002,
    });
    return false;
  }
  return true;
}

// ------------------------------
// CREATE Staff
// POST /api/staff
// ------------------------------
router.post('/', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const data = req.body;

    if (!data.firstName || !data.email || !data.password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, email, password',
        errorCode: 2006,
      });
    }

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const staffPayload = {
      role: 'staff',
      firstName: data.firstName,
      lastName: data.lastName || '',
      email: data.email.toLowerCase(),
      phone: data.phone || '',
      password: hashedPassword,
      is_active: data.is_active ?? true,
      metadata: {
        designation: data.designation || '',
        department: data.department || '',
        patientFacingId: data.patientFacingId || '',
        avatarUrl: data.avatarUrl || '',
        gender: data.gender || '',
        shift: data.shift || '',
        roles: data.roles || [],
        qualifications: data.qualifications || [],
        experienceYears: data.experienceYears || 0,
        joinedAt: data.joinedAt || Date.now(),
        lastActiveAt: data.lastActiveAt || Date.now(),
        location: data.location || '',
        dob: data.dob || '',
        notes: data.notes || '',
        appointmentsCount: data.appointmentsCount || 0,
        tags: data.tags || [],
      },
    };

    const created = await User.create(staffPayload);
    res.status(201).json({ success: true, staff: created });
  } catch (err) {
    console.error('STAFF CREATE error:', err);
    res.status(500).json({ success: false, message: 'Failed to create staff', errorCode: 5000 });
  }
});

// ------------------------------
// LIST Staff
// GET /api/staff
// ------------------------------
router.get('/', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const department = (req.query.department || '').trim();
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));

    const filter = { role: 'staff' };

    if (department) {
      filter['metadata.department'] = department;
    }

    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { 'metadata.designation': regex },
        { 'metadata.department': regex },
      ];
    }

    const skip = page * limit;
    const [items, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort({ firstName: 1 }).lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, staff: items, total, page, limit });
  } catch (err) {
    console.error('STAFF LIST error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch staff list', errorCode: 5001 });
  }
});

// ------------------------------
// GET Staff by ID
// ------------------------------
router.get('/:id', auth, async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, role: 'staff' }).lean();
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found', errorCode: 2007 });
    }
    res.status(200).json({ success: true, staff });
  } catch (err) {
    console.error('STAFF GET error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch staff', errorCode: 5002 });
  }
});

// ------------------------------
// UPDATE Staff
// ------------------------------
router.put('/:id', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const data = req.body;
    const update = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      is_active: data.is_active,
      metadata: {
        designation: data.designation,
        department: data.department,
        patientFacingId: data.patientFacingId,
        avatarUrl: data.avatarUrl,
        gender: data.gender,
        shift: data.shift,
        roles: data.roles,
        qualifications: data.qualifications,
        experienceYears: data.experienceYears,
        joinedAt: data.joinedAt,
        lastActiveAt: data.lastActiveAt,
        location: data.location,
        dob: data.dob,
        notes: data.notes,
        appointmentsCount: data.appointmentsCount,
        tags: data.tags,
      },
      updatedAt: Date.now(),
    };

    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'staff' },
      update,
      { new: true, runValidators: true }
    );

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found', errorCode: 2007 });
    }

    res.status(200).json({ success: true, staff });
  } catch (err) {
    console.error('STAFF UPDATE error:', err);
    res.status(500).json({ success: false, message: 'Failed to update staff', errorCode: 5003 });
  }
});

// ------------------------------
// PATCH Staff Status
// ------------------------------
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { is_active } = req.body;
    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'staff' },
      { is_active, 'metadata.lastActiveAt': Date.now() },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found', errorCode: 2007 });
    }

    res.status(200).json({ success: true, staff });
  } catch (err) {
    console.error('STAFF STATUS error:', err);
    res.status(500).json({ success: false, message: 'Failed to update staff status', errorCode: 5004 });
  }
});

// ------------------------------
// DELETE Staff
// ------------------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const staff = await User.findOneAndDelete({ _id: req.params.id, role: 'staff' });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found', errorCode: 2007 });
    }

    res.status(200).json({ success: true, deletedId: staff._id });
  } catch (err) {
    console.error('STAFF DELETE error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete staff', errorCode: 5005 });
  }
});

module.exports = router;
