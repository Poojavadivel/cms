import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, RefreshControl,
    ActivityIndicator, Dimensions, TouchableOpacity, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../../provider';
import { doctorService } from '../../../services';

const { width } = Dimensions.get('window');

const DoctorDashboard = ({ navigation }) => {
    const { userName } = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeChartTab, setActiveChartTab] = useState('Today');
    const [stats, setStats] = useState({
        todayAppointments: 0,
        totalPatients: 0,
        waitingNow: 0,
        completedToday: 0,
        todayList: []
    });

    const fetchData = useCallback(async () => {
        try {
            const data = await doctorService.fetchDashboardData();
            if (data) {
                const s = data.stats || data;
                setStats({
                    todayAppointments: s.todayAppointments || 0,
                    totalPatients: s.totalPatients || 0,
                    waitingNow: s.waitingNow || 0,
                    completedToday: s.completedToday || 0,
                    todayList: s.todayList || []
                });
            }
        } catch (error) {
            console.error('Error fetching doctor dashboard:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const chartData = {
        labels: ['09:00', '11:00', '13:00', '15:00', '17:00'],
        datasets: [{
            data: [2, 5, 8, 4, 6],
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 3
        }]
    };

    const statCards = [
        { title: "Total Patients", value: stats.totalPatients, icon: 'people-outline', color: '#6366F1' },
        { title: "Today's Appts", value: stats.todayAppointments, icon: 'event', color: '#A855F7' },
        { title: "Waiting Now", value: stats.waitingNow, icon: 'hourglass-empty', color: '#F59E0B' },
        { title: "Completed", value: stats.completedToday, icon: 'check-circle-outline', color: '#10B981' },
    ];

    if (isLoading) return (
        <View style={styles.loading}>
            <ActivityIndicator size="large" color="#3B82F6" />
        </View>
    );

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Premium Navy Banner */}
                <View style={styles.banner}>
                    <View style={styles.bannerTop}>
                        <View style={styles.bannerInfo}>
                            <Text style={styles.bannerGreeting}>{greeting()},</Text>
                            <Text style={styles.bannerName}>Dr. {userName || 'Sanjit Doctor'}</Text>
                            <Text style={styles.bannerWait}>You have {stats.waitingNow} patients waiting</Text>
                        </View>
                        <View style={styles.bannerRight}>
                            <View style={styles.dateBadge}>
                                <MaterialIcons name="event" size={14} color="#64748B" />
                                <Text style={styles.dateBadgeText}>Feb 16, 2026</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Actions Row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsRow} contentContainerStyle={styles.quickActionsContent}>
                    <TouchableOpacity style={styles.quickActionBtn}>
                        <MaterialIcons name="add-circle-outline" size={18} color="#3B82F6" />
                        <Text style={styles.quickActionText}>Start Consultation</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickActionBtn, { borderColor: '#FEE2E2' }]}>
                        <MaterialIcons name="warning-amber" size={18} color="#EF4444" />
                        <Text style={[styles.quickActionText, { color: '#EF4444' }]}>Emergency</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickActionBtn, { borderColor: '#FEF3C7' }]}>
                        <MaterialIcons name="note-add" size={18} color="#F59E0B" />
                        <Text style={[styles.quickActionText, { color: '#F59E0B' }]}>Quick Notes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickActionBtn, { borderColor: '#F3E8FF' }]}>
                        <MaterialIcons name="chat-bubble-outline" size={18} color="#A855F7" />
                        <Text style={[styles.quickActionText, { color: '#A855F7' }]}>Messages</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {statCards.map((card, index) => (
                        <View key={`stat-${index}`} style={styles.statCard}>
                            <View style={[styles.statIconBox, { backgroundColor: card.color + '15' }]}>
                                <MaterialIcons name={card.icon} size={22} color={card.color} />
                            </View>
                            <Text style={styles.statLabel}>{card.title}</Text>
                            <Text style={styles.statValue}>{card.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Patient Flow Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.titleRow}>
                            <MaterialIcons name="show-chart" size={16} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Patient Flow</Text>
                        </View>
                        <View style={styles.legend}>
                            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#3B82F6' }]} /><Text style={styles.legendText}>Scheduled</Text></View>
                            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#1E293B' }]} /><Text style={styles.legendText}>Completed</Text></View>
                        </View>
                    </View>
                    <View style={styles.chartWrapper}>
                        <LineChart
                            data={chartData}
                            width={width - 48}
                            height={180}
                            chartConfig={{
                                backgroundColor: '#FFFFFF',
                                backgroundGradientFrom: '#FFFFFF',
                                backgroundGradientTo: '#FFFFFF',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: '4', strokeWidth: '2', stroke: '#3B82F6' },
                                gridColor: 'rgba(241, 245, 249, 1)',
                            }}
                            bezier
                            style={styles.chart}
                        />
                    </View>
                </View>

                {/* Upcoming List */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.titleRow}>
                            <MaterialIcons name="event-note" size={16} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Upcoming</Text>
                        </View>
                        <View style={styles.countBadge}><Text style={styles.countText}>{stats.todayList.length}</Text></View>
                    </View>
                    {stats.todayList && stats.todayList.length > 0 ? (
                        stats.todayList.map((apt, index) => (
                            <TouchableOpacity key={apt._id || `apt-${index}`} style={styles.upcomingCard}>
                                <View style={styles.aptAvatar}><MaterialIcons name="person" size={20} color="#3B82F6" /></View>
                                <View style={styles.aptMain}>
                                    <Text style={styles.aptName}>{apt.patientName || 'Patient'}</Text>
                                    <Text style={styles.aptMeta}>{apt.time || 'Invalid Date'} • ---</Text>
                                </View>
                                <TouchableOpacity style={styles.viewBtn}>
                                    <MaterialIcons name="visibility" size={18} color="#6366F1" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <MaterialIcons name="event-available" size={32} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No upcoming patients</Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingBottom: 100 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Banner
    banner: {
        backgroundColor: '#1E40AF',
        marginHorizontal: 16,
        padding: 24,
        borderRadius: 24,
        marginTop: 40,
        elevation: 8,
        shadowColor: '#1E40AF',
        shadowOpacity: 0.2,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 10 }
    },
    bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    bannerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    bannerName: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginTop: 4 },
    bannerWait: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 8, fontWeight: '500' },
    dateBadge: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateBadgeText: { fontSize: 11, fontWeight: '800', color: '#1E293B' },

    // Quick Actions
    quickActionsRow: { marginTop: 24, paddingLeft: 16 },
    quickActionsContent: { paddingRight: 32, gap: 12 },
    quickActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        elevation: 1
    },
    quickActionText: { fontSize: 13, fontWeight: '800', color: '#3B82F6' },

    // Stats Grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
    statCard: {
        width: (width - 44) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    statIconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4 },
    statValue: { fontSize: 22, fontWeight: '900', color: '#1E293B' },

    // Sections
    section: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 24, padding: 20, marginBottom: 16, elevation: 1 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    legend: { flexDirection: 'row', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
    countBadge: { backgroundColor: '#F1F5F9', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    countText: { fontSize: 10, fontWeight: '800', color: '#6366F1' },

    chartWrapper: { alignItems: 'center' },
    chart: { borderRadius: 16 },

    // Upcoming List
    upcomingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    aptAvatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 1 },
    aptMain: { flex: 1, marginLeft: 12 },
    aptName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    aptMeta: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
    viewBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },

    emptyCard: { alignItems: 'center', paddingVertical: 20 },
    emptyText: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 8 }
});

export default DoctorDashboard;
