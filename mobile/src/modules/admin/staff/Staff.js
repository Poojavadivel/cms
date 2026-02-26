/**
 * Admin Staff - High-Fidelity Refined Version
 * Achieving 1:1 visual parity with the web staff module.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { staffService } from '../../../services';
import AnimatedDropdown from '../../../components/AnimatedDropdown';

const AdminStaff = ({ navigation }) => {
    const [staff, setStaff] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Name (A-Z)');
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const [selectedDept, setSelectedDept] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState(null);

    const departments = ['All', 'Medical Department', 'Nursing Department', 'Pathology', 'Pharmacy', 'Medical'];
    const statusOptions = ['All', 'Active', 'Inactive'];
    const sortOptions = ['Name (A-Z)', 'Role', 'Department'];

    const fetchStaff = useCallback(async () => {
        try {
            const data = await staffService.fetchStaffs();
            setStaff(data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const onRefresh = () => { setRefreshing(true); fetchStaff(); };

    const filteredStaff = useMemo(() => {
        let result = staff.filter(s => {
            const name = s.name || '';
            const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.patientFacingId || s.id || '').includes(searchQuery) ||
                (s.designation || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'All' ||
                (statusFilter === 'Active' && ((s.status || '').toLowerCase() === 'active' || (s.status || '').toLowerCase() === 'available')) ||
                (statusFilter === 'Inactive' && ((s.status || '').toLowerCase() === 'inactive' || (s.status || '').toLowerCase() === 'unavailable' || (s.status || '').toLowerCase() === 'off duty'));

            const matchesDept = selectedDept === 'All' ||
                (s.department || '').toLowerCase() === selectedDept.toLowerCase();

            return matchesSearch && matchesStatus && matchesDept;
        });

        if (sortBy === 'Name (A-Z)') {
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortBy === 'Role') {
            result.sort((a, b) => (a.designation || '').localeCompare(b.designation || ''));
        } else if (sortBy === 'Department') {
            result.sort((a, b) => (a.department || '').localeCompare(b.department || ''));
        }

        return result;
    }, [staff, searchQuery, statusFilter, selectedDept, sortBy]);

    const paginatedStaff = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStaff.slice(start, start + itemsPerPage);
    }, [filteredStaff, currentPage]);

    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;

    const handleToggle = (type) => {
        if (openDropdown === type) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(type);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Remove Staff',
            'Are you sure you want to remove this staff member?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await staffService.deleteStaff(id);
                            fetchStaff();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove staff');
                        }
                    }
                }
            ]
        );
    };

    const renderStaff = ({ item }) => {
        const isAvailable = (item.status || 'Available').toLowerCase() === 'available';

        return (
            <TouchableOpacity
                style={styles.premiumCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('StaffDetail', { staff: item })}
            >
                <View style={styles.cardMain}>
                    <View style={styles.cardHeader}>
                        <View style={styles.avatarLarge}>
                            <Text style={styles.avatarLargeText}>{(item.name || 'S')[0]}</Text>
                        </View>
                        <View style={styles.staffInfo}>
                            <Text style={styles.staffNamePremium} numberOfLines={1}>{item.name || 'Unknown'}</Text>
                            <Text style={styles.staffRole}>{item.designation || 'Staff Member'}</Text>
                        </View>
                        <View style={[styles.statusBadgePremium, { backgroundColor: isAvailable ? '#F0FDF4' : '#FFF7ED' }]}>
                            <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#16A34A' : '#F59E0B' }]} />
                            <Text style={[styles.statusTextPremium, { color: isAvailable ? '#16A34A' : '#F59E0B' }]}>
                                {item.status || 'Available'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.cardDetails}>
                        <View style={styles.detailItem}>
                            <MaterialIcons name="badge" size={14} color="#94A3B8" />
                            <Text style={styles.detailText}>{item.patientFacingId || `STA-${(item.id || '000').slice(-3).toUpperCase()}`}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <MaterialIcons name="business" size={14} color="#94A3B8" />
                            <Text style={styles.detailValuePremium} numberOfLines={1}>{item.department || 'General'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <MaterialIcons name="phone" size={14} color="#94A3B8" />
                            <Text style={styles.detailText}>{item.contact || 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={styles.cardActions}>
                        <TouchableOpacity style={styles.actionBtnPremium} onPress={() => navigation.navigate('StaffForm', { staff: item })}>
                            <MaterialIcons name="edit" size={18} color="#3B82F6" />
                            <Text style={[styles.actionBtnTextPremium, { color: '#3B82F6' }]}>Edit</Text>
                        </TouchableOpacity>
                        <View style={styles.vDivider} />
                        <TouchableOpacity style={styles.actionBtnPremium} onPress={() => handleDelete(item._id || item.id)}>
                            <MaterialIcons name="delete" size={18} color="#EF4444" />
                            <Text style={[styles.actionBtnTextPremium, { color: '#EF4444' }]}>Remove</Text>
                        </TouchableOpacity>
                        <View style={styles.vDivider} />
                        <TouchableOpacity style={styles.actionBtnPremium} onPress={() => navigation.navigate('StaffDetail', { staff: item })}>
                            <MaterialIcons name="arrow-forward" size={18} color="#1E293B" />
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
                        <Text style={styles.pageTitle}>STAFF</Text>
                        <Text style={styles.pageSubtitle}>Manage hospital departments and staff members</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('StaffForm', {})}>
                        <MaterialIcons name="add" size={20} color={"#FFFFFF"} />
                        <Text style={styles.addBtnText}>New Member</Text>
                    </TouchableOpacity>
                </View>

                {/* Filters Bar */}
                <View style={[styles.filtersBar, { zIndex: 100 }]}>
                    <View style={styles.searchBar}>
                        <MaterialIcons name="search" size={18} color="#94A3B8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search staff..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={(t) => { setSearchQuery(t); setCurrentPage(1); }}
                        />
                    </View>

                    <View style={styles.filterRow}>
                        <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'status' ? 100 : 1 }]}>
                            <TouchableOpacity
                                style={[styles.dropdownBtn, openDropdown === 'status' && styles.dropdownBtnActive]}
                                onPress={() => handleToggle('status')}
                            >
                                <Text style={styles.dropdownBtnText}>{statusFilter === 'All' ? 'All Status' : statusFilter}</Text>
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
                            style={[styles.moreBtn, showMoreFilters && styles.activeMoreBtn]}
                            onPress={() => setShowMoreFilters(!showMoreFilters)}
                        >
                            <MaterialIcons name="filter-list" size={20} color={showMoreFilters ? "#3B82F6" : "#64748B"} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Advanced Filters Expandable Section */}
                {showMoreFilters && (
                    <View style={[styles.advancedFilters, { zIndex: 90 }]}>
                        <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'dept' ? 100 : 1 }]}>
                            <Text style={styles.filterLabel}>Department</Text>
                            <TouchableOpacity
                                style={[styles.dropdownBtn, openDropdown === 'dept' && styles.dropdownBtnActive]}
                                onPress={() => handleToggle('dept')}
                            >
                                <Text style={styles.dropdownBtnText}>{selectedDept === 'All' ? 'All Departments' : selectedDept}</Text>
                                <MaterialIcons name={openDropdown === 'dept' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                            </TouchableOpacity>
                            <AnimatedDropdown
                                visible={openDropdown === 'dept'}
                                options={departments}
                                currentValue={selectedDept}
                                onSelect={(val) => { setSelectedDept(val); setCurrentPage(1); }}
                                onClose={() => setOpenDropdown(null)}
                                topPosition={68}
                            />
                        </View>
                    </View>
                )}

                {/* Staff List */}
                {isLoading ? (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                ) : (
                    <FlatList
                        data={paginatedStaff}
                        renderItem={renderStaff}
                        keyExtractor={(item, index) => item._id || item.id || `staff-${index}`}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <MaterialIcons name="groups" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>No staff members found</Text>
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

    filtersBar: { backgroundColor: '#FFFFFF', paddingBottom: 16, gap: 12 },
    searchBar: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', marginHorizontal: 16, borderRadius: 12, height: 46, gap: 10 },
    searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },

    filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, alignItems: 'center', zIndex: 100 },
    dropdownWrapper: { flex: 1, position: 'relative' },
    dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 44 },
    dropdownBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    dropdownBtnText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },

    moreBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FFFFFF' },
    activeMoreBtn: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },

    advancedFilters: { backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 16, flexDirection: 'row' },
    filterLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 6 },


    // List & Cards
    list: { padding: 16, paddingBottom: 100 },
    premiumCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    cardMain: { padding: 0 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    avatarLarge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
    avatarLargeText: { fontSize: 20, fontWeight: '800', color: '#3B82F6' },
    staffInfo: { flex: 1 },
    staffNamePremium: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    staffRole: { fontSize: 12, color: '#64748B', fontWeight: '600' },

    statusBadgePremium: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusTextPremium: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

    cardDivider: { height: 1, backgroundColor: '#F1F5F9' },
    cardDetails: { flexDirection: 'row', padding: 14, backgroundColor: '#F8FAFC', justifyContent: 'space-between' },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    detailText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    detailValuePremium: { fontSize: 12, fontWeight: '700', color: '#475569' },

    cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center' },
    actionBtnPremium: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
    actionBtnTextPremium: { fontSize: 13, fontWeight: '700' },
    vDivider: { width: 1, height: 20, backgroundColor: '#F1F5F9' },

    paginationFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingBottom: 10 },
    pageBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
    disabledBtn: { opacity: 0.3 },
    pageInfoText: { fontSize: 14, fontWeight: '700', color: '#64748B' },

    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyText: { color: '#94A3B8', fontSize: 15, fontWeight: '600', marginTop: 12 }
});

export default AdminStaff;
