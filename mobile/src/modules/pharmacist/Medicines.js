/**
 * Pharmacist Medicines - High-Fidelity Mobile Redesign
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

const { width } = Dimensions.get('window');

const PharmacistMedicines = ({ navigation }) => {
    const [medicines, setMedicines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const fetchData = useCallback(async () => {
        try {
            const data = await pharmacyService.fetchMedicines();
            setMedicines(data || []);
        } catch (e) {
            console.error('Error fetching medicines:', e);
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
        const total = medicines.length;
        const low = medicines.filter(m => (m.stock || m.quantity || 0) < 10 && (m.stock || m.quantity || 0) > 0).length;
        const out = medicines.filter(m => (m.stock || m.quantity || 0) <= 0).length;
        return { total, low, out };
    }, [medicines]);

    const filteredMedicines = useMemo(() => {
        return medicines.filter(m => {
            const matchesSearch = (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (m.sku || '').toLowerCase().includes(search.toLowerCase()) ||
                (m.category || '').toLowerCase().includes(search.toLowerCase());

            const stock = m.stock || m.quantity || 0;
            if (filterStatus === 'In Stock') return matchesSearch && stock >= 10;
            if (filterStatus === 'Low Stock') return matchesSearch && stock > 0 && stock < 10;
            if (filterStatus === 'Out of Stock') return matchesSearch && stock <= 0;
            return matchesSearch;
        });
    }, [medicines, search, filterStatus]);

    const getStatusInfo = (stock) => {
        if (stock <= 0) return { label: 'OUT OF STOCK', color: '#EF4444', bg: '#FEF2F2' };
        if (stock < 10) return { label: 'LOW STOCK', color: '#F97316', bg: '#FFF7ED' };
        return { label: 'IN STOCK', color: '#10B981', bg: '#F0FDF4' };
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Medicine',
            'Are you sure you want to delete this medicine?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await pharmacyService.deleteMedicine(id);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete medicine');
                        }
                    }
                }
            ]
        );
    };

    const renderHeader = () => (
        <View style={styles.headerContent}>
            <View style={styles.banner}>
                <View>
                    <Text style={styles.bannerTitle}>Medicine Inventory</Text>
                    <Text style={styles.bannerSub}>Manage pharmacy inventory and stock levels.</Text>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>TOTAL ITEMS</Text>
                        <Text style={styles.statValue}>{stats.total}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#F97316' }]}>LOW STOCK</Text>
                        <Text style={styles.statValue}>{stats.low}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: '#EF4444' }]}>OUT OF STOCK</Text>
                        <Text style={styles.statValue}>{stats.out}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('MedicineForm', {})}
                >
                    <Feather name="plus" size={18} color="#FFF" />
                    <Text style={styles.addBtnText}>Add Medicine</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.controls}>
                <View style={styles.searchContainer}>
                    <Feather name="search" size={18} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by medicine name, SKU, or category..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <View style={styles.filterRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[styles.filterTab, filterStatus === item && styles.filterTabActive]}
                                onPress={() => setFilterStatus(item)}
                            >
                                <Text style={[styles.filterTabText, filterStatus === item && styles.filterTabTextActive]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                        <Feather name="refresh-cw" size={16} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderItem = ({ item }) => {
        const stock = item.stock || item.quantity || 0;
        const status = getStatusInfo(stock);

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.nameSection}>
                        <Text style={styles.medName} numberOfLines={1}>{item.name || 'Medicine'}</Text>
                        <Text style={styles.medDose}>{item.dosage || '500mg'}</Text>
                    </View>
                    <View style={styles.statusSection}>
                        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardMeta}>
                    <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>CATEGORY</Text>
                        <Text style={styles.metaValue}>{item.category || 'N/A'}</Text>
                    </View>
                    <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>SKU</Text>
                        <Text style={styles.metaValue}>{item.sku || 'N/A'}</Text>
                    </View>
                    <View style={styles.metaCol}>
                        <Text style={styles.metaLabel}>STOCK</Text>
                        <View style={styles.stockBadge}>
                            <Text style={styles.stockValueText}>{stock} PCS</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => navigation.navigate('MedicineDetail', { medicine: item })}
                    >
                        <Feather name="eye" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => navigation.navigate('MedicineForm', { medicine: item })}
                    >
                        <Feather name="edit-2" size={16} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}
                        onPress={() => handleDelete(item._id || item.id)}
                    >
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
                <Text style={styles.loadingText}>Syncing Inventory...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={filteredMedicines}
                renderItem={renderItem}
                keyExtractor={(item, index) => item._id || `med-${index}`}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="pill-off" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No matching medicines found</Text>
                        <TouchableOpacity style={styles.resetBtn} onPress={() => { setSearch(''); setFilterStatus('All'); }}>
                            <Text style={styles.resetBtnText}>Clear Filters</Text>
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

    headerContent: { paddingHorizontal: 16, paddingTop: 12 },
    banner: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, marginBottom: 16 },
    bannerTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    bannerSub: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '500' },

    statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20 },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    statDivider: { width: 1, height: 24, backgroundColor: '#F1F5F9' },

    addBtn: { backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, gap: 8 },
    addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

    controls: { marginBottom: 16 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#F1F5F9', gap: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
    searchInput: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500' },

    filterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
    filterScroll: { gap: 8 },
    filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderHeight: 1, borderColor: '#F1F5F9', backgroundColor: '#FFF' },
    filterTabActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    filterTabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    filterTabTextActive: { color: '#FFF' },
    refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },

    card: { backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 16, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    nameSection: { flex: 1, marginRight: 10 },
    medName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    medDose: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
    statusSection: { alignItems: 'flex-end' },
    statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '900' },

    cardMeta: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F8FAFC', marginBottom: 12 },
    metaCol: { flex: 1 },
    metaLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
    metaValue: { fontSize: 11, fontWeight: '700', color: '#475569' },
    stockBadge: { backgroundColor: '#F1F5F9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    stockValueText: { fontSize: 10, fontWeight: '800', color: '#475569' },

    cardActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
    actionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },

    empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginTop: 12, textAlign: 'center' },
    resetBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9' },
    resetBtnText: { color: '#3B82F6', fontSize: 12, fontWeight: '700' },
});

export default PharmacistMedicines;
