// routes/staff.js
const express = require('express');
const { Staff } = require('../Models/models'); // use combined models export
const auth = require('../Middleware/Auth'); // verifies JWT and sets req.user
const router = express.Router();

/*
  Staff routes
  Base: /api/staff
  Endpoints:
    POST   /        -> create staff (admin)
    GET    /        -> list staff (supports q, department, page, limit)
    GET    /:id     -> get staff by id
    PUT    /:id     -> full update (admin)
    PATCH  /:id/status -> update status (admin)
    DELETE /:id     -> delete staff (admin)
*/

// --- optional role guard helper (adjust roles to your system) ---
function requireAdmin(req, res) {
  // If your req.user has `role` as enum/string, adjust accordingly.
  // Comment out this block if you don't want role-restricted endpoints.
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

// ===============================
// CREATE Staff
// POST /api/staff
// ===============================
router.post('/', auth, async (req, res) => {
  console.log('📩 [STAFF CREATE] Incoming request to /api/staff');

  try {
    // optional role guard - uncomment the next two lines to enforce admin-only creation
    if (!requireAdmin(req, res)) return;

    const data = req.body;
    console.log('📦 [STAFF CREATE] Payload:', JSON.stringify(data, null, 2));

    // Basic validation
    if (!data.name || !data.designation || !data.department) {
      console.warn('⚠️ [STAFF CREATE] Missing required fields', {
        name: !!data.name,
        designation: !!data.designation,
        department: !!data.department,
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, designation, department',
        errorCode: 2006,
      });
    }

    const staffPayload = {
      name: data.name,
      designation: data.designation,
      department: data.department,
      patientFacingId: data.patientFacingId || data.code || '',
      contact: data.contact || data.phone || '',
      email: data.email || '',
      avatarUrl: data.avatarUrl || data.photo || '',
      gender: data.gender || '',
      status: data.status || 'Off Duty',
      shift: data.shift || '',
      roles: data.roles || [],
      qualifications: data.qualifications || [],
      experienceYears: data.experienceYears || 0,
      joinedAt: data.joinedAt || Date.now(),
      lastActiveAt: data.lastActiveAt || Date.now(),
      location: data.location || '',
      dob: data.dob || '',
      notes: data.notes || {},
      appointmentsCount: data.appointmentsCount || 0,
      tags: data.tags || [],
    };

    const created = await Staff.create(staffPayload);
    console.log('✅ [STAFF CREATE] created id:', created._id);

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      staff: created,
    });
  } catch (err) {
    console.error('💥 [STAFF CREATE] Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff',
      errorCode: 5000,
    });
  }
});

// ===============================
// GET All Staff (with search & pagination)
// GET /api/staff
// ===============================
router.get('/', auth, async (req, res) => {
  try {
    console.log('📥 [STAFF LIST] Query:', req.query);

    // Common query params
    const q = (req.query.q || '').toString().trim();
    const department = (req.query.department || '').toString().trim();
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));

    // Build filter
    const filter = {};
    if (department && department.toLowerCase() !== 'all') filter.department = department;

    if (q) {
      // search by name, id, designation, contact, email
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: regex },
        { patientFacingId: regex },
        { designation: regex },
        { contact: regex },
        { email: regex },
      ];
    }

    const skip = page * limit;

    const [items, total] = await Promise.all([
      Staff.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
      Staff.countDocuments(filter),
    ]);

    console.log(`📊 [STAFF LIST] returning ${items.length} / total ${total}`);
    res.status(200).json({
      success: true,
      staff: items,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error('❌ [STAFF LIST] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff list',
      errorCode: 5001,
    });
  }
});

// ===============================
// GET Staff by ID
// GET /api/staff/:id
// ===============================
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('🔎 [STAFF GET] id:', req.params.id);
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      console.warn('⚠️ [STAFF GET] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
        errorCode: 2007,
      });
    }

    res.status(200).json({ success: true, staff });
  } catch (err) {
    console.error('❌ [STAFF GET] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      errorCode: 5002,
    });
  }
});

// ===============================
// UPDATE Staff (full)
// PUT /api/staff/:id
// ===============================
router.put('/:id', auth, async (req, res) => {
  try {
    // optional admin guard
    if (!requireAdmin(req, res)) return;

    console.log('✏️ [STAFF UPDATE] id:', req.params.id, 'payload:', JSON.stringify(req.body, null, 2));
    const data = req.body;

    const update = {
      name: data.name,
      designation: data.designation,
      department: data.department,
      patientFacingId: data.patientFacingId || data.code,
      contact: data.contact || data.phone,
      email: data.email,
      avatarUrl: data.avatarUrl || data.photo,
      gender: data.gender,
      status: data.status,
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
      updatedAt: Date.now(),
    };

    const staff = await Staff.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });

    if (!staff) {
      console.warn('⚠️ [STAFF UPDATE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
        errorCode: 2007,
      });
    }

    console.log('✅ [STAFF UPDATE] updated:', staff._id);
    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      staff,
    });
  } catch (err) {
    console.error('❌ [STAFF UPDATE] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff',
      errorCode: 5003,
    });
  }
});

// ===============================
// PATCH status
// PATCH /api/staff/:id/status
// ===============================
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { status } = req.body;
    console.log(`✏️ [STAFF STATUS] ${req.params.id} -> ${status}`);

    if (!status) {
      console.warn('⚠️ [STAFF STATUS] Missing status');
      return res.status(400).json({
        success: false,
        message: 'Status is required',
        errorCode: 2008,
      });
    }

    const staff = await Staff.findByIdAndUpdate(req.params.id, { status, lastActiveAt: Date.now() }, { new: true });

    if (!staff) {
      console.warn('⚠️ [STAFF STATUS] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
        errorCode: 2007,
      });
    }

    console.log('✅ [STAFF STATUS] updated:', staff._id, staff.status);
    res.status(200).json({
      success: true,
      message: 'Staff status updated',
      staff,
    });
  } catch (err) {
    console.error('❌ [STAFF STATUS] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff status',
      errorCode: 5004,
    });
  }
});

// ===============================
// DELETE Staff
// DELETE /api/staff/:id
// ===============================
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    console.log('🗑️ [STAFF DELETE] id:', req.params.id);
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      console.warn('⚠️ [STAFF DELETE] Not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
        errorCode: 2007,
      });
    }

    console.log('✅ [STAFF DELETE] deleted:', staff._id);
    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully',
      deletedId: staff._id,
    });
  } catch (err) {
    console.error('❌ [STAFF DELETE] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff',
      errorCode: 5005,
    });
  }
});

module.exports = router;
