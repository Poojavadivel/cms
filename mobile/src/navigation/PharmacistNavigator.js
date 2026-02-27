/**
 * PharmacistNavigator.js
 * Bottom Tab navigation for Pharmacist role
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../provider';
import { AppColors } from '../provider/ThemeContext';
import BottomTabBar from '../components/common/BottomTabBar';

import PharmacistDashboard from '../modules/pharmacist/Dashboard';
import PharmacistMedicines from '../modules/pharmacist/Medicines';
import PharmacistPrescriptions from '../modules/pharmacist/Prescriptions';
import PharmacistIntakeQueue from '../modules/pharmacist/IntakeQueue';
import PharmacistSettings from '../modules/pharmacist/Settings';

const Tab = createBottomTabNavigator();

const PharmacistNavigator = () => {
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
                component={PharmacistDashboard}
                options={{
                    title: 'Dashboard',
                    tabBarIconName: 'dashboard'
                }}
            />
            <Tab.Screen
                name="Medicines"
                component={PharmacistMedicines}
                options={{
                    title: 'Medicines',
                    tabBarIconName: 'medication'
                }}
            />
            <Tab.Screen
                name="Prescriptions"
                component={PharmacistPrescriptions}
                options={{
                    title: 'Prescriptions',
                    tabBarIconName: 'description'
                }}
            />
            <Tab.Screen
                name="Settings"
                component={PharmacistSettings}
                options={{
                    title: 'Settings',
                    tabBarIconName: 'settings'
                }}
            />
        </Tab.Navigator>
    );
};

export default PharmacistNavigator;
