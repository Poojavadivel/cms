/**
 * PathologistNavigator.js
 * Bottom Tab navigation for Pathologist role
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../provider';
import { AppColors } from '../provider/ThemeContext';
import BottomTabBar from '../components/common/BottomTabBar';

import PathologistDashboard from '../modules/pathologist/dashboard/Dashboard';
import PathologistTestReports from '../modules/pathologist/test_reports/TestReports';
import PathologistTestQueue from '../modules/pathologist/test_reports/TestQueue';
import PathologistPatients from '../modules/pathologist/patients/Patients';
import PathologistSettings from '../modules/pathologist/settings/Settings';

const Tab = createBottomTabNavigator();

const PathologistNavigator = () => {
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
                component={PathologistDashboard}
                options={{
                    title: 'Dashboard',
                    tabBarIconName: 'dashboard'
                }}
            />
            <Tab.Screen
                name="TestReports"
                component={PathologistTestReports}
                options={{
                    title: 'Reports',
                    tabBarIconName: 'science'
                }}
            />
            <Tab.Screen
                name="Patients"
                component={PathologistPatients}
                options={{
                    title: 'Patients',
                    tabBarIconName: 'people'
                }}
            />
            <Tab.Screen
                name="Settings"
                component={PathologistSettings}
                options={{
                    title: 'Settings',
                    tabBarIconName: 'settings'
                }}
            />
        </Tab.Navigator>
    );
};

export default PathologistNavigator;
