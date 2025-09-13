// ===============================
// Postgres (Sequelize) - User Model
// ===============================
const { sequelize } = require('../Config/Dbconfig');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// --- Sequelize User Model (Admins + Doctors in Postgres) ---
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'doctor'),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      field: 'date_of_birth',
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      validate: {
        isNumeric: true,
      },
    },
    country: DataTypes.STRING(100),
    state: DataTypes.STRING(100),
    city: DataTypes.STRING(100),

    // --- Doctor-Specific ---
    specialization: DataTypes.STRING(100),
    licenseNumber: {
      type: DataTypes.STRING(100),
      field: 'license_number',
    },
    department: DataTypes.STRING(100),
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// ===============================
// MongoDB (Mongoose) - Models
// ===============================
const mongoose = require('mongoose');

// --- Patient Model (Mongo) ---
const PatientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  phone: String,
  email: { type: String, unique: true },
  address: {
    country: String,
    state: String,
    city: String,
  },

  // 🔗 Link to Postgres Doctor (User.id UUID)
  doctorId: { type: String, required: true },

  medicalHistory: [String], // ["Diabetes", "Allergy"]

  prescriptions: [
    {
      appointmentId: { type: String }, // Mongo Appointment._id
      doctorId: { type: String },      // Postgres User.id
      medicines: [
        {
          name: String,
          dosage: String,
          duration: String,
        },
      ],
      notes: String,
      issuedAt: { type: Date, default: Date.now },
    },
  ],

  labReports: [
    {
      reportType: String,
      fileUrl: String, // link to S3 or server
      uploadedBy: String, // doctorId/adminId (Postgres UUID)
      appointmentId: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],

  allergies: [String],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Patient = mongoose.model('Patient', PatientSchema);

// --- Appointment Model (Mongo) ---
const AppointmentSchema = new mongoose.Schema({
  doctorId: { type: String, required: true },  // Postgres User.id (UUID from JWT)
  patientId: { type: String },                 // Mongo Patient._id

  clientName: { type: String, required: true },
  appointmentType: { type: String, required: true },
  date: { type: String, required: true },  // "YYYY-MM-DD"
  time: { type: String, required: true },  // "HH:mm"

  location: { type: String, required: true },
  notes: { type: String },

  phoneNumber: { type: String },
  mode: { type: String, enum: ['In-clinic', 'Telehealth'], default: 'In-clinic' },
  priority: { type: String, enum: ['Normal', 'Urgent', 'Emergency'], default: 'Normal' },
  durationMinutes: { type: Number, default: 20 },
  reminder: { type: Boolean, default: true },
  chiefComplaint: { type: String },

  vitals: {
    heightCm: String,
    weightKg: String,
    bp: String,
    heartRate: String,
    spo2: String,
  },

  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No-Show'],
    default: 'Scheduled',
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Appointment = mongoose.model('Appointment', AppointmentSchema);

// --- Pathology Model (Mongo) ---
const PathologySchema = new mongoose.Schema({
  patientId: { type: String, required: true }, // Mongo Patient._id
  doctorId: { type: String, required: true },  // Postgres User.id (UUID)
  testName: String,
  reportUrl: String,
  date: { type: Date, default: Date.now },
});
const Pathology = mongoose.model('Pathology', PathologySchema);

// --- Pharmacy Model (Mongo) ---
const PharmacySchema = new mongoose.Schema({
  patientId: { type: String, required: true },   // Mongo Patient._id
  doctorId: { type: String, required: true },    // Postgres User.id (UUID)
  appointmentId: { type: String },               // Mongo Appointment._id
  medicineName: String,
  quantity: Number,
  dosage: String,
  duration: String,
  issuedAt: { type: Date, default: Date.now },
});
const Pharmacy = mongoose.model('Pharmacy', PharmacySchema);

// --- Staff Model (Mongo) ---
const StaffSchema = new mongoose.Schema({
  doctorId: { type: String, required: false }, // Postgres User.id (UUID) - optional
  name: { type: String, required: true },
  designation: { type: String },               // 👈 add this
  department: String,
  contact: { type: String },                   // 👈 add this
  role: { type: String, enum: ['Nurse', 'Technician', 'Receptionist', 'Doctor'] },
  phone: String,                               // (you can keep this if needed separately)
  email: String,
  createdAt: { type: Date, default: Date.now },
});


const Staff = mongoose.model('Staff', StaffSchema);

// ===============================
// Exports
// ===============================
module.exports = {
  User,       // Postgres (Admins + Doctors)
  Patient,    // Mongo
  Appointment,// Mongo
  Pathology,  // Mongo
  Pharmacy,   // Mongo
  Staff,      // Mongo
};
