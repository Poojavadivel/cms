/**
 * AppNavigator.js
 * Root navigation - replaces web's AppRoutes.jsx
 * Handles auth state → Auth Stack or Role-based Drawer
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useApp } from '../provider';

// Screens
import LoginScreen from '../pages/auth/LoginScreen';
import SplashScreen from '../pages/auth/SplashScreen';

// Admin Screens
import StaffForm from '../modules/admin/staff/StaffForm';
import StaffDetail from '../modules/admin/staff/StaffDetail';
import DoctorForm from '../modules/admin/doctors/DoctorForm';
import PatientForm from '../modules/admin/patients/PatientForm';
import PatientDetail from '../modules/admin/patients/PatientDetail';
import AppointmentForm from '../modules/admin/appointments/AppointmentForm';

// Pathologist Screens
import LabReportForm from '../modules/pathologist/test_reports/LabReportForm';
import ReportDetail from '../modules/pathologist/test_reports/ReportDetail';

// Pharmacist Screens
import PharmacistMedicines from '../modules/pharmacist/Medicines';
import PharmacistPrescriptions from '../modules/pharmacist/Prescriptions';
import PharmacistIntakeQueue from '../modules/pharmacist/IntakeQueue';
import MedicineForm from '../modules/pharmacist/medicines/MedicineForm';
import MedicineDetail from '../modules/pharmacist/medicines/MedicineDetail';
import PrescriptionDetail from '../modules/pharmacist/prescriptions/PrescriptionDetail';
import DispensingForm from '../modules/pharmacist/prescriptions/DispensingForm';

// Role navigators
import AdminNavigator from './AdminNavigator';
import DoctorNavigator from './DoctorNavigator';
import PharmacistNavigator from './PharmacistNavigator';
import PathologistNavigator from './PathologistNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { isLoggedIn, isCheckingAuth, userRole } = useApp();

    // Show splash while checking stored auth
    if (isCheckingAuth) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    gestureEnabled: true,
                    gestureDirection: 'vertical',
                    cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                }}
            >
                {!isLoggedIn ? (
                    // Auth Stack - not logged in
                    <Stack.Group>
                        <Stack.Screen name="Login" component={LoginScreen} />
                    </Stack.Group>
                ) : (
                    // Role-based navigation - logged in
                    <Stack.Group>
                        {(userRole === 'admin' || userRole === 'superadmin') && (
                            <>
                                <Stack.Screen name="AdminRoot" component={AdminNavigator} />
                                <Stack.Screen name="StaffForm" component={StaffForm} />
                                <Stack.Screen name="StaffDetail" component={StaffDetail} />
                                <Stack.Screen name="DoctorForm" component={DoctorForm} />
                                <Stack.Screen name="PatientForm" component={PatientForm} />
                                <Stack.Screen name="PatientDetail" component={PatientDetail} />
                                <Stack.Screen name="AppointmentForm" component={AppointmentForm} />
                                <Stack.Screen name="DispensingForm" component={DispensingForm} />
                                <Stack.Screen name="LabReportForm" component={LabReportForm} />
                                <Stack.Screen name="Pharmacy" component={PharmacistNavigator} />
                            </>
                        )}
                        {userRole === 'doctor' && (
                            <>
                                <Stack.Screen name="DoctorRoot" component={DoctorNavigator} />
                                <Stack.Screen name="PatientDetail" component={PatientDetail} />
                                <Stack.Screen name="AppointmentForm" component={AppointmentForm} />
                            </>
                        )}
                        {userRole === 'pharmacist' && (
                            <>
                                <Stack.Screen name="PharmacistRoot" component={PharmacistNavigator} />
                                <Stack.Screen name="Medicines" component={PharmacistMedicines} />
                                <Stack.Screen name="Prescriptions" component={PharmacistPrescriptions} />
                                <Stack.Screen name="IntakeQueue" component={PharmacistIntakeQueue} />
                                <Stack.Screen name="MedicineForm" component={MedicineForm} />
                                <Stack.Screen name="MedicineDetail" component={MedicineDetail} />
                                <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetail} />
                            </>
                        )}
                        {userRole === 'pathologist' && (
                            <>
                                <Stack.Screen name="PathologistRoot" component={PathologistNavigator} />
                                <Stack.Screen name="LabReportForm" component={LabReportForm} />
                                <Stack.Screen name="ReportDetail" component={ReportDetail} />
                            </>
                        )}
                    </Stack.Group>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
