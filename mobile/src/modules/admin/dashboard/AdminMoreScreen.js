import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../../../provider';

const AdminMoreScreen = ({ navigation }) => {
    const { user, signOut } = useApp();

    const secondaryItems = [
        { icon: 'receipt', label: 'Payroll', route: 'Invoice' },
        { icon: 'biotech', label: 'Pathology', route: 'Pathology' },
        { icon: 'local-pharmacy', label: 'Pharmacy', route: 'Pharmacy' },
        { icon: 'camera-alt', label: 'Scan Upload', route: 'ScanUpload' },
        { icon: 'settings', label: 'Settings', route: 'Settings' },
    ];

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.profileCard}>
                <View style={styles.profileMain}>
                    <View style={styles.avatar}>
                        <MaterialIcons name="admin-panel-settings" size={32} color="#3B82F6" />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.fullName || 'Admin User'}</Text>
                        <Text style={styles.profileEmail}>{user?.email || 'admin@hms.com'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <MaterialIcons name="logout" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>ADDITIONAL MODULES</Text>
            <View style={styles.grid}>
                {secondaryItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.gridItem}
                        onPress={() => navigation.navigate(item.route)}
                    >
                        <View style={styles.iconCircle}>
                            <MaterialIcons name={item.icon} size={26} color="#3B82F6" />
                        </View>
                        <Text style={styles.gridLabel}>{item.label}</Text>
                        <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { padding: 16 },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    profileMain: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    profileEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        gap: 8,
    },
    logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },

    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 12,
        paddingLeft: 4,
    },
    grid: { gap: 12 },
    gridItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        gap: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
});

export default AdminMoreScreen;
