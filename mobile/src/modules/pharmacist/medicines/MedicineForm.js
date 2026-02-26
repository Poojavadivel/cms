/**
 * MedicineForm.js - High-Fidelity Premium Version
 * Mobile Medicine Create/Edit Form for Pharmacy Module
 */

import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { pharmacyService } from '../../../services';

const MedicineForm = ({ route, navigation }) => {
    const { medicine } = route.params || {};
    const isEdit = !!medicine;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        manufacturer: '',
        quantity: 0,
        unit: 'units',
        batchNumber: '',
        expiryDate: '',
        price: 0,
        mrp: 0,
        description: '',
        dosage: '',
        sideEffects: '',
        contraindications: ''
    });

    useEffect(() => {
        if (medicine) {
            setFormData({
                name: medicine.name || '',
                category: medicine.category || '',
                manufacturer: medicine.manufacturer || '',
                quantity: medicine.quantity || 0,
                unit: medicine.unit || 'units',
                batchNumber: medicine.batchNumber || '',
                expiryDate: medicine.expiryDate || '',
                price: medicine.price || 0,
                mrp: medicine.mrp || medicine.price || 0,
                description: medicine.description || '',
                dosage: medicine.dosage || '',
                sideEffects: medicine.sideEffects || '',
                contraindications: medicine.contraindications || ''
            });
        }
    }, [medicine]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Required';
        if (!formData.category) newErrors.category = 'Required';
        if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Incomplete Form', 'Please fill in all mandatory fields.');
            return;
        }

        setIsSubmitting(true);
        try {
            const medicineData = {
                ...formData,
                quantity: parseInt(formData.quantity) || 0,
                price: parseFloat(formData.price) || 0,
                mrp: parseFloat(formData.mrp) || parseFloat(formData.price) || 0
            };

            if (isEdit) {
                await pharmacyService.updateMedicine(medicine.id, medicineData);
            } else {
                await pharmacyService.createMedicine(medicineData);
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save');
        } finally {
            setIsSubmitting(false);
        }
    };

    const FormSection = ({ title, icon, children }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                    <MaterialIcons name={icon} size={20} color="#10B981" />
                </View>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.sectionBody}>
                {children}
            </View>
        </View>
    );

    const FormInput = ({ label, value, onChangeText, error, placeholder, icon, ...props }) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputWrapper, error && styles.inputError]}>
                {icon && <MaterialIcons name={icon} size={18} color="#94A3B8" style={styles.inputIcon} />}
                <TextInput
                    style={styles.input}
                    value={String(value || '')}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#CBD5E1"
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );

    const PillPicker = ({ label, value, options, onSelect }) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.pill, value === opt && styles.pillActive]}
                        onPress={() => onSelect(opt)}
                    >
                        <Text style={[styles.pillText, value === opt && styles.pillTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{isEdit ? 'Update Medicine' : 'Add New Medicine'}</Text>
                    <Text style={styles.headerSubtitle}>{isEdit ? `SKU: ${medicine?.sku || 'N/A'}` : 'Update pharmacy inventory'}</Text>
                </View>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                <FormSection title="General Information" icon="medication">
                    <FormInput
                        label="Medicine Name *"
                        value={formData.name}
                        onChangeText={(t) => handleChange('name', t)}
                        error={errors.name}
                        placeholder="e.g. Paracetamol 500mg"
                        icon="label"
                    />
                    <PillPicker
                        label="Category *"
                        value={formData.category}
                        options={['Tablet', 'Syrup', 'Injection', 'Capsule', 'Other']}
                        onSelect={(v) => handleChange('category', v)}
                    />
                    <FormInput
                        label="Manufacturer *"
                        value={formData.manufacturer}
                        onChangeText={(t) => handleChange('manufacturer', t)}
                        error={errors.manufacturer}
                        placeholder="ABC Pharma Ltd"
                        icon="business"
                    />
                    <FormInput
                        label="Brief Description"
                        value={formData.description}
                        onChangeText={(t) => handleChange('description', t)}
                        placeholder="Purpose and primary use..."
                        icon="notes"
                        multiline
                    />
                </FormSection>

                <FormSection title="Stock & Batch" icon="inventory">
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <FormInput
                                label="Stock Quantity *"
                                value={formData.quantity}
                                onChangeText={(t) => handleChange('quantity', t)}
                                placeholder="0"
                                icon="layers"
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <FormInput
                                label="Batch Number"
                                value={formData.batchNumber}
                                onChangeText={(t) => handleChange('batchNumber', t)}
                                placeholder="BT-001"
                                icon="tag"
                            />
                        </View>
                    </View>
                    <FormInput
                        label="Expiry Date"
                        value={formData.expiryDate}
                        onChangeText={(t) => handleChange('expiryDate', t)}
                        placeholder="YYYY-MM-DD"
                        icon="event-busy"
                    />
                </FormSection>

                <FormSection title="Pricing Detail" icon="payments">
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <FormInput
                                label="Price Per Unit *"
                                value={formData.price}
                                onChangeText={(t) => handleChange('price', t)}
                                placeholder="0.00"
                                icon="currency-rupee"
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <FormInput
                                label="MRP"
                                value={formData.mrp}
                                onChangeText={(t) => handleChange('mrp', t)}
                                placeholder="0.00"
                                icon="shopping-bag"
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>
                </FormSection>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <MaterialIcons name="save" size={20} color="#FFFFFF" />
                            <Text style={styles.submitText}>{isEdit ? 'Update Inventory' : 'Add to Pharmacy'}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 40 },
    backBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    headerSubtitle: { fontSize: 13, color: '#64748B' },

    body: { flex: 1 },
    bodyContent: { padding: 16, paddingBottom: 40 },

    section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', paddingBottom: 12 },
    sectionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 48 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500' },
    inputError: { borderColor: '#EF4444' },
    errorText: { fontSize: 11, color: '#EF4444', marginTop: 4, marginLeft: 4 },

    pillScroll: { gap: 8 },
    pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9' },
    pillActive: { backgroundColor: '#10B981' },
    pillText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    pillTextActive: { color: '#FFFFFF' },

    footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    submitBtn: { backgroundColor: '#10B981', height: 56, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    row: { flexDirection: 'row', gap: 12 }
});

export default MedicineForm;
