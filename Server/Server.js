// --- Core Imports ---
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// --- Local Imports ---
const { sequelize, connectDB } = require('./Config/Dbconfig');
const User = require('./Models/models');
const authRoutes = require('./routes/auth');

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Core Middleware ---
app.use(cors());
app.use(express.json());

// --- API Route Definitions ---
app.use('/api/auth', authRoutes);

// --- Root Endpoint ---
app.get('/', (req, res) => {
  res.send('Glow Skin & Gro Hair HMS Server is running!');
});

/**
 * Creates the initial admin user from .env variables if it doesn't already exist.
 */
const createInitialAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('Initial admin user variables not found in .env, skipping creation.');
      return;
    }

    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log('Admin user already exists.');
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await User.create({
        id: `admin_${Date.now()}`,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin', // Hardcoded role for safety
        firstName: 'Admin',
        lastName: 'User',
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
const startServer = async () => {
  try {
    // 1. Verify the database connection.
    await connectDB();

    // 2. Sync all defined models with the database.
    // Using { force: true } will drop existing tables and recreate them.
    // WARNING: This will delete all data in your tables. Use only in development.
    await sequelize.sync({ force: true });
    console.log('All models were synchronized successfully.');
    
    // 3. Create the initial admin user if they don't exist.
    await createInitialAdmin();

    // 4. Start the Express server.
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
