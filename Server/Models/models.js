// Server/Models/models.js
// Single file exporting Sequelize User (Postgres) + Mongoose models (Mongo).
// Adjust relative paths to Config/Dbconfig and mongoose connection as needed.

///// ---------- Postgres (Sequelize) - User Model ---------- /////
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
      type: DataTypes.ENUM('admin', 'doctor', 'pharmacist', 'superadmin'),
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

    // --- Doctor/Pharmacist-Specific ---
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
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        // only hash if password changed
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

///// ---------- MongoDB (Mongoose) - Models ---------- /////
const mongoose = require('mongoose');

// Helper function for ObjectId references (string typed to keep compatibility)
const ObjectIdString = { type: String }; // storing related Postgres UUIDs or Mongo _id as string

// --- Patient Model (Mongo) ---
const PatientSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, default: '' },

    dateOfBirth: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    phone: String,
    email: { type: String, default: null },

    address: {
      country: { type: String, default: '' },
      state: { type: String, default: '' },
      city: { type: String, default: '' },
      line1: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },

    // Link to Postgres User.id UUID for assigned doctor
    doctorId: { type: String, required: true },

    medicalHistory: [{ type: String }], // e.g. ["Diabetes", "Allergy"]

    // Array of prescription snapshots (issued by a doctor)
    prescriptions: [
      {
        appointmentId: { type: String }, // Mongo Appointment._id
        doctorId: { type: String }, // Postgres User.id
        medicines: [
          {
            medicineId: { type: String }, // Medicine catalog _id
            name: { type: String },
            dosage: { type: String }, // e.g. "1 tablet"
            frequency: { type: String }, // e.g. "twice a day"
            duration: { type: String }, // e.g. "5 days"
            quantity: { type: Number, default: 0 },
          },
        ],
        notes: { type: String, default: '' },
        issuedAt: { type: Date, default: Date.now },
      },
    ],

    labReports: [
      {
        reportType: { type: String },
        fileUrl: { type: String },
        uploadedBy: { type: String }, // doctorId/adminId (Postgres UUID)
        appointmentId: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    allergies: [{ type: String }],
    avatarUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

PatientSchema.index({ doctorId: 1 });
PatientSchema.index({ phone: 1 });

const Patient = mongoose.model('Patient', PatientSchema);

// --- Appointment Model (Mongo) ---
const AppointmentSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true }, // Postgres User.id (UUID)
    patientId: { type: String }, // Mongo Patient._id

    clientName: { type: String, required: true },
    appointmentType: { type: String, required: true }, // e.g. "Consultation"
    date: { type: String, required: true }, // "YYYY-MM-DD"
    time: { type: String, required: true }, // "HH:mm"

    location: { type: String, required: true },
    notes: { type: String, default: '' },

    phoneNumber: { type: String, default: '' },
    mode: { type: String, enum: ['In-clinic', 'Telehealth'], default: 'In-clinic' },
    priority: { type: String, enum: ['Normal', 'Urgent', 'Emergency'], default: 'Normal' },
    durationMinutes: { type: Number, default: 20 },
    reminder: { type: Boolean, default: true },
    chiefComplaint: { type: String, default: '' },

    vitals: {
      heightCm: { type: String, default: '' },
      weightKg: { type: String, default: '' },
      bp: { type: String, default: '' },
      heartRate: { type: String, default: '' },
      spo2: { type: String, default: '' },
    },

    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No-Show'],
      default: 'Scheduled',
    },
  },
  { timestamps: true }
);

AppointmentSchema.index({ doctorId: 1, date: 1, time: 1 });
const Appointment = mongoose.model('Appointment', AppointmentSchema);

// --- Pathology Model (Mongo) ---
const PathologySchema = new mongoose.Schema({
  patientId: { type: String, required: true }, // Mongo Patient._id
  doctorId: { type: String, required: true }, // Postgres User.id (UUID)
  testName: { type: String },
  reportUrl: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed }, // optional metadata
  date: { type: Date, default: Date.now },
});
PathologySchema.index({ patientId: 1, doctorId: 1, testName: 1 });
const Pathology = mongoose.model('Pathology', PathologySchema);

///// ---------- Pharmacy & Medicine Models ---------- /////

// Medicine Catalog
const MedicineSchema = new mongoose.Schema(
  {
    sku: { type: String, index: true, unique: true, sparse: true }, // optional SKU (unique when present)
    name: { type: String, required: true, index: true },
    genericName: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
    brand: { type: String, default: '' },
    category: { type: String, default: '' },
    description: { type: String, default: '' },
    form: {
      type: String,
      enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Other'],
      default: 'Tablet',
    },
    strength: { type: String, default: '' }, // e.g. "500mg"
    unit: { type: String, default: 'pcs' }, // e.g. pcs, bottle
    stock: { type: Number, default: 0 }, // computed/approx; prefer aggregating batches
    reorderLevel: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    status: { type: String, enum: ['In Stock', 'Out of Stock', 'Discontinued'], default: 'In Stock' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);
MedicineSchema.index({ name: 'text', genericName: 'text', brand: 'text', sku: 'text' });
const Medicine = mongoose.model('Medicine', MedicineSchema);

// Medicine Batch - tracks physical batches and quantities
const MedicineBatchSchema = new mongoose.Schema(
  {
    medicineId: { type: String, required: true }, // link to Medicine._id (string)
    batchNumber: { type: String, default: '' },
    expiryDate: { type: Date },
    quantity: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    supplier: { type: String, default: '' },
    location: { type: String, default: '' }, // where batch stored
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);
MedicineBatchSchema.index({ medicineId: 1, expiryDate: 1 });
const MedicineBatch = mongoose.model('MedicineBatch', MedicineBatchSchema);

// PharmacyRecord - purchases / receipts / dispense / returns
const PharmacyRecordSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['PurchaseReceive', 'Dispense', 'Return', 'Adjustment'],
      required: true,
    },
    patientId: { type: String, default: null }, // optional for dispense
    appointmentId: { type: String, default: null },
    createdBy: { type: String, default: '' }, // user id who performed the action
    items: [
      {
        medicineId: { type: String },
        batchId: { type: String, default: null },
        sku: { type: String, default: null },
        name: { type: String, default: null },
        quantity: { type: Number, default: 0 },
        unitPrice: { type: Number, default: 0 },
        taxPercent: { type: Number, default: 0 },
        lineTotal: { type: Number, default: 0 },
      },
    ],
    total: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paymentMethod: { type: String, default: null },
    notes: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);
PharmacyRecordSchema.index({ type: 1, patientId: 1, createdBy: 1, createdAt: -1 });
const PharmacyRecord = mongoose.model('PharmacyRecord', PharmacyRecordSchema);

// Pharmacy (legacy name / convenience wrapper)
const PharmacySchema = new mongoose.Schema({
  patientId: { type: String, required: true }, // Mongo Patient._id
  doctorId: { type: String, required: true }, // Postgres User.id
  appointmentId: { type: String },
  medicines: [
    {
      medicineId: { type: String },
      name: { type: String },
      dosage: { type: String },
      duration: { type: String },
      quantity: { type: Number, default: 0 },
    },
  ],
  notes: { type: String, default: '' },
  issuedAt: { type: Date, default: Date.now },
});
const Pharmacy = mongoose.model('Pharmacy', PharmacySchema);

///// ---------- Staff Model (Mongo) ---------- /////
const StaffSchema = new mongoose.Schema({
  doctorId: { type: String }, // Postgres User.id (UUID) - optional
  name: { type: String, required: true },
  designation: { type: String },
  department: { type: String },
  contact: { type: String },
  role: { type: String, enum: ['Nurse', 'Technician', 'Receptionist', 'Pharmacist', 'Doctor'] },
  phone: { type: String },
  email: { type: String },
}, { timestamps: true });

const Staff = mongoose.model('Staff', StaffSchema);

///// ---------- Export all models ---------- /////
module.exports = {
  // Postgres / Sequelize
  User,

  // Mongo / Mongoose
  Patient,
  Appointment,
  Pathology,
  Medicine,
  MedicineBatch,
  PharmacyRecord,
  Pharmacy,
  Staff,
};
