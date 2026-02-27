/**
 * Doctor Appointments
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Dimensions, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { appointmentsService } from '../../../services';

const { width } = Dimensions.get('window');

const DoctorAppointments = ({ navigation }) => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
    const [dateFilterActive, setDateFilterActive] = useState(false);

    const fetch = useCallback(async () => {
        try {
            const data = await appointmentsService.fetchDoctorAppointments();
            setAppointments(data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);
    const onRefresh = () => { setRefreshing(true); fetch(); };

    const getStatusStyle = (s) => {
        switch (s?.toLowerCase()) {
            case 'completed': return { bg: '#DCFCE7', text: '#16A34A', dot: '#22C55E' };
            case 'confirmed': return { bg: '#E0F2FE', text: '#0369A1', dot: '#0EA5E9' };
            case 'scheduled': return { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' };
            case 'pending': return { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' };
            case 'cancelled': return { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' };
            default: return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
        }
    };

    const renderItem = ({ item }) => {
        const st = getStatusStyle(item.status);
        return (
            <TouchableOpacity
                style={styles.appointmentCard}
                onPress={() => navigation.navigate('AppointmentForm', { appointment: item })}
            >
                <View style={styles.cardTop}>
                    <View style={styles.patientInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{item.patientName?.[0] || 'P'}</Text>
                        </View>
                        <View>
                            <Text style={styles.patientName}>{item.patientName || 'Patient'}</Text>
                            <Text style={styles.patientId}>ID: {item.patientID || 'PAT-XXXX'}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
                        <Text style={[styles.statusText, { color: st.text }]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailCol}>
                            <Text style={styles.detailLabel}>DATE & TIME</Text>
                            <View style={styles.detailValueRow}>
                                <MaterialIcons name="event" size={14} color="#64748B" />
                                <Text style={styles.detailValue}>{item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}</Text>
                            </View>
                            <Text style={styles.timeValue}>{item.time || item.slot || '---'}</Text>
                        </View>
                        <View style={styles.detailCol}>
                            <Text style={styles.detailLabel}>SERVICE</Text>
                            <Text style={styles.serviceValue}>{item.type || item.service || 'Consultation'}</Text>
                        </View>
                    </View>

                    <View style={styles.reasonRow}>
                        <Text style={styles.detailLabel}>REASON</Text>
                        <Text style={styles.reasonText} numberOfLines={2}>
                            {item.reason || 'Regular checkup and general consultation...'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.actionIcon}><MaterialIcons name="description" size={18} color="#3B82F6" /></TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon}><MaterialIcons name="edit" size={18} color="#3B82F6" /></TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon}><MaterialIcons name="visibility" size={18} color="#3B82F6" /></TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon}><MaterialIcons name="delete-outline" size={18} color="#EF4444" /></TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const filteredAppointments = appointments.filter(a => {
        const matchesSearch = (a.patientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (a.patientID?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'All' || a.status?.toLowerCase() === activeFilter.toLowerCase();
        const matchesDate = (viewMode === 'calendar' || dateFilterActive) ? (a.date && a.date.substring(0, 10) === selectedDate) : true;
        return matchesSearch && matchesFilter && matchesDate;
    });

    // Generate marked dates for Calendar
    const markedDates = {};
    appointments.forEach(a => {
        if (a.date) {
            const dateStr = a.date.substring(0, 10);
            markedDates[dateStr] = { marked: true, dotColor: '#3B82F6' };
        }
    });
    markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: '#3B82F6' };

    if (isLoading) return <View style={styles.loading}><ActivityIndicator size="large" color="#3B82F6" /></View>;

    const renderHeader = () => (
        <View>
            <View style={styles.pageHeader}>
                <View>
                    <Text style={styles.pageTitle}>APPOINTMENTS</Text>
                    <Text style={styles.pageSubtitle}>Manage bookings, schedules, and patient statuses</Text>
                </View>
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[styles.toggleOption, viewMode === 'list' && styles.toggleOptionActive]}
                        onPress={() => setViewMode('list')}
                    >
                        <MaterialIcons name="view-list" size={18} color={viewMode === 'list' ? '#3B82F6' : '#64748B'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleOption, viewMode === 'calendar' && styles.toggleOptionActive]}
                        onPress={() => setViewMode('calendar')}
                    >
                        <MaterialIcons name="calendar-today" size={16} color={viewMode === 'calendar' ? '#3B82F6' : '#64748B'} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.filterSection}>
                <View style={styles.searchBarWrapper}>
                    <Feather name="search" size={18} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by patient name, ID, or status..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow} contentContainerStyle={styles.categoriesContent}>
                    {['All', 'Scheduled', 'Confirmed', 'Pending', 'Cancelled'].map(cat => (
                        <TouchableOpacity
                            key={`cat-${cat}`}
                            style={[styles.categoryBtn, activeFilter === cat && styles.categoryBtnActive]}
                            onPress={() => setActiveFilter(cat)}
                        >
                            <Text style={[styles.categoryText, activeFilter === cat && styles.categoryTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                    style={[styles.dateFilterBtn, dateFilterActive && styles.dateFilterBtnActive]}
                    onPress={() => setIsDatePickerVisible(true)}
                >
                    <MaterialIcons name="event" size={20} color={dateFilterActive ? '#3B82F6' : '#1E293B'} />
                    <Text style={[styles.dateFilterText, dateFilterActive && styles.dateFilterTextActive]}>
                        {dateFilterActive ? `Date: ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Filter by Date'}
                    </Text>
                    {dateFilterActive ? (
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); setDateFilterActive(false); }}>
                            <MaterialIcons name="cancel" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                    ) : (
                        <MaterialIcons name="arrow-drop-down" size={20} color="#1E293B" />
                    )}
                </TouchableOpacity>
            </View>

            {viewMode === 'calendar' && (
                <View style={styles.calendarContainer}>
                    <Calendar
                        current={selectedDate}
                        onDayPress={day => setSelectedDate(day.dateString)}
                        markedDates={markedDates}
                        theme={{
                            todayTextColor: '#3B82F6',
                            arrowColor: '#3B82F6',
                            selectedDayBackgroundColor: '#3B82F6',
                            textDayFontWeight: '600',
                            textMonthFontWeight: '800',
                            textDayHeaderFontWeight: '700',
                        }}
                    />
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={filteredAppointments}
                renderItem={renderItem}
                keyExtractor={(item, index) => item._id?.toString() || `appointment-${index}`}
                contentContainerStyle={styles.list}
                ListHeaderComponent={renderHeader}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialIcons name="event-busy" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No results for your search' : 'No appointments found'}
                        </Text>
                    </View>
                }
            />

            {/* Date Picker Modal */}
            <Modal
                transparent={true}
                visible={isDatePickerVisible}
                animationType="fade"
                onRequestClose={() => setIsDatePickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsDatePickerVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Date</Text>
                            <TouchableOpacity onPress={() => setIsDatePickerVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <Calendar
                            current={selectedDate}
                            onDayPress={day => {
                                setSelectedDate(day.dateString);
                                setDateFilterActive(true);
                                setIsDatePickerVisible(false);
                            }}
                            markedDates={{
                                ...markedDates,
                                [selectedDate]: { selected: true, selectedColor: '#3B82F6' }
                            }}
                            theme={{
                                todayTextColor: '#3B82F6',
                                arrowColor: '#3B82F6',
                                selectedDayBackgroundColor: '#3B82F6',
                                textDayFontWeight: '600',
                                textMonthFontWeight: '800',
                                textDayHeaderFontWeight: '700',
                            }}
                        />
                        <TouchableOpacity
                            style={styles.clearDateBtn}
                            onPress={() => {
                                setDateFilterActive(false);
                                setIsDatePickerVisible(false);
                            }}
                        >
                            <Text style={styles.clearDateText}>Clear Date Filter</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    pageHeader: { paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },

    viewToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 3 },
    toggleOption: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    toggleOptionActive: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },

    filterSection: { paddingHorizontal: 16, marginBottom: 8 },
    searchBarWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
    searchInput: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500' },

    categoriesRow: { marginTop: 16, marginBottom: 4 },
    categoriesContent: { gap: 8, paddingRight: 20 },
    categoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9' },
    categoryBtnActive: { backgroundColor: '#3B82F6' },
    categoryText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    categoryTextActive: { color: '#FFFFFF' },

    dateFilterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start', marginTop: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    dateFilterBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    dateFilterText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    dateFilterTextActive: { color: '#3B82F6' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 8 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    clearDateBtn: { marginTop: 16, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    clearDateText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },

    calendarContainer: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 20, padding: 8, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },

    list: { padding: 16, paddingBottom: 100 },
    appointmentCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWeight: 1, borderColor: '#F1F5F9' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: '800', color: '#3B82F6' },
    patientName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    patientId: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 1 },

    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

    cardDivider: { height: 1.5, backgroundColor: '#F1F5F9', marginVertical: 16 },
    cardDetails: { gap: 16 },
    detailRow: { flexDirection: 'row', gap: 24 },
    detailCol: { flex: 1 },
    detailLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 6 },
    detailValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailValue: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
    timeValue: { fontSize: 12, color: '#64748B', fontWeight: '600', marginLeft: 20, marginTop: 2 },
    serviceValue: { fontSize: 13, fontWeight: '800', color: '#3B82F6' },

    reasonRow: {},
    reasonText: { fontSize: 13, color: '#475569', lineHeight: 18, fontWeight: '500' },

    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 16 },
    actionIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },

    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginTop: 12 },
});

export default DoctorAppointments;
