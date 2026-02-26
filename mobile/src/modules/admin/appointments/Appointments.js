/**
 * Admin Appointments - Refined High-Fidelity Version
 * achieving 1:1 visual parity with the web interface screenshot
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { appointmentsService } from '../../../services';
import { Calendar } from 'react-native-calendars';
import AnimatedDropdown from '../../../components/AnimatedDropdown';

const AdminAppointments = ({ navigation }) => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Newest First');
    const [showCalendar, setShowCalendar] = useState(false);
    const [dateFilter, setDateFilter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState(null);

    const fetchAppointments = useCallback(async () => {
        try {
            const data = await appointmentsService.fetchAppointments();
            setAppointments(data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    const onRefresh = () => { setRefreshing(true); fetchAppointments(); };

    const filteredAppointments = useMemo(() => {
        let result = appointments.filter(apt => {
            const matchesSearch = (apt.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (apt.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (apt.condition || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'All' ||
                (apt.status || '').toLowerCase() === statusFilter.toLowerCase();

            const matchesDate = !dateFilter ||
                (apt.date && new Date(apt.date).toISOString().split('T')[0] === dateFilter);

            return matchesSearch && matchesStatus && matchesDate;
        });

        // Sorting
        if (sortBy === 'Newest First') {
            result.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        } else if (sortBy === 'Oldest First') {
            result.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
        } else if (sortBy === 'Patient Name') {
            result.sort((a, b) => (a.patientName || '').localeCompare(b.patientName || ''));
        }

        return result;
    }, [appointments, searchQuery, statusFilter, dateFilter, sortBy]);

    const paginatedAppointments = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAppointments.slice(start, start + itemsPerPage);
    }, [filteredAppointments, currentPage]);

    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'scheduled': return { bg: '#EFF6FF', text: '#3B82F6' };
            case 'confirmed': return { bg: '#ECFDF5', text: '#10B981' };
            case 'pending': return { bg: '#FFF7ED', text: '#F59E0B' };
            case 'cancelled': return { bg: '#FEF2F2', text: '#EF4444' };
            default: return { bg: '#F8FAFC', text: '#64748B' };
        }
    };

    const statusOptions = ['All', 'Scheduled', 'Confirmed', 'Pending', 'Cancelled'];
    const sortOptions = ['Newest First', 'Oldest First', 'Patient Name'];

    const handleToggle = (type) => {
        if (openDropdown === type) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(type);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete Appointment',
            'Are you sure you want to delete this appointment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await appointmentsService.deleteAppointment(id);
                            fetchAppointments();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete appointment');
                        }
                    }
                }
            ]
        );
    };

    const renderAppointment = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const appointmentDate = item.date ? new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

        return (
            <TouchableOpacity
                style={styles.premiumCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AppointmentForm', { appointment: item })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.patientInfo}>
                        <View style={styles.avatarPremium}>
                            <Text style={styles.avatarTextPremium}>{(item.patientName || 'P')[0]}</Text>
                        </View>
                        <View>
                            <Text style={styles.patientNamePremium} numberOfLines={1}>{item.patientName || 'Unknown Patient'}</Text>
                            <Text style={styles.patientIdPremium}>ID: PAT-{(item._id || '000').slice(-5).toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadgePremium, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusTextPremium, { color: statusStyle.text }]}>{item.status || 'Scheduled'}</Text>
                    </View>
                </View>

                <View style={styles.cardDetailsRow}>
                    <View style={styles.detailItem}>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="medical-services" size={16} color="#3B82F6" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>TREATING DOCTOR</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{item.doctorName || 'Dr. Unassigned'}</Text>
                        </View>
                    </View>
                    <View style={styles.detailItem}>
                        <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
                            <MaterialIcons name="schedule" size={16} color="#10B981" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>SLOT TIME</Text>
                            <Text style={styles.detailValue}>{item.time || '09:00 AM'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardFooterPremium}>
                    <View style={styles.dateSection}>
                        <MaterialIcons name="event" size={14} color="#94A3B8" />
                        <Text style={styles.appointmentDateText}>{appointmentDate}</Text>
                    </View>
                    <View style={styles.footerActions}>
                        <TouchableOpacity style={styles.footerActionBtn} onPress={() => navigation.navigate('AppointmentForm', { appointment: item })}>
                            <MaterialIcons name="edit" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.footerActionBtn} onPress={() => handleDelete(item._id || item.id)}>
                            <MaterialIcons name="delete" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.container}>
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <View style={styles.pageHeaderLeft}>
                        <Text style={styles.pageTitle}>BOOKINGS</Text>
                        <Text style={styles.pageSubtitle}>Manage and schedule patient visits</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AppointmentForm', {})}>
                        <MaterialIcons name="add" size={20} color={"#FFFFFF"} />
                        <Text style={styles.addBtnText}>Add New</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar Top */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <MaterialIcons name="search" size={18} color="#94A3B8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search appointments..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={(t) => { setSearchQuery(t); setCurrentPage(1); }}
                        />
                    </View>
                </View>

                {/* Filter Row with Dropdowns */}
                <View style={styles.filterRow}>
                    <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'status' ? 100 : 1 }]}>
                        <TouchableOpacity
                            style={[styles.dropdownBtn, openDropdown === 'status' && styles.dropdownBtnActive]}
                            onPress={() => handleToggle('status')}
                        >
                            <Text style={styles.dropdownBtnText}>{statusFilter}</Text>
                            <MaterialIcons name={openDropdown === 'status' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                        </TouchableOpacity>
                        <AnimatedDropdown
                            visible={openDropdown === 'status'}
                            options={statusOptions}
                            currentValue={statusFilter}
                            onSelect={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                            onClose={() => setOpenDropdown(null)}
                            topPosition={48}
                        />
                    </View>

                    <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'sort' ? 100 : 1 }]}>
                        <TouchableOpacity
                            style={[styles.dropdownBtn, openDropdown === 'sort' && styles.dropdownBtnActive]}
                            onPress={() => handleToggle('sort')}
                        >
                            <Text style={styles.dropdownBtnText}>{sortBy}</Text>
                            <MaterialIcons name={openDropdown === 'sort' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                        </TouchableOpacity>
                        <AnimatedDropdown
                            visible={openDropdown === 'sort'}
                            options={sortOptions}
                            currentValue={sortBy}
                            onSelect={setSortBy}
                            onClose={() => setOpenDropdown(null)}
                            topPosition={48}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.dateFilterBtn, dateFilter && styles.dateFilterBtnActive]}
                        onPress={() => setShowCalendar(true)}
                    >
                        <MaterialIcons name="event" size={18} color={dateFilter ? "#3B82F6" : "#64748B"} />
                        {dateFilter && (
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); setDateFilter(null); }}>
                                <MaterialIcons name="cancel" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Appointment List */}
                {isLoading ? (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                ) : (
                    <FlatList
                        data={paginatedAppointments}
                        renderItem={renderAppointment}
                        keyExtractor={(item, index) => item._id || item.id || `apt-${index}`}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <MaterialIcons name="event-busy" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>No appointments found</Text>
                            </View>
                        }
                    />
                )}

                {/* Pagination Footer */}
                <View style={styles.paginationFooter}>
                    <TouchableOpacity
                        disabled={currentPage === 1}
                        onPress={() => setCurrentPage(p => p - 1)}
                        style={[styles.pageBtn, currentPage === 1 && styles.disabledBtn]}
                    >
                        <MaterialIcons name="chevron-left" size={24} color={currentPage === 1 ? "#CBD5E1" : "#1E293B"} />
                    </TouchableOpacity>
                    <Text style={styles.pageInfoText}>Page {currentPage} of {totalPages}</Text>
                    <TouchableOpacity
                        disabled={currentPage === totalPages}
                        onPress={() => setCurrentPage(p => p + 1)}
                        style={[styles.pageBtn, currentPage === totalPages && styles.disabledBtn]}
                    >
                        <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages ? "#CBD5E1" : "#1E293B"} />
                    </TouchableOpacity>
                </View>

                {/* Calendar Modal */}
                <Modal transparent visible={showCalendar} animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.calendarContainer}>
                            <Calendar
                                onDayPress={(day) => {
                                    setDateFilter(day.dateString);
                                    setShowCalendar(false);
                                    setCurrentPage(1);
                                }}
                                markedDates={dateFilter ? { [dateFilter]: { selected: true, selectedColor: '#3B82F6' } } : {}}
                                theme={{
                                    selectedDayBackgroundColor: '#3B82F6',
                                    todayTextColor: '#3B82F6',
                                    arrowColor: '#3B82F6',
                                }}
                            />
                            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowCalendar(false)}>
                                <Text style={styles.closeModalText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 40, paddingBottom: 24, paddingHorizontal: 16, backgroundColor: '#F8FAFC' },
    pageHeaderLeft: { flex: 1, marginRight: 16 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, elevation: 2 },
    addBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, marginLeft: 4 },

    searchContainer: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 46, gap: 8 },
    searchInput: { flex: 1, fontSize: 13, color: '#1E293B' },

    filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 10, backgroundColor: '#FFFFFF', zIndex: 10 },
    dropdownWrapper: { flex: 1, position: 'relative' },
    dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 44 },
    dropdownBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    dropdownBtnText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },

    dateFilterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    dateFilterBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },


    // List & Cards
    list: { padding: 16, paddingBottom: 100 },
    premiumCard: { backgroundColor: '#FFFFFF', borderRadius: 24, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarPremium: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    avatarTextPremium: { fontSize: 16, fontWeight: '800', color: '#3B82F6' },
    patientNamePremium: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    patientIdPremium: { fontSize: 11, color: '#94A3B8', fontWeight: '700', marginTop: 2 },
    statusBadgePremium: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusTextPremium: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    cardDetailsRow: { flexDirection: 'row', padding: 16, gap: 20 },
    detailItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    detailLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.3 },
    detailValue: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 1 },

    cardFooterPremium: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    dateSection: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    appointmentDateText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
    footerActions: { flexDirection: 'row', gap: 12 },
    footerActionBtn: { padding: 6, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },

    paginationFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingBottom: 15 },
    pageBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
    disabledBtn: { opacity: 0.3 },
    pageInfoText: { fontSize: 14, fontWeight: '700', color: '#64748B' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    calendarContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, width: '100%', maxWidth: 400 },
    closeModalBtn: { marginTop: 16, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    closeModalText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '500', marginTop: 12 }
});

export default AdminAppointments;
