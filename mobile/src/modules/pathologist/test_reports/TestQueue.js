/**
 * Pathologist Test Queue
 * Displays list of intakes with pending pathology tests
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, ActivityIndicator, TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { pathologyService } from '../../../services';

const PathologistTestQueue = ({ navigation }) => {
    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const data = await pathologyService.fetchPendingTests();
            setTests(data);
        } catch (e) {
            console.error('Fetch Test Queue Error:', e);
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

    const filtered = tests.filter(item =>
        (item.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('LabReportForm', { intake: item, onRefresh: fetchData })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{item.patientName || 'Unknown Patient'}</Text>
                    <Text style={styles.doctorName}>Ref: {item.doctorName || 'Doctor'}</Text>
                </View>
                <View style={styles.dateInfo}>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    <Text style={styles.itemCount}>{item.pathologyItems?.length || 0} tests</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.testList}>
                {(item.pathologyItems || []).slice(0, 2).map((test, idx) => (
                    <View key={idx} style={styles.testChip}>
                        <Text style={styles.testChipText}>{test.name || test.testName}</Text>
                    </View>
                ))}
                {(item.pathologyItems?.length || 0) > 2 && (
                    <Text style={styles.moreText}>+{(item.pathologyItems?.length || 0) - 2} more</Text>
                )}
            </View>

            <View style={styles.footer}>
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>PENDING COLLECTION</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <MaterialIcons name="search" size={20} color="#94A3B8" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by patient or doctor..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filtered}
                renderItem={renderItem}
                keyExtractor={(item) => item._id || item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialIcons name="fact-check" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No pending tests in queue</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        marginHorizontal: 16, marginTop: 12, marginBottom: 8, borderRadius: 10,
        paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#E2E8F0', gap: 8
    },
    searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },
    list: { padding: 16, paddingTop: 8, gap: 12 },
    card: {
        backgroundColor: '#FFF', borderRadius: 12, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
        borderLeftWidth: 4, borderLeftColor: '#3B82F6'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    patientName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    doctorName: { fontSize: 13, color: '#64748B', marginTop: 2 },
    dateInfo: { alignItems: 'flex-end' },
    date: { fontSize: 12, color: '#94A3B8' },
    itemCount: { fontSize: 12, color: '#3B82F6', fontWeight: '600', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    testList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    testChip: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    testChipText: { fontSize: 11, color: '#1D4ED8', fontWeight: '500' },
    moreText: { fontSize: 11, color: '#94A3B8', alignSelf: 'center' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6' },
    statusText: { fontSize: 10, fontWeight: '700', color: '#1E40AF' },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: '#94A3B8', fontSize: 14, marginTop: 8 }
});

export default PathologistTestQueue;
