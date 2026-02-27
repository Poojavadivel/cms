/**
 * StaffDetail.js
 * Read-only detail view for Staff
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const StaffDetail = ({ route, navigation }) => {
    const { staff } = route.params;

    const handleEdit = () => {
        navigation.navigate('StaffForm', { staffMember: staff });
    };

    const handleCall = () => {
        if (staff.contact) Linking.openURL(`tel:${staff.contact}`);
    };

    const handleEmail = () => {
        if (staff.email) Linking.openURL(`mailto:${staff.email}`);
    };

    const DetailSection = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>{children}</View>
        </View>
    );

    const DetailRow = ({ icon, label, value, isLink, onPress }) => (
        <TouchableOpacity
            style={styles.detailRow}
            activeOpacity={isLink ? 0.7 : 1}
            onPress={isLink ? onPress : null}
            disabled={!isLink}
        >
            <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={20} color="#64748B" />
            </View>
            <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={[styles.detailValue, isLink && styles.linkText]}>{value || 'N/A'}</Text>
            </View>
            {isLink && <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />}
        </TouchableOpacity>
    );

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'available': return { bg: '#DCFCE7', text: '#16A34A' };
            case 'busy': return { bg: '#FEE2E2', text: '#DC2626' };
            case 'on leave': return { bg: '#FEF3C7', text: '#D97706' };
            default: return { bg: '#F1F5F9', text: '#64748B' };
        }
    };

    const statusStyle = getStatusColor(staff.status);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Staff Details</Text>
                <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                    <MaterialIcons name="edit" size={22} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Banner */}
                <View style={styles.banner}>
                    <View style={[styles.avatar, { backgroundColor: staff.gender === 'Female' ? '#FCE7F3' : '#DBEAFE' }]}>
                        <MaterialIcons name="person" size={40} color={staff.gender === 'Female' ? '#EC4899' : '#3B82F6'} />
                    </View>
                    <Text style={styles.name}>{staff.name}</Text>
                    <Text style={styles.role}>{staff.designation} • {staff.department}</Text>

                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{staff.status || 'Unknown'}</Text>
                    </View>
                </View>

                {/* Contact Info */}
                <DetailSection title="Contact Information">
                    <DetailRow icon="email" label="Email" value={staff.email} isLink onPress={handleEmail} />
                    <DetailRow icon="phone" label="Phone" value={staff.contact} isLink onPress={handleCall} />
                    <DetailRow icon="location-on" label="Address" value={staff.address} />
                    <DetailRow icon="contact-phone" label="Emergency Contact" value={staff.emergencyContact} />
                </DetailSection>

                {/* Employment Info */}
                <DetailSection title="Employment Details">
                    <DetailRow icon="badge" label="Staff ID" value={staff.patientFacingId} />
                    <DetailRow icon="business" label="Department" value={staff.department} />
                    <DetailRow icon="work" label="Designation" value={staff.designation} />
                    <DetailRow icon="schedule" label="Shift" value={staff.shift} />
                    <DetailRow icon="place" label="Location" value={staff.location} />
                    <DetailRow icon="timeline" label="Experience" value={staff.experienceYears ? `${staff.experienceYears} Years` : null} />
                    <DetailRow icon="event" label="Joined" value={staff.joinedAt ? new Date(staff.joinedAt).toLocaleDateString() : null} />
                </DetailSection>

                {/* Other Info */}
                <DetailSection title="Other Details">
                    <DetailRow icon="wc" label="Gender" value={staff.gender} />
                    <DetailRow icon="cake" label="Date of Birth" value={staff.dob ? new Date(staff.dob).toLocaleDateString() : null} />
                    {staff.notes?.general && (
                        <View style={styles.noteContainer}>
                            <Text style={styles.noteLabel}>Notes</Text>
                            <Text style={styles.noteText}>{staff.notes.general}</Text>
                        </View>
                    )}
                </DetailSection>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
        paddingTop: Platform.OS === 'android' ? 16 : 0 // Adjust if needed
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    backButton: { padding: 4 },
    editButton: { padding: 4 },
    banner: {
        alignItems: 'center', padding: 24, backgroundColor: '#FFFFFF',
        borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 16
    },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center', marginBottom: 16
    },
    name: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 4, textAlign: 'center' },
    role: { fontSize: 14, color: '#64748B', marginBottom: 12, textAlign: 'center' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
    statusText: { fontSize: 12, fontWeight: '600' },
    section: { marginBottom: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0' },
    sectionTitle: {
        fontSize: 14, fontWeight: '700', color: '#475569',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F8FAFC',
        borderBottomWidth: 1, borderBottomColor: '#E2E8F0', textTransform: 'uppercase'
    },
    sectionContent: { paddingLeft: 16 },
    detailRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingRight: 16,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    iconContainer: { width: 40, alignItems: 'center' },
    detailInfo: { flex: 1 },
    detailLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
    detailValue: { fontSize: 15, color: '#1E293B' },
    linkText: { color: '#3B82F6' },
    noteContainer: { padding: 16 },
    noteLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
    noteText: { fontSize: 14, color: '#334155', lineHeight: 20 },
});

export default StaffDetail;
