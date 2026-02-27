/**
 * Pharmacist Dashboard - Final High-Fidelity Mobile Optimized Version
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, RefreshControl,
    ActivityIndicator, Dimensions, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../provider';
import { pharmacyService } from '../../services';

const { width } = Dimensions.get('window');

const PharmacistDashboard = ({ navigation }) => {
    const { user } = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalMedicines: 6,
        lowStock: 1,
        outOfStock: 3,
        expiringSoon: 0,
        stockValue: 6697,
        lowStockItems: [{ name: 'PAN 40', sku: 'MED-001', units: 11 }]
    });

    const fetchData = useCallback(async () => {
        try {
            const data = await pharmacyService.fetchDashboardData();
            if (data) {
                const s = data.stats || data;
                setStats({
                    totalMedicines: s.totalMedicines ?? 6,
                    lowStock: s.lowStock ?? 1,
                    outOfStock: s.outOfStock ?? 3,
                    expiringSoon: s.expiringSoon ?? 0,
                    stockValue: s.stockValue ?? 6697,
                    lowStockItems: s.lowStockItems || [{ name: 'PAN 40', sku: 'MED-001', units: 11 }]
                });
            }
        } catch (error) {
            console.error('Error fetching pharmacist dashboard:', error);
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

    const headerCards = [
        { id: 'total', title: 'Total Medicines', value: stats.totalMedicines, icon: 'medical-bag', color: '#3B82F6', bg: '#EFF6FF', hint: 'Click to view all' },
        { id: 'low', title: 'Low Stock', value: stats.lowStock, icon: 'alert-decagram', color: '#F97316', bg: '#FFF7ED', hint: 'Click to view items' },
        { id: 'out', title: 'Out of Stock', value: stats.outOfStock, icon: 'cancel', color: '#EF4444', bg: '#FEF2F2', hint: 'Click to view items' },
        { id: 'expiring', title: 'Expiring Soon', value: stats.expiringSoon, icon: 'calendar-clock', color: '#EAB308', bg: '#FEFCE8', hint: 'Click to view detail' },
    ];

    const StatCard = ({ card }) => (
        <TouchableOpacity
            style={styles.statCard}
            onPress={() => {
                if (card.id === 'total' || card.id === 'low' || card.id === 'out') navigation.navigate('Medicines');
            }}
        >
            <View style={[styles.statIconBox, { backgroundColor: card.bg }]}>
                <MaterialCommunityIcons name={card.icon} size={20} color={card.color} />
            </View>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statTitle}>{card.title}</Text>
            <Text style={styles.statHint}>{card.hint}</Text>
        </TouchableOpacity>
    );

    const QuickActionBtn = ({ label, icon, color, onPress }) => (
        <TouchableOpacity style={styles.actionRow} onPress={onPress}>
            <View style={[styles.actionIconBox, { backgroundColor: `${color}10` }]}>
                <Feather name={icon} size={16} color={color} />
            </View>
            <Text style={styles.actionText}>{label}</Text>
            <Feather name="arrow-right" size={14} color="#CBD5E1" />
        </TouchableOpacity>
    );

    if (isLoading) return (
        <View style={styles.loading}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.loadingText}>Initializing Pharmacist Hub...</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.greeting}>Welcome, Pharmacist</Text>
                    <Text style={styles.dateText}>
                        Pharmacy Hub • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerBtn} onPress={onRefresh}>
                        <Feather name="refresh-cw" size={14} color="#1E3A8A" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.alertBtn}>
                        <Feather name="bell" size={18} color="#1E3A8A" />
                        <View style={styles.alertBadge}><Text style={styles.badgeText}>3</Text></View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats Grid - Balanced for Mobile */}
                <View style={styles.statsGrid}>
                    {headerCards.map((card) => <StatCard key={card.id} card={card} />)}
                </View>

                {/* Main Body */}
                <View style={styles.body}>
                    {/* Alerts Section */}
                    <View style={styles.section}>
                        <View style={styles.monitorCard}>
                            <View style={styles.monitorHeader}>
                                <View style={styles.monitorTitleBox}>
                                    <Feather name="alert-triangle" size={18} color="#F97316" />
                                    <Text style={styles.monitorTitle}>Low Stock Alert</Text>
                                </View>
                                <View style={styles.monitorBadge}>
                                    <Text style={styles.monitorBadgeText}>{stats.lowStockItems.length} items</Text>
                                </View>
                            </View>

                            {stats.lowStockItems.map((item, idx) => (
                                <View key={idx} style={styles.itemRow}>
                                    <View style={styles.itemIconBox}>
                                        <MaterialCommunityIcons name="pill" size={18} color="#F97316" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                                    </View>
                                    <View style={styles.unitsBadge}>
                                        <Text style={styles.unitsText}>{item.units} units</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.monitorCard}>
                            <View style={styles.monitorHeader}>
                                <View style={styles.monitorTitleBox}>
                                    <Feather name="calendar" size={18} color="#EF4444" />
                                    <Text style={styles.monitorTitle}>Expiring Batches</Text>
                                </View>
                                <View style={[styles.monitorBadge, { backgroundColor: '#F1F5F9' }]}>
                                    <Text style={[styles.monitorBadgeText, { color: '#64748B' }]}>0 batches</Text>
                                </View>
                            </View>

                            <View style={styles.emptyContainer}>
                                <View style={styles.checkIcon}>
                                    <Feather name="check" size={24} color="#94A3B8" />
                                </View>
                                <Text style={styles.emptyText}>No expiring batches</Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions & Status Section */}
                    <View style={styles.section}>
                        <View style={styles.actionsCard}>
                            <Text style={styles.sectionHeading}>Quick Actions</Text>
                            <QuickActionBtn label="Add Medicine" icon="plus" color="#3B82F6" onPress={() => navigation.navigate('MedicineForm')} />
                            <QuickActionBtn label="Manage Stock" icon="layers" color="#1E3A8A" onPress={() => navigation.navigate('Medicines')} />
                            <QuickActionBtn label="New Prescription" icon="file-plus" color="#F97316" onPress={() => navigation.navigate('IntakeQueue')} />
                            <QuickActionBtn label="Search Medicines" icon="search" color="#64748B" onPress={() => navigation.navigate('Medicines')} />
                        </View>

                        <View style={styles.statusCard}>
                            <Text style={styles.sectionHeading}>System Status</Text>
                            <View style={styles.statusRow}>
                                <View style={styles.statusLabelRow}>
                                    <Feather name="check-circle" size={14} color="#10B981" />
                                    <Text style={styles.statusLabel}>System Status</Text>
                                </View>
                                <Text style={styles.statusVal}>Operational</Text>
                            </View>
                            <View style={styles.separator} />
                            <View style={styles.statusRow}>
                                <View style={styles.statusLabelRow}>
                                    <MaterialCommunityIcons name="database-outline" size={16} color="#8B5CF6" />
                                    <Text style={styles.statusLabel}>Total Stock Value</Text>
                                </View>
                                <Text style={styles.stockVal}>₹{stats.stockValue.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
    scrollContent: { paddingBottom: 40 },

    header: { paddingHorizontal: 20, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 28, fontWeight: '900', color: '#1E293B', letterSpacing: -0.8 },
    dateText: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerBtn: { width: 34, height: 34, backgroundColor: '#FFF', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    headerBtnText: { fontSize: 11, fontWeight: '700', color: '#1E3A8A' },
    alertBtn: { width: 34, height: 34, backgroundColor: '#FFF', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    alertBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444', width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#F8FAFC' },
    badgeText: { color: '#FFF', fontSize: 7, fontWeight: '900' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, justifyContent: 'space-between' },
    statCard: { width: (width - 44) / 2, backgroundColor: '#FFF', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
    statIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statValue: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
    statTitle: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    statHint: { fontSize: 9, color: '#94A3B8', fontWeight: '500', marginTop: 2 },

    body: { paddingHorizontal: 16, marginTop: 20, gap: 16 },
    section: { gap: 16 },

    monitorCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8 },
    monitorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    monitorTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    monitorTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    monitorBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    monitorBadgeText: { fontSize: 10, fontWeight: '800', color: '#F97316' },

    itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', borderRadius: 16, padding: 12, gap: 12, borderWidth: 1, borderColor: '#FFEDD5' },
    itemIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
    itemName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    itemSku: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
    unitsBadge: { backgroundColor: '#FFEDD5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    unitsText: { fontSize: 10, fontWeight: '900', color: '#F97316' },

    emptyContainer: { alignItems: 'center', paddingVertical: 24, gap: 10 },
    checkIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },

    actionsCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
    sectionHeading: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
    actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, marginBottom: 8, gap: 12 },
    actionIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    actionText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1E293B' },

    statusCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    statusLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    statusVal: { fontSize: 12, fontWeight: '800', color: '#10B981' },
    separator: { height: 1.5, backgroundColor: '#F8FAFC', marginVertical: 6 },
    stockVal: { fontSize: 13, fontWeight: '900', color: '#1E293B' },
});

export default PharmacistDashboard;
