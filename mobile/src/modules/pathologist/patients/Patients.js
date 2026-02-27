import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, TextInput, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { pathologyService } from '../../../services';

const { width } = Dimensions.get('window');

const PathologistPatients = ({ navigation }) => {
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const data = await pathologyService.fetchPathologyPatients();
            setPatients(data || []);
        } catch (e) {
            console.error('Error fetching pathology patients:', e);
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

    const filteredPatients = useMemo(() => {
        return patients.filter(p => {
            const name = (p.name || p.fullName || '').toLowerCase();
            const code = (p.patientCode || p._id || '').toLowerCase();
            const q = search.toLowerCase();
            return name.includes(q) || code.includes(q);
        });
    }, [patients, search]);

    const renderHeader = () => (
        <View>
            {/* Page Header */}
            <View style={styles.header}>
                <Text style={styles.pageTitle}>Patient Test History</Text>
                <Text style={styles.pageSubtitle}>Browse patients and their laboratory test records</Text>
            </View>

            {/* Premium Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Feather name="search" size={18} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or patient code..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Labels - Visible on wider/tablet, simplified for mobile */}
            <View style={styles.tableLabels}>
                <Text style={[styles.label, { flex: 2.5 }]}>PATIENT</Text>
                <Text style={[styles.label, { flex: 1, textAlign: 'center' }]}>AGE/SEX</Text>
                <Text style={[styles.label, { flex: 1, textAlign: 'center' }]}>BLOOD</Text>
                <Text style={[styles.label, { flex: 1.5, textAlign: 'right' }]}>ACTIONS</Text>
            </View>
        </View>
    );

    const renderItem = ({ item }) => (
        <View style={styles.patientCard}>
            <View style={styles.cardContent}>
                {/* Patient Basic Info */}
                <View style={[styles.col, { flex: 2.5 }]}>
                    <View style={styles.patientRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{(item.name || item.fullName || 'P')[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.patientName} numberOfLines={1}>{item.name || item.fullName}</Text>
                            <Text style={styles.patientCode}>{item.patientCode || `PAT-${item._id?.slice(-5).toUpperCase() || '00XXX'}`}</Text>
                        </View>
                    </View>
                </View>

                {/* Age & Gender */}
                <View style={[styles.col, { flex: 1, alignItems: 'center' }]}>
                    <Text style={styles.metaValue}>{item.age || '--'} Yrs</Text>
                    <View style={[styles.genderBadge, { backgroundColor: item.gender?.toLowerCase() === 'male' ? '#EFF6FF' : '#FDF2F8' }]}>
                        <Text style={[styles.genderText, { color: item.gender?.toLowerCase() === 'male' ? '#3B82F6' : '#DB2777' }]}>
                            {item.gender?.toUpperCase() || 'N/A'}
                        </Text>
                    </View>
                </View>

                {/* Blood Group */}
                <View style={[styles.col, { flex: 1, alignItems: 'center' }]}>
                    <Text style={styles.bloodValue}>{item.bloodGroup || 'O+'}</Text>
                </View>

                {/* Action Button */}
                <View style={[styles.col, { flex: 1.5, alignItems: 'flex-end' }]}>
                    <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => navigation.navigate('TestReports', { search: item.name || item.fullName })}
                    >
                        <Feather name="eye" size={14} color="#1E293B" />
                        <Text style={styles.viewBtnText}>Tests</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Footer containing Last Visit */}
            <View style={styles.cardFooter}>
                <View style={styles.visitRow}>
                    <Feather name="calendar" size={12} color="#94A3B8" />
                    <Text style={styles.visitText}>
                        Last Visit: {item.lastVisit ? new Date(item.lastVisit).toLocaleDateString() : 'Invalid Date'}
                    </Text>
                </View>
            </View>
        </View>
    );

    if (isLoading) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.loadingText}>Fetching Patient Records...</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={filteredPatients}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                keyExtractor={(item, index) => item._id || `patient-${index}`}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Feather name="users" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No patients found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
    scrollContent: { paddingBottom: 40 },

    header: { padding: 24, paddingBottom: 12 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '500' },

    searchSection: { paddingHorizontal: 16, marginBottom: 20 },
    searchContainer: { backgroundColor: '#FFF', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 14, color: '#1E293B', fontWeight: '500' },

    tableLabels: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 8, opacity: 0.5 },
    label: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 1 },

    patientCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8 },
    cardContent: { flexDirection: 'row', padding: 16, alignItems: 'center' },
    col: { justifyContent: 'center' },

    patientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
    patientName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    patientCode: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 2 },

    metaValue: { fontSize: 12, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    genderBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    genderText: { fontSize: 8, fontWeight: '900' },

    bloodValue: { fontSize: 13, fontWeight: '800', color: '#1E3A8A' },

    viewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 4 },
    viewBtnText: { fontSize: 11, fontWeight: '800', color: '#1E293B' },

    cardFooter: { borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 10 },
    visitRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    visitText: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },

    emptyState: { padding: 80, alignItems: 'center', gap: 12 },
    emptyText: { color: '#94A3B8', fontWeight: '600', fontSize: 14 }
});

export default PathologistPatients;
