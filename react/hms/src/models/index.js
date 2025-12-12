/**
 * Models Index
 * Central export file for all model classes
 */

// User and Role-based models
export { User, UserRole } from './User';
export { Admin } from './Admin';
export { Doctor } from './Doctor';
export { Pharmacist } from './Pharmacist';
export { Pathologist } from './Pathologist';

// Patient models
export { PatientDetails, CheckupRecord, PatientDashboardData } from './Patients';
export { 
  PatientVitals, 
  BloodPressure, 
  Temperature, 
  Weight, 
  Height, 
  BloodGlucose, 
  AbnormalFlag 
} from './PatientVitals';

// Staff and Payroll models
export { Staff } from './Staff';
export { 
  Payroll, 
  SalaryComponent, 
  AttendanceSummary, 
  StatutoryCompliance, 
  LoanAdvance 
} from './Payroll';

// Appointment models
export { AppointmentDraft } from './AppointmentDraft';
export { DashboardAppointments, DoctorDashboardData } from './DashboardModels';
