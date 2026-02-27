import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, RefreshControl,
    ActivityIndicator, TouchableOpacity, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { doctorService } from '../../../services';

const { width } = Dimensions.get('window');

const DoctorSchedule = () => {
    const [schedule, setSchedule] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const fetch = useCallback(async () => {
        try {
            const data = await doctorService.fetchMySchedule();
            setSchedule(data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const onRefresh = () => {
        setRefreshing(true);
        fetch();
    };

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[new Date(selectedDate).getDay()];

    // Generate marked dates for calendar (demo markers for now)
    const markedDates = {
        [selectedDate]: { selected: true, selectedColor: '#3B82F6' },
        '2026-02-17': { marked: true, dotColor: '#3B82F6' },
        '2026-02-18': { marked: true, dotColor: '#3B82F6' },
        '2026-02-19': { marked: true, dotColor: '#3B82F6' },
    };

    if (isLoading) return <View style={styles.loading}><ActivityIndicator size="large" color="#3B82F6" /></View>;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.pageHeader}>
                    <View>
                        <Text style={styles.pageTitle}>MY SCHEDULE</Text>
                        <Text style={styles.pageSubtitle}>View and manage your weekly availability</Text>
                    </View>
                </View>

                {/* Calendar Section */}
                <View style={styles.calendarCard}>
                    <View style={styles.calendarHeader}>
                        <MaterialIcons name="event-note" size={24} color="#3B82F6" />
                        <Text style={styles.calendarTitle}>Availability Calendar</Text>
                    </View>
                    <Calendar
                        current={selectedDate}
                        onDayPress={day => setSelectedDate(day.dateString)}
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: '#ffffff',
                            calendarBackground: '#ffffff',
                            textSectionTitleColor: '#64748B',
                            selectedDayBackgroundColor: '#3B82F6',
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: '#3B82F6',
                            dayTextColor: '#1E293B',
                            textDisabledColor: '#CBD5E1',
                            dotColor: '#3B82F6',
                            selectedDotColor: '#ffffff',
                            arrowColor: '#3B82F6',
                            monthTextColor: '#1E293B',
                            indicatorColor: '#3B82F6',
                            textDayFontWeight: '600',
                            textMonthFontWeight: '800',
                            textDayHeaderFontWeight: '700',
                            textDayFontSize: 14,
                            textMonthFontSize: 16,
                            textDayHeaderFontSize: 12,
                        }}
                    />
                </View>

                {/* Slots Section */}
                <View style={styles.slotsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Daily Slots — {currentDayName}</Text>
                        <View style={styles.badge}><Text style={styles.badgeText}>6 Slots</Text></View>
                    </View>

                    {schedule.length > 0 ? schedule.map((slot, i) => (
                        <View key={i} style={styles.slotCard}>
                            <View style={styles.slotRow}>
                                <View style={styles.slotTimeBox}>
                                    <MaterialIcons name="access-time" size={18} color="#3B82F6" />
                                    <Text style={styles.slotTimeBold}>{slot.startTime || '09:00'} - {slot.endTime || '17:00'}</Text>
                                </View>
                                <View style={[styles.statusTag, { backgroundColor: slot.isActive !== false ? '#DCFCE7' : '#FEE2E2' }]}>
                                    <View style={[styles.statusDot, { backgroundColor: slot.isActive !== false ? '#22C55E' : '#EF4444' }]} />
                                    <Text style={[styles.statusText, { color: slot.isActive !== false ? '#16A34A' : '#DC2626' }]}>
                                        {slot.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.slotDivider} />
                            <View style={styles.slotFooter}>
                                <View style={styles.footerDetail}>
                                    <Text style={styles.footerLabel}>CAPACITY</Text>
                                    <Text style={styles.footerValue}>{slot.maxPatients || 20} Patients Max</Text>
                                </View>
                                <TouchableOpacity style={styles.editBtn}>
                                    <MaterialIcons name="edit" size={16} color="#3B82F6" />
                                    <Text style={styles.editBtnText}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )) : (
                        <View style={styles.emptyCard}>
                            <MaterialIcons name="event-busy" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No manual slots defined for this day.</Text>
                            <Text style={styles.emptySubText}>Using system default: 09:00 AM - 05:00 PM</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 100 },

    pageHeader: { paddingTop: 40, paddingBottom: 24, paddingHorizontal: 20 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },

    calendarCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 24, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' },
    calendarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingHorizontal: 4 },
    calendarTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },

    slotsSection: { paddingHorizontal: 16, marginTop: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#475569', letterSpacing: 0.3 },
    badge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '800', color: '#3B82F6' },

    slotCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' },
    slotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    slotTimeBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    slotTimeBold: { fontSize: 15, fontWeight: '800', color: '#1E293B' },

    statusTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '800' },

    slotDivider: { height: 1.5, backgroundColor: '#F8FAFC', marginVertical: 14 },
    slotFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerDetail: { gap: 2 },
    footerLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    footerValue: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },

    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    editBtnText: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },

    emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
    emptyText: { color: '#64748B', fontSize: 14, fontWeight: '700', marginTop: 16 },
    emptySubText: { color: '#94A3B8', fontSize: 12, marginTop: 4, fontWeight: '500' },
});

export default DoctorSchedule;
