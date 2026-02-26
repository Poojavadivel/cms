/**
 * AppointmentForm.js - High-Fidelity Premium Version
 * Standardized sectioned layout with icons and professional aesthetics.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, Modal, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { appointmentsService, patientsService } from '../../../services';
import { useNotification } from '../../../provider';

const AppointmentForm = ({ navigation, route }) => {
    const { appointment } = route.params || {};
    const isEditMode = !!appointment;
    const { scheduleAppointmentNotification } = useNotification();

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data Lists
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);

    // Form State
    const [patientId, setPatientId] = useState(appointment?.patientId || appointment?.patient?._id || '');
    const [selectedPatient, setSelectedPatient] = useState(appointment ? {
        name: appointment.patientName || appointment.patient?.name || 'Selected Patient',
        _id: appointment.patientId || appointment.patient?._id
    } : null);

    const [doctorId, setDoctorId] = useState(appointment?.doctorId || '');
    const [date, setDate] = useState(appointment ? new Date(appointment.date) : new Date());
    const [time, setTime] = useState(appointment?.time || '09:00');
    const [reason, setReason] = useState(appointment?.reason || '');
    const [notes, setNotes] = useState(appointment?.notes || '');
    const [status, setStatus] = useState(appointment?.status || 'Scheduled');

    // UI State
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');

    // Fetch Initial Data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [patientsData, doctorsData] = await Promise.all([
                    patientsService.fetchPatients(),
                    appointmentsService.fetchDoctors()
                ]);
                setPatients(patientsData || []);
                setDoctors(doctorsData || []);
            } catch (error) {
                Alert.alert('Error', 'Failed to load metadata');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredPatients = patients.filter(p =>
        (p.name || p.fullName || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
        (p.phone || p.mobile || '').includes(patientSearch)
    );

    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d);
        }
        return dates;
    };
    const dateOptions = generateDates();

    const generateTimeSlots = () => {
        const slots = [];
        let start = 9 * 60;
        const end = 17 * 60;
        while (start <= end) {
            const h = Math.floor(start / 60);
            const m = start % 60;
            slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            start += 30;
        }
        return slots;
    };
    const timeSlots = generateTimeSlots();

    const handleSubmit = async () => {
        if (!patientId) return Alert.alert('Error', 'Please select a patient');
        if (!doctorId) return Alert.alert('Error', 'Please select a doctor');
        if (!reason) return Alert.alert('Error', 'Please enter a reason');

        setIsSubmitting(true);
        try {
            const doctorObj = doctors.find(d => (d.id || d._id) === doctorId);
            const dateStr = date.toISOString().split('T')[0];

            const payload = {
                patientId,
                doctorId,
                appointmentType: 'Consultation',
                startAt: new Date(dateStr + 'T' + time).toISOString(),
                date: dateStr,
                time,
                reason,
                notes,
                status,
                location: 'In-clinic',
                mode: 'In-clinic',
            };

            if (isEditMode) {
                await appointmentsService.updateAppointment(appointment._id || appointment.id, payload);
            } else {
                await appointmentsService.createAppointment(payload);
            }

            const docName = doctorObj?.name || doctorObj?.firstName || 'Doctor';
            scheduleAppointmentNotification(
                isEditMode ? 'Appointment Updated' : 'Appointment Scheduled',
                `Appointment with Dr. ${docName} on ${date.toLocaleDateString()} at ${time}.`
            );

            Alert.alert('Success', 'Appointment saved successfully');
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
                    <MaterialIcons name={icon} size={20} color="#3B82F6" />
                </View>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.sectionBody}>
                {children}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{isEditMode ? 'Modify Appointment' : 'Book Appointment'}</Text>
                    <Text style={styles.headerSubtitle}>{isEditMode ? 'Update existing schedule' : 'Setup a new clinic visit'}</Text>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                    <FormSection title="Patient Selection" icon="person-search">
                        <TouchableOpacity style={styles.pickerSelector} onPress={() => setShowPatientModal(true)}>
                            <MaterialIcons name="account-circle" size={22} color="#3B82F6" />
                            <Text style={[styles.selectorText, !selectedPatient && styles.placeholderText]}>
                                {selectedPatient ? (selectedPatient.name || 'Selected Patient') : 'Select Patient...'}
                            </Text>
                            <MaterialIcons name="unfold-more" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </FormSection>

                    <FormSection title="Schedule Details" icon="event">
                        <Text style={styles.subLabel}>Available Dates</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
                            {dateOptions.map((d, i) => {
                                const isSelected = d.toDateString() === date.toDateString();
                                return (
                                    <TouchableOpacity key={i} style={[styles.dateCard, isSelected && styles.activePill]} onPress={() => setDate(d)}>
                                        <Text style={[styles.dateWeekday, isSelected && styles.activePillText]}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                                        <Text style={[styles.dateDay, isSelected && styles.activePillText]}>{d.getDate()}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <Text style={[styles.subLabel, { marginTop: 20 }]}>Time Slots</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
                            {timeSlots.map((t, i) => {
                                const isSelected = t === time;
                                return (
                                    <TouchableOpacity key={i} style={[styles.pill, isSelected && styles.activePill]} onPress={() => setTime(t)}>
                                        <Text style={[styles.pillText, isSelected && styles.activePillText]}>{t}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </FormSection>

                    <FormSection title="Medical Provider" icon="medical-services">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
                            {doctors.map((doc) => {
                                const isSelected = (doc.id || doc._id) === doctorId;
                                return (
                                    <TouchableOpacity key={doc.id || doc._id} style={[styles.doctorCard, isSelected && styles.activeDoctorCard]} onPress={() => setDoctorId(doc.id || doc._id)}>
                                        <View style={[styles.docAvatar, isSelected && styles.activeDocAvatar]}>
                                            <MaterialIcons name="person" size={20} color={isSelected ? '#FFF' : '#3B82F6'} />
                                        </View>
                                        <Text style={[styles.docName, isSelected && styles.activePillText]} numberOfLines={1}>Dr. {doc.name || 'Doc'}</Text>
                                        <Text style={[styles.docDept, isSelected && styles.activePillText]} numberOfLines={1}>{doc.department || 'General'}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </FormSection>

                    <FormSection title="Consultation Info" icon="description">
                        <View style={styles.inputWrapper}>
                            <MaterialIcons name="help-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                            <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="Reason for visit..." placeholderTextColor="#CBD5E1" />
                        </View>
                        <View style={[styles.inputWrapper, { height: 80, marginTop: 12, alignItems: 'flex-start', paddingTop: 12 }]}>
                            <MaterialIcons name="notes" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                            <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Additional notes..." placeholderTextColor="#CBD5E1" multiline />
                        </View>
                    </FormSection>

                    <FormSection title="Status" icon="check-circle">
                        <View style={styles.rowWrap}>
                            {['Scheduled', 'Confirmed', 'Cancelled'].map(s => (
                                <TouchableOpacity key={s} style={[styles.pill, status === s && styles.activePill]} onPress={() => setStatus(s)}>
                                    <Text style={[styles.pillText, status === s && styles.activePillText]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </FormSection>
                </ScrollView>
            )}

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.disabledBtn]} onPress={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                        <>
                            <MaterialIcons name="event-available" size={20} color="#FFF" />
                            <Text style={styles.submitBtnText}>{isEditMode ? 'Update Appointment' : 'Confirm Appointment'}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Patient Modal */}
            <Modal visible={showPatientModal} animationType="fade" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Patient</Text>
                            <TouchableOpacity onPress={() => setShowPatientModal(false)}><MaterialIcons name="close" size={24} color="#64748B" /></TouchableOpacity>
                        </View>
                        <View style={styles.searchBox}>
                            <MaterialIcons name="search" size={20} color="#94A3B8" />
                            <TextInput style={styles.searchInput} placeholder="Search by name or phone..." value={patientSearch} onChangeText={setPatientSearch} />
                        </View>
                        <FlatList
                            data={filteredPatients}
                            keyExtractor={(item) => item._id || item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.patientItem} onPress={() => { setPatientId(item._id || item.id); setSelectedPatient(item); setShowPatientModal(false); }}>
                                    <View style={styles.patientAvatar}><Text style={styles.initials}>{(item.name || '?')[0]}</Text></View>
                                    <View>
                                        <Text style={styles.pName}>{item.name}</Text>
                                        <Text style={styles.pPhone}>{item.phone || 'No Phone'}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
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
    bodyContent: { padding: 16, paddingBottom: 100 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', paddingBottom: 12 },
    sectionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

    pickerSelector: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12 },
    selectorText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E293B' },
    placeholderText: { color: '#94A3B8' },

    subLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 },
    pillScroll: { gap: 10 },
    pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9' },
    activePill: { backgroundColor: '#3B82F6' },
    pillText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
    activePillText: { color: '#FFFFFF' },

    dateCard: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    dateWeekday: { fontSize: 11, fontWeight: '700', color: '#64748B' },
    dateDay: { fontSize: 18, fontWeight: '800', color: '#1E293B' },

    doctorCard: { width: 110, padding: 12, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center' },
    activeDoctorCard: { backgroundColor: '#3B82F6' },
    docAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    activeDocAvatar: { backgroundColor: 'rgba(255,255,255,0.2)' },
    docName: { fontSize: 12, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
    docDept: { fontSize: 10, color: '#64748B', textAlign: 'center' },

    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 48 },
    input: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500' },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    submitBtn: { backgroundColor: '#3B82F6', height: 56, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    disabledBtn: { opacity: 0.6 },

    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 16 },
    searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },
    patientItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    patientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    initials: { fontSize: 16, fontWeight: '800', color: '#3B82F6' },
    pName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    pPhone: { fontSize: 12, color: '#64748B' }
});

export default AppointmentForm;
