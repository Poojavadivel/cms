/**
 * Admin Pathology - High-Fidelity Refined Version
 * Achieving 1:1 visual parity with the web pathology module.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { pathologyService } from '../../../services';

const { width } = Dimensions.get('window');

const AdminPathology = ({ navigation }) => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [testTypeFilter, setTestTypeFilter] = useState('All');
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchReports = useCallback(async () => {
        try {
            const data = await pathologyService.fetchReports();
            setReports(data);
        } catch (error) {
            console.error('Error fetching pathology reports:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchReports();
    };

    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const matchesSearch = (r.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.testName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.patientId || '').includes(searchQuery);

            const matchesStatus = statusFilter === 'All' ||
                (r.status || '').toLowerCase() === statusFilter.toLowerCase();

            const matchesTestType = testTypeFilter === 'All' ||
                (r.testName || '').toLowerCase().includes(testTypeFilter.toLowerCase()) ||
                (r.testCategory || '').toLowerCase().includes(testTypeFilter.toLowerCase());

            return matchesSearch && matchesStatus && matchesTestType;
        });
    }, [reports, searchQuery, statusFilter, testTypeFilter]);

    const paginatedReports = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredReports.slice(start, start + itemsPerPage);
    }, [filteredReports, currentPage]);

    const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return { bg: '#FFF7ED', text: '#F97316', label: 'Pending' };
            case 'in progress': return { bg: '#FFF7ED', text: '#F59E0B', label: 'In Progress' };
            case 'completed': return { bg: '#DCFCE7', text: '#16A34A', label: 'Completed' };
            default: return { bg: '#F1F5F9', text: '#64748B', label: status || 'Pending' };
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete Report',
            'Are you sure you want to delete this lab report?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (pathologyService.deleteReport) {
                                await pathologyService.deleteReport(id);
                                fetchReports();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete report');
                        }
                    }
                }
            ]
        );
    };

    const renderReportRow = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const reportDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '12/02/26';

        return (
            <TouchableOpacity
                style={styles.premiumCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('LabReportForm', { report: item })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.patientInfo}>
                        <View style={styles.avatarPremium}>
                            <Text style={styles.avatarPremiumText}>{(item.patientName || 'P')[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.patientNamePremium} numberOfLines={1}>{item.patientName || 'Unknown Patient'}</Text>
                            <Text style={styles.patientIdPremium}>ID: PAT-{(item._id || '000').slice(-5).toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadgePremium, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusTextPremium, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                    </View>
                </View>

                <View style={styles.testSection}>
                    <View style={styles.testDetails}>
                        <MaterialIcons name="biotech" size={16} color="#3B82F6" />
                        <View>
                            <Text style={styles.testNamePremium}>{item.testName || 'Laboratory Test'}</Text>
                            <Text style={styles.categoryPremium}>{item.testCategory || 'General Diagnostics'}</Text>
                        </View>
                    </View>
                    <View style={styles.techBadge}>
                        <MaterialIcons name="person-outline" size={12} color="#64748B" />
                        <Text style={styles.techTextPremium}>{item.technicianName || 'Udaya'}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.dateInfo}>
                        <MaterialIcons name="event-note" size={14} color="#94A3B8" />
                        <Text style={styles.dateTextPremium}>Reported on {reportDate}</Text>
                    </View>
                    <View style={styles.footerActions}>
                        <TouchableOpacity style={styles.iconActionBtn}><MaterialIcons name="visibility" size={18} color="#64748B" /></TouchableOpacity>
                        <TouchableOpacity style={styles.iconActionBtn}><MaterialIcons name="edit" size={18} color="#3B82F6" /></TouchableOpacity>
                        <TouchableOpacity style={styles.iconActionBtn}><MaterialIcons name="delete" size={18} color="#EF4444" /></TouchableOpacity>
                        <TouchableOpacity style={styles.iconActionBtn}><MaterialIcons name="download" size={18} color="#64748B" /></TouchableOpacity>
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
                        <Text style={styles.pageTitle}>PATHOLOGY</Text>
                        <Text style={styles.pageSubtitle}>Manage lab test reports and diagnostics</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]}>
                            <MaterialIcons name="file-download" size={20} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('LabReportForm', {})}>
                            <MaterialIcons name="add" size={20} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>New</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Controls Bar */}
                <View style={styles.controlsBar}>
                    <View style={styles.searchBar}>
                        <MaterialIcons name="search" size={18} color="#94A3B8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search reports by ID, patient name, test name..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={(t) => { setSearchQuery(t); setCurrentPage(1); }}
                        />
                    </View>

                    <View style={styles.controlsTopRow}>
                        <View style={styles.tabsCol}>
                            {['All', 'Pending', 'In Progress'].map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.tab, statusFilter === tab && styles.activeTab]}
                                    onPress={() => { setStatusFilter(tab); setCurrentPage(1); }}
                                >
                                    <Text style={[styles.tabText, statusFilter === tab && styles.activeTabText]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[styles.moreBtn, showMoreFilters && styles.activeMoreBtn]}
                                onPress={() => setShowMoreFilters(!showMoreFilters)}
                            >
                                <Text style={[styles.moreBtnText, showMoreFilters && styles.activeMoreBtnText]}>
                                    {showMoreFilters ? 'Less Filters' : 'More Filters'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showMoreFilters && (
                        <View style={styles.advancedFiltersRow}>
                            {['All', 'X-Ray', 'Blood Test', 'Urine Test'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeBtn, testTypeFilter === type && styles.activeTypeBtn]}
                                    onPress={() => { setTestTypeFilter(type); setCurrentPage(1); }}
                                >
                                    <Text style={[styles.typeBtnText, testTypeFilter === type && styles.activeTypeBtnText]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Report List */}
                {isLoading ? (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                ) : (
                    <FlatList
                        data={paginatedReports}
                        renderItem={renderReportRow}
                        keyExtractor={(item, index) => item._id || item.id || `rep-${index}`}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <MaterialIcons name="science" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>No pathology reports found</Text>
                            </View>
                        }
                    />
                )}

                {/* Pagination Footer */}
                <View style={styles.paginationFooter}>
                    <TouchableOpacity
                        disabled={currentPage === 1}
                        onPress={() => setCurrentPage(p => p - 1)}
                        style={[styles.pageNavBtn, currentPage === 1 && styles.disabledNav]}
                    >
                        <MaterialIcons name="chevron-left" size={24} color={currentPage === 1 ? "#E2E8F0" : "#64748B"} />
                    </TouchableOpacity>
                    <Text style={styles.pageInfo}>Page {currentPage} of {totalPages}</Text>
                    <TouchableOpacity
                        disabled={currentPage === totalPages}
                        onPress={() => setCurrentPage(p => p + 1)}
                        style={[styles.pageNavBtn, currentPage === totalPages && styles.disabledNav]}
                    >
                        <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages ? "#E2E8F0" : "#64748B"} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    // Header
    scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 40, paddingBottom: 24, paddingHorizontal: 16, backgroundColor: '#F8FAFC' },
    pageHeaderLeft: { flex: 1, marginRight: 16 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, gap: 6, elevation: 2 },
    actionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

    // Controls
    controlsBar: { backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
    controlsTopRow: { flexDirection: 'row', alignItems: 'center' },
    tabsCol: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, height: 46, paddingHorizontal: 14, gap: 10 },
    searchInput: { flex: 1, fontSize: 13, color: '#1E293B' },

    tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    activeTab: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    activeTabText: { color: '#FFFFFF' },

    moreBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#3B82F6' },
    activeMoreBtn: { backgroundColor: '#EFF6FF' },
    moreBtnText: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
    activeMoreBtnText: { color: '#3B82F6' },

    advancedFiltersRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    typeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    activeTypeBtn: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    typeBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    activeTypeBtnText: { color: '#FFFFFF' },

    // List & Cards
    list: { padding: 16, paddingBottom: 100 },
    premiumCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    cardHeader: { flexDirection: 'row', padding: 16, alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    avatarPremium: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    avatarPremiumText: { fontSize: 16, fontWeight: '800', color: '#3B82F6' },
    patientNamePremium: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    patientIdPremium: { fontSize: 11, color: '#94A3B8', fontWeight: '700', marginTop: 2 },
    statusBadgePremium: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusTextPremium: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    testSection: { padding: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    testDetails: { flexDirection: 'row', gap: 10, flex: 1 },
    testNamePremium: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    categoryPremium: { fontSize: 11, color: '#64748B', fontWeight: '600' },
    techBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    techTextPremium: { fontSize: 10, fontWeight: '700', color: '#64748B' },

    cardFooter: { flexDirection: 'row', padding: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateTextPremium: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    footerActions: { flexDirection: 'row', gap: 12 },
    iconActionBtn: { padding: 4 },

    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginTop: 12 },

    // Pagination
    paginationFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingBottom: 10 },
    pageNavBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
    pageInfo: { fontSize: 14, fontWeight: '700', color: '#64748B' },
    disabledNav: { opacity: 0.3 }
});

export default AdminPathology;
