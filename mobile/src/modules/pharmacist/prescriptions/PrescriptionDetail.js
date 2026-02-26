/**
 * Prescription Detail View
 * Allows pharmacists to view prescription details and dispense medicines
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { pharmacyService } from '../../../services';

const PrescriptionDetail = ({ route, navigation }) => {
    const { prescription } = route.params;
    const [isDispensing, setIsDispensing] = useState(false);
    const [status, setStatus] = useState(prescription.status || 'Pending');

    const handleDispense = async () => {
        setIsDispensing(true);
        try {
            await pharmacyService.dispensePrescription(prescription._id || prescription.id);
            setStatus('Dispensed');
            Alert.alert('Success', 'Medicines dispensed successfully');
            // Notify previous screen to refresh if needed
            if (route.params.onRefresh) route.params.onRefresh();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to dispense medicines');
        } finally {
            setIsDispensing(false);
        }
    };

    const isDispensed = status.toLowerCase() === 'dispensed';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Prescription Details</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Patient Info */}
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={styles.avatar}>
                            <MaterialIcons name="person" size={24} color="#3B82F6" />
                        </View>
                        <View>
                            <Text style={styles.label}>Patient</Text>
                            <Text style={styles.value}>{prescription.patientName || 'Unknown Patient'}</Text>
                        </View>
                    </View>
                    <View style={[styles.row, { marginTop: 12 }]}>
                        <View style={[styles.avatar, { backgroundColor: '#EDE9FE' }]}>
                            <MaterialIcons name="medical-services" size={24} color="#8B5CF6" />
                        </View>
                        <View>
                            <Text style={styles.label}>Doctor</Text>
                            <Text style={styles.value}>Dr. {prescription.doctorName || 'Unknown Doctor'}</Text>
                        </View>
                    </View>
                    <View style={[styles.row, { marginTop: 12 }]}>
                        <View style={[styles.avatar, { backgroundColor: '#FFF7ED' }]}>
                            <MaterialIcons name="event" size={24} color="#F97316" />
                        </View>
                        <View>
                            <Text style={styles.label}>Date</Text>
                            <Text style={styles.value}>{new Date(prescription.date || Date.now()).toLocaleDateString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Medicines List */}
                <Text style={styles.sectionTitle}>Prescribed Medicines</Text>
                <View style={styles.card}>
                    {prescription.medicines && prescription.medicines.length > 0 ? (
                        prescription.medicines.map((med, index) => (
                            <View key={index} style={[styles.medicineItem, index !== prescription.medicines.length - 1 && styles.borderBottom]}>
                                <View style={styles.medIcon}>
                                    <MaterialIcons name="medication" size={20} color="#3B82F6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.medName}>{med.name || med.medicineName}</Text>
                                    <Text style={styles.medDosage}>
                                        {med.dosage || ''} {med.frequency ? `• ${med.frequency}` : ''} {med.duration ? `• ${med.duration}` : ''}
                                    </Text>
                                    {med.notes ? <Text style={styles.medNotes}>Note: {med.notes}</Text> : null}
                                </View>
                                <Text style={styles.medQty}>x{med.quantity || 1}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No medicines listed</Text>
                    )}
                </View>

                {/* Status */}
                <View style={[styles.card, styles.statusCard]}>
                    <Text style={styles.label}>Status</Text>
                    <View style={[styles.badge, { backgroundColor: isDispensed ? '#DCFCE7' : '#FEF3C7' }]}>
                        <Text style={[styles.badgeText, { color: isDispensed ? '#16A34A' : '#D97706' }]}>
                            {status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer Action */}
            {!isDispensed && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.dispenseBtn}
                        onPress={handleDispense}
                        disabled={isDispensing}
                    >
                        {isDispensing ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <MaterialIcons name="check-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.btnText}>Dispense Medicines</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginTop: 30 },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    content: { flex: 1, padding: 16 },
    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    label: { fontSize: 12, color: '#64748B', marginBottom: 2 },
    value: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12, marginLeft: 4 },
    medicineItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    medIcon: { marginRight: 12, width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    medName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    medDosage: { fontSize: 13, color: '#64748B', marginTop: 2 },
    medNotes: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontStyle: 'italic' },
    medQty: { fontSize: 14, fontWeight: '700', color: '#3B82F6', marginLeft: 12 },
    emptyText: { textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' },
    statusCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    dispenseBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default PrescriptionDetail;
