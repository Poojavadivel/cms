/**
 * DoctorForm.js
 * Mobile Doctor Create/Edit Form
 * Creates User with role 'doctor' which syncs to Staff collection
 */

import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import doctorService from '../../../services/doctorService';

const DoctorForm = ({ route, navigation }) => {
    const { doctor } = route.params || {};
    const isEdit = !!doctor;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        specialization: '',
        department: 'Medical',
        qualification: '',
        experience: '',
    });

    useEffect(() => {
        if (doctor) {
            setFormData({
                firstName: doctor.firstName || doctor.name?.split(' ')[0] || '',
                lastName: doctor.lastName || doctor.name?.split(' ').slice(1).join(' ') || '',
                email: doctor.email || '',
                phone: doctor.phone || '',
                password: '', // Hidden for security, can be left empty for no change (if backend supports)
                specialization: doctor.specialization || '',
                department: doctor.department || 'Medical',
                qualification: doctor.qualification || '',
                experience: String(doctor.experience || ''),
            });
        }
    }, [doctor]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!isEdit && !formData.password) newErrors.password = 'Password is required';
        if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEdit) {
                // Update logic... (using staffService or specialized user update if exists)
                // For now, let's assume we can update profile via staff service
                const { staffService } = require('../../../services');
                const updateData = {
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.email,
                    contact: formData.phone,
                    designation: formData.specialization,
                    department: formData.department,
                    experienceYears: parseInt(formData.experience) || 0,
                    qualifications: formData.qualification.split(',').map(q => q.trim()).filter(q => q),
                };
                await staffService.updateStaff(doctor.id || doctor._id, updateData);
                Alert.alert('Success', 'Doctor updated successfully');
            } else {
                await doctorService.createDoctor(formData);
                Alert.alert('Success', 'Doctor created successfully and synced to Staff list.');
            }
            navigation.goBack();
        } catch (error) {
            console.error('Error saving doctor:', error);
            Alert.alert('Error', error.message || 'Failed to save doctor');
        } finally {
            setIsSubmitting(false);
        }
    };

    const InputField = ({ label, value, onChangeText, error, placeholder, secureTextEntry = false, keyboardType = 'default' }) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );

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
                    <Text style={styles.headerTitle}>{isEdit ? 'Edit Doctor' : 'Add Doctor'}</Text>
                    <Text style={styles.headerSubtitle}>{isEdit ? 'Update profile' : 'Create login & profile'}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Information</Text>
                    <InputField
                        label="First Name *"
                        value={formData.firstName}
                        onChangeText={(val) => handleChange('firstName', val)}
                        error={errors.firstName}
                        placeholder="John"
                    />
                    <InputField
                        label="Last Name"
                        value={formData.lastName}
                        onChangeText={(val) => handleChange('lastName', val)}
                        placeholder="Doe"
                    />
                    <InputField
                        label="Email Address *"
                        value={formData.email}
                        onChangeText={(val) => handleChange('email', val)}
                        error={errors.email}
                        placeholder="doctor@hospital.com"
                        keyboardType="email-address"
                    />
                    {!isEdit && (
                        <InputField
                            label="Password *"
                            value={formData.password}
                            onChangeText={(val) => handleChange('password', val)}
                            error={errors.password}
                            placeholder="Min 6 characters"
                            secureTextEntry
                        />
                    )}
                    <InputField
                        label="Phone Number"
                        value={formData.phone}
                        onChangeText={(val) => handleChange('phone', val)}
                        placeholder="+91 98765 43210"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Professional Profile</Text>
                    <InputField
                        label="Specialization *"
                        value={formData.specialization}
                        onChangeText={(val) => handleChange('specialization', val)}
                        error={errors.specialization}
                        placeholder="e.g. Cardiologist"
                    />
                    <InputField
                        label="Department"
                        value={formData.department}
                        onChangeText={(val) => handleChange('department', val)}
                        placeholder="Medical"
                    />
                    <InputField
                        label="Qualifications"
                        value={formData.qualification}
                        onChangeText={(val) => handleChange('qualification', val)}
                        placeholder="MBBS, MD (Comma separated)"
                    />
                    <InputField
                        label="Experience (Years)"
                        value={formData.experience}
                        onChangeText={(val) => handleChange('experience', val)}
                        placeholder="10"
                        keyboardType="numeric"
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : (
                        <>
                            <MaterialIcons name="save" size={20} color="#FFFFFF" />
                            <Text style={styles.submitButtonText}>{isEdit ? 'Update Doctor' : 'Create Doctor'}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { padding: 4 },
    headerTitles: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 32 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, textTransform: 'uppercase' },
    input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 14, color: '#1E293B' },
    inputError: { borderColor: '#EF4444' },
    errorText: { fontSize: 11, color: '#EF4444', marginTop: 4 },
    footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    submitButton: { backgroundColor: '#3B82F6', borderRadius: 10, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    submitButtonDisabled: { backgroundColor: '#94A3B8' },
    submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' }
});

export default DoctorForm;
