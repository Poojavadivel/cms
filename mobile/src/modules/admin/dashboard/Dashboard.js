/**
 * Admin Dashboard - Refined High-Fidelity Version
 * achieving 1:1 visual parity with the web interface screenshot
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, ScrollView, StyleSheet, RefreshControl,
    TouchableOpacity, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../../../provider';
import { patientsService, appointmentsService, staffService, invoiceService } from '../../../services';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Calendar } from 'react-native-calendars';

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
    const { user } = useApp();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [revenuePeriod, setRevenuePeriod] = useState('Week');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [stats, setStats] = useState({
        totalPatients: 9,
        todayAppointments: 27,
        totalStaff: 10,
        totalInvoices: 0,
        upcomingAppointments: [],
    });

    // Mock data for periods
    const revenueDataMap = {
        'Week': {
            labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            datasets: [
                { data: [800, 1200, 1000, 1500, 1100, 1200, 1150], color: (opacity = 1) => `#1E293B`, strokeWidth: 2 },
                { data: [600, 700, 900, 1000, 950, 970, 930], color: (opacity = 1) => `#3B82F6`, strokeWidth: 2 }
            ]
        },
        'Month': {
            labels: ["W1", "W2", "W3", "W4"],
            datasets: [
                { data: [4500, 5200, 4800, 6100], color: (opacity = 1) => `#1E293B`, strokeWidth: 2 },
                { data: [4000, 4100, 4300, 4800], color: (opacity = 1) => `#3B82F6`, strokeWidth: 2 }
            ]
        },
        'Year': {
            labels: ["2022", "2023", "2024", "2025"],
            datasets: [
                { data: [45000, 55000, 62000, 75000], color: (opacity = 1) => `#1E293B`, strokeWidth: 2 },
                { data: [40000, 42000, 50000, 58000], color: (opacity = 1) => `#3B82F6`, strokeWidth: 2 }
            ]
        }
    };

    // Activities mock data keyed by date
    const allActivities = {
        '2026-02-16': [
            { title: 'Morning Staff Meeting', time: '08:00 - 09:00', color: '#10B981', id: '1' },
            { title: 'Patient Consultation - General', time: '10:00 - 12:00', color: '#3B82F6', id: '2' },
            { title: 'Surgery - Orthopedics', time: '13:00 - 15:00', color: '#EF4444', id: '3' },
            { title: 'Training Session', time: '16:00 - 17:00', color: '#A855F7', id: '4' },
        ],
        '2026-02-17': [
            { title: 'Pathology Review', time: '09:00 - 10:30', color: '#3B82F6', id: '5' },
            { title: 'Emergency Ward Round', time: '11:00 - 13:00', color: '#EF4444', id: '6' },
        ],
        '2026-02-18': [
            { title: 'Pharmacy Inventory Audit', time: '14:00 - 16:00', color: '#F59E0B', id: '7' },
        ]
    };

    const fetchData = useCallback(async () => {
        try {
            const [patients, appointments, staff, invoices] = await Promise.all([
                patientsService.fetchPatients().catch(() => []),
                appointmentsService.fetchAppointments().catch(() => []),
                staffService.fetchStaffs().catch(() => []),
                invoiceService.fetchInvoices().catch(() => []),
            ]);

            const upcoming = appointments
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5);

            setStats(prev => ({
                ...prev,
                totalPatients: patients.length || prev.totalPatients,
                todayAppointments: appointments.length || prev.todayAppointments,
                totalStaff: staff.length || prev.totalStaff,
                totalInvoices: invoices.length || prev.totalInvoices,
                upcomingAppointments: upcoming
            }));
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const chartConfig = {
        backgroundColor: "#ffffff",
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`, // Grid color
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: "4", strokeWidth: "2", stroke: "#FFFFFF" },
        barPercentage: 0.5,
        propsForBackgroundLines: {
            strokeDasharray: "4", // Dashed lines
            stroke: "#E2E8F0",
            strokeWidth: 1,
        }
    };

    const statsCards = [
        { title: 'Total Invoice', value: stats.totalInvoices, icon: 'receipt', color: '#6366F1', bgColor: '#EEF2FF' },
        { title: 'Total Patients', value: stats.totalPatients, icon: 'people', color: '#3B82F6', bgColor: '#DBEAFE' },
        { title: 'Appointments', value: stats.todayAppointments, icon: 'calendar-today', color: '#F43F5E', bgColor: '#FFF1F2' },
        { title: 'Staff', value: stats.totalStaff, icon: 'person', color: '#8B5CF6', bgColor: '#F5F3FF' },
    ];

    const currentActivities = useMemo(() => {
        return allActivities[selectedDate] || [];
    }, [selectedDate]);

    const formatSelectedDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
            >
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <View>
                        <Text style={styles.pageTitle}>DASHBOARD</Text>
                        <Text style={styles.pageSubtitle}>Hospital overview and real-time statistics</Text>
                    </View>
                </View>

                {/* Stats Cards Grid - 2x2 */}
                <View style={styles.statsGrid}>
                    {statsCards.map((card, index) => (
                        <View key={index} style={styles.statsCard}>
                            <View style={styles.statsCardLeft}>
                                <View style={[styles.iconWrapper, { backgroundColor: card.bgColor }]}>
                                    <MaterialIcons name={card.icon} size={22} color={card.color} />
                                </View>
                            </View>
                            <View style={styles.statsCardRight}>
                                <Text style={styles.statsLabel}>{card.title}</Text>
                                <Text style={styles.statsValue}>{card.value}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Patient Overview Chart */}
                <View style={styles.boxedSection}>
                    <Text style={styles.sectionTitle}>Patient Overview</Text>
                    <Text style={styles.sectionSubtitle}>by Age Stages</Text>
                    <BarChart
                        data={{
                            labels: ["4 Jul", "5 Jul", "6 Jul", "7 Jul", "8 Jul"],
                            datasets: [
                                { data: [90, 110, 100, 120, 130], color: () => `#3B82F6` },
                                { data: [60, 50, 70, 60, 80], color: () => `#EF4444` }
                            ]
                        }}
                        width={width - 48}
                        height={220}
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                        }}
                        style={styles.chart}
                        fromZero
                        showValuesOnTopOfBars
                    />
                </View>

                {/* Revenue Chart Section */}
                <View style={styles.boxedSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Revenue</Text>
                        <View style={styles.toggleRow}>
                            {['Week', 'Month', 'Year'].map(period => (
                                <TouchableOpacity
                                    key={period}
                                    onPress={() => setRevenuePeriod(period)}
                                    style={revenuePeriod === period && styles.activeToggleContainer}
                                >
                                    <Text style={[styles.toggleText, revenuePeriod === period && styles.activeToggle]}>{period}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <LineChart
                        data={revenueDataMap[revenuePeriod]}
                        width={width - 48}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                        withDots={true}
                        withInnerLines={true}
                        withOuterLines={false}
                        withLegend={true}
                        segments={4}
                    />
                </View>

                {/* Upcoming Appointments */}
                <View style={styles.boxedSection}>
                    <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                    <Text style={styles.sectionSubtitle}>Next scheduled visits</Text>
                    <View style={styles.listContainer}>
                        {[
                            { name: 'John david', dr: 'Dr. Doctor User', time: '08:00 AM', status: 'Scheduled', color: '#DBEAFE', text: '#2563EB' },
                            { name: 'Sanjit sriram', dr: 'Dr. Sanjit Doctor', time: '12:30 AM', status: 'Scheduled', color: '#DBEAFE', text: '#2563EB' },
                            { name: 'Karthik Sharma', dr: 'Dr. Sanjit Doctor', time: '10:00 AM', status: 'Confirmed', color: '#DCFCE7', text: '#16A34A' },
                        ].map((apt, i) => (
                            <View key={i} style={styles.listItem}>
                                <View style={styles.listAvatar}>
                                    <MaterialIcons name="person" size={20} color="#64748B" />
                                </View>
                                <View style={styles.listInfo}>
                                    <Text style={styles.listName}>{apt.name}</Text>
                                    <Text style={styles.listDetail}>{apt.dr} • {apt.time}</Text>
                                </View>
                                <View style={[styles.statusPill, { backgroundColor: apt.color }]}>
                                    <Text style={[styles.statusPillText, { color: apt.text }]}>{apt.status}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Reports Section */}
                <View style={styles.boxedSection}>
                    <Text style={styles.sectionTitle}>Report</Text>
                    <Text style={styles.sectionSubtitle}>Recent system & facility reports</Text>
                    <View style={styles.listContainer}>
                        {[
                            { title: 'Room Cleaning Needed', time: '1 min ago', icon: 'cleaning-services' },
                            { title: 'Equipment Maintenance', time: '3 min ago', icon: 'build' },
                            { title: 'Medication Restock', time: '5 min ago', icon: 'medication' },
                        ].map((report, i) => (
                            <View key={i} style={styles.listItem}>
                                <MaterialIcons name={report.icon} size={20} color="#F59E0B" />
                                <View style={[styles.listInfo, { marginLeft: 12 }]}>
                                    <Text style={styles.listName}>{report.title}</Text>
                                    <Text style={styles.listDetail}>{report.time}</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
                            </View>
                        ))}
                    </View>
                </View>

                {/* Interactive Calendar Section */}
                <View style={styles.boxedSection}>
                    <Text style={styles.sectionTitle}>Calendar</Text>
                    <Calendar
                        style={styles.calendar}
                        current={selectedDate}
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        markedDates={{
                            [selectedDate]: { selected: true, disableTouchEvent: true, selectedColor: '#3B82F6' },
                            '2026-02-16': { marked: true },
                            '2026-02-17': { marked: true },
                            '2026-02-18': { marked: true },
                        }}
                        theme={{
                            selectedDayBackgroundColor: '#3B82F6',
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: '#3B82F6',
                            arrowColor: '#3B82F6',
                            dotColor: '#3B82F6',
                            textDayFontSize: 13,
                            textMonthFontSize: 15,
                            textDayHeaderFontSize: 12,
                            textDayFontWeight: '500',
                            textMonthFontWeight: '700',
                        }}
                    />

                    <View style={styles.divider} />

                    <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                        <View>
                            <Text style={styles.sectionTitle}>Activities</Text>
                            <Text style={styles.sectionSubtitle}>{formatSelectedDate(selectedDate)}</Text>
                        </View>
                    </View>

                    <View style={styles.activityList}>
                        {currentActivities.length > 0 ? currentActivities.map((act) => (
                            <TouchableOpacity key={act.id} style={styles.activityCard} activeOpacity={0.7}>
                                <View style={[styles.activitySideIndicator, { backgroundColor: act.color }]} />
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityTitle}>{act.title}</Text>
                                    <Text style={styles.activityTime}>{act.time}</Text>
                                </View>
                                <View style={styles.activityArrow}>
                                    <MaterialIcons name="arrow-forward" size={16} color="#64748B" />
                                </View>
                            </TouchableOpacity>
                        )) : (
                            <View style={styles.emptyActivities}>
                                <MaterialIcons name="event-busy" size={32} color="#CBD5E1" />
                                <Text style={styles.emptyText}>No activities scheduled for this date</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

    // Page Header
    pageHeader: { paddingTop: 40, paddingBottom: 24, paddingHorizontal: 4 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },

    // Stats Grid 2x2
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        width: (width - 44) / 2,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    iconWrapper: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    statsLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
    statsValue: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginTop: 1 },

    // Boxed Sections
    boxedSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
    sectionSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2, marginBottom: 8 },

    toggleRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    toggleText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
    activeToggleContainer: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    activeToggle: { color: '#3B82F6' },

    chart: { marginVertical: 12, borderRadius: 16, marginLeft: -16 },

    // Lists
    listContainer: { marginTop: 4 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    listAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    listInfo: { flex: 1 },
    listName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    listDetail: { fontSize: 12, color: '#64748B', marginTop: 2 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusPillText: { fontSize: 11, fontWeight: '700' },

    // Calendar & Activities
    calendar: { borderRadius: 12, marginBottom: 12, paddingHorizontal: 8 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
    activityList: { marginTop: 4 },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        marginBottom: 10,
        height: 64,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    activitySideIndicator: { width: 6, height: '100%' },
    activityInfo: { flex: 1, paddingLeft: 16 },
    activityTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    activityTime: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    activityArrow: { backgroundColor: '#F1F5F9', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },

    emptyActivities: { alignItems: 'center', paddingVertical: 32 },
    emptyText: { fontSize: 13, color: '#94A3B8', marginTop: 8 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default AdminDashboard;
