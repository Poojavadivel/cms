import React, { useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    Switch, Image, ActivityIndicator, Dimensions, Modal,
    TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../provider';
import authService from '../../../services/authService';

const { width, height } = Dimensions.get('window');

const DoctorSettings = () => {
    const { user, signOut, setUser } = useApp();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // UI States
    const [isProfileModalVisible, setProfileModalVisible] = useState(false);
    const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Form States - Profile
    const [profileForm, setProfileForm] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        specialization: user?.specialization || 'Senior Surgeon',
        qualification: user?.qualification || 'MBBS, MD'
    });

    // Form States - Security
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    const handleUpdateProfile = async () => {
        if (!profileForm.fullName.trim()) return Alert.alert('Error', 'Full Name is required');

        setIsUpdating(true);
        try {
            const updatedUser = await authService.put('/users/profile', profileForm);
            setUser(updatedUser);
            Alert.alert('Success', 'Profile updated successfully');
            setProfileModalVisible(false);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleChangePassword = async () => {
        const { currentPassword, newPassword, confirmPassword } = passwordForm;
        if (!currentPassword || !newPassword) return Alert.alert('Error', 'All fields are required');
        if (newPassword !== confirmPassword) return Alert.alert('Error', 'New passwords do not match');
        if (newPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');

        setIsUpdating(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            Alert.alert('Success', 'Password changed successfully');
            setPasswordModalVisible(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to change password');
        } finally {
            setIsUpdating(false);
        }
    };

    const groups = [
        {
            title: 'Account & Security',
            items: [
                { id: 'profile', icon: 'person-outline', label: 'Personal Information', sub: 'Update your professional details', color: '#3B82F6', onPress: () => setProfileModalVisible(true) },
                { id: 'password', icon: 'lock-closed-outline', label: 'Security & Password', sub: 'Manage your credentials', color: '#10B981', onPress: () => setPasswordModalVisible(true) },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { id: 'notifications', icon: 'notifications-outline', label: 'Push Notifications', sub: 'Real-time appointment alerts', toggle: true, color: '#F59E0B' },
                { id: 'language', icon: 'globe-outline', label: 'App Language', sub: 'English (US)', color: '#8B5CF6' },
            ]
        },
        {
            title: 'Support & About',
            items: [
                { id: 'help', icon: 'help-circle-outline', label: 'Help Center', sub: 'FAQs and support tickets', color: '#64748B' },
                { id: 'privacy', icon: 'shield-checkmark-outline', label: 'Privacy Policy', sub: 'Data handling standards', color: '#64748B' },
                { id: 'version', icon: 'information-circle-outline', label: 'App Version', sub: 'v1.2.4 (Premium Build)', color: '#64748B' },
            ]
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.pageHeader}>
                    <View>
                        <Text style={styles.pageTitle}>SETTINGS</Text>
                        <Text style={styles.pageSubtitle}>Manage your profile and app preferences</Text>
                    </View>
                </View>

                {/* Profile Section */}
                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarWrapper}>
                            {user?.profileImage ? (
                                <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{(user?.fullName || 'D')[0]}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.userName}>{user?.fullName || 'Dr. Sanjit Doctor'}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>{user?.specialization?.toUpperCase() || 'SENIOR SURGEON'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.editHeaderBtn} onPress={() => setProfileModalVisible(true)}>
                            <Feather name="edit-3" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.profileDivider} />

                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <View style={[styles.infoIcon, { backgroundColor: '#EFF6FF' }]}>
                                <Feather name="mail" size={14} color="#3B82F6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>EMAIL</Text>
                                <Text style={styles.infoValue} numberOfLines={1}>{user?.email || 'dr.sanjit@hms.com'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoItem}>
                            <View style={[styles.infoIcon, { backgroundColor: '#F0FDF4' }]}>
                                <Feather name="phone" size={14} color="#10B981" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>PHONE</Text>
                                <Text style={styles.infoValue}>{user?.phone || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Menu Groups */}
                {groups.map((group, gIndex) => (
                    <View key={gIndex} style={styles.groupSection}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={styles.menuCard}>
                            {group.items.map((item, iIndex) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.menuItem, iIndex < group.items.length - 1 && styles.menuBorder]}
                                    activeOpacity={0.7}
                                    onPress={item.onPress}
                                    disabled={item.toggle}
                                >
                                    <View style={styles.menuLeft}>
                                        <View style={[styles.menuIconBox, { backgroundColor: `${item.color}10` }]}>
                                            <Ionicons name={item.icon} size={20} color={item.color} />
                                        </View>
                                        <View>
                                            <Text style={styles.menuLabel}>{item.label}</Text>
                                            <Text style={styles.menuSub}>{item.sub}</Text>
                                        </View>
                                    </View>
                                    {item.toggle ? (
                                        <Switch
                                            value={notificationsEnabled}
                                            onValueChange={setNotificationsEnabled}
                                            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                                            thumbColor={notificationsEnabled ? '#3B82F6' : '#F8FAFC'}
                                        />
                                    ) : (
                                        <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut()} activeOpacity={0.8}>
                    <View style={styles.logoutIconContent}>
                        <MaterialIcons name="logout" size={20} color="#EF4444" />
                        <Text style={styles.logoutBtnText}>Sign Out of System</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Powered by MOVI HMS • Build 240216</Text>
                </View>
            </ScrollView>

            {/* Profile Update Modal */}
            <Modal visible={isProfileModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Profile</Text>
                            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={profileForm.fullName}
                                onChangeText={(val) => setProfileForm({ ...profileForm, fullName: val })}
                                placeholder="Enter full name"
                            />

                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={profileForm.phone}
                                onChangeText={(val) => setProfileForm({ ...profileForm, phone: val })}
                                placeholder="Enter phone"
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.inputLabel}>Specialization</Text>
                            <TextInput
                                style={styles.input}
                                value={profileForm.specialization}
                                onChangeText={(val) => setProfileForm({ ...profileForm, specialization: val })}
                                placeholder="e.g. Cardiology"
                            />

                            <Text style={styles.inputLabel}>Qualification</Text>
                            <TextInput
                                style={styles.input}
                                value={profileForm.qualification}
                                onChangeText={(val) => setProfileForm({ ...profileForm, qualification: val })}
                                placeholder="e.g. MBBS, MD"
                            />

                            <TouchableOpacity
                                style={[styles.submitBtn, isUpdating && styles.disabledBtn]}
                                onPress={handleUpdateProfile}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Password Modal */}
            <Modal visible={isPasswordModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Security & Password</Text>
                            <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Current Password</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={passwordForm.currentPassword}
                                    onChangeText={(val) => setPasswordForm({ ...passwordForm, currentPassword: val })}
                                    placeholder="Enter current password"
                                    secureTextEntry={!showPasswords.current}
                                />
                                <TouchableOpacity onPress={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}>
                                    <Feather name={showPasswords.current ? "eye" : "eye-off"} size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>New Password</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={passwordForm.newPassword}
                                    onChangeText={(val) => setPasswordForm({ ...passwordForm, newPassword: val })}
                                    placeholder="Enter new password (min 6 chars)"
                                    secureTextEntry={!showPasswords.new}
                                />
                                <TouchableOpacity onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                                    <Feather name={showPasswords.new ? "eye" : "eye-off"} size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>Confirm New Password</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={passwordForm.confirmPassword}
                                    onChangeText={(val) => setPasswordForm({ ...passwordForm, confirmPassword: val })}
                                    placeholder="Re-type new password"
                                    secureTextEntry={!showPasswords.confirm}
                                />
                                <TouchableOpacity onPress={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                                    <Feather name={showPasswords.confirm ? "eye" : "eye-off"} size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, isUpdating && styles.disabledBtn]}
                                onPress={handleChangePassword}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Update Password</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingBottom: 40 },

    pageHeader: { paddingTop: 40, paddingBottom: 24, paddingHorizontal: 20 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },

    profileCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 28 },
    profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 72, height: 72, borderRadius: 24 },
    avatarPlaceholder: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DBEAFE' },
    avatarText: { fontSize: 24, fontWeight: '900', color: '#3B82F6' },
    profileInfo: { gap: 6, flex: 1 },
    userName: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    roleBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
    roleText: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
    editHeaderBtn: { padding: 8, borderRadius: 12, backgroundColor: '#F0F9FF' },

    profileDivider: { height: 1.5, backgroundColor: '#F8FAFC', marginVertical: 20 },
    infoGrid: { flexDirection: 'row', gap: 20 },
    infoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    infoLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    infoValue: { fontSize: 12, fontWeight: '700', color: '#3B82F6', marginTop: 1 },

    groupSection: { paddingHorizontal: 16, marginBottom: 24 },
    groupTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginLeft: 4 },
    menuCard: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    menuIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    menuLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    menuSub: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '500' },

    logoutBtn: { backgroundColor: '#FEE2E2', marginHorizontal: 16, borderRadius: 20, padding: 18, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#FECACA' },
    logoutIconContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoutBtnText: { fontSize: 15, fontWeight: '800', color: '#EF4444' },

    footer: { marginTop: 32, alignItems: 'center' },
    footerText: { fontSize: 11, fontWeight: '700', color: '#CBD5E1', letterSpacing: 0.5 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: height * 0.85, paddingBottom: 30 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    modalBody: { padding: 24 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, fontSize: 15, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingRight: 14 },
    passwordInput: { flex: 1, padding: 14, fontSize: 15, color: '#1E293B' },
    submitBtn: { backgroundColor: '#3B82F6', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 32, elevation: 4, shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 10 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    disabledBtn: { backgroundColor: '#94A3B8' },
});

export default DoctorSettings;
