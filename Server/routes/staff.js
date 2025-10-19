// routes/staff.js
const express = require('express');
const { Staff } = require('../Models'); // Staff model (separate collection)
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
// Build payload and push extra fields to metadata
// ------------------------------
function buildStaffPayload(body = {}) {
  const allowed = new Set([
    'name', 'designation', 'department', 'patientFacingId', 'contact', 'email',
    'avatarUrl', 'gender', 'status', 'shift', 'roles', 'qualifications',
    'experienceYears', 'joinedAt', 'lastActiveAt', 'location', 'dob',
    'notes', 'appointmentsCount', 'tags'
  ]);

  const payload = {};
  const metadata = {};

  Object.keys(body || {}).forEach(k => {
    if (allowed.has(k)) {
      payload[k] = body[k];
    } else {
      metadata[k] = body[k]; // anything else goes in metadata
    }
  });

  if (payload.roles && !Array.isArray(payload.roles)) {
    payload.roles = ('' + payload.roles).split(',').map(s => s.trim());
  }
  if (payload.qualifications && !Array.isArray(payload.qualifications)) {
    payload.qualifications = ('' + payload.qualifications).split(',').map(s => s.trim());
  }
  if (payload.tags && !Array.isArray(payload.tags)) {
    payload.tags = ('' + payload.tags).split(',').map(s => s.trim());
  }

  if (payload.joinedAt && typeof payload.joinedAt === 'string') payload.joinedAt = new Date(payload.joinedAt);
  if (payload.lastActiveAt && typeof payload.lastActiveAt === 'string') payload.lastActiveAt = new Date(payload.lastActiveAt);
  if (payload.dob && typeof payload.dob === 'string') payload.dob = new Date(payload.dob);
  if (payload.experienceYears) payload.experienceYears = Number(payload.experienceYears) || 0;
  if (payload.appointmentsCount) payload.appointmentsCount = Number(payload.appointmentsCount) || 0;

  if (body.metadata && typeof body.metadata === 'object') {
    Object.assign(metadata, body.metadata);
  }

  const finalPayload = Object.assign({}, payload, { metadata });
  return finalPayload;
}

// ------------------------------
// Generate next staff code (STF-###)
// ------------------------------
async function generateStaffCode() {
  const lastStaff = await Staff.findOne({ 'metadata.staffCode': { $exists: true } })
    .sort({ 'metadata.staffCode': -1 })
    .lean();

  let nextNumber = 1;
  if (lastStaff && lastStaff.metadata && lastStaff.metadata.staffCode) {
    const match = lastStaff.metadata.staffCode.match(/STF-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }
  return `STF-${String(nextNumber).padStart(3, '0')}`;
}

// ------------------------------
// CREATE Staff
// ------------------------------
router.post('/', auth, async (req, res) => {
  try {
    console.log('STAFF CREATE: by user:', req.user ? (req.user._id ?? req.user.id) : 'unknown');
    if (!requireAdmin(req, res)) return;

    const body = req.body || {};
    console.log('STAFF CREATE: raw body:', body);

    if (!body.name) {
      return res.status(400).json({ success: false, message: 'Missing required field: name', errorCode: 2006 });
    }

    // Generate staff code
    const staffCode = await generateStaffCode();
    console.log('STAFF CREATE: generated staffCode =', staffCode);

    const payload = buildStaffPayload(body);
    payload.metadata = payload.metadata || {};
    payload.metadata.staffCode = staffCode;

    const created = await Staff.create(payload);
    console.log('STAFF CREATE: created staff id:', created._id);

    return res.status(201).json({ success: true, staff: created });
  } catch (err) {
    console.error('STAFF CREATE error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create staff', errorCode: 5000 });
  }
});

// ------------------------------
// LIST Staff
// ------------------------------
router.get('/', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const department = (req.query.department || '').trim();
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));

    const filter = {};

    if (department) {
      filter.$or = [{ department }, { 'metadata.department': department }];
    }

    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = (filter.$or || []).concat([
        { name: regex },
        { designation: regex },
        { department: regex },
        { contact: regex },
        { email: regex },
        { 'metadata.staffCode': regex },
      ]);
    }

    const skip = page * limit;

    const [items, total] = await Promise.all([
      Staff.find(filter).skip(skip).limit(limit).sort({ name: 1 }).lean(),
      Staff.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, staff: items, total, page, limit });
  } catch (err) {
    console.error('STAFF LIST error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch staff list', errorCode: 5001 });
  }
});

// ------------------------------
// GET Staff by ID
// ------------------------------
router.get('/:id', auth, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).lean();
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found', errorCode: 2007 });
    return res.status(200).json({ success: true, staff });
  } catch (err) {
    console.error('STAFF GET error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch staff', errorCode: 5002 });
  }
});

// ------------------------------
// UPDATE Staff
// ------------------------------
router.put('/:id', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const body = req.body || {};
    const updatePayload = buildStaffPayload(body);
    if (updatePayload.metadata && Object.keys(updatePayload.metadata).length === 0) {
      delete updatePayload.metadata;
    }
    updatePayload.updatedAt = Date.now();

    const updated = await Staff.findByIdAndUpdate(req.params.id, updatePayload, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'Staff not found', errorCode: 2007 });

    return res.status(200).json({ success: true, staff: updated });
  } catch (err) {
    console.error('STAFF UPDATE error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update staff', errorCode: 5003 });
  }
});

// ------------------------------
// PATCH Staff Status
// ------------------------------
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { is_active, status } = req.body;
    const update = {};
    if (typeof is_active !== 'undefined') update.is_active = !!is_active;
    if (typeof status !== 'undefined') update.status = status;
    if (req.body.lastActiveAt) update.lastActiveAt = new Date(req.body.lastActiveAt);

    const staff = await Staff.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found', errorCode: 2007 });

    return res.status(200).json({ success: true, staff });
  } catch (err) {
    console.error('STAFF STATUS error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update staff status', errorCode: 5004 });
  }
});

// ------------------------------
// DELETE Staff
// ------------------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const removed = await Staff.findByIdAndDelete(req.params.id).lean();
    if (!removed) return res.status(404).json({ success: false, message: 'Staff not found', errorCode: 2007 });
    return res.status(200).json({ success: true, deletedId: removed._id });
  } catch (err) {
    console.error('STAFF DELETE error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete staff', errorCode: 5005 });
  }
});

module.exports = router;
