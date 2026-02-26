/**
 * Pharmacist Intake Queue - High-Fidelity Mobile Redesign
 * Displays list of intakes with un-dispensed pharmacy items
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { pharmacyService } from '../../services';
import { SafeAreaView } from 'react-native-safe-area-context';

const PharmacistIntakeQueue = ({ navigation }) => {
    const [intakes, setIntakes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('All Time');

    const fetchData = useCallback(async () => {
        try {
            const data = await pharmacyService.fetchPendingPrescriptions({ status: 'pending' });
            setIntakes(data || []);
        } catch (e) {
            console.error('Fetch Intake Queue Error:', e);
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

    const filteredIntakes = useMemo(() => {
        let result = intakes.filter(item =>
            (item.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        const now = new Date();
        if (dateFilter === 'Today') {
            result = result.filter(item => new Date(item.createdAt).toDateString() === now.toDateString());
        } else if (dateFilter === 'This Week') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            result = result.filter(item => new Date(item.createdAt) >= weekAgo);
        } else if (dateFilter === 'This Month') {
            result = result.filter(item => {
                const itemDate = new Date(item.createdAt);
                return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
            });
        }

        return result;
    }, [intakes, searchQuery, dateFilter]);

    const showDateFilterOptions = () => {
        Alert.alert(
            'Filter by Date',
            'Select period',
            [
                { text: 'All Time', onPress: () => setDateFilter('All Time') },
                { text: 'Today', onPress: () => setDateFilter('Today') },
                { text: 'This Week', onPress: () => setDateFilter('This Week') },
                { text: 'This Month', onPress: () => setDateFilter('This Month') },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleDispense = (item) => {
        navigation.navigate('DispensingForm', { intake: item, onRefresh: fetchData });
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.patientInfo}>
                    <View style={styles.avatar}>
                        <Feather name="user" size={18} color="#6366F1" />
                    </View>
                    <View>
                        <Text style={styles.patientName}>{item.patientName || 'Unknown Patient'}</Text>
                        <Text style={styles.doctorName}>Dr. {item.doctorName || 'Unknown'}</Text>
                    </View>
                </View>
                <View style={styles.dateBadge}>
                    <Feather name="clock" size={12} color="#64748B" />
                    <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBody}>
                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Items:</Text>
                    <View style={styles.itemCountBadge}>
                        <Text style={styles.itemCountText}>{item.pharmacyItems?.length || 0} Meds</Text>
                    </View>
                </View>
                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>ID:</Text>
                    <Text style={styles.metaValue}>#{item._id?.slice(-6).toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>READY TO DISPENSE</Text>
                </View>
                <TouchableOpacity
                    style={styles.dispenseBtn}
                    onPress={() => handleDispense(item)}
                >
                    <Text style={styles.dispenseBtnText}>Dispense Now</Text>
                    <Feather name="arrow-right" size={16} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (isLoading && !refreshing) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading Queue...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Pending Intakes</Text>
                    <Text style={styles.headerSubtitle}>Manage incoming medication orders</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{intakes.length}</Text>
                </View>
            </View>

            <View style={styles.controls}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={18} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search patient or doctor..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.filterBtn} onPress={showDateFilterOptions}>
                    <Feather name="calendar" size={18} color="#64748B" />
                    {dateFilter !== 'All Time' && <View style={styles.filterDot} />}
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredIntakes}
                renderItem={renderItem}
                keyExtractor={(item) => item._id || item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <MaterialCommunityIcons name="clipboard-check-outline" size={48} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>All Caught Up!</Text>
                        <Text style={styles.emptyText}>No pending intakes in the queue.</Text>
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

    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
    countBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
    countText: { fontSize: 16, fontWeight: '900', color: '#3B82F6' },

    controls: { paddingHorizontal: 20, flexDirection: 'row', gap: 12, marginBottom: 12 },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 10,
        elevation: 1,
        shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4
    },
    searchInput: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500' },
    filterBtn: {
        width: 48,
        height: 48,
        backgroundColor: '#FFF',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 1
    },
    filterDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', borderWidth: 1.5, borderColor: '#FFF' },

    list: { padding: 20, paddingTop: 8, paddingBottom: 40, gap: 16 },
    card: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 18,
        shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
        borderWidth: 1, borderColor: '#F1F5F9'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
    patientName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    doctorName: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 1 },
    dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    dateText: { fontSize: 11, fontWeight: '600', color: '#64748B' },

    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },

    cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
    itemCountBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    itemCountText: { fontSize: 11, fontWeight: '700', color: '#059669' },
    metaValue: { fontSize: 12, fontWeight: '700', color: '#475569' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6, borderWidth: 1, borderColor: '#DCFCE7' },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
    statusText: { fontSize: 10, fontWeight: '800', color: '#16A34A' },

    dispenseBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6, shadowColor: '#3B82F6', shadowOpacity: 0.2, shadowRadius: 6, elevation: 2 },
    dispenseBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

    empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
    emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20, fontWeight: '500' }
});

export default PharmacistIntakeQueue;
