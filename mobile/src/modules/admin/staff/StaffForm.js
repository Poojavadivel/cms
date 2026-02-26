/**
 * StaffForm.js - High-Fidelity Premium Version
 * Standardized sectioned layout with icons and professional aesthetics.
 */

import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { staffService } from '../../../services';

const StaffForm = ({ route, navigation }) => {
    const { staffMember } = route.params || {};
    const isEdit = !!staffMember;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contact: '',
        gender: '',
        dob: '',
        patientFacingId: '',
        designation: '',
        department: '',
        qualifications: [],
        experienceYears: 0,
        joinedAt: '',
        shift: '',
        status: 'Available',
        location: '',
        emergencyContact: '',
        address: '',
        notes: ''
    });

    useEffect(() => {
        if (staffMember) {
            setFormData({
                name: staffMember.name || '',
                email: staffMember.email || '',
                contact: staffMember.contact || '',
                gender: staffMember.gender || '',
                dob: staffMember.dob || '',
                patientFacingId: staffMember.patientFacingId || '',
                designation: staffMember.designation || '',
                department: staffMember.department || '',
                qualifications: staffMember.qualifications || [],
                experienceYears: staffMember.experienceYears || 0,
                joinedAt: staffMember.joinedAt || '',
                shift: staffMember.shift || '',
                status: staffMember.status || 'Available',
                location: staffMember.location || '',
                emergencyContact: staffMember.emergencyContact || '',
                address: staffMember.address || '',
                notes: staffMember.notes?.general || ''
            });
        }
    }, [staffMember]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Required';
        if (!formData.email.trim()) newErrors.email = 'Required';
        if (!formData.contact.trim()) newErrors.contact = 'Required';
        if (!formData.designation) newErrors.designation = 'Required';
        if (!formData.department) newErrors.department = 'Required';
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
            const staffData = {
                ...formData,
                notes: { general: formData.notes }
            };

            if (isEdit) {
                await staffService.updateStaff(staffMember._id || staffMember.id, staffData);
            } else {
                await staffService.createStaff(staffData);
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message || 'Action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const FormSection = ({ title, icon, children }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                    <MaterialIcons name={icon} size={20} color="#3B82F6" />
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
                    <Text style={styles.headerTitle}>{isEdit ? 'Update Staff Profile' : 'Add New Staff'}</Text>
                    <Text style={styles.headerSubtitle}>{isEdit ? `Editing ${staffMember.patientFacingId}` : 'Enter staff information below'}</Text>
                </View>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                <FormSection title="Personal Information" icon="person">
                    <FormInput
                        label="Full Name *"
                        value={formData.name}
                        onChangeText={(t) => handleChange('name', t)}
                        error={errors.name}
                        placeholder="John Doe"
                        icon="badge"
                    />
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <FormInput
                                label="Email Address *"
                                value={formData.email}
                                onChangeText={(t) => handleChange('email', t)}
                                error={errors.email}
                                placeholder="john@hospital.com"
                                icon="alternate-email"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>
                    <FormInput
                        label="Contact Number *"
                        value={formData.contact}
                        onChangeText={(t) => handleChange('contact', t)}
                        error={errors.contact}
                        placeholder="+91 00000 00000"
                        icon="phone"
                        keyboardType="phone-pad"
                    />
                    <PillPicker
                        label="Gender *"
                        value={formData.gender}
                        options={['Male', 'Female', 'Other']}
                        onSelect={(v) => handleChange('gender', v)}
                    />
                    <FormInput
                        label="Residential Address"
                        value={formData.address}
                        onChangeText={(t) => handleChange('address', t)}
                        placeholder="Suite #123, Main Street"
                        icon="location-on"
                        multiline
                    />
                </FormSection>

                <FormSection title="Professional Details" icon="work">
                    <PillPicker
                        label="Department *"
                        value={formData.department}
                        options={['Medical', 'Nursing', 'Pathology', 'Pharmacy', 'Admin']}
                        onSelect={(v) => handleChange('department', v)}
                    />
                    <FormInput
                        label="Designation *"
                        value={formData.designation}
                        onChangeText={(t) => handleChange('designation', t)}
                        error={errors.designation}
                        placeholder="e.g. Senior Nurse"
                        icon="assignment-ind"
                    />
                    <FormInput
                        label="Staff Code / ID"
                        value={formData.patientFacingId}
                        onChangeText={(t) => handleChange('patientFacingId', t.toUpperCase())}
                        placeholder="STF-001"
                        icon="tag"
                    />
                    <FormInput
                        label="Qualifications"
                        value={Array.isArray(formData.qualifications) ? formData.qualifications.join(', ') : formData.qualifications}
                        onChangeText={(t) => handleChange('qualifications', t)}
                        placeholder="MBBS, MD"
                        icon="school"
                    />
                </FormSection>

                <FormSection title="Employment Status" icon="event-available">
                    <PillPicker
                        label="Current Status"
                        value={formData.status}
                        options={['Available', 'On Leave', 'Busy']}
                        onSelect={(v) => handleChange('status', v)}
                    />
                    <FormInput
                        label="Work Location"
                        value={formData.location}
                        onChangeText={(t) => handleChange('location', t)}
                        placeholder="Wing A, Floor 3"
                        icon="apartment"
                    />
                    <FormInput
                        label="Additional Notes"
                        value={formData.notes}
                        onChangeText={(t) => handleChange('notes', t)}
                        placeholder="Enter any other details..."
                        icon="note"
                        multiline
                    />
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
                            <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                            <Text style={styles.submitText}>{isEdit ? 'Save Changes' : 'Confirm & Add'}</Text>
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
    sectionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
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
    pillActive: { backgroundColor: '#3B82F6' },
    pillText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    pillTextActive: { color: '#FFFFFF' },

    footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    submitBtn: { backgroundColor: '#3B82F6', height: 56, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    row: { flexDirection: 'row', gap: 12 }
});

export default StaffForm;
