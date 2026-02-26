import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, RefreshControl,
    ActivityIndicator, Dimensions, TouchableOpacity, Image
} from 'react-native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useApp } from '../../../provider';
import { pathologyService } from '../../../services';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const PathologistDashboard = ({ navigation }) => {
    const { user } = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalTests: 0,
        pendingReports: 0,
        completedToday: 0,
        criticalCases: 0, // Mocked for UI fidelity if missing
        recentList: []
    });

    const fetchData = useCallback(async () => {
        try {
            const data = await pathologyService.fetchDashboardData();
            if (data) {
                const s = data.stats || data;
                setStats({
                    totalTests: s.totalTests || 0,
                    pendingReports: s.pendingReports || 0,
                    completedToday: s.completedToday || 0,
                    criticalCases: s.criticalCases || 0,
                    recentList: s.recentReports || []
                });
            }
        } catch (error) {
            console.error('Error fetching pathologist dashboard:', error);
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

    const statsCards = [
        { id: 'total', title: 'Total Reports', value: stats.totalTests, icon: 'article', color: '#6366F1', bg: '#EEF2FF' },
        { id: 'pending', title: 'Pending', value: stats.pendingReports, icon: 'assignment', color: '#F59E0B', bg: '#FFF7ED' },
        { id: 'completed', title: 'Completed', value: stats.completedToday, icon: 'check-circle', color: '#10B981', bg: '#F0FDF4' },
        { id: 'critical', title: 'Critical', value: stats.criticalCases, icon: 'warning', color: '#EF4444', bg: '#FEF2F2' },
    ];

    const labEquipment = [
        { id: 'centrifuge', name: 'Centrifuge A', status: 'Spinning Cycle', progress: 0.6, color: '#3B82F6', icon: 'refresh' },
        { id: 'analyzer', name: 'Analyzer X1', status: 'Processing Batch', progress: 0.8, color: '#8B5CF6', icon: 'biotech' },
        { id: 'hematology', name: 'Hematology', status: 'Idle / Ready', progress: 1.0, color: '#10B981', icon: 'opacity' },
    ];

    if (isLoading) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Initializing Lab Systems...</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusLabel}>SYSTEM ONLINE</Text>
                        </View>
                        <Text style={styles.title}>Pathology Dashboard</Text>
                        <Text style={styles.subtitle}>Central Laboratory • {new Date().toLocaleDateString()}</Text>
                    </View>
                    <TouchableOpacity style={styles.notifBtn}>
                        <Ionicons name="notifications-outline" size={22} color="#1E293B" />
                        <View style={styles.notifBadge} />
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {statsCards.map((card) => (
                        <TouchableOpacity
                            key={card.id}
                            style={[styles.statCard, { borderLeftColor: card.color }]}
                            onPress={() => (card.id === 'pending' || card.id === 'total') && navigation.navigate('TestReports')}
                        >
                            <View style={[styles.statIconBox, { backgroundColor: card.bg }]}>
                                <MaterialIcons name={card.icon} size={20} color={card.color} />
                            </View>
                            <View>
                                <Text style={styles.statValue}>{card.value}</Text>
                                <Text style={styles.statTitle}>{card.title}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Live Lab Status */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Live Lab Status</Text>
                    <Text style={styles.updatedText}>Updated: Just now</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.equipmentScroll}>
                    {labEquipment.map((item) => (
                        <View key={item.id} style={styles.equipmentCard}>
                            <View style={styles.equipmentTop}>
                                <View style={[styles.equipmentIcon, { backgroundColor: `${item.color}15` }]}>
                                    <MaterialIcons name={item.icon} size={18} color={item.color} />
                                </View>
                                <View>
                                    <Text style={styles.equipmentName}>{item.name}</Text>
                                    <Text style={styles.equipmentStatus}>{item.status}</Text>
                                </View>
                            </View>
                            <View style={styles.progressBg}>
                                <View style={[styles.progressFill, { width: `${item.progress * 100}%`, backgroundColor: item.color }]} />
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Performance & Trends */}
                <View style={styles.trendsContainer}>
                    <View style={styles.trendsTitleRow}>
                        <Text style={styles.trendsTitle}>Performance Trends</Text>
                        <View style={styles.trendsDropdown}>
                            <Text style={styles.dropdownText}>Weekly</Text>
                            <Feather name="chevron-down" size={12} color="#64748B" />
                        </View>
                    </View>
                    <LineChart
                        data={{
                            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                            datasets: [{ data: [20, 45, 28, 80, 99, 43, 88] }]
                        }}
                        width={width - 50}
                        height={180}
                        chartConfig={{
                            backgroundColor: '#FFFFFF',
                            backgroundGradientFrom: '#FFFFFF',
                            backgroundGradientTo: '#FFFFFF',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                            propsForDots: { r: '4', strokeWidth: '2', stroke: '#6366F1' },
                            gridColor: '#F1F5F9'
                        }}
                        bezier
                        style={styles.chart}
                    />
                </View>

                {/* Quick Stats & Alerts */}
                <View style={styles.actionRow}>
                    <View style={[styles.actionCard, { flex: 1.5 }]}>
                        <Text style={styles.actionTitle}>Quick Stats</Text>
                        <View style={styles.quickStatItem}>
                            <Text style={styles.quickStatLabel}>Today's Tests</Text>
                            <Text style={styles.quickStatValue}>48</Text>
                        </View>
                        <View style={styles.quickStatDivider} />
                        <View style={styles.quickStatItem}>
                            <Text style={styles.quickStatLabel}>Avg. Turnaround</Text>
                            <Text style={styles.quickStatValue}>2.3h</Text>
                        </View>
                        <View style={styles.quickStatDivider} />
                        <View style={styles.quickStatItem}>
                            <Text style={styles.quickStatLabel}>Accuracy Rate</Text>
                            <Text style={styles.quickStatValue}>99.2%</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.actionCard, { flex: 1, backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                        <View style={styles.alertIconBox}>
                            <MaterialIcons name="inventory" size={24} color="#F97316" />
                        </View>
                        <Text style={[styles.actionTitle, { marginTop: 10 }]}>Reagents Low</Text>
                        <Text style={styles.alertSub}>3 Items need restock</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Reports */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Test Reports</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('TestReports')}>
                        <Text style={styles.seeAllText}>View All</Text>
                    </TouchableOpacity>
                </View>
                {stats.recentList.length > 0 ? (
                    stats.recentList.map((report, index) => (
                        <TouchableOpacity
                            key={report._id || index}
                            style={styles.recentItem}
                            onPress={() => navigation.navigate('ReportDetail', { reportId: report._id })}
                        >
                            <View style={styles.recentAvatar}>
                                <Text style={styles.avatarText}>{(report.patientName || 'P')[0]}</Text>
                            </View>
                            <View style={styles.recentInfo}>
                                <Text style={styles.recentName}>{report.patientName}</Text>
                                <Text style={styles.recentId}>{report.patientCode || `PAT-${Math.floor(Math.random() * 90000) + 10000}`}</Text>
                            </View>
                            <View style={styles.recentMeta}>
                                <Text style={styles.recentTest}>{report.testName?.toUpperCase() || 'GENERAL TEST'}</Text>
                                <View style={[styles.statusBadge, {
                                    backgroundColor: report.status === 'Completed' ? '#F0FDF4' :
                                        report.status === 'In Progress' ? '#EFF6FF' : '#FFF7ED'
                                }]}>
                                    <Text style={[styles.statusBadgeText, {
                                        color: report.status === 'Completed' ? '#10B981' :
                                            report.status === 'In Progress' ? '#3B82F6' : '#F59E0B'
                                    }]}>
                                        {report.status?.toUpperCase() || 'PENDING'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Feather name="folder" size={40} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No recent test reports</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
    scrollContent: { paddingBottom: 40 },

    header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
    statusLabel: { fontSize: 10, fontWeight: '800', color: '#22C55E', letterSpacing: 1 },
    title: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
    notifBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 28 },
    statCard: { width: (width - 56) / 2, backgroundColor: '#FFF', borderRadius: 20, padding: 18, borderLeftWidth: 5, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    statTitle: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 1 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, marginBottom: 16 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    updatedText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
    seeAllText: { fontSize: 13, color: '#3B82F6', fontWeight: '700' },

    equipmentScroll: { paddingLeft: 20, marginBottom: 28 },
    equipmentCard: { width: 220, backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginRight: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    equipmentTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    equipmentIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    equipmentName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    equipmentStatus: { fontSize: 11, color: '#64748B', marginTop: 2 },
    progressBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },

    trendsContainer: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, padding: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1, borderColor: '#F1F5F9' },
    trendsTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    trendsTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    trendsDropdown: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    dropdownText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
    chart: { marginRight: -20 },

    actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 28 },
    actionCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#F1F5F9' },
    actionTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    quickStatItem: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
    quickStatLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    quickStatValue: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    quickStatDivider: { height: 1, backgroundColor: '#F1F5F9' },
    alertIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
    alertSub: { fontSize: 11, color: '#9A3412', fontWeight: '500', marginTop: 4 },

    recentItem: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 20, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    recentAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 16, fontWeight: '800', color: '#3B82F6' },
    recentInfo: { flex: 1, marginLeft: 14 },
    recentName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    recentId: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
    recentMeta: { alignItems: 'flex-end', gap: 4 },
    recentTest: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusBadgeText: { fontSize: 9, fontWeight: '900' },

    emptyState: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: '#94A3B8', fontWeight: '600', fontSize: 13 }
});

export default PathologistDashboard;
