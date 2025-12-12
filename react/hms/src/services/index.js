/**
 * Services Index
 * Central export file for all services
 */

// Auth service (singleton)
export { default as authService } from './authService';
export { AuthResult, ApiException } from './authService';

// Splash screen component
export { default as SplashScreen } from './SplashScreen';

// API constants
export * from './apiConstants';
export { default as apiConstants } from './apiConstants';

// Logger service
export { default as logger } from './loggerService';

// Appointments service
export { default as appointmentsService } from './appointmentsService';

// Patients service
export { default as patientsService } from './patientsService';
