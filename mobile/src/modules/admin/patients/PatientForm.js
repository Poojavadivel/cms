/**
 * PatientForm.js - Mobile-Optimized 4-Step Wizard
 * Fully vertical layout designed for phones.
 */

import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView,
    Platform, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { patientsService, doctorService } from '../../../services';
import { Calendar } from 'react-native-calendars';

const STEPS = ['Details', 'Contact', 'Medical', 'Review'];
const STEP_ICONS = ['person', 'phone', 'favorite', 'description'];

const PatientForm = ({ route, navigation }) => {
    const { patient } = route.params || {};
    const isEdit = !!patient;

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showDoctorPicker, setShowDoctorPicker] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        dateOfBirth: '',
        age: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        bloodGroup: '',
        emergencyContactName: '',
        emergencyPhone: '',
        height: '',
        weight: '',
        bp: '120/80',
        bmi: '-',
        conditions: '',
        medications: '',
        assignedDoctorId: '',
        assignedDoctorName: '',
        profileImage: ''
    });

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const data = await doctorService.fetchAllDoctors();
                setDoctors(data);
            } catch (error) {
                console.error('Error fetching doctors:', error);
            }
        };
        fetchDoctors();

        if (patient) {
            const nameParts = (patient.name || patient.fullName || '').split(' ');
            setFormData({
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: patient.email || '',
                phone: patient.phone || '',
                gender: patient.gender || '',
                dateOfBirth: patient.dateOfBirth || '',
                age: patient.age?.toString() || '',
                address: patient.address || '',
                city: patient.city || '',
                state: patient.state || '',
                zipCode: patient.zipCode || '',
                bloodGroup: patient.bloodGroup || '',
                emergencyContactName: patient.emergencyContactName || '',
                emergencyPhone: patient.emergencyPhone || patient.emergencyContact || '',
                height: patient.height?.toString() || '',
                weight: patient.weight?.toString() || '',
                bp: patient.bp || '120/80',
                bmi: patient.bmi || '-',
                conditions: patient.conditions || patient.medicalHistory || '',
                medications: patient.medications || '',
                assignedDoctorId: patient.assignedDoctorId || '',
                assignedDoctorName: patient.assignedDoctorName || patient.assignedDoctor || '',
                profileImage: patient.profileImage || ''
            });
        }
    }, [patient]);

    // BMI Calculation
    useEffect(() => {
        const h = parseFloat(formData.height);
        const w = parseFloat(formData.weight);
        if (h > 0 && w > 0) {
            const bmiVal = (w / ((h / 100) * (h / 100))).toFixed(1);
            setFormData(prev => ({ ...prev, bmi: bmiVal }));
        } else {
            setFormData(prev => ({ ...prev, bmi: '-' }));
        }
    }, [formData.height, formData.weight]);

    const calculateAge = (dobString) => {
        const today = new Date();
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age.toString();
    };

    const handleDateSelect = (day) => {
        setFormData(prev => ({
            ...prev,
            dateOfBirth: day.dateString,
            age: calculateAge(day.dateString)
        }));
        setShowDatePicker(false);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validateStep = (step) => {
        const newErrors = {};
        if (step === 1) {
            if (!formData.firstName.trim()) newErrors.firstName = 'Required';
            if (!formData.lastName.trim()) newErrors.lastName = 'Required';
            if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Required';
            if (!formData.gender) newErrors.gender = 'Required';
        } else if (step === 2) {
            if (!formData.phone.trim()) newErrors.phone = 'Required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        } else {
            Alert.alert('Incomplete', 'Please fill in all required fields marked with *');
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const finalData = {
                ...formData,
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                assignedDoctor: formData.assignedDoctorName
            };
            if (isEdit) {
                await patientsService.updatePatient(patient._id || patient.id, finalData);
                Alert.alert('Success', 'Patient records updated successfully');
            } else {
                await patientsService.createPatient(finalData);
                Alert.alert('Success', 'New patient registered successfully');
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save patient');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={22} color="#1E293B" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>
                            {isEdit ? 'Edit Patient' : 'New Patient'}
                        </Text>
                        <Text style={styles.headerSub}>Step {currentStep} of 4 — {STEPS[currentStep - 1]}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <MaterialIcons name="close" size={22} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                {/* Step Progress Bar */}
                <View style={styles.progressContainer}>
                    {STEPS.map((label, idx) => {
                        const stepNum = idx + 1;
                        const isActive = currentStep === stepNum;
                        const isDone = currentStep > stepNum;
                        return (
                            <View key={stepNum} style={styles.stepWrapper}>
                                <View style={[
                                    styles.stepCircle,
                                    isActive && styles.stepCircleActive,
                                    isDone && styles.stepCircleDone
                                ]}>
                                    {isDone
                                        ? <MaterialIcons name="check" size={14} color="#FFF" />
                                        : <MaterialIcons name={STEP_ICONS[idx]} size={14} color={isActive ? '#FFF' : '#94A3B8'} />
                                    }
                                </View>
                                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
                                {idx < STEPS.length - 1 && (
                                    <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Form Body */}
                <ScrollView
                    contentContainerStyle={styles.formBody}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* STEP 1: Personal Details */}
                    {currentStep === 1 && (
                        <View>
                            <Text style={styles.sectionTitle}>Personal Details</Text>
                            <Text style={styles.sectionSub}>BIOMETRIC AND DEMOGRAPHIC IDENTIFICATION</Text>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.label}>FIRST NAME <Text style={styles.req}>*</Text></Text>
                                    <View style={[styles.inputBox, errors.firstName && styles.errorBox]}>
                                        <MaterialIcons name="person-outline" size={16} color="#3B82F6" style={styles.icon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. John"
                                            placeholderTextColor="#94A3B8"
                                            value={formData.firstName}
                                            onChangeText={(t) => handleChange('firstName', t)}
                                        />
                                    </View>
                                    {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>LAST NAME <Text style={styles.req}>*</Text></Text>
                                    <View style={[styles.inputBox, errors.lastName && styles.errorBox]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. Doe"
                                            placeholderTextColor="#94A3B8"
                                            value={formData.lastName}
                                            onChangeText={(t) => handleChange('lastName', t)}
                                        />
                                    </View>
                                    {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                                    <Text style={styles.label}>DATE OF BIRTH <Text style={styles.req}>*</Text></Text>
                                    <TouchableOpacity
                                        style={[styles.inputBox, errors.dateOfBirth && styles.errorBox]}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <MaterialIcons name="calendar-today" size={16} color="#94A3B8" style={styles.icon} />
                                        <Text style={[styles.input, !formData.dateOfBirth && { color: '#94A3B8' }]}>
                                            {formData.dateOfBirth || 'Select date'}
                                        </Text>
                                    </TouchableOpacity>
                                    {errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}
                                </View>
                                <View style={[styles.inputGroup, { flex: 0.8 }]}>
                                    <Text style={styles.label}>AGE</Text>
                                    <View style={[styles.inputBox, styles.disabledBox]}>
                                        <Text style={[styles.input, { color: '#94A3B8' }]}>{formData.age || 'Auto'}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>GENDER <Text style={styles.req}>*</Text></Text>
                                <View style={styles.genderRow}>
                                    {['Male', 'Female', 'Other'].map(g => (
                                        <TouchableOpacity
                                            key={g}
                                            style={[styles.genderBtn, formData.gender === g && styles.genderBtnActive]}
                                            onPress={() => handleChange('gender', g)}
                                        >
                                            <Text style={[styles.genderText, formData.gender === g && styles.genderTextActive]}>{g}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
                            </View>
                        </View>
                    )}

                    {/* STEP 2: Contact */}
                    {currentStep === 2 && (
                        <View>
                            <Text style={styles.sectionTitle}>Contact Info</Text>
                            <Text style={styles.sectionSub}>SECURE COMMUNICATION AND RESIDENCY RECORDS</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>PHONE NUMBER <Text style={styles.req}>*</Text></Text>
                                <View style={[styles.inputBox, errors.phone && styles.errorBox]}>
                                    <MaterialIcons name="phone" size={16} color="#94A3B8" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="+91 99999 00000"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="phone-pad"
                                        value={formData.phone}
                                        onChangeText={(t) => handleChange('phone', t)}
                                    />
                                </View>
                                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EMAIL ADDRESS</Text>
                                <View style={styles.inputBox}>
                                    <MaterialIcons name="mail-outline" size={16} color="#94A3B8" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="john.doe@example.com"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="email-address"
                                        value={formData.email}
                                        onChangeText={(t) => handleChange('email', t)}
                                    />
                                </View>
                            </View>

                            <View style={styles.groupDivider}>
                                <MaterialIcons name="people-outline" size={16} color="#94A3B8" />
                                <Text style={styles.groupDividerText}>EMERGENCY CONTACT</Text>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                                    <Text style={styles.label}>CONTACT NAME</Text>
                                    <View style={styles.inputBox}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. Jane Doe"
                                            placeholderTextColor="#94A3B8"
                                            value={formData.emergencyContactName}
                                            onChangeText={(t) => handleChange('emergencyContactName', t)}
                                        />
                                    </View>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>PHONE</Text>
                                    <View style={styles.inputBox}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="+91 ..."
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="phone-pad"
                                            value={formData.emergencyPhone}
                                            onChangeText={(t) => handleChange('emergencyPhone', t)}
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.groupDivider}>
                                <MaterialIcons name="location-on" size={16} color="#94A3B8" />
                                <Text style={styles.groupDividerText}>ADDRESS</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputBox}>
                                    <TextInput
                                        style={[styles.input, { minHeight: 60 }]}
                                        placeholder="Full residential address..."
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        value={formData.address}
                                        onChangeText={(t) => handleChange('address', t)}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* STEP 3: Medical */}
                    {currentStep === 3 && (
                        <View>
                            <Text style={styles.sectionTitle}>Medical Info</Text>
                            <Text style={styles.sectionSub}>CLINICAL VITALS AND MEDICAL HISTORY</Text>

                            {/* Vitals */}
                            <View style={styles.vitalsCard}>
                                <View style={styles.vitalsHeader}>
                                    <MaterialIcons name="show-chart" size={16} color="#3B82F6" />
                                    <Text style={styles.vitalsHeaderText}>Critical Vitals</Text>
                                </View>
                                <View style={styles.vitalsGrid}>
                                    <View style={styles.vitalItem}>
                                        <Text style={styles.vitalLabel}>HEIGHT (CM)</Text>
                                        <View style={styles.vitalInput}>
                                            <TextInput
                                                style={styles.vitalInputText}
                                                value={formData.height}
                                                placeholder="170"
                                                placeholderTextColor="#94A3B8"
                                                keyboardType="numeric"
                                                onChangeText={(t) => handleChange('height', t)}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.vitalItem}>
                                        <Text style={styles.vitalLabel}>WEIGHT (KG)</Text>
                                        <View style={styles.vitalInput}>
                                            <TextInput
                                                style={styles.vitalInputText}
                                                value={formData.weight}
                                                placeholder="70"
                                                placeholderTextColor="#94A3B8"
                                                keyboardType="numeric"
                                                onChangeText={(t) => handleChange('weight', t)}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.vitalItem}>
                                        <Text style={styles.vitalLabel}>BP (mmHg)</Text>
                                        <View style={styles.vitalInput}>
                                            <TextInput
                                                style={styles.vitalInputText}
                                                value={formData.bp}
                                                onChangeText={(t) => handleChange('bp', t)}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.vitalItem}>
                                        <Text style={styles.vitalLabel}>BMI</Text>
                                        <View style={[styles.vitalInput, { backgroundColor: '#F8FAFC' }]}>
                                            <Text style={[styles.vitalInputText, { color: '#3B82F6' }]}>{formData.bmi}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>BLOOD GROUP</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodScroll}>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                        <TouchableOpacity
                                            key={bg}
                                            style={[styles.bloodBtn, formData.bloodGroup === bg && styles.bloodBtnActive]}
                                            onPress={() => handleChange('bloodGroup', bg)}
                                        >
                                            <Text style={[styles.bloodBtnText, formData.bloodGroup === bg && styles.bloodBtnTextActive]}>{bg}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>KNOWN CONDITIONS / HISTORY</Text>
                                <View style={styles.inputBox}>
                                    <TextInput
                                        style={[styles.input, { minHeight: 60 }]}
                                        placeholder="e.g. Diabetes, Hypertension..."
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        value={formData.conditions}
                                        onChangeText={(t) => handleChange('conditions', t)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>CURRENT MEDICATIONS</Text>
                                <View style={styles.inputBox}>
                                    <TextInput
                                        style={[styles.input, { minHeight: 60 }]}
                                        placeholder="e.g. Metformin 500mg..."
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        value={formData.medications}
                                        onChangeText={(t) => handleChange('medications', t)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>ASSIGNED DOCTOR</Text>
                                <TouchableOpacity
                                    style={styles.inputBox}
                                    onPress={() => setShowDoctorPicker(true)}
                                >
                                    <MaterialIcons name="person-outline" size={16} color="#94A3B8" style={styles.icon} />
                                    <Text style={[styles.input, !formData.assignedDoctorName && { color: '#94A3B8' }]}>
                                        {formData.assignedDoctorName || 'Select Doctor'}
                                    </Text>
                                    <MaterialIcons name="keyboard-arrow-down" size={16} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* STEP 4: Review */}
                    {currentStep === 4 && (
                        <View>
                            <Text style={styles.sectionTitle}>Review & Submit</Text>
                            <Text style={styles.sectionSub}>REVIEW AND FINAL DATA SUBMISSION</Text>

                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>Patient Summary</Text>
                                {[
                                    { label: 'Full Name', value: `${formData.firstName} ${formData.lastName}` },
                                    { label: 'Gender / Age', value: `${formData.gender} / ${formData.age} yrs` },
                                    { label: 'Date of Birth', value: formData.dateOfBirth },
                                    { label: 'Phone', value: formData.phone },
                                    { label: 'Email', value: formData.email || 'Not provided' },
                                    { label: 'Blood Group', value: formData.bloodGroup || 'Not set' },
                                    { label: 'Vitals', value: `${formData.height || '-'}cm, ${formData.weight || '-'}kg (BMI: ${formData.bmi})` },
                                    { label: 'Blood Pressure', value: formData.bp },
                                    { label: 'Doctor', value: formData.assignedDoctorName || 'Not Assigned' },
                                    { label: 'Conditions', value: formData.conditions || 'None' },
                                ].map((row, i) => (
                                    <View key={i} style={[styles.summaryRow, i % 2 === 0 && styles.summaryRowAlt]}>
                                        <Text style={styles.summaryLabel}>{row.label}</Text>
                                        <Text style={styles.summaryValue} numberOfLines={1}>{row.value}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.confirmBox}>
                                <MaterialIcons name="info-outline" size={18} color="#3B82F6" />
                                <Text style={styles.confirmText}>
                                    By proceeding, you confirm that the data entered is accurate and complete.
                                </Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Footer Navigation */}
                <View style={styles.footer}>
                    {currentStep > 1 ? (
                        <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
                            <MaterialIcons name="arrow-back" size={16} color="#64748B" />
                            <Text style={styles.backBtnText}>BACK</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.backBtn} />
                    )}
                    {currentStep < 4 ? (
                        <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                            <Text style={styles.nextBtnText}>NEXT</Text>
                            <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.nextBtn, isSubmitting && styles.nextBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? <ActivityIndicator color="#FFF" size="small" />
                                : <>
                                    <Text style={styles.nextBtnText}>{isEdit ? 'UPDATE' : 'SAVE'}</Text>
                                    <MaterialIcons name="check" size={16} color="#FFF" />
                                </>
                            }
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>

            {/* Date Picker Modal */}
            <Modal transparent visible={showDatePicker} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Calendar
                            onDayPress={handleDateSelect}
                            maxDate={new Date().toISOString().split('T')[0]}
                            theme={{
                                selectedDayBackgroundColor: '#3B82F6',
                                todayTextColor: '#3B82F6',
                                arrowColor: '#3B82F6',
                            }}
                        />
                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Doctor Picker Modal */}
            <Modal transparent visible={showDoctorPicker} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Select Doctor</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            <TouchableOpacity
                                style={styles.doctorOption}
                                onPress={() => { handleChange('assignedDoctorId', ''); handleChange('assignedDoctorName', ''); setShowDoctorPicker(false); }}
                            >
                                <Text style={styles.doctorOptionText}>Not Assigned</Text>
                                {!formData.assignedDoctorId && <MaterialIcons name="check" size={16} color="#3B82F6" />}
                            </TouchableOpacity>
                            {doctors.map(doc => (
                                <TouchableOpacity
                                    key={doc.id || doc._id}
                                    style={styles.doctorOption}
                                    onPress={() => {
                                        handleChange('assignedDoctorId', doc.id || doc._id);
                                        handleChange('assignedDoctorName', doc.name);
                                        setShowDoctorPicker(false);
                                    }}
                                >
                                    <Text style={styles.doctorOptionText}>{doc.name}</Text>
                                    {formData.assignedDoctorId === (doc.id || doc._id) && <MaterialIcons name="check" size={16} color="#3B82F6" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDoctorPicker(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: { padding: 4, marginRight: 8 },
    closeButton: { padding: 4, marginLeft: 8 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    headerSub: { fontSize: 11, color: '#64748B', marginTop: 2 },

    // Step Progress
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    stepWrapper: { flex: 1, alignItems: 'center', position: 'relative' },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    stepCircleActive: { backgroundColor: '#3B82F6' },
    stepCircleDone: { backgroundColor: '#10B981' },
    stepLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
    stepLabelActive: { color: '#3B82F6' },
    stepLine: {
        position: 'absolute',
        top: 15,
        right: -10,
        left: 40,
        height: 2,
        backgroundColor: '#E2E8F0',
    },
    stepLineDone: { backgroundColor: '#10B981' },

    // Form
    formBody: { padding: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
    sectionSub: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 20 },

    row: { flexDirection: 'row', marginBottom: 0 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 6 },
    req: { color: '#EF4444' },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    errorBox: { borderColor: '#F87171', backgroundColor: '#FFF5F5' },
    disabledBox: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
    icon: { marginRight: 8, opacity: 0.7 },
    input: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
    errorText: { fontSize: 11, color: '#EF4444', marginTop: 4 },

    genderRow: { flexDirection: 'row' },
    genderBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        marginRight: 8,
        backgroundColor: '#FFFFFF',
    },
    genderBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    genderText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    genderTextActive: { color: '#3B82F6' },

    groupDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        marginTop: 4,
    },
    groupDividerText: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginLeft: 6 },

    // Vitals
    vitalsCard: {
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    vitalsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    vitalsHeaderText: { fontSize: 13, fontWeight: '900', color: '#1E5A9D', marginLeft: 6 },
    vitalsGrid: { flexDirection: 'row' },
    vitalItem: { flex: 1, marginRight: 8 },
    vitalLabel: { fontSize: 9, fontWeight: '800', color: '#1E5A9D', marginBottom: 6, letterSpacing: 0.3 },
    vitalInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    vitalInputText: { fontSize: 14, fontWeight: '800', color: '#1E293B', width: '100%', textAlign: 'center' },

    // Blood Group
    bloodScroll: { marginBottom: 4 },
    bloodBtn: {
        width: 52,
        height: 40,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        backgroundColor: '#FFFFFF',
    },
    bloodBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    bloodBtnText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    bloodBtnTextActive: { color: '#3B82F6' },

    // Summary
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        marginBottom: 16,
    },
    summaryTitle: { fontSize: 15, fontWeight: '900', color: '#1E293B', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    summaryRowAlt: { backgroundColor: '#F8FAFC' },
    summaryLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    summaryValue: { fontSize: 12, color: '#1E293B', fontWeight: '800', maxWidth: '55%', textAlign: 'right' },

    confirmBox: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 14,
        alignItems: 'flex-start',
    },
    confirmText: { flex: 1, fontSize: 12, color: '#1E5A9D', fontWeight: '600', lineHeight: 18, marginLeft: 10 },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14 },
    backBtnText: { fontSize: 13, fontWeight: '800', color: '#64748B', marginLeft: 4 },
    nextBtn: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginRight: 6 },
    nextBtnDisabled: { opacity: 0.6 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 380 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 16 },
    modalCancel: { alignSelf: 'center', padding: 12, marginTop: 8 },
    modalCancelText: { color: '#3B82F6', fontWeight: '800', fontSize: 14 },
    doctorOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    doctorOptionText: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
});

export default PatientForm;
