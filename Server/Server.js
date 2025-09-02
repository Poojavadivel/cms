// --- Core Imports ---
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// --- Local Imports ---
const { sequelize, connectPostgres, connectMongo } = require('./Config/Dbconfig');
const { User } = require('./Models/models');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointment');
const path = require("path"); 
// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Core Middleware ---
app.use(cors());
app.use(express.json());
const webAppPath = path.join(__dirname, 'web');
// --- API Route Definitions ---
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);

app.use(express.static(webAppPath));
app.get('/', (req, res) => {
  res.sendFile(path.join(webAppPath, 'index.html'));
});

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
    const adminRole = process.env.ADMIN_ROLE;

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
        id: `doctor_${Date.now()}`,
        email: adminEmail,
        password: hashedPassword,
        role: adminRole, // Hardcoded role for safety
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
    // 1. Connect to PostgreSQL
    await connectPostgres();

    // 2. Connect to MongoDB
    await connectMongo();

    // 3. Sync all defined Sequelize models with PostgreSQL
    await sequelize.sync({ alter: true });
    console.log('✅ All Sequelize models were synchronized successfully.');

    // 4. Create the initial admin user if they don't exist
    await createInitialAdmin();
    console.log('👑 Initial admin user check completed.');

    // 5. Start the Express server
    app.listen(PORT, () => {
      console.log(`🌍 Server is listening on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start the server:', error);
    process.exit(1);
  }
};


// --- Start the Server ---
startServer();
