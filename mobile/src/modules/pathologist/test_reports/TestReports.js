import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Modal, TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { pathologyService } from '../../../services';
import AnimatedDropdown from '../../../components/AnimatedDropdown';

const { width } = Dimensions.get('window');

const PathologistTestReports = ({ navigation }) => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const initialSearch = navigation.getState()?.routes?.find(r => r.name === 'TestReports')?.params?.search || '';
    const [search, setSearch] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState('All'); // All, Completed, Pending
    const [sortBy, setSortBy] = useState('Newest First');
    const [showPendingOnly, setShowPendingOnly] = useState(false);

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState(null); // 'status', 'sort', or null

    const fetchData = useCallback(async () => {
        try {
            const data = await pathologyService.fetchReports();
            setReports(data || []);
        } catch (e) {
            console.error('Error fetching reports:', e);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const filteredReports = useMemo(() => {
        let result = reports.filter(r => {
            const matchesSearch = (r.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
                (r.patientCode || '').toLowerCase().includes(search.toLowerCase()) ||
                (r.testName || '').toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'All' || r.status?.toLowerCase() === statusFilter.toLowerCase();
            const matchesPendingToggle = !showPendingOnly || r.status?.toLowerCase() === 'pending';

            return matchesSearch && matchesStatus && matchesPendingToggle;
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
    }, [reports, search, statusFilter, showPendingOnly, sortBy]);

    const pendingCount = useMemo(() => reports.filter(r => r.status?.toLowerCase() === 'pending').length, [reports]);

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return { bg: '#F0FDF4', text: '#10B981' };
            case 'pending': return { bg: '#FFF7ED', text: '#F59E0B' };
            case 'in-progress': return { bg: '#EFF6FF', text: '#3B82F6' };
            case 'critical': return { bg: '#FEF2F2', text: '#EF4444' };
            default: return { bg: '#F1F5F9', text: '#64748B' };
        }
    };

    const statusOptions = ['All', 'Completed', 'Pending'];
    const sortOptions = ['Newest First', 'Oldest First', 'Patient Name'];

    const handleToggle = (type) => {
        if (openDropdown === type) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(type);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header Content - Moved out of FlatList for Z-Index safety */}
            <View style={styles.headerContainer}>
                {/* Banner Header */}
                <View style={styles.banner}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.bannerTitle}>Test Reports</Text>
                        <Text style={styles.bannerSubtitle}>Manage pathology test reports and results</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.newReportBtn}
                        onPress={() => navigation.navigate('LabReportForm')}
                    >
                        <Feather name="plus" size={16} color="#FFF" />
                        <Text style={styles.newReportText}>New Report</Text>
                    </TouchableOpacity>
                </View>

                {/* Filter Bar */}
                <View style={styles.filterSection}>
                    <View style={styles.searchContainer}>
                        <Feather name="search" size={18} color="#94A3B8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by patient name, code, or test type..."
                            placeholderTextColor="#94A3B8"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[styles.pendingToggle, showPendingOnly && styles.pendingToggleActive]}
                            onPress={() => setShowPendingOnly(!showPendingOnly)}
                        >
                            <Text style={[styles.pendingToggleText, showPendingOnly && styles.pendingToggleTextActive]}>Pending Orders</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{pendingCount}</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'status' ? 100 : 1 }]}>
                            <TouchableOpacity
                                style={[styles.statusPicker, openDropdown === 'status' && styles.statusPickerActive]}
                                onPress={() => handleToggle('status')}
                            >
                                <Text style={styles.statusPickerText}>{statusFilter} Status</Text>
                                <Feather name={openDropdown === 'status' ? "chevron-up" : "chevron-down"} size={16} color="#64748B" />
                            </TouchableOpacity>
                            <AnimatedDropdown
                                visible={openDropdown === 'status'}
                                options={statusOptions}
                                currentValue={statusFilter}
                                onSelect={setStatusFilter}
                                onClose={() => setOpenDropdown(null)}
                                topPosition={48}
                            />
                        </View>

                        <View style={[styles.dropdownWrapper, { flex: 0.6, zIndex: openDropdown === 'sort' ? 100 : 1 }]}>
                            <TouchableOpacity
                                style={[styles.statusPicker, openDropdown === 'sort' && styles.statusPickerActive]}
                                onPress={() => handleToggle('sort')}
                            >
                                <Feather name="filter" size={16} color={sortBy !== 'Newest First' ? "#3B82F6" : "#64748B"} />
                                <Feather name={openDropdown === 'sort' ? "chevron-up" : "chevron-down"} size={14} color="#64748B" />
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
                    </View>
                </View>
            </View>

            <FlatList
                data={filteredReports}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.id || `report-${index}`}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="documents-outline" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No matching reports found</Text>
                    </View>
                }
                ListFooterComponent={
                    filteredReports.length > 0 && (
                        <View style={styles.pagination}>
                            <Text style={styles.pageText}>Page 1 of 1</Text>
                            <View style={styles.pageButtons}>
                                <TouchableOpacity style={styles.pageBtn} disabled>
                                    <Feather name="chevron-left" size={18} color="#CBD5E1" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pageBtn} disabled>
                                    <Feather name="chevron-right" size={18} color="#CBD5E1" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
    listContent: { paddingBottom: 40 },

    // Header
    headerContainer: { zIndex: 1000, elevation: 10 },
    banner: { backgroundColor: '#1E3A8A', margin: 16, borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    bannerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
    bannerSubtitle: { fontSize: 12, color: '#BFDBFE', marginTop: 4, fontWeight: '500' },
    newReportBtn: { backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
    newReportText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

    // Filter Bar
    filterSection: { marginHorizontal: 16, marginBottom: 12, zIndex: 1000, elevation: 10 },
    searchContainer: { backgroundColor: '#FFF', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 14, color: '#1E293B', fontWeight: '500' },
    filterRow: { flexDirection: 'row', gap: 12, zIndex: 1000, elevation: 10 }, // Added zIndex
    pendingToggle: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, gap: 8 },
    pendingToggleActive: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    pendingToggleText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    pendingToggleTextActive: { color: '#EF4444' },
    countBadge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
    countText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

    dropdownWrapper: { flex: 0.8, position: 'relative' }, // Replaced statusPicker with wrapper
    statusPicker: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 44 },
    statusPickerActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    statusPickerText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },

    // Card Design
    reportCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 16, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: '800', color: '#3B82F6' },
    patientName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    patientCode: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
    actionRow: { flexDirection: 'row', gap: 8 },
    actionIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },

    divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },

    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    testInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    testIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
    testName: { fontSize: 14, fontWeight: '900', color: '#1E3A8A' },
    testType: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 },

    metaInfo: { alignItems: 'flex-end', gap: 6 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, fontWeight: '900' },
    techBadge: { backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    techText: { fontSize: 8, fontWeight: '800', color: '#8B5CF6' },

    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerDate: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },

    // Pagination
    pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 10 },
    pageText: { fontSize: 12, fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    pageButtons: { flexDirection: 'row', gap: 8 },
    pageBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    emptyState: { padding: 60, alignItems: 'center', gap: 12 },
    emptyText: { color: '#94A3B8', fontWeight: '600', fontSize: 14 }
});

export default PathologistTestReports;
