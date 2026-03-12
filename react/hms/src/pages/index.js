/**
 * Central export file for all Root Layout components
 * These are the main navigation containers with sidebars
 * Actual page components are in modules/
 */

// Root Layouts (Navigation Containers with Sidebars)
export { default as AdminRoot } from './admin/AdminRoot';
export { default as DoctorRoot } from './doctor/DoctorRoot';
export { default as PharmacistRoot } from './pharmacist/PharmacistRoot';
export { default as PathologistRoot } from './pathologist/PathologistRoot';

// Auth Pages
export { default as Login } from './auth/LoginPage';
