// Server/Models/index.js
// Central export point for all models

const mongoose = require('mongoose');

// Import all models
const User = require('./User');
const Staff = require('./Staff');
const AuthSession = require('./AuthSession');
const Patient = require('./Patient');
const Intake = require('./Intake');
const Appointment = require('./Appointment');
const Medicine = require('./Medicine');
const MedicineBatch = require('./MedicineBatch');
const PharmacyRecord = require('./PharmacyRecord');
const LabReport = require('./LabReport');
const File = require('./File');
const AuditLog = require('./AuditLog');
const Bot = require('./Bot');
const PatientPDF = require('./PatientPDF');
const PrescriptionDocument = require('./PrescriptionDocument');
const LabReportDocument = require('./LabReportDocument');
const MedicalHistoryDocument = require('./MedicalHistoryDocument');
const Payroll = require('./Payroll');

// Export all models
module.exports = {
  User,
  Staff,
  AuthSession,
  Patient,
  Intake,
  Appointment,
  Medicine,
  MedicineBatch,
  PharmacyRecord,
  LabReport,
  File,
  AuditLog,
  Bot,
  PatientPDF,
  PrescriptionDocument,
  LabReportDocument,
  MedicalHistoryDocument,
  Payroll,
  // Helper function for transactions
  startSession: () => mongoose.startSession()
};
