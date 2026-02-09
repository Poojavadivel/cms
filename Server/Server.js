// server.js
// Main entrypoint for HMS (MongoDB-only)

// --- Core Imports ---
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- Local Imports ---
const { connectMongo } = require('./Config/Dbconfig');           // your new Mongo-only DB config
const { User } = require('./Models');          // updated models (UUID-based)
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointment');
const path = require('path');

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Core Middleware ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
const webAppPath = path.join(__dirname, 'web');

// --- API Route Definitions ---
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/staff', require('./routes/staff'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/pathology', require('./routes/pathology'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/intake', require('./routes/intake'));
app.use('/api/scanner-enterprise', require('./routes/scanner-enterprise'));
app.use('/api/card', require('./routes/card'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/reports', require('./routes/enterpriseReports'));
app.use('/api/reports-proper', require('./routes/properReports'));

// --- Static Files & SPA Support ---
// Serve static assets (images, js, css)
app.use(express.static(webAppPath));

// Catch-all route: sends index.html for any request that doesn't match an API or static file
app.get('*', (req, res) => {
  // Return 404 for missing API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  // Send index.html for all other routes to support client-side routing (SPA)
  res.sendFile(path.resolve(webAppPath, 'index.html'));
});


/**
 * Creates the initial admin user from .env variables if it doesn't already exist.
 * Notes:
 *  - The User schema already hashes passwords in a pre-save hook.
 *  - We create the user only if no user exists with the configured ADMIN_EMAIL.
 */
const createInitialAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminRole = process.env.ADMIN_ROLE || 'superadmin';

    if (!adminEmail || !adminPassword) {
      console.log('Initial admin user variables not found in .env, skipping creation.');
      return;
    }

    // Use Mongoose findOne (not Sequelize). Email is indexed and unique in the schema.
    const existingAdmin = await User.findOne({ email: adminEmail }).lean();

    if (existingAdmin) {
      console.log('Admin user already exists.');
    } else {
      // Create using Mongoose. UserSchema pre-save will hash the password automatically.
      const newAdmin = new User({
        // _id will be auto-generated UUID by the schema
        email: adminEmail,
        password: adminPassword,
        role: adminRole,
        firstName: 'Admin',
        lastName: 'User',
        is_active: true
      });

      // Save (pre-save hook hashes password)
      await newAdmin.save();
      console.log('Initial admin user created successfully with email:', adminEmail);
    }
  } catch (error) {
    console.error('Error creating initial admin user:', error);
  }
};
/**
 * Creates the initial doctor user from .env variables if it doesn't already exist.
 * Notes:
 *  - Uses Mongoose User model (UUID _id).
 *  - Password will be hashed automatically by UserSchema pre-save hook.
 */
const createInitialDoctor = async () => {
  try {
    const doctorEmail = process.env.DOCTOR_EMAIL;
    const doctorPassword = process.env.DOCTOR_PASSWORD;
    const doctorRole = process.env.DOCTOR_ROLE || 'doctor';

    if (!doctorEmail || !doctorPassword) {
      console.log('Initial doctor user variables not found in .env, skipping creation.');
      return;
    }

    const existingDoctor = await User.findOne({ email: doctorEmail }).lean();

    if (existingDoctor) {
      console.log('Doctor user already exists.');
    } else {
      const newDoctor = new User({
        email: doctorEmail,
        password: doctorPassword,
        role: doctorRole,
        firstName: 'Doctor',
        lastName: 'User',
        is_active: true
      });

      await newDoctor.save();
      console.log('Initial doctor user created successfully with email:', doctorEmail);
    }
  } catch (error) {
    console.error('Error creating initial doctor user:', error);
  }
};

/**
 * Creates the initial pharmacist user from .env variables if it doesn't already exist.
 */
const createInitialPharmacist = async () => {
  try {
    const pharmacistEmail = process.env.PHARMACIST_EMAIL;
    const pharmacistPassword = process.env.PHARMACIST_PASSWORD;
    const pharmacistRole = process.env.PHARMACIST_ROLE || 'pharmacist';

    if (!pharmacistEmail || !pharmacistPassword) {
      console.log('Initial pharmacist user variables not found in .env, skipping creation.');
      return;
    }

    const existingPharmacist = await User.findOne({ email: pharmacistEmail }).lean();

    if (existingPharmacist) {
      console.log('Pharmacist user already exists.');
    } else {
      const newPharmacist = new User({
        email: pharmacistEmail,
        password: pharmacistPassword,
        role: pharmacistRole,
        firstName: 'Pharmacist',
        lastName: 'User',
        is_active: true
      });

      await newPharmacist.save();
      console.log('Initial pharmacist user created successfully with email:', pharmacistEmail);
    }
  } catch (error) {
    console.error('Error creating initial pharmacist user:', error);
  }
};

/**
 * Creates the initial pathologist user from .env variables if it doesn't already exist.
 */
const createInitialPathologist = async () => {
  try {
    const pathologistEmail = process.env.PATHOLOGIST_EMAIL;
    const pathologistPassword = process.env.PATHOLOGIST_PASSWORD;
    const pathologistRole = process.env.PATHOLOGIST_ROLE || 'pathologist';

    if (!pathologistEmail || !pathologistPassword) {
      console.log('Initial pathologist user variables not found in .env, skipping creation.');
      return;
    }

    const existingPathologist = await User.findOne({ email: pathologistEmail }).lean();

    if (existingPathologist) {
      console.log('Pathologist user already exists.');
    } else {
      const newPathologist = new User({
        email: pathologistEmail,
        password: pathologistPassword,
        role: pathologistRole,
        firstName: 'Pathologist',
        lastName: 'User',
        is_active: true
      });

      await newPathologist.save();
      console.log('Initial pathologist user created successfully with email:', pathologistEmail);
    }
  } catch (error) {
    console.error('Error creating initial pathologist user:', error);
  }
};


/**
 * Generates a unique staff code (patientFacingId) for a staff member
 */
const generateStaffCode = async (Staff, prefix = 'DOC') => {
  let code;
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // Generate a random 3-digit number
    const randomNum = Math.floor(100 + Math.random() * 900);
    code = `${prefix}${randomNum}`;

    // Check if this code already exists
    const existing = await Staff.findOne({ patientFacingId: code }).lean();
    if (!existing) {
      return code;
    }
    attempts++;
  }

  // Fallback: use timestamp-based code if random generation fails
  return `${prefix}${Date.now().toString().slice(-4)}`;
};

/**
 * Syncs doctors from User collection to Staff collection
 */
const syncDoctorsToStaff = async () => {
  try {
    const { User, Staff } = require('./Models');

    // Find all doctors in User collection
    const doctors = await User.find({ role: 'doctor' }).lean();

    if (doctors.length === 0) {
      console.log('ℹ️  No doctors found in User collection to sync.');
      return;
    }

    let synced = 0;
    for (const doctor of doctors) {
      // Check if staff record already exists with this email
      const existingStaff = await Staff.findOne({ email: doctor.email }).lean();

      if (!existingStaff) {
        // Generate unique staff code
        const staffCode = await generateStaffCode(Staff, 'DOC');

        // Create new staff record for this doctor
        const staffData = {
          name: doctor.firstName && doctor.lastName
            ? `${doctor.firstName} ${doctor.lastName}`.trim()
            : doctor.firstName || 'Doctor',
          email: doctor.email,
          contact: doctor.phone || '0000000000', // Provide default if missing
          patientFacingId: staffCode, // Add required staff code
          roles: ['doctor'],
          designation: doctor.metadata?.specialization || 'Doctor',
          department: doctor.metadata?.department || 'Medical',
          status: doctor.is_active ? 'Available' : 'Off Duty',
          metadata: {
            userId: doctor._id,
            syncedAt: new Date().toISOString()
          }
        };

        await Staff.create(staffData);
        synced++;
        console.log(`✓ Synced doctor to Staff: ${staffData.name} (${doctor.email}) - Code: ${staffCode}`);
      }
    }

    if (synced > 0) {
      console.log(`🔄 Synced ${synced} doctor(s) to Staff collection.`);
    }
  } catch (error) {
    console.error('Error syncing doctors to staff:', error);
  }
};

/**
 * Main startup function.
 * Connects to MongoDB, optionally runs migrations/seeds, creates initial admin user, and starts Express.
 */
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectMongo();

    // 2. Create initial admin user (if configured)
    await createInitialAdmin();
    await createInitialDoctor();
    await createInitialPharmacist();
    await createInitialPathologist();
    console.log('👑 Initial admin user check completed.');

    // 3. Sync doctors from User to Staff collection
    await syncDoctorsToStaff();

    // 4. Start the Express server
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
