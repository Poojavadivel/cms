// --- Core Imports ---
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing
require('dotenv').config();
const jwt = 'jsonwebtoken';
const auth = require('./Middleware/Auth');

// --- Local Imports ---
const { sequelize, connectDB } = require('./Config/Dbconfig');
const User = require('./Models/models'); // Import the User model

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Core Middleware ---
app.use(cors());
app.use(express.json());

// --- API Route Definitions ---
// const authRoutes = require('./routes/auth.routes');
// app.use('/api/auth', authRoutes);

// --- Root Endpoint ---
app.get('/', (req, res) => {
  res.send('Grow Hai and Glo Skin HMS Server is running!');
});

/**
 * Creates the initial admin user from .env variables if it doesn't already exist.
 * This is a secure way to seed the database on first run.
 */
const createInitialAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminRole = process.env.ADMIN_ROLE;

    // If the required environment variables aren't set, skip creation.
    if (!adminEmail || !adminPassword || !adminRole) {
      console.log('Initial admin user variables not found in .env, skipping creation.');
      return;
    }

    // Check if the admin user already exists in the database.
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log('Admin user already exists.');
    } else {
      // If the admin does not exist, create them.
      // First, securely hash the password.
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      await User.create({
        id: `admin_${Date.now()}`, // A simple unique ID for the admin
        email: adminEmail,
        password: hashedPassword, // Store the hashed password
        role: adminRole,
        firstName: 'Admin', // Default first name
        lastName: 'User',   // Default last name
      });
      console.log('Initial admin user created successfully.');
    }
  } catch (error) {
    console.error('Error creating initial admin user:', error);
  }
};

/**
 * The main startup function for the server.
 */


// --- POST /api/auth/login ---
// This is the primary endpoint for user login.
app.post('/login', async (req, res) => {
  // Log route call
  console.log('✅ /login route was called');

  // Log the details passed by the client
  console.log('📩 Request details:');
  console.log('Timestamp:', new Date().toISOString());
  console.log('IP Address:', req.ip);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body); // Contains email and password

  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // 2. Find the user in the database
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 4. Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    console.log(`✅ User ${email} logged in successfully`);

    // 5. Send response
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

  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/me', auth, async (req, res) => {
  try {
    // The authMiddleware has already verified the token and attached the user's ID to req.user.
    const user = await User.findByPk(req.user, {
      // We explicitly exclude the password field for security.
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If the user is found, send their data back to the client.
    res.status(200).json(user);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const startServer = async () => {
  try {
    // 1. Verify the database connection.
    await connectDB();

    // 2. Sync all defined models with the database.
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
    
    // 3. NEW: Create the initial admin user if they don't exist.
    await createInitialAdmin();

    // 4. Start the Express server to listen for incoming requests.
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

// --- Start the Server ---
startServer();
