/**
 * PatientDetail.js
 * Read-only detail view for Patients
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const PatientDetail = ({ route, navigation }) => {
    const { patient } = route.params;

    const handleEdit = () => {
        navigation.navigate('PatientForm', { patient });
    };

    const handleCall = () => {
        if (patient.phone) Linking.openURL(`tel:${patient.phone}`);
    };

    const handleEmail = () => {
        if (patient.email) Linking.openURL(`mailto:${patient.email}`);
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

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Patient Details</Text>
                <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                    <MaterialIcons name="edit" size={22} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Banner */}
                <View style={styles.banner}>
                    {patient.profileImage ? (
                        <Image source={{ uri: patient.profileImage }} style={styles.profileImage} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: patient.gender === 'Female' ? '#FCE7F3' : '#DBEAFE' }]}>
                            <MaterialIcons name="person" size={40} color={patient.gender === 'Female' ? '#EC4899' : '#3B82F6'} />
                        </View>
                    )}
                    <Text style={styles.name}>{patient.name}</Text>
                    <Text style={styles.role}>
                        {patient.gender} • {patient.age ? `${patient.age} years` : (patient.dateOfBirth || 'DOB N/A')}
                    </Text>
                    {patient.bloodGroup && (
                        <View style={styles.bloodBadge}>
                            <MaterialIcons name="opacity" size={14} color="#EF4444" />
                            <Text style={styles.bloodText}>{patient.bloodGroup}</Text>
                        </View>
                    )}
                </View>

                {/* Contact Info */}
                <DetailSection title="Contact Information">
                    <DetailRow icon="email" label="Email" value={patient.email} isLink onPress={handleEmail} />
                    <DetailRow icon="phone" label="Phone" value={patient.phone} isLink onPress={handleCall} />
                    <DetailRow icon="location-on" label="Address" value={`${patient.address || ''} ${patient.city || ''} ${patient.state || ''}`.trim()} />
                </DetailSection>

                {/* Emergency Contact */}
                <DetailSection title="Emergency Contact">
                    <DetailRow icon="person" label="Name" value={patient.emergencyContactName} />
                    <DetailRow icon="contact-phone" label="Phone" value={patient.emergencyContact} isLink onPress={() => patient.emergencyContact && Linking.openURL(`tel:${patient.emergencyContact}`)} />
                </DetailSection>

                {/* Medical Info */}
                <DetailSection title="Medical Information">
                    <DetailRow icon="healing" label="Allergies" value={patient.allergies} />
                    <DetailRow icon="history" label="Medical History" value={patient.medicalHistory} />
                    <DetailRow icon="verified-user" label="Insurance Provider" value={patient.insuranceProvider} />
                    <DetailRow icon="confirmation-number" label="Insurance Number" value={patient.insuranceNumber} />
                </DetailSection>

                {/* Vitals History (Chart) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vitals History (Last 6 Months)</Text>
                    <View style={styles.chartContainer}>
                        <LineChart
                            data={{
                                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                                datasets: [
                                    { data: [120, 118, 122, 119, 124, 121], color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, strokeWidth: 2 }, // Sys
                                    { data: [80, 78, 82, 79, 84, 80], color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, strokeWidth: 2 } // Dia
                                ],
                                legend: ["Systolic", "Diastolic"]
                            }}
                            width={Dimensions.get("window").width - 40} // from react-native
                            height={220}
                            yAxisSuffix=""
                            yAxisInterval={1}
                            chartConfig={{
                                backgroundColor: "#ffffff",
                                backgroundGradientFrom: "#ffffff",
                                backgroundGradientTo: "#ffffff",
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "4", strokeWidth: "2", stroke: "#FFF" }
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    </View>
                </View>

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
    profileImage: {
        width: 80, height: 80, borderRadius: 40, marginBottom: 16,
        borderWidth: 1, borderColor: '#E2E8F0'
    },
    name: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 4, textAlign: 'center' },
    role: { fontSize: 14, color: '#64748B', marginBottom: 12, textAlign: 'center' },
    bloodBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16,
        backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA'
    },
    bloodText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
    section: { marginBottom: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0' },
    sectionTitle: {
        fontSize: 14, fontWeight: '700', color: '#475569',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F8FAFC',
        borderBottomWidth: 1, borderBottomColor: '#E2E8F0', textTransform: 'uppercase'
    },
    chartContainer: { alignItems: 'center', padding: 16, overflow: 'hidden' },
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
});

export default PatientDetail;
