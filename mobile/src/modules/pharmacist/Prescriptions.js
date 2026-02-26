/**
 * Pharmacist Prescriptions - High-Fidelity Mobile Redesign
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, TextInput, ActivityIndicator,
    Alert, Dimensions, ScrollView
} from 'react-native';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { pharmacyService } from '../../services';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedDropdown from '../../components/AnimatedDropdown';

const { width } = Dimensions.get('window');

const PharmacistPrescriptions = ({ navigation }) => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [timeFilter, setTimeFilter] = useState('All Time');
    const [sortBy, setSortBy] = useState('Newest First');
    const [activeTab, setActiveTab] = useState('All');

    const fetchData = useCallback(async () => {
        try {
            const data = await pharmacyService.fetchPrescriptions();
            setPrescriptions(data || []);
        } catch (e) {
            console.error('Error fetching prescriptions:', e);
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

    const stats = useMemo(() => {
        const totalEarnings = prescriptions.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const stockValue = 6697; // Mocked as per design screenshot
        const pending = prescriptions.filter(p => !p.status || p.status.toLowerCase() === 'pending').length;
        const completed = prescriptions.filter(p => p.status && p.status.toLowerCase() === 'dispensed').length;
        return { totalEarnings, stockValue, pending, completed };
    }, [prescriptions]);

    const filteredPrescriptions = useMemo(() => {
        let result = prescriptions.filter(p => {
            const matchesSearch = (p.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
                (p.patientPhone || '').toLowerCase().includes(search.toLowerCase()) ||
                (p.notes || '').toLowerCase().includes(search.toLowerCase());

            const prescriptionDate = new Date(p.date);
            const now = new Date();
            let matchesTime = true;

            if (timeFilter === 'Today') {
                matchesTime = prescriptionDate.toDateString() === now.toDateString();
            } else if (timeFilter === 'This Week') {
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                matchesTime = prescriptionDate >= weekAgo;
            } else if (timeFilter === 'This Month') {
                matchesTime = prescriptionDate.getMonth() === now.getMonth() && prescriptionDate.getFullYear() === now.getFullYear();
            }

            if (activeTab === 'Pending') return matchesSearch && matchesTime && (!p.status || p.status.toLowerCase() === 'pending');
            if (activeTab === 'Completed') return matchesSearch && matchesTime && (p.status && p.status.toLowerCase() === 'dispensed');
            return matchesSearch && matchesTime;
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
    }, [prescriptions, search, activeTab, sortBy, timeFilter]);

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Prescription',
            'Are you sure you want to delete this prescription?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await pharmacyService.deletePrescription(id);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete prescription');
                        }
                    }
                }
            ]
        );
    };

    const handleDispense = async (prescription) => {
        if (prescription.status?.toLowerCase() === 'dispensed') return;

        try {
            // navigation.navigate('DispensingForm', { prescription });
            Alert.alert('Dispensing', `Proceeding to dispense for ${prescription.patientName}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to initiate dispensing');
        }
    };

    const [openDropdown, setOpenDropdown] = useState(null); // 'time', 'sort', or null

    const handleToggle = (type) => {
        if (openDropdown === type) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(type);
        }
    };

    const timeOptions = ['All Time', 'Today', 'This Week', 'This Month'];
    const sortOptions = ['Newest First', 'Oldest First', 'Patient Name'];

    const renderHeader = () => (
        <View style={styles.headerContent}>
            {/* Banner Stats Row */}
            <View style={styles.bannerRow}>
                <View style={[styles.statBox, styles.statBoxFirst]}>
                    <Text style={styles.statIconText}>$</Text>
                    <Text style={styles.statValue}>₹{stats.totalEarnings.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Total Earnings</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Feather name="trending-up" size={16} color="#8B5CF6" />
                    <Text style={styles.statValue}>₹{stats.stockValue.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Stock Value</Text>
                </View>
                <View style={styles.statDivider} />
                <TouchableOpacity
                    style={[styles.statBox, activeTab === 'Pending' && styles.statBoxActive]}
                    onPress={() => setActiveTab(activeTab === 'Pending' ? 'All' : 'Pending')}
                >
                    <MaterialCommunityIcons name="pill" size={18} color="#8B5CF6" />
                    <Text style={styles.statValue}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </TouchableOpacity>
                <View style={styles.statDivider} />
                <TouchableOpacity
                    style={[styles.statBox, activeTab === 'Completed' && styles.statBoxActive]}
                    onPress={() => setActiveTab(activeTab === 'Completed' ? 'All' : 'Completed')}
                >
                    <Feather name="check-circle" size={16} color="#3B82F6" />
                    <Text style={styles.statValue}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </TouchableOpacity>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Feather name="filter" size={16} color="#F97316" />
                    <Text style={styles.statValue}>{filteredPrescriptions.length}</Text>
                    <Text style={styles.statLabel}>Results</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtnBanner} onPress={onRefresh}>
                    <Feather name="refresh-cw" size={16} color="#8B5CF6" />
                </TouchableOpacity>
            </View>

            {/* Filter controls row */}
            <View style={styles.controlsRow}>
                <View style={styles.searchContainer}>
                    <Feather name="search" size={18} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by patient name, phone, or notes..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <View style={styles.dropdownsRow}>
                    <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'time' ? 100 : 1 }]}>
                        <TouchableOpacity
                            style={[styles.dropdown, openDropdown === 'time' && styles.dropdownActive]}
                            onPress={() => handleToggle('time')}
                        >
                            <Text style={styles.dropdownText}>{timeFilter}</Text>
                            <MaterialIcons name={openDropdown === 'time' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                        </TouchableOpacity>
                        <AnimatedDropdown
                            visible={openDropdown === 'time'}
                            options={timeOptions}
                            currentValue={timeFilter}
                            onSelect={setTimeFilter}
                            onClose={() => setOpenDropdown(null)}
                        />
                    </View>

                    <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'sort' ? 100 : 1 }]}>
                        <TouchableOpacity
                            style={[styles.dropdown, openDropdown === 'sort' && styles.dropdownActive]}
                            onPress={() => handleToggle('sort')}
                        >
                            <Text style={styles.dropdownText}>{sortBy}</Text>
                            <MaterialIcons name={openDropdown === 'sort' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                        </TouchableOpacity>
                        <AnimatedDropdown
                            visible={openDropdown === 'sort'}
                            options={sortOptions}
                            currentValue={sortBy}
                            onSelect={setSortBy}
                            onClose={() => setOpenDropdown(null)}
                        />
                    </View>

                    <View style={styles.viewToggle}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                            onPress={() => setViewMode('list')}
                        >
                            <Feather name="list" size={18} color={viewMode === 'list' ? '#FFF' : '#64748B'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
                            onPress={() => setViewMode('grid')}
                        >
                            <Feather name="grid" size={18} color={viewMode === 'grid' ? '#FFF' : '#64748B'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderItem = ({ item }) => {
        const isCompleted = item.status?.toLowerCase() === 'dispensed';

        if (viewMode === 'grid') {
            return (
                <View style={styles.gridCard}>
                    <View style={styles.gridHeader}>
                        <Feather name="user" size={16} color="#6366F1" />
                        <Text style={styles.gridPatientName} numberOfLines={1}>{item.patientName || 'Patient'}</Text>
                    </View>
                    <View style={styles.gridBody}>
                        <Text style={styles.gridLabel}>DOCTOR</Text>
                        <Text style={styles.gridInfo} numberOfLines={1}>Dr. {item.doctorName || 'N/A'}</Text>

                        <Text style={styles.gridLabel}>TOTAL AMOUNT</Text>
                        <Text style={styles.gridPrice}>₹{item.totalAmount || 0}</Text>

                        <Text style={styles.gridLabel}>DATE</Text>
                        <Text style={styles.gridDate}>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.dispenseBtn, isCompleted && styles.dispenseBtnDisabled]}
                        onPress={() => handleDispense(item)}
                    >
                        <Feather name="check" size={14} color={isCompleted ? '#FFF' : '#FFF'} />
                        <Text style={styles.dispenseBtnText}>{isCompleted ? 'Dispensed' : 'Dispense'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.gridDeleteBtn} onPress={() => handleDelete(item._id)}>
                        <Feather name="trash-2" size={14} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.patientMain}>
                        <Feather name="user" size={16} color="#1E293B" />
                        <Text style={styles.patientName}>{item.patientName || 'Patient Name'}</Text>
                    </View>
                    <View style={styles.dateSection}>
                        <Feather name="calendar" size={14} color="#94A3B8" />
                        <Text style={styles.dateText}>{item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Phone:</Text>
                        <Text style={styles.metaValue}>{item.patientPhone || 'N/A'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Doctor:</Text>
                        <Text style={styles.metaValue}>Dr. {item.doctorName || 'N/A'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Total Amount:</Text>
                        <Text style={styles.priceValue}>₹{item.totalAmount || 0}</Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.dispenseBtn, isCompleted && styles.dispenseBtnDisabled]}
                        onPress={() => handleDispense(item)}
                        disabled={isCompleted}
                    >
                        {isCompleted && <Feather name="check" size={16} color="#FFF" style={{ marginRight: 4 }} />}
                        <Text style={styles.dispenseBtnText}>{isCompleted ? 'Dispensed' : 'Dispense'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => navigation.navigate('PrescriptionDetail', { prescription: item })}
                    >
                        <Text style={styles.detailsBtnText}>Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
                        <Feather name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (isLoading && !refreshing) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Syncing Prescriptions...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                key={viewMode}
                data={filteredPrescriptions}
                renderItem={renderItem}
                keyExtractor={(item, index) => item._id || `rx-${index}`}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={[styles.listContent, viewMode === 'grid' && styles.gridList]}
                numColumns={viewMode === 'grid' ? 3 : 1}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="receipt-text-minus" size={80} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No Prescriptions Found</Text>
                        <Text style={styles.emptySub}>Try adjusting your filters or search query</Text>
                        <TouchableOpacity style={styles.resetBtn} onPress={() => { setSearch(''); setActiveTab('All'); setTimeFilter('All Time'); }}>
                            <Text style={styles.resetBtnText}>Reset All Filters</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
    listContent: { paddingBottom: 40 },
    gridList: { paddingHorizontal: 12 },

    headerContent: { paddingHorizontal: 16, paddingTop: 12 },
    bannerRow: {
        backgroundColor: '#FFF',
        borderRadius: 28,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 4,
        shadowColor: '#6366F1',
        shadowOpacity: 0.08,
        shadowRadius: 15,
        marginBottom: 24,
        marginTop: 4
    },
    statBox: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 20 },
    statBoxFirst: { marginLeft: 4 },
    statBoxActive: { backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE' },
    statIconText: { fontSize: 22, fontWeight: '900', color: '#3B82F6' },
    statValue: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginTop: 4 },
    statLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    statDivider: { width: 1, height: 44, backgroundColor: '#F1F5F9', marginHorizontal: 4 },
    refreshBtnBanner: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', marginLeft: 8, borderWidth: 1, borderColor: '#DDD6FE' },

    controlsRow: { marginBottom: 16, gap: 12 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 12,
        elevation: 2
    },
    searchInput: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500' },

    dropdownsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dropdown: {
        flex: 1,
        height: 44,
        backgroundColor: '#FFF',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    dropdownWrapper: { flex: 1, position: 'relative' },
    dropdownText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
    dropdownActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    dropdownMenu: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        padding: 5,
        elevation: 5,
        shadowColor: '#6366F1',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        zIndex: 1000
    },
    dropdownOption: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2
    },
    dropdownOptionActive: { backgroundColor: '#3B82F6' },
    dropdownOptionText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
    dropdownOptionTextActive: { color: '#FFF', fontWeight: '700' },

    viewToggle: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, borderHeight: 1, borderColor: '#F1F5F9', padding: 4, gap: 4 },
    toggleBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    toggleBtnActive: { backgroundColor: '#6366F1' },

    card: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    patientMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    patientName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    dateSection: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

    cardBody: { paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F8FAFC', marginBottom: 16 },
    metaRow: { flexDirection: 'row', marginBottom: 8 },
    metaLabel: { width: 100, fontSize: 13, fontWeight: '600', color: '#94A3B8' },
    metaValue: { flex: 1, fontSize: 13, fontWeight: '700', color: '#475569' },
    priceValue: { fontSize: 14, fontWeight: '900', color: '#3B82F6' },

    actions: { flexDirection: 'row', gap: 12 },
    dispenseBtn: { flex: 2, height: 44, backgroundColor: '#94A3B8', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    dispenseBtnDisabled: { backgroundColor: '#94A3B8' }, // Should be grey but maybe it was interactive in screenshot
    dispenseBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
    detailsBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
    detailsBtnText: { color: '#3B82F6', fontSize: 14, fontWeight: '800' },
    deleteBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },

    gridCard: { width: (width - 48) / 3, backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginBottom: 16, marginRight: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    gridHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    gridPatientName: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
    gridBody: { paddingBottom: 10 },
    gridLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8', marginBottom: 2 },
    gridInfo: { fontSize: 10, fontWeight: '700', color: '#475569', marginBottom: 6 },
    gridPrice: { fontSize: 13, fontWeight: '900', color: '#3B82F6', marginBottom: 6 },
    gridDate: { fontSize: 9, color: '#94A3B8', fontWeight: '600' },
    gridDeleteBtn: { position: 'absolute', top: 4, right: 4, padding: 4 },

    empty: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center', fontWeight: '500' },
    resetBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, backgroundColor: '#F1F5F9' },
    resetBtnText: { color: '#6366F1', fontSize: 14, fontWeight: '700' },
});

export default PharmacistPrescriptions;
