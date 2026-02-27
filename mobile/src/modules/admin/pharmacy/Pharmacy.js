/**
 * Admin Pharmacy - High-Fidelity Refined Version
 * Achieving 1:1 visual parity with the web pharmacy module.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { pharmacyService } from '../../../services';
import SwipeableRow from '../../../components/SwipeableRow';
import AnimatedDropdown from '../../../components/AnimatedDropdown';

const { width } = Dimensions.get('window');

const AdminPharmacy = ({ navigation }) => {
    const [medicines, setMedicines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Inventory');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Name (A-Z)');

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState(null);

    const [batches, setBatches] = useState([
        { id: '1', batchNumber: '001-2602-TU', medicineName: 'PAN 40', supplier: 'UDAYA', quantity: 11, salePrice: 7.00, costPrice: 5.00, expiryDate: '2/12/2033' },
        { id: '2', batchNumber: '003-2602-OI', medicineName: 'ZINCOVIT', supplier: 'UDAYA', quantity: 235, salePrice: 20.00, costPrice: 12.00, expiryDate: '1/1/2030' },
        { id: '3', batchNumber: '002-2602-W', medicineName: 'ZINCOFER', supplier: 'UDAYA', quantity: 96, salePrice: 20.00, costPrice: 10.00, expiryDate: '11/10/2030' },
    ]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const sortOptions = ['Name (A-Z)', 'Stock (Low to High)', 'Stock (High to Low)', 'Category'];

    const fetchMedicines = useCallback(async () => {
        try {
            const data = await pharmacyService.fetchMedicines();
            setMedicines(data);
        } catch (error) {
            console.error('Error fetching medicines:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMedicines();
    };

    const uniqueCategories = useMemo(() => {
        const cats = new Set(medicines.map(m => m.category).filter(Boolean));
        return ['All', ...Array.from(cats).sort()];
    }, [medicines]);

    const filteredMedicines = useMemo(() => {
        let result = medicines.filter(m => {
            const matchesSearch = (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.sku || m.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.category || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });

        if (sortBy === 'Name (A-Z)') {
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortBy === 'Stock (Low to High)') {
            result.sort((a, b) => (parseFloat(a.stock || 0) - parseFloat(b.stock || 0)));
        } else if (sortBy === 'Stock (High to Low)') {
            result.sort((a, b) => (parseFloat(b.stock || 0) - parseFloat(a.stock || 0)));
        } else if (sortBy === 'Category') {
            result.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        }

        return result;
    }, [medicines, searchQuery, categoryFilter, sortBy]);

    const paginatedMedicines = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredMedicines.slice(start, start + itemsPerPage);
    }, [filteredMedicines, currentPage]);

    const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage) || 1;

    const getStockStatus = (stock) => {
        const qty = parseFloat(stock || 0);
        if (qty <= 0) return { bg: '#FEF2F2', text: '#EF4444', label: 'OUT OF STOCK' };
        if (qty < 10) return { bg: '#FFF7ED', text: '#F97316', label: 'LOW STOCK' };
        return { bg: '#F0FDF4', text: '#16A34A', label: 'IN STOCK' };
    };

    const handleToggle = (type) => {
        if (openDropdown === type) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(type);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Remove Medicine',
            'Are you sure you want to remove this medicine from inventory?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (pharmacyService.deleteMedicine) {
                                await pharmacyService.deleteMedicine(id);
                                fetchMedicines();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove medicine');
                        }
                    }
                }
            ]
        );
    };

    const renderMedicineRow = ({ item }) => {
        const stockStatus = getStockStatus(item.stock || item.quantity || 0);

        return (
            <TouchableOpacity
                style={styles.premiumCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MedicineForm', { medicine: item })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.medIconContainerPremium}>
                        <MaterialIcons name="medication" size={24} color="#3B82F6" />
                    </View>
                    <View style={styles.medMainInfo}>
                        <Text style={styles.medNamePremium} numberOfLines={1}>
                            {item.name || 'Medicine'} <Text style={styles.dosageTextPremium}>(500mg)</Text>
                        </Text>
                        <Text style={styles.categoryBadgeText}>{item.category || 'General'}</Text>
                    </View>
                    <View style={[styles.stockBadgePremium, { backgroundColor: stockStatus.bg }]}>
                        <Text style={[styles.stockTextPremium, { color: stockStatus.text }]}>{stockStatus.label}</Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardDetailsRow}>
                    <View style={styles.detailBox}>
                        <Text style={styles.detailLabel}>SKU CODE</Text>
                        <Text style={[styles.detailValuePremium, { color: '#F59E0B' }]}>{item.sku || item.code || 'MED-000'}</Text>
                    </View>
                    <View style={styles.detailBox}>
                        <Text style={styles.detailLabel}>CURRENT STOCK</Text>
                        <View style={styles.qtyContainer}>
                            <Text style={[styles.qtyTextPremium, { color: stockStatus.text }]}>{item.stock || item.quantity || 0}</Text>
                            <Text style={styles.unitText}>Units</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardFooterPremium}>
                    <Text style={styles.manufacturerPremium} numberOfLines={1}>
                        <MaterialIcons name="business" size={12} color="#94A3B8" /> {item.manufacturer || 'Unknown Manufacturer'}
                    </Text>
                    <View style={styles.footerActionsPremium}>
                        <TouchableOpacity style={styles.actionIconBtn} onPress={() => navigation.navigate('MedicineForm', { medicine: item })}>
                            <MaterialIcons name="edit" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleDelete(item._id || item.id)}>
                            <MaterialIcons name="delete" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderBatchRow = ({ item }) => (
        <View style={styles.premiumCard}>
            <View style={styles.cardHeader}>
                <View style={[styles.medIconContainerPremium, { backgroundColor: '#FFF7ED' }]}>
                    <MaterialIcons name="inventory-2" size={22} color="#F59E0B" />
                </View>
                <View style={styles.medMainInfo}>
                    <Text style={styles.medNamePremium} numberOfLines={1}>{item.medicineName}</Text>
                    <Text style={styles.batchLabelText}>Batch: {item.batchNumber}</Text>
                </View>
                <View style={styles.expiryBadge}>
                    <Text style={styles.expiryTextPremium}>Exp: {item.expiryDate}</Text>
                </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardDetailsRow}>
                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>SALE PRICE</Text>
                    <Text style={styles.priceValue}>₹{item.salePrice.toFixed(2)}</Text>
                </View>
                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>COST PRICE</Text>
                    <Text style={styles.priceValue}>₹{item.costPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>QUANTITY</Text>
                    <Text style={[styles.qtyTextPremium, { color: '#1E293B' }]}>{item.quantity}</Text>
                </View>
            </View>

            <View style={styles.cardFooterPremium}>
                <Text style={styles.supplierPremium}>
                    <MaterialIcons name="local-shipping" size={12} color="#94A3B8" /> Supplier: {item.supplier}
                </Text>
                <View style={styles.footerActionsPremium}>
                    <TouchableOpacity style={styles.actionIconBtn}><MaterialIcons name="edit" size={18} color="#3B82F6" /></TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconBtn}><MaterialIcons name="delete" size={18} color="#EF4444" /></TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.container}>
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <View style={styles.pageHeaderLeft}>
                        <Text style={styles.pageTitle}>PHARMACY</Text>
                        <Text style={styles.pageSubtitle}>Secure medicine inventory and batch management</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]}>
                            <MaterialIcons name="inventory" size={18} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MedicineForm', {})}>
                            <MaterialIcons name="add" size={20} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Controls Bar */}
                <View style={[styles.controlsBar, { zIndex: 100 }]}>
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <MaterialIcons name="search" size={18} color="#94A3B8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={activeTab === 'Batches' ? "Search batches..." : "Search medicines by name, SKU, or category..."}
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={(t) => { setSearchQuery(t); setCurrentPage(1); }}
                            />
                        </View>
                    </View>

                    {activeTab === 'Inventory' && (
                        <View style={styles.filterRow}>
                            <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'category' ? 100 : 1 }]}>
                                <TouchableOpacity
                                    style={[styles.dropdownBtn, openDropdown === 'category' && styles.dropdownBtnActive]}
                                    onPress={() => handleToggle('category')}
                                >
                                    <Text style={styles.dropdownBtnText}>{categoryFilter === 'All' ? 'All Categories' : categoryFilter}</Text>
                                    <MaterialIcons name={openDropdown === 'category' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                                </TouchableOpacity>
                                <AnimatedDropdown
                                    visible={openDropdown === 'category'}
                                    options={uniqueCategories}
                                    currentValue={categoryFilter}
                                    onSelect={(val) => { setCategoryFilter(val); setCurrentPage(1); }}
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
                        </View>
                    )}

                    <View style={styles.tabsContainer}>
                        <View style={styles.segmentedControl}>
                            {['Inventory', 'Batches', 'Analytics'].map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.segment, activeTab === tab && styles.activeSegment]}
                                    onPress={() => { setActiveTab(tab); setCurrentPage(1); }}
                                >
                                    <Text style={[styles.segmentText, activeTab === tab && styles.activeSegmentText]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {activeTab === 'Analytics' ? (
                    <View style={styles.analyticsContainer}>
                        <Text style={styles.analyticsTitle}>INVENTORY ANALYTICS</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <MaterialIcons name="medication" size={28} color="#3B82F6" />
                                <Text style={styles.statValue}>6</Text>
                                <Text style={styles.statLabel}>TOTAL MEDICINES</Text>
                            </View>
                            <View style={styles.statCard}>
                                <MaterialIcons name="inventory-2" size={28} color="#F59E0B" />
                                <Text style={styles.statValue}>1</Text>
                                <Text style={styles.statLabel}>LOW STOCK</Text>
                            </View>
                            <View style={[styles.statCard, { borderColor: '#3B82F6', borderWidth: 1 }]}>
                                <MaterialIcons name="delete" size={28} color="#EF4444" />
                                <Text style={[styles.statValue, { color: '#EF4444' }]}>3</Text>
                                <Text style={styles.statLabel}>OUT OF STOCK</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    /* Content List */
                    isLoading ? (
                        <View style={styles.loading}>
                            <ActivityIndicator size="large" color="#3B82F6" />
                        </View>
                    ) : (
                        <FlatList
                            data={activeTab === 'Inventory' ? paginatedMedicines : batches}
                            renderItem={activeTab === 'Inventory' ? renderMedicineRow : renderBatchRow}
                            keyExtractor={(item, index) => item._id || item.id || `ph-${index}`}
                            contentContainerStyle={styles.list}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.empty}>
                                    <MaterialIcons name="local-pharmacy" size={48} color="#CBD5E1" />
                                    <Text style={styles.emptyText}>No items found</Text>
                                </View>
                            }
                        />
                    )
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
    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 40, paddingBottom: 24, paddingHorizontal: 16, backgroundColor: '#F8FAFC' },
    pageHeaderLeft: { flex: 1, marginRight: 16 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, gap: 6, elevation: 2 },
    actionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

    // Controls
    controlsBar: { backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
    searchContainer: { width: '100%' },
    tabsContainer: { width: '100%' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, height: 46, paddingHorizontal: 14, gap: 10 },
    searchInput: { flex: 1, fontSize: 13, color: '#1E293B' },

    filterRow: { flexDirection: 'row', gap: 10, zIndex: 100 },
    dropdownWrapper: { flex: 1, position: 'relative' },
    dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 44 },
    dropdownBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    dropdownBtnText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },

    segmentedControl: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 4 },
    segment: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
    activeSegment: { backgroundColor: '#3B82F6' },
    segmentText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    activeSegmentText: { color: '#FFFFFF' },

    // List & Cards
    list: { padding: 16, paddingBottom: 100 },
    premiumCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    medIconContainerPremium: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    medMainInfo: { flex: 1 },
    medNamePremium: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    dosageTextPremium: { color: '#64748B', fontWeight: '600', fontSize: 13 },
    categoryBadgeText: { fontSize: 10, fontWeight: '800', color: '#3B82F6', textTransform: 'uppercase', marginTop: 2 },
    batchLabelText: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginTop: 2 },
    stockBadgePremium: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    stockTextPremium: { fontSize: 10, fontWeight: '800' },
    expiryBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    expiryTextPremium: { fontSize: 10, fontWeight: '800', color: '#EF4444' },

    cardDivider: { height: 1, backgroundColor: '#F1F5F9' },
    cardDetailsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', gap: 20 },
    detailBox: { flex: 1, gap: 4 },
    detailLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    detailValuePremium: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
    qtyContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    qtyTextPremium: { fontSize: 18, fontWeight: '900' },
    unitText: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
    priceValue: { fontSize: 14, fontWeight: '800', color: '#1E293B' },

    cardFooterPremium: { flexDirection: 'row', padding: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    manufacturerPremium: { fontSize: 11, color: '#94A3B8', fontWeight: '600', flex: 1 },
    supplierPremium: { fontSize: 11, color: '#64748B', fontWeight: '700', flex: 1 },
    footerActionsPremium: { flexDirection: 'row', gap: 12 },
    actionIconBtn: { padding: 6, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },

    // Analytics
    analyticsContainer: { flex: 1, padding: 24 },
    analyticsTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 24 },
    statsGrid: { flexDirection: 'row', gap: 16 },
    statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 24, borderRadius: 20, alignItems: 'center', gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15 },
    statValue: { fontSize: 32, fontWeight: '800', color: '#3B82F6' },
    statLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },

    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginTop: 12 },

    // Pagination
    paginationFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingBottom: 15 },
    pageNavBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
    pageInfo: { fontSize: 14, fontWeight: '700', color: '#64748B' },
    disabledNav: { opacity: 0.3 }
});

export default AdminPharmacy;
