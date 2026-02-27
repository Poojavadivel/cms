/**
 * AdminNavigator.js
 * Bottom Tab navigation for Admin role - replaces Side Drawer
 * Features primary modules in bottom bar + "More" menu for secondary items
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../provider';
import { AppColors } from '../provider/ThemeContext';
import BottomTabBar from '../components/common/BottomTabBar';

// Admin screens
import AdminDashboard from '../modules/admin/dashboard/Dashboard';
import AdminAppointments from '../modules/admin/appointments/Appointments';
import AdminPatients from '../modules/admin/patients/Patients';
import AdminStaff from '../modules/admin/staff/Staff';
import AdminInvoice from '../modules/admin/invoice/Invoice';
import AdminPathology from '../modules/admin/pathology/Pathology';
import AdminPharmacy from '../modules/admin/pharmacy/Pharmacy';
import AdminSettings from '../modules/admin/settings/Settings';
import AdminScanUpload from '../modules/admin/settings/ScanUpload';
import AdminMoreScreen from '../modules/admin/dashboard/AdminMoreScreen';

const Tab = createBottomTabNavigator();

const AdminNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName="Dashboard"
            tabBar={(props) => <BottomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                headerTitleAlign: 'center',
                headerStyle: {
                    backgroundColor: '#FFFFFF',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F1F5F9',
                    height: 64
                },
                headerTitleStyle: { fontWeight: '800', fontSize: 18, color: '#1E293B' },
                headerTitleAlign: 'center',
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={AdminDashboard}
                options={{
                    title: 'Dashboard',
                    tabBarIconName: 'dashboard'
                }}
            />
            <Tab.Screen
                name="Appointments"
                component={AdminAppointments}
                options={{
                    title: 'Bookings',
                    tabBarIconName: 'calendar-today'
                }}
            />
            <Tab.Screen
                name="Patients"
                component={AdminPatients}
                options={{
                    title: 'Patients',
                    tabBarIconName: 'local-hospital'
                }}
            />
            <Tab.Screen
                name="Staff"
                component={AdminStaff}
                options={{
                    title: 'Staff',
                    tabBarIconName: 'people'
                }}
            />
            <Tab.Screen
                name="Invoice"
                component={AdminInvoice}
                options={{
                    title: 'Payroll',
                    tabBarIconName: 'receipt'
                }}
            />
            <Tab.Screen
                name="Pathology"
                component={AdminPathology}
                options={{
                    title: 'Pathology',
                    tabBarIconName: 'biotech'
                }}
            />
            <Tab.Screen
                name="Pharmacy"
                component={AdminPharmacy}
                options={{
                    title: 'Pharmacy',
                    tabBarIconName: 'local-pharmacy'
                }}
            />
            <Tab.Screen
                name="ScanUpload"
                component={AdminScanUpload}
                options={{
                    title: 'Scan',
                    tabBarIconName: 'camera-alt'
                }}
            />
            <Tab.Screen
                name="Settings"
                component={AdminSettings}
                options={{
                    title: 'Settings',
                    tabBarIconName: 'settings'
                }}
            />
        </Tab.Navigator>
    );
};

export default AdminNavigator;
