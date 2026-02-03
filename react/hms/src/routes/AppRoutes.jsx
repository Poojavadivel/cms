/**
 * AppRoutes.jsx
 * Main routing configuration for the application
 * 
 * Professional routing structure with:
 * - Public routes (login, forgot password, etc.)
 * - Protected routes (require authentication)
 * - Role-based routes (admin, doctor, pharmacist, pathologist)
 * - Lazy loading for code splitting
 * - 404 Not Found page
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SplashScreen } from '../services';
import LoadingFallback from '../components/common/LoadingFallback';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';

// Lazy load pages for better performance (code splitting)
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const UnauthorizedPage = lazy(() => import('../pages/common/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('../pages/common/NotFoundPage'));

// Root layouts (navigation containers)
const AdminRoot = lazy(() => import('../pages/admin/AdminRoot'));
const DoctorRoot = lazy(() => import('../pages/doctor/DoctorRoot'));
const PharmacistRoot = lazy(() => import('../pages/pharmacist/PharmacistRoot'));
const PathologistRoot = lazy(() => import('../pages/pathologist/PathologistRoot'));

// Admin module pages (from modules folder)
const AdminDashboard = lazy(() => import('../modules/admin/dashboard/Dashboard'));
const AdminUsers = lazy(() => import('../modules/admin/users/Users'));
const AdminAppointments = lazy(() => import('../modules/admin/appointments/Appointments'));
const AdminPatients = lazy(() => import('../modules/admin/patients/Patients'));
const AdminStaff = lazy(() => import('../modules/admin/staff/Staff'));
const AdminPharmacy = lazy(() => import('../modules/admin/pharmacy/Pharmacy'));
const AdminInvoice = lazy(() => import('../modules/admin/invoice/Invoice'));
const AdminPathology = lazy(() => import('../modules/admin/pathology/Pathology'));
const AdminSettings = lazy(() => import('../modules/admin/settings/Settings'));

// Doctor module pages (from modules folder)
const DoctorDashboard = lazy(() => import('../modules/doctor/dashboard/Dashboard'));
const DoctorPatients = lazy(() => import('../modules/doctor/patients/Patients'));
const DoctorAppointments = lazy(() => import('../modules/doctor/appointments/Appointments'));
const DoctorSchedule = lazy(() => import('../modules/doctor/schedule/Schedule'));
const DoctorSettings = lazy(() => import('../modules/doctor/settings/Settings'));

// Pharmacist module pages (from modules folder - Table Style)
const PharmacistDashboard = lazy(() => import('../modules/pharmacist/Dashboard_Flutter'));
const PharmacistMedicines = lazy(() => import('../modules/pharmacist/Medicines_Table'));
const PharmacistPrescriptions = lazy(() => import('../modules/pharmacist/Prescriptions_Flutter'));

// Pathologist module pages (from modules folder)
const PathologistDashboard = lazy(() => import('../modules/pathologist/dashboard/Dashboard'));
const PathologistTestReports = lazy(() => import('../modules/pathologist/test-reports/TestReports'));
const PathologistPatients = lazy(() => import('../modules/pathologist/patients/Patients'));
const PathologistSettings = lazy(() => import('../modules/pathologist/settings/Settings'));

// Shared pages (TODO: Implement these pages)
// const ProfilePage = lazy(() => import('../pages/common/ProfilePage'));
// const SettingsPage = lazy(() => import('../pages/common/SettingsPage'));

/**
 * Main routing component
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        {/* Root - Splash screen checks auth and redirects */}
        <Route path="/" element={<SplashScreen />} />

        {/* Authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Error pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* ========== PROTECTED ROUTES ========== */}
        {/* Profile and settings (accessible to all authenticated users) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div style={{ padding: '2rem' }}>Profile Page - Coming Soon</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <div style={{ padding: '2rem' }}>Settings Page - Coming Soon</div>
            </ProtectedRoute>
          }
        />

        {/* ========== ADMIN ROUTES ========== */}
        <Route
          path="/admin"
          element={
            <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
              <AdminRoot />
            </RoleBasedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="pharmacy" element={<AdminPharmacy />} />
          <Route path="invoice" element={<AdminInvoice />} />
          <Route path="pathology" element={<AdminPathology />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* ========== DOCTOR ROUTES ========== */}
        <Route
          path="/doctor"
          element={
            <RoleBasedRoute allowedRoles={['doctor']}>
              <DoctorRoot />
            </RoleBasedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="settings" element={<DoctorSettings />} />
          <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
        </Route>

        {/* ========== PHARMACIST ROUTES ========== */}
        <Route
          path="/pharmacist"
          element={
            <RoleBasedRoute allowedRoles={['pharmacist']}>
              <PharmacistRoot />
            </RoleBasedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PharmacistDashboard />} />
          <Route path="medicines" element={<PharmacistMedicines />} />
          <Route path="prescriptions" element={<PharmacistPrescriptions />} />
          <Route path="settings" element={<div>Settings - Coming Soon</div>} />
          <Route path="*" element={<Navigate to="/pharmacist/dashboard" replace />} />
        </Route>

        {/* ========== PATHOLOGIST ROUTES ========== */}
        <Route
          path="/pathologist"
          element={
            <RoleBasedRoute allowedRoles={['pathologist']}>
              <PathologistRoot />
            </RoleBasedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PathologistDashboard />} />
          <Route path="test-reports" element={<PathologistTestReports />} />
          <Route path="patients" element={<PathologistPatients />} />
          <Route path="settings" element={<PathologistSettings />} />
          <Route path="*" element={<Navigate to="/pathologist/dashboard" replace />} />
        </Route>

        {/* ========== CATCH ALL - 404 ========== */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
