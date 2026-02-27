import React, { useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../provider';
import { authService } from '../../../services';

const PathologistSettings = () => {
    const { user, signOut } = useApp();
    const [isUpdating, setIsUpdating] = useState(false);
    const [availability, setAvailability] = useState('Available');

    // Password Form State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleUpdatePassword = async () => {
        const { currentPassword, newPassword, confirmPassword } = passwordForm;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return Alert.alert('Error', 'Please fill in all password fields');
        }
        if (newPassword !== confirmPassword) {
            return Alert.alert('Error', 'New passwords do not match');
        }
        if (newPassword.length < 6) {
            return Alert.alert('Error', 'Password must be at least 6 characters');
        }

        setIsUpdating(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            Alert.alert('Success', 'Password updated successfully');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update password');
        } finally {
            setIsUpdating(false);
        }
    };

    const StatusButton = ({ label, color, isActive }) => (
        <TouchableOpacity
            style={[
                styles.statusBtn,
                isActive && { borderColor: color, backgroundColor: `${color}10` }
            ]}
            onPress={() => setAvailability(label)}
        >
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusBtnText, isActive && { color }]}>{label}</Text>
        </TouchableOpacity>
    );

    const InfoField = ({ label, value, icon }) => (
        <View style={styles.infoField}>
            <View style={styles.fieldIconBox}>
                <Feather name={icon} size={14} color="#8B5CF6" />
            </View>
            <View>
                <Text style={styles.fieldLabel}>{label}</Text>
                <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeContainer} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
                <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                    <Feather name="log-out" size={16} color="#EF4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

                    {/* Profile Information */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Feather name="user" size={18} color="#8B5CF6" />
                            <Text style={styles.sectionTitle}>Profile Information</Text>
                        </View>

                        <View style={styles.profileCard}>
                            <View style={styles.avatarSection}>
                                <View style={styles.avatarLarge}>
                                    <Ionicons name="person" size={40} color="#FFF" />
                                </View>
                            </View>

                            <View style={styles.infoGrid}>
                                <View style={styles.infoRow}>
                                    <InfoField label="Full Name" value={user?.fullName} icon="user" />
                                    <InfoField label="Email" value={user?.email} icon="mail" />
                                </View>
                                <View style={styles.infoRow}>
                                    <InfoField label="Phone" value={user?.phone || 'N/A'} icon="phone" />
                                    <InfoField label="Role" value={user?.role?.toUpperCase() || 'PATHOLOGIST'} icon="briefcase" />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Availability Status */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Feather name="toggle-left" size={18} color="#8B5CF6" />
                            <Text style={styles.sectionTitle}>Availability Status</Text>
                        </View>

                        <View style={styles.statusGrid}>
                            <View style={styles.statusRow}>
                                <StatusButton label="Available" color="#8B5CF6" isActive={availability === 'Available'} />
                                <StatusButton label="Busy" color="#F59E0B" isActive={availability === 'Busy'} />
                            </View>
                            <View style={styles.statusRow}>
                                <StatusButton label="On Leave" color="#EF4444" isActive={availability === 'On Leave'} />
                                <StatusButton label="Off Duty" color="#64748B" isActive={availability === 'Off Duty'} />
                            </View>
                        </View>

                        <View style={styles.statusIndicator}>
                            <Text style={styles.indicatorLabel}>Current status: <Text style={styles.indicatorActive}>{availability}</Text></Text>
                        </View>
                    </View>

                    {/* Security */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Feather name="lock" size={18} color="#8B5CF6" />
                            <Text style={styles.sectionTitle}>Security</Text>
                        </View>

                        <View style={styles.securityCard}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Current Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Enter current password"
                                        secureTextEntry
                                        value={passwordForm.currentPassword}
                                        onChangeText={(val) => setPasswordForm({ ...passwordForm, currentPassword: val })}
                                    />
                                    <Feather name="eye" size={16} color="#94A3B8" />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>New Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Enter new password"
                                        secureTextEntry
                                        value={passwordForm.newPassword}
                                        onChangeText={(val) => setPasswordForm({ ...passwordForm, newPassword: val })}
                                    />
                                    <Feather name="eye" size={16} color="#94A3B8" />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Confirm New Password</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Confirm new password"
                                        secureTextEntry
                                        value={passwordForm.confirmPassword}
                                        onChangeText={(val) => setPasswordForm({ ...passwordForm, confirmPassword: val })}
                                    />
                                    <Feather name="eye" size={16} color="#94A3B8" />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.updateBtn, isUpdating && styles.disabledBtn]}
                                onPress={handleUpdatePassword}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <Feather name="save" size={16} color="#FFF" />
                                        <Text style={styles.updateBtnText}>Update Password</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                </KeyboardAvoidingView>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingBottom: 40 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, gap: 8 },
    logoutText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },

    section: { marginTop: 20, paddingHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },

    // Profile Card
    profileCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    avatarSection: { alignItems: 'center', marginBottom: 20 },
    avatarLarge: { width: 80, height: 80, borderRadius: 30, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#8B5CF6', shadowOpacity: 0.3, shadowRadius: 15 },

    infoGrid: { gap: 16 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    infoField: { flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 4 },
    fieldIconBox: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
    fieldLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
    fieldValue: { fontSize: 12, fontWeight: '800', color: '#1E293B', marginTop: 1 },

    // Status Grid
    statusGrid: { gap: 12 },
    statusRow: { flexDirection: 'row', gap: 12 },
    statusBtn: { flex: 1, height: 50, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },

    statusIndicator: { marginTop: 15, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12, alignItems: 'flex-start' },
    indicatorLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    indicatorActive: { color: '#1E293B', fontWeight: '900' },

    // Security Card
    securityCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', gap: 16 },
    inputGroup: { gap: 8 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    passwordInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#F1F5F9' },
    passwordInput: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500' },

    updateBtn: { backgroundColor: '#1E293B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 16, gap: 10, marginTop: 8 },
    updateBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    disabledBtn: { opacity: 0.7 }
});

export default PathologistSettings;
