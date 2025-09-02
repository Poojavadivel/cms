const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../Models/models'); // ✅ destructure to get Sequelize User
const auth = require('../Middleware/Auth');   // Token verification middleware

const router = express.Router();

// --- POST /api/auth/login ---
// Handles the login process for both Admins and Doctors.
router.post('/login', async (req, res) => {
  console.log('--- LOGIN REQUEST INITIATED ---');
  console.log(`[${new Date().toISOString()}] /api/auth/login route hit.`);

  try {
    const { email, password } = req.body;
    console.log(`Attempting login for email: ${email}`);

    // 1. Validate input
    if (!email || !password) {
      console.log('❌ Validation Failed: Missing email or password.');
      return res.status(400).json({ message: 'Please enter all fields', errorCode: 1000 });
    }
    console.log('✅ Input validation passed.');

    // 2. Find the user in the database
    console.log('Querying database for user...');
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`❌ User Not Found: No user with email ${email}.`);
      return res.status(400).json({ message: 'Invalid credentials', errorCode: 1002 });
    }
    console.log(`✅ User Found: ${user.id} (${user.role})`);

    // 3. Compare passwords
    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password Mismatch.');
      return res.status(400).json({ message: 'Invalid credentials', errorCode: 1003 });
    }
    console.log('✅ Password matched.');

    // 4. Generate JWT (contains both id + role)
    console.log('Generating JWT...');
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    console.log('✅ JWT generated successfully.');

    // 5. Send successful response
    console.log('Sending successful login response to client.');
    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
    console.log('--- LOGIN REQUEST COMPLETED ---');
  } catch (error) {
    console.error('💥 FATAL LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server error', errorCode: 5000 });
  }
});

// --- POST /api/auth/validate-token ---
// Verifies an existing token and returns the user's data.
router.post('/validate-token', auth, async (req, res) => {
  console.log('--- TOKEN VALIDATION INITIATED ---');
  console.log(`[${new Date().toISOString()}] /api/auth/validate-token route hit.`);

  try {
    // The 'auth' middleware has already run and verified the token.
    console.log(`Token validated for user ID: ${req.user.id}`);

    console.log('Querying database for user details...');
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      console.log(`❌ User Not Found: No user with ID ${req.user.id}.`);
      return res.status(404).json({ message: 'User not found', errorCode: 1002 });
    }
    console.log(`✅ User details found: ${user.email}`);

    // Return user details (including role)
    console.log('Sending successful validation response to client.');
    res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    console.log('--- TOKEN VALIDATION COMPLETED ---');
  } catch (error) {
    console.error('💥 FATAL TOKEN VALIDATION ERROR:', error);
    res.status(500).json({ message: 'Server error', errorCode: 5000 });
  }
});

// --- POST /api/auth/signout ---
// A simple endpoint to acknowledge the sign-out request.
router.post('/signout', (req, res) => {
  console.log('--- SIGNOUT REQUEST INITIATED ---');
  console.log(`[${new Date().toISOString()}] /api/auth/signout route hit.`);

  res.status(200).json({ message: 'Sign-out successful.' });

  console.log('--- SIGNOUT REQUEST COMPLETED ---');
});

module.exports = router;
