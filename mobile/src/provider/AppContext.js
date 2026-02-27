/**
 * AppContext.js
 * Central state management using React Context API
 * Port from web AppContext.js - uses AsyncStorage instead of localStorage
 */

import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Admin } from '../models/Admin';
import { Doctor } from '../models/Doctor';
import { Pharmacist } from '../models/Pharmacist';
import { Pathologist } from '../models/Pathologist';

const AppContext = React.createContext(undefined);

/**
 * AppProvider Component
 */
export const AppProvider = ({ children }) => {
    const [user, setUserState] = React.useState(null);
    const [token, setTokenState] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

    // Initialize state from AsyncStorage on mount
    React.useEffect(() => {
        const loadStoredAuth = async () => {
            setIsCheckingAuth(true);
            try {
                const storedToken = await AsyncStorage.getItem('auth_token');
                const storedUser = await AsyncStorage.getItem('authUser');

                if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
                    const userData = JSON.parse(storedUser);
                    setTokenState(storedToken);

                    let reconstructedUser = null;
                    if (userData.role === 'admin' || userData.role === 'superadmin') {
                        reconstructedUser = Admin.fromJSON(userData);
                    } else if (userData.role === 'doctor') {
                        reconstructedUser = Doctor.fromJSON(userData);
                    } else if (userData.role === 'pharmacist') {
                        reconstructedUser = Pharmacist.fromJSON(userData);
                    } else if (userData.role === 'pathologist') {
                        reconstructedUser = Pathologist.fromJSON(userData);
                    }

                    if (reconstructedUser) {
                        setUserState(reconstructedUser);
                        console.log('✅ [AppContext] Restored user:', userData.fullName);
                    } else {
                        await AsyncStorage.multiRemove(['auth_token', 'authUser']);
                    }
                } else {
                    if (storedUser === 'undefined' || storedUser === 'null') {
                        await AsyncStorage.multiRemove(['authUser', 'auth_token']);
                    }
                }
            } catch (error) {
                console.error('❌ [AppContext] Error loading stored auth:', error);
                await AsyncStorage.multiRemove(['auth_token', 'authUser']);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        loadStoredAuth();
    }, []);

    const setUser = React.useCallback(async (newUser, newToken) => {
        setUserState(newUser);
        setTokenState(newToken);

        if (newUser && newToken) {
            try {
                await AsyncStorage.setItem('auth_token', newToken);
                await AsyncStorage.setItem('authUser', JSON.stringify(newUser.toJSON()));
            } catch (error) {
                console.error('Error saving auth:', error);
            }
        }
    }, []);

    const signOut = React.useCallback(async () => {
        setUserState(null);
        setTokenState(null);
        await AsyncStorage.multiRemove(['auth_token', 'authUser', 'selectedModule']);
    }, []);

    const updateUser = React.useCallback(async (updatedUser) => {
        setUserState(updatedUser);
        if (updatedUser) {
            try {
                await AsyncStorage.setItem('authUser', JSON.stringify(updatedUser.toJSON()));
            } catch (error) {
                console.error('Error updating user data:', error);
            }
        }
    }, []);

    const isLoggedIn = user !== null && token !== null;
    const isAdmin = user instanceof Admin;
    const isDoctor = user instanceof Doctor;
    const isPharmacist = user instanceof Pharmacist;
    const isPathologist = user instanceof Pathologist;
    const userRole = user ? user.role : null;
    const userId = user ? user.id : null;
    const userName = user ? user.fullName : null;

    const value = {
        user, token, isLoading, isCheckingAuth,
        setUser, signOut, updateUser, setIsLoading,
        isLoggedIn, isAdmin, isDoctor, isPharmacist, isPathologist,
        userRole, userId, userName,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = React.useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export default AppContext;
