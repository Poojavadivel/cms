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
// MongoDB (Mongoose) - Patient & Appointment Models
// ===============================
const mongoose = require('mongoose');

// --- Patient Model (lives in Mongo) ---
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
      uploadedBy: String, // doctorId/adminId
      appointmentId: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],

  allergies: [String],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Patient = mongoose.model('Patient', PatientSchema);

// --- Appointment Model (matches Flutter AppointmentDraft.toJson) ---
const AppointmentSchema = new mongoose.Schema({
  doctorId: { type: String, required: true },  // Postgres User.id (from JWT)
  patientId: { type: String },                 // ✅ changed to String for easier handling

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

// ===============================
// Exports
// ===============================
module.exports = {
  User,         // Postgres (Admins + Doctors)
  Patient,      // Mongo
  Appointment,  // Mongo
};
