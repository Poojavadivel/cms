// Server/Models/models_core.js
// HMS core Mongoose models (single-file)
// Notes:
// - Uses string UUIDs for all _id fields and all refs (consistent).
// - Passwords hashed with bcryptjs; password field is select:false.
// - AuthSession.expiresAt has a TTL index (expireAfterSeconds: 0).
// - Basic validators for email and phone.
// - Useful indexes and virtuals included.
// - If migrating from ObjectId to UUID strings, run a migration script (this file assumes UUID string IDs).

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;
const SALT_ROUNDS = 10;

// Common options
const commonOptions = {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  minimize: false // keep empty objects instead of removing them
};

// Simple validators
const emailValidator = {
  validator: function(v) {
    if (v === null || v === undefined || v === '') return true; // allow null/empty for optional emails
    // basic email regex - good enough for early validation
    return /^\S+@\S+\.\S+$/.test(v);
  },
  message: props => `${props.value} is not a valid email`
};

const phoneValidator = {
  validator: function(v) {
    if (v === null || v === undefined || v === '') return true; // allow null/empty for optional phones
    // allow optional leading + and 7-15 digits
    return /^\+?[0-9]{7,15}$/.test(v);
  },
  message: props => `${props.value} is not a valid phone number`
};

// ---------------------------
// Users
// ---------------------------
const UserSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  role: { type: String, enum: ['superadmin','admin','doctor','pharmacist','reception','staff'], required: true, index: true },
  firstName: { type: String, required: true, index: true },
  lastName: { type: String, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, index: true, validate: emailValidator },
  phone: { type: String, index: true, validate: phoneValidator },
  password: { type: String, required: true, select: false },
  is_active: { type: Boolean, default: true },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));
UserSchema.index({ role: 1 });

// virtual fullName
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''}${this.lastName ? ' ' + this.lastName : ''}`.trim();
});

// Hash password before save (only if modified)
UserSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Hash password if using findOneAndUpdate with password in update
UserSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const update = this.getUpdate();
    if (!update) return next();
    const pwd = update.password || (update.$set && update.$set.password);
    if (!pwd) return next();
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(pwd, salt);
    if (update.password) update.password = hashed;
    if (update.$set && update.$set.password) update.$set.password = hashed;
    this.setUpdate(update);
    return next();
  } catch (err) {
    return next(err);
  }
});

// comparePassword method (call after selecting +password)
UserSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ---------------------------
// Auth sessions (refresh tokens / devices)
// ---------------------------
const AuthSessionSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, ref: 'User', required: true, index: true },
  deviceId: { type: String, default: null, index: true },
  refreshTokenHash: { type: String, required: true },
  ip: String,
  userAgent: String,
  expiresAt: { type: Date, required: true, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions, { strict: false }));

// TTL index - sessions expire when expiresAt <= now
AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ---------------------------
// Patients (canonical)
// ---------------------------
const PatientSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  firstName: { type: String, required: true, index: true },
  lastName: { type: String, default: '' },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male','Female','Other'], default: null },
  phone: { type: String, index: true, validate: phoneValidator },
  email: { type: String, default: null, index: true, validate: emailValidator },
  address: {
    line1: String, city: String, state: String, pincode: String, country: String
  },
  doctorId: { type: String, ref: 'User', default: null, index: true },
  allergies: [{ type: String }],
  prescriptions: [
    {
      prescriptionId: { type: String, default: () => uuidv4() },
      appointmentId: { type: String, default: null },
      doctorId: { type: String, ref: 'User' },
      medicines: [{ medicineId: { type: String, ref: 'Medicine' }, name: String, dosage: String, frequency: String, duration: String, quantity: Number }],
      notes: String,
      issuedAt: { type: Date, default: Date.now }
    }
  ],
  notes: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} },
  deleted_at: { type: Date, default: null }
}, Object.assign({}, commonOptions));
PatientSchema.index({ phone: 1 });
PatientSchema.index({ lastName: 1, dateOfBirth: 1 });
PatientSchema.index({ phone: 1, dateOfBirth: 1 });

// ---------------------------
// Intakes (immutable snapshots + status)
// ---------------------------
const IntakeSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  patientId: { type: String, ref: 'Patient', default: null, index: true },
  patientSnapshot: {
    firstName: { type: String, required: true, index: true },
    lastName: { type: String, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male','Female','Other'], default: null },
    phone: { type: String, default: null, index: true, validate: phoneValidator },
    email: { type: String, default: null, validate: emailValidator }
  },
  doctorId: { type: String, ref: 'User', required: true, index: true },
  appointmentId: { type: String, default: null },
  triage: {
    chiefComplaint: { type: String, default: '' },
    vitals: {
      bp: { type: String, default: '' },
      temp: { type: Number, default: null },
      pulse: { type: Number, default: null },
      spo2: { type: Number, default: null },
      weightKg: { type: Number, default: null },
      heightCm: { type: Number, default: null }
    },
    priority: { type: String, enum: ['Normal','Urgent','Emergency'], default: 'Normal' },
    triageCategory: { type: String, enum: ['Green','Yellow','Red'], default: 'Green' }
  },
  consent: {
    consentGiven: { type: Boolean, default: false },
    consentAt: { type: Date },
    consentBy: { type: String, enum: ['digital','paper','verbal'], default: 'digital' },
    consentFileId: { type: String, ref: 'File', default: null }
  },
  insurance: {
    hasInsurance: { type: Boolean, default: false },
    payer: { type: String, default: '' },
    policyNumber: { type: String, default: '' },
    coverageMeta: { type: Schema.Types.Mixed, default: {} }
  },
  attachments: [{ type: String, ref: 'File' }],
  notes: { type: String, default: '' },
  meta: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['New','Reviewed','Converted','Rejected'], default: 'New', index: true },
  createdBy: { type: String, ref: 'User', required: true, index: true },
  convertedAt: { type: Date, default: null },
  convertedBy: { type: String, ref: 'User', default: null }
}, Object.assign({}, commonOptions));
IntakeSchema.index({ 'patientSnapshot.phone': 1 });
// Example sparse index field placeholder (sourceRef might be in meta)
IntakeSchema.index({ sourceRef: 1 }, { sparse: true });

// ---------------------------
// Appointments
// ---------------------------
const AppointmentSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  patientId: { type: String, ref: 'Patient', required: true, index: true },
  doctorId: { type: String, ref: 'User', required: true, index: true },
  appointmentType: { type: String, default: 'Consultation' },
  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date },
  location: { type: String, default: '' },
  status: { type: String, enum: ['Scheduled','Completed','Cancelled','No-Show','Rescheduled'], default: 'Scheduled', index: true },
  vitals: { type: Schema.Types.Mixed, default: {} },
  notes: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));
AppointmentSchema.index({ doctorId: 1, startAt: 1 });

// ---------------------------
// Medicines (catalog)
// ---------------------------
const MedicineSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  name: { type: String, required: true, index: true },
  genericName: { type: String, default: '' },
  sku: { type: String, default: null, index: true },
  form: { type: String, default: 'Tablet' },
  strength: { type: String, default: '' },
  unit: { type: String, default: 'pcs' },
  manufacturer: { type: String, default: '' },
  brand: { type: String, default: '' },
  category: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, enum: ['In Stock','Out of Stock','Discontinued'], default: 'In Stock' },
  metadata: { type: Schema.Types.Mixed, default: {} },
  deleted_at: { type: Date, default: null }
}, Object.assign({}, commonOptions));

// text index for searching
MedicineSchema.index({ name: 'text', genericName: 'text', brand: 'text', sku: 'text' });
// ensure sku uniqueness when present
MedicineSchema.index({ sku: 1 }, { unique: true, sparse: true });

// ---------------------------
// Medicine Batches
// ---------------------------
const MedicineBatchSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  medicineId: { type: String, ref: 'Medicine', required: true, index: true },
  batchNumber: { type: String, default: '' },
  expiryDate: { type: Date },
  quantity: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  supplier: { type: String, default: '' },
  location: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));
MedicineBatchSchema.index({ medicineId: 1, expiryDate: 1 });

// ---------------------------
// Pharmacy Records (transactions)
// ---------------------------
const PharmacyItemSchema = new Schema({
  medicineId: { type: String, ref: 'Medicine' },
  batchId: { type: String, ref: 'MedicineBatch' },
  sku: { type: String, default: null },
  name: { type: String, default: null },
  quantity: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

const PharmacyRecordSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  type: { type: String, enum: ['PurchaseReceive','Dispense','Return','Adjustment'], required: true, index: true },
  patientId: { type: String, ref: 'Patient', default: null, index: true },
  appointmentId: { type: String, default: null },
  createdBy: { type: String, ref: 'User' },
  items: { type: [PharmacyItemSchema], default: [] },
  total: { type: Number, default: 0 },
  paid: { type: Boolean, default: false },
  paymentMethod: { type: String, default: null },
  notes: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));
PharmacyRecordSchema.index({ createdAt: -1 });
PharmacyRecordSchema.index({ patientId: 1, createdAt: -1 });

// ---------------------------
// Lab Reports
// ---------------------------
const LabReportSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  patientId: { type: String, ref: 'Patient', required: true, index: true },
  appointmentId: { type: String, default: null },
  testType: { type: String, default: '' },
  results: { type: Schema.Types.Mixed, default: {} },
  fileRef: { type: String, ref: 'File', default: null },
  uploadedBy: { type: String, ref: 'User' },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));
LabReportSchema.index({ patientId: 1, testType: 1 });

// ---------------------------
// Files (S3 / GridFS pointers)
// ---------------------------
const FileSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  filename: { type: String, required: true, index: true },
  ownerId: { type: String, default: null, index: true }, // patientId/userId etc. (string UUID)
  mimeType: { type: String },
  size: { type: Number, default: 0 },
  storage: { type: String, default: 's3' },
  url: { type: String, default: null },
  key: { type: String, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions, { _id: true }));
FileSchema.index({ ownerId: 1, filename: 1 });

// ---------------------------
// Audit logs (immutable append-only)
// ---------------------------
const AuditLogSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, ref: 'User', index: true },
  entity: { type: String, required: true, index: true }, // e.g., Patient
  entityId: { type: String, required: true, index: true },
  action: { type: String, enum: ['CREATE','UPDATE','DELETE','EXPORT','IMPORT','LOGIN'], required: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  ip: { type: String },
  meta: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions, { strict: false }));
AuditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

// ---------------------------
// Bots (chat history + sessions)
// ---------------------------
const BotSessionSchema = new Schema({
  sessionId: { type: String, default: () => uuidv4() },
  model: { type: String, default: '' },
  messages: { type: [Schema.Types.Mixed], default: [] }, // {role, text, meta}
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const BotSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, ref: 'User', required: true, index: true },
  sessions: {
    type: [BotSessionSchema],
    default: [],
    // basic safeguard to prevent truly unbounded arrays; adjust limit per your needs
    validate: {
      validator: function(arr) {
        return !arr || arr.length <= 1000;
      },
      message: 'Bot sessions array exceeds allowed length (1000)'
    }
  },
  archived: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, Object.assign({}, commonOptions));
BotSchema.index({ userId: 1, archived: 1, updatedAt: -1 });
// index nested sessionId for quick lookups (multikey)
BotSchema.index({ 'sessions.sessionId': 1 });

// ---------------------------
// Model exports & helper
// ---------------------------
const User = mongoose.model('User', UserSchema);
const AuthSession = mongoose.model('AuthSession', AuthSessionSchema);
const Patient = mongoose.model('Patient', PatientSchema);
const Intake = mongoose.model('Intake', IntakeSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);
const Medicine = mongoose.model('Medicine', MedicineSchema);
const MedicineBatch = mongoose.model('MedicineBatch', MedicineBatchSchema);
const PharmacyRecord = mongoose.model('PharmacyRecord', PharmacyRecordSchema);
const LabReport = mongoose.model('LabReport', LabReportSchema);
const File = mongoose.model('File', FileSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
const Bot = mongoose.model('Bot', BotSchema);

module.exports = {
  User, AuthSession, Patient, Intake, Appointment, Medicine, MedicineBatch,
  PharmacyRecord, LabReport, File, AuditLog, Bot,
  startSession: () => mongoose.startSession()
};
