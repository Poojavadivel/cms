/**
 * DispensingForm.js
 * Specialized form for dispensing medicines from an Intake
 */

import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { pharmacyService } from '../../../services';

const DispensingForm = ({ route, navigation }) => {
    const { intake } = route.params;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [items, setItems] = useState(intake.pharmacyItems || []);
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.unitPrice || item.price || 0)), 0);
    };

    const handleDispense = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                intakeId: intake._id || intake.id,
                patientId: intake.patientId,
                patientName: intake.patientName,
                appointmentId: intake.appointmentId,
                items: items,
                notes: notes,
                paymentMethod: paymentMethod,
                paid: true // Assuming paid for mobile dispensing simplicity
            };

            await pharmacyService.dispensePrescription(intake._id || intake.id, payload);

            Alert.alert('Success', 'Prescription dispensed and stock updated.');
            if (route.params.onRefresh) route.params.onRefresh();
            navigation.goBack();
        } catch (error) {
            console.error('Dispensing Error:', error);
            Alert.alert('Error', error.message || 'Failed to dispense prescription');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Dispense Prescription</Text>
                    <Text style={styles.headerSubtitle}>{intake.patientName}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Prescribed Items</Text>
                    {items.map((item, index) => (
                        <View key={index} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemName}>{item.name || item.Medicine || 'Unknown'}</Text>
                                <Text style={styles.itemQty}>x{item.quantity}</Text>
                            </View>
                            <Text style={styles.itemDetail}>
                                {item.dosage} • {item.frequency} • {item.duration}
                            </Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Unit Price:</Text>
                                <Text style={styles.priceValue}>₹{item.unitPrice || item.price || 0}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dispensing Details</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Handover Notes</Text>
                        <TextInput
                            style={styles.textArea}
                            multiline
                            numberOfLines={3}
                            placeholder="Add any instructions for the patient..."
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>

                    <Text style={styles.label}>Payment Method</Text>
                    <View style={styles.paymentMethods}>
                        {['Cash', 'UPI', 'Card'].map(method => (
                            <TouchableOpacity
                                key={method}
                                style={[styles.methodBtn, paymentMethod === method && styles.methodBtnActive]}
                                onPress={() => setPaymentMethod(method)}
                            >
                                <Text style={[styles.methodText, paymentMethod === method && styles.methodTextActive]}>
                                    {method}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Amount</Text>
                        <Text style={styles.summaryValue}>₹{calculateTotal().toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleDispense}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : (
                        <>
                            <MaterialIcons name="local-shipping" size={20} color="#FFFFFF" />
                            <Text style={styles.submitButtonText}>Confirm & Dispense</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingTop: 40 },
    backButton: { padding: 4 },
    headerTitles: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
    itemCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    itemQty: { fontSize: 14, fontWeight: '700', color: '#3B82F6' },
    itemDetail: { fontSize: 13, color: '#64748B', marginTop: 4 },
    priceRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, gap: 4 },
    priceLabel: { fontSize: 12, color: '#94A3B8' },
    priceValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
    textArea: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 14, color: '#1E293B', height: 80, textAlignVertical: 'top' },
    paymentMethods: { flexDirection: 'row', gap: 10 },
    methodBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#FFFFFF' },
    methodBtnActive: { borderColor: '#10B981', backgroundColor: '#D1FAE5' },
    methodText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    methodTextActive: { color: '#065F46' },
    summaryCard: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, marginTop: 10 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 14, fontWeight: '600', color: '#475569' },
    summaryValue: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    submitButton: { backgroundColor: '#10B981', borderRadius: 10, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    submitButtonDisabled: { backgroundColor: '#94A3B8' },
    submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' }
});

export default DispensingForm;
