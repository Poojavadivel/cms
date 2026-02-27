/**
 * Settings Screen - Shared across all roles
 * Port of modules/admin/settings/Settings.jsx
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../../../provider';

const AdminSettings = () => {
    const { user, signOut } = useApp();

    const settingsGroups = [
        {
            title: 'Account',
            items: [
                { icon: 'person', label: 'Profile', subtitle: user?.fullName || 'View profile' },
                { icon: 'lock', label: 'Change Password', subtitle: 'Update your password' },
                { icon: 'email', label: 'Email', subtitle: user?.email || 'Update email' },
            ],
        },
        {
            title: 'Preferences',
            items: [
                { icon: 'camera-alt', label: 'Scan Upload', subtitle: 'OCR & Auto-link reports', route: 'ScanUpload' },
                { icon: 'notifications', label: 'Notifications', subtitle: 'Manage notifications', hasToggle: true },
                { icon: 'dark-mode', label: 'Dark Mode', subtitle: 'Coming soon', hasToggle: true, disabled: true },
                { icon: 'language', label: 'Language', subtitle: 'English' },
            ],
        },
        {
            title: 'About',
            items: [
                { icon: 'info', label: 'App Version', subtitle: 'v1.0.0' },
                { icon: 'security', label: 'Privacy Policy', subtitle: 'View policy' },
                { icon: 'help', label: 'Help & Support', subtitle: 'Get help' },
            ],
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <View>
                        <Text style={styles.pageTitle}>SETTINGS</Text>
                        <Text style={styles.pageSubtitle}>System configuration and user profile management</Text>
                    </View>
                </View>
                {settingsGroups.map((group, gi) => (
                    <View key={gi} style={styles.group}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={styles.groupCard}>
                            {group.items.map((item, ii) => (
                                <TouchableOpacity
                                    key={ii}
                                    style={[styles.settingsItem, ii < group.items.length - 1 && styles.itemBorder]}
                                    activeOpacity={0.6}
                                    disabled={item.disabled}
                                    onPress={() => item.route && navigation.navigate(item.route)}
                                >
                                    <View style={styles.itemLeft}>
                                        <MaterialIcons name={item.icon} size={22} color="#3B82F6" />
                                        <View style={styles.itemText}>
                                            <Text style={styles.itemLabel}>{item.label}</Text>
                                            <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                                        </View>
                                    </View>
                                    {item.hasToggle ? (
                                        <Switch
                                            value={false}
                                            disabled={item.disabled}
                                            trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                                            thumbColor={false ? '#3B82F6' : '#CBD5E1'}
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
                <TouchableOpacity style={styles.logoutButton} onPress={() => signOut()} activeOpacity={0.7}>
                    <MaterialIcons name="logout" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>MOVI HOSPITAL • HMS v1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
    pageHeader: { paddingTop: 40, paddingBottom: 24, paddingHorizontal: 16, backgroundColor: '#F8FAFC' },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
    group: { marginBottom: 20 },
    groupTitle: { fontSize: 13, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
    groupCard: { backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
    itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    itemText: { flex: 1 },
    itemLabel: { fontSize: 14, fontWeight: '500', color: '#1E293B' },
    itemSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginBottom: 16 },
    logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
    footer: { alignItems: 'center', paddingBottom: 32 },
    footerText: { fontSize: 12, color: '#94A3B8' },
});

export default AdminSettings;
