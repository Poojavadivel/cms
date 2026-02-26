/**
 * DoctorNavigator.js
 * Bottom Tab navigation for Doctor role
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../provider';
import { AppColors } from '../provider/ThemeContext';
import BottomTabBar from '../components/common/BottomTabBar';

import DoctorDashboard from '../modules/doctor/dashboard/Dashboard';
import DoctorAppointments from '../modules/doctor/appointments/Appointments';
import DoctorPatients from '../modules/doctor/patients/Patients';
import DoctorSchedule from '../modules/doctor/schedule/Schedule';
import DoctorSettings from '../modules/doctor/settings/Settings';

const Tab = createBottomTabNavigator();

const DoctorNavigator = () => {
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
                component={DoctorDashboard}
                options={{
                    title: 'Dashboard',
                    tabBarIconName: 'dashboard'
                }}
            />
            <Tab.Screen
                name="Appointments"
                component={DoctorAppointments}
                options={{
                    title: 'Appointments',
                    tabBarIconName: 'calendar-today'
                }}
            />
            <Tab.Screen
                name="Patients"
                component={DoctorPatients}
                options={{
                    title: 'My Patients',
                    tabBarIconName: 'people'
                }}
            />
            <Tab.Screen
                name="Schedule"
                component={DoctorSchedule}
                options={{
                    title: 'Schedule',
                    tabBarIconName: 'schedule'
                }}
            />
            <Tab.Screen
                name="Settings"
                component={DoctorSettings}
                options={{
                    title: 'Settings',
                    tabBarIconName: 'settings'
                }}
            />
        </Tab.Navigator>
    );
};

export default DoctorNavigator;
