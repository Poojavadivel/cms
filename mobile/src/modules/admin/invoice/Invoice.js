/**
 * Admin Payroll (Invoice) - High-Fidelity Refined Version
 * Achieving 1:1 visual parity with the web payroll module.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { invoiceService } from '../../../services';
import AnimatedDropdown from '../../../components/AnimatedDropdown';

const { width } = Dimensions.get('window');

const AdminInvoice = ({ navigation }) => {
    const [payrolls, setPayrolls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [periodFilter, setPeriodFilter] = useState('All Periods');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState(null);

    const periodOptions = ['All Periods', 'Current Month', 'Last Month'];
    const statusOptions = ['All', 'Pending', 'Approved'];

    const fetchPayrolls = useCallback(async () => {
        try {
            const data = await invoiceService.fetchInvoices();
            setPayrolls(data);
        } catch (error) {
            console.error('Error fetching payrolls:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPayrolls();
    };

    const filteredPayrolls = useMemo(() => {
        return payrolls.filter(p => {
            const matchesSearch = (p.staffName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.staffCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.department || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'All' ||
                (p.status || '').toLowerCase() === statusFilter.toLowerCase();

            // Simplified period filter logic for demo parity
            const matchesPeriod = periodFilter === 'All Periods' ||
                (periodFilter === 'Current Month'); // In real app, date logic would be here

            return matchesSearch && matchesStatus && matchesPeriod;
        });
    }, [payrolls, searchQuery, statusFilter, periodFilter]);

    const paginatedPayrolls = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPayrolls.slice(start, start + itemsPerPage);
    }, [filteredPayrolls, currentPage]);

    const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage) || 1;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return { bg: '#F1F5F9', text: '#64748B', label: 'approved' };
            case 'pending': return { bg: '#FFF7ED', text: '#F97316', label: 'pending' };
            default: return { bg: '#F1F5F9', text: '#64748B', label: status || 'pending' };
        }
    };

    const handleToggle = (type) => {
        if (openDropdown === type) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(type);
        }
    };

    const renderPayrollRow = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);

        return (
            <TouchableOpacity style={styles.premiumCard} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                    <View style={styles.avatarMiniPremium}>
                        <MaterialIcons name="person" size={16} color="#3B82F6" />
                    </View>
                    <View style={styles.employeeInfo}>
                        <Text style={styles.employeeNamePremium}>{item.staffName}</Text>
                        <Text style={styles.employeeIdPremium}>#{item.staffCode} • {item.department}</Text>
                    </View>
                    <View style={[styles.statusBadgePremium, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusTextPremium, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardContent}>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>PAY PERIOD</Text>
                            <Text style={styles.statValue}>{item.payMonth}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>GROSS PAY</Text>
                            <Text style={styles.statValue}>{formatCurrency(item.grossPay)}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={[styles.statLabel, { color: '#3B82F6' }]}>NET PAY</Text>
                            <Text style={[styles.statValue, { color: '#3B82F6', fontWeight: '900' }]}>{formatCurrency(item.netPay)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.footerInfo}>
                        <MaterialIcons name="event" size={14} color="#94A3B8" />
                        <Text style={styles.footerText}>Issued on {item.date}</Text>
                    </View>
                    <View style={styles.footerActions}>
                        <TouchableOpacity style={styles.iconActionBtn}><MaterialIcons name="visibility" size={18} color="#64748B" /></TouchableOpacity>
                        <TouchableOpacity style={styles.iconActionBtn}><MaterialIcons name="edit" size={18} color="#3B82F6" /></TouchableOpacity>
                        <TouchableOpacity style={styles.iconActionBtn}><MaterialIcons name="delete" size={18} color="#EF4444" /></TouchableOpacity>
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
                        <Text style={styles.pageTitle}>PAYROLL</Text>
                        <Text style={styles.pageSubtitle}>Manage staff salaries, deductions, and invoices</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.moreHeaderBtn}
                            onPress={() => setShowBulkActions(true)}
                        >
                            <MaterialIcons name="more-vert" size={20} color={"#64748B"} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.processBtn}>
                            <MaterialIcons name="add" size={18} color={"#FFFFFF"} />
                            <Text style={styles.processBtnText}>Process</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Controls Bar */}
                <View style={[styles.controlsBar, { zIndex: 100 }]}>
                    <View style={styles.searchBar}>
                        <MaterialIcons name="search" size={18} color="#94A3B8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by Employee, Code, Dept or Payroll ID..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={(t) => { setSearchQuery(t); setCurrentPage(1); }}
                        />
                    </View>

                    <View style={styles.filtersRow}>
                        <View style={[styles.dropdownWrapper, { flex: 1, zIndex: openDropdown === 'period' ? 100 : 1 }]}>
                            <TouchableOpacity
                                style={[styles.dropdownBtn, openDropdown === 'period' && styles.dropdownBtnActive]}
                                onPress={() => handleToggle('period')}
                            >
                                <Text style={styles.dropdownBtnText} numberOfLines={1}>{periodFilter}</Text>
                                <MaterialIcons name={openDropdown === 'period' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                            </TouchableOpacity>
                            <AnimatedDropdown
                                visible={openDropdown === 'period'}
                                options={periodOptions}
                                currentValue={periodFilter}
                                onSelect={(val) => { setPeriodFilter(val); setCurrentPage(1); }}
                                onClose={() => setOpenDropdown(null)}
                                topPosition={44}
                            />
                        </View>

                        <View style={[styles.dropdownWrapper, { flex: 1, zIndex: openDropdown === 'status' ? 100 : 1 }]}>
                            <TouchableOpacity
                                style={[styles.dropdownBtn, openDropdown === 'status' && styles.dropdownBtnActive]}
                                onPress={() => handleToggle('status')}
                            >
                                <Text style={styles.dropdownBtnText} numberOfLines={1}>{statusFilter}</Text>
                                <MaterialIcons name={openDropdown === 'status' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                            </TouchableOpacity>
                            <AnimatedDropdown
                                visible={openDropdown === 'status'}
                                options={statusOptions}
                                currentValue={statusFilter}
                                onSelect={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                                onClose={() => setOpenDropdown(null)}
                                topPosition={44}
                            />
                        </View>

                        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                            <MaterialIcons name="refresh" size={18} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Payroll List */}
                {isLoading ? (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                ) : (
                    <FlatList
                        data={paginatedPayrolls}
                        renderItem={renderPayrollRow}
                        keyExtractor={(item, index) => item.id || `pr-${index}`}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <MaterialIcons name="receipt-long" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>No payroll records found</Text>
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
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    moreHeaderBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
    processBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, gap: 6, elevation: 2 },
    processBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

    // Controls
    controlsBar: { backgroundColor: '#FFFFFF', padding: 16, gap: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, height: 46, paddingHorizontal: 14, gap: 10 },
    searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },

    filtersRow: { flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 100 },

    dropdownWrapper: { position: 'relative' },
    dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, height: 40, backgroundColor: '#FFFFFF' },
    dropdownBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    dropdownBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B', flex: 1, marginRight: 8 },

    refreshBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, width: 40, height: 40, backgroundColor: '#FFFFFF' },

    // Table
    tableContent: { width: 840 },
    tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerColText: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },

    // List & Cards
    list: { padding: 16, paddingBottom: 100 },
    premiumCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    avatarMiniPremium: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    employeeInfo: { flex: 1 },
    employeeNamePremium: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    employeeIdPremium: { fontSize: 11, color: '#94A3B8', fontWeight: '700', marginTop: 2 },
    statusBadgePremium: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusTextPremium: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    cardDivider: { height: 1, backgroundColor: '#F1F5F9' },

    cardContent: { padding: 16, backgroundColor: '#FFFFFF' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1 },
    statLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginBottom: 4, letterSpacing: 0.5 },
    statValue: { fontSize: 13, fontWeight: '700', color: '#475569' },

    cardFooter: { flexDirection: 'row', padding: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    footerActions: { flexDirection: 'row', gap: 16 },
    iconActionBtn: { padding: 4 },

    paginationFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingBottom: 15 },
    pageNavBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
    pageInfo: { fontSize: 14, fontWeight: '700', color: '#64748B' },
    disabledNav: { opacity: 0.3 },

    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginTop: 12 }
});

export default AdminInvoice;
