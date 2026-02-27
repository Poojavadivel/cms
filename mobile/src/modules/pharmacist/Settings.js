/**
 * Pharmacist Settings - High-Fidelity Mobile Redesign
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Switch, Alert, Modal, TextInput } from 'react-native';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services';

const PharmacistSettings = ({ navigation }) => {
    const { user, signOut, setUser } = useApp();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    // Profile Modal State
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [profileForm, setProfileForm] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || ''
    });

    // Password Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => signOut() }
            ]
        );
    };

    const handleUpdateProfile = async () => {
        if (!profileForm.fullName.trim()) {
            Alert.alert('Error', 'Full Name is required');
            return;
        }

        setLoading(true);
        try {
            // Using generic profile update endpoint
            const updatedUser = await authService.put('/users/profile', profileForm);
            if (setUser) setUser(updatedUser);

            Alert.alert('Success', 'Profile updated successfully');
            setProfileModalVisible(false);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            Alert.alert('Success', 'Password updated successfully');
            setModalVisible(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const SettingItem = ({ icon, label, sub, onPress, type = 'link', value, onValueChange, color = '#3B82F6' }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={onPress}
            disabled={type === 'switch'}
            activeOpacity={0.7}
        >
            <View style={styles.left}>
                <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                    <Feather name={icon} size={20} color={color} />
                </View>
                <View>
                    <Text style={styles.label}>{label}</Text>
                    {sub && <Text style={styles.sub}>{sub}</Text>}
                </View>
            </View>
            {type === 'switch' ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                    thumbColor={value ? '#3B82F6' : '#FFF'}
                />
            ) : (
                <Feather name="chevron-right" size={20} color="#CBD5E1" />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Feather name="user" size={40} color="#6366F1" />
                        </View>
                        <TouchableOpacity style={styles.editBadge} onPress={() => setProfileModalVisible(true)}>
                            <Feather name="edit-2" size={12} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.name}>{user?.fullName || 'Pharmacist User'}</Text>
                    <Text style={styles.role}>Licensed Pharmacist • ID: {user?.id?.slice(-6).toUpperCase()}</Text>
                    <View style={styles.emailBadge}>
                        <Feather name="mail" size={12} color="#64748B" />
                        <Text style={styles.emailText}>{user?.email || 'pharmacist@hms.com'}</Text>
                    </View>
                </View>

                {/* Account Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="user"
                            label="Personal Information"
                            sub="Update your profile details"
                            onPress={() => setProfileModalVisible(true)}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="lock"
                            label="Security & Password"
                            sub="Change your password"
                            color="#F97316"
                            onPress={() => setModalVisible(true)}
                        />
                    </View>
                </View>

                {/* Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PREFERENCES</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="bell"
                            label="Notifications"
                            type="switch"
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            color="#8B5CF6"
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="shield"
                            label="Biometric Login"
                            type="switch"
                            value={biometricEnabled}
                            onValueChange={setBiometricEnabled}
                            color="#10B981"
                        />
                    </View>
                </View>

                {/* Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SUPPORT</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="help-circle"
                            label="Help Center"
                            color="#64748B"
                            onPress={() => { }}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="file-text"
                            label="Terms & Privacy"
                            color="#64748B"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Feather name="log-out" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0 (Build 2024)</Text>
            </ScrollView>

            {/* Profile Update Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={profileModalVisible}
                onRequestClose={() => setProfileModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Profile</Text>
                            <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={styles.closeBtn}>
                                <Feather name="x" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="user" size={18} color="#94A3B8" />
                                <TextInput
                                    style={styles.input}
                                    value={profileForm.fullName}
                                    onChangeText={(val) => setProfileForm({ ...profileForm, fullName: val })}
                                    placeholder="Enter full name"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="phone" size={18} color="#94A3B8" />
                                <TextInput
                                    style={styles.input}
                                    value={profileForm.phone}
                                    onChangeText={(val) => setProfileForm({ ...profileForm, phone: val })}
                                    placeholder="Enter phone number"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: '#F1F5F9' }]}>
                                <Feather name="mail" size={18} color="#94A3B8" />
                                <TextInput
                                    style={[styles.input, { color: '#64748B' }]}
                                    value={user?.email}
                                    editable={false}
                                />
                            </View>
                            <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, marginLeft: 4 }}>Email cannot be changed</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, loading && styles.saveBtnLoading]}
                            onPress={handleUpdateProfile}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text style={styles.saveBtnText}>Saving Changes...</Text>
                            ) : (
                                <>
                                    <Feather name="check" size={18} color="#FFF" />
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Feather name="x" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Current Password</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="lock" size={18} color="#94A3B8" />
                                <TextInput
                                    style={styles.input}
                                    secureTextEntry
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Enter current password"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>New Password</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="key" size={18} color="#94A3B8" />
                                <TextInput
                                    style={styles.input}
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Enter new password"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirm New Password</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="check-square" size={18} color="#94A3B8" />
                                <TextInput
                                    style={styles.input}
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm new password"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, loading && styles.saveBtnLoading]}
                            onPress={handleChangePassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text style={styles.saveBtnText}>Updating...</Text>
                            ) : (
                                <>
                                    <Feather name="check" size={18} color="#FFF" />
                                    <Text style={styles.saveBtnText}>Update Password</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingBottom: 40 },

    header: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#F8FAFC' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3B82F6', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
    name: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    role: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
    emailBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    emailText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

    section: { marginTop: 24, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 10, marginLeft: 4, letterSpacing: 1 },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 4, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },

    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    left: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    sub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F8FAFC', marginLeft: 70 },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', marginHorizontal: 20, marginTop: 32, padding: 16, borderRadius: 16, gap: 8 },
    logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
    versionText: { textAlign: 'center', fontSize: 11, color: '#CBD5E1', marginTop: 24, fontWeight: '500' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 450 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    closeBtn: { padding: 4 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, height: 50, gap: 10 },
    input: { flex: 1, fontSize: 15, color: '#1E293B' },
    saveBtn: { backgroundColor: '#3B82F6', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
    saveBtnLoading: { opacity: 0.7 },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});

export default PharmacistSettings;
