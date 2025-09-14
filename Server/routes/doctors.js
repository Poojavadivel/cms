const express = require('express');
const { User } = require('../Models/models');
const auth = require('../Middleware/Auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  console.log('➡️ Incoming request to GET /doctors');
  console.log('Headers:', req.headers);
  console.log('Query Params:', req.query);
  console.log('User Info:', req.user);

  try {
    console.log('🔍 Fetching doctors from database...');
    const doctors = await User.findAll({
      where: { role: 'doctor' }, // ✅ Ensure only doctors are fetched
      attributes: ['id', 'firstName', 'lastName', 'specialization', 'department', 'role'], // ✅ Include role in response
      order: [['firstName', 'ASC']],
    });

    console.log(`✅ Found ${doctors.length} users`);
    console.log('📦 Raw doctors data:', doctors.map(d => d.toJSON()));

    // ✅ Filter again just in case to exclude any incorrect entries
    const filtered = doctors.filter(d => d.role === 'doctor');
    console.log(`✅ Filtered doctors count: ${filtered.length}`);

    const payload = filtered.map(d => {
      const doc = {
        id: d.id,
        name: `${d.firstName} ${d.lastName}`.trim(),
        firstName: d.firstName,
        lastName: d.lastName,
        specialization: d.specialization || null,
        department: d.department || null,
        role: d.role // ✅ Include role so frontend can map it correctly
      };
      console.log('📦 Doctor:', doc);
      return doc;
    });

    console.log('📤 Sending response with payload');
    return res.json(payload);
  } catch (err) {
    console.error('❌ GET /doctors error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      errorCode: 5006
    });
  }
});

module.exports = router;
