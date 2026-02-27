/**
 * Admin Doctors List
 * Specialized view for managing doctors (Admin only)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import doctorService from '../../../services/doctorService';
import AnimatedDropdown from '../../../components/AnimatedDropdown';

const AdminDoctors = ({ navigation }) => {
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [specializationFilter, setSpecializationFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Name (A-Z)');

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState(null);

    const fetchDoctors = useCallback(async () => {
        try {
            const data = await doctorService.fetchAllDoctors();
            setDoctors(data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDoctors();
    };

    const uniqueSpecializations = useMemo(() => {
        const specs = new Set(doctors.map(d => d.specialization).filter(Boolean));
        return ['All', ...Array.from(specs).sort()];
    }, [doctors]);

    const sortOptions = ['Name (A-Z)', 'Specialization'];

    const filtered = useMemo(() => {
        let result = doctors.filter(d => {
            const matchesSearch = (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (d.specialization || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSpec = specializationFilter === 'All' || d.specialization === specializationFilter;

            return matchesSearch && matchesSpec;
        });

        if (sortBy === 'Name (A-Z)') {
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortBy === 'Specialization') {
            result.sort((a, b) => (a.specialization || '').localeCompare(b.specialization || ''));
        }

        return result;
    }, [doctors, searchQuery, specializationFilter, sortBy]);

    const handleToggle = (type) => {
        if (openDropdown === type) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(type);
        }
    };

    const renderDoctor = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('DoctorForm', { doctor: item })}
        >
            <View style={styles.cardRow}>
                <View style={styles.avatar}>
                    <MaterialIcons name="medical-services" size={24} color="#10B981" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.name} numberOfLines={1}>{item.name || 'Dr. Unknown'}</Text>
                    <Text style={styles.specialization} numberOfLines={1}>{item.specialization || 'General Physician'}</Text>
                    <View style={styles.contactRow}>
                        <MaterialIcons name="email" size={12} color="#94A3B8" />
                        <Text style={styles.contactText}>{item.email || 'No email'}</Text>
                    </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.container}>
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <View style={styles.pageHeaderLeft}>
                        <Text style={styles.pageTitle}>DOCTORS</Text>
                        <Text style={styles.pageSubtitle}>Manage medical professionals and schedules</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('DoctorForm', {})}>
                        <MaterialIcons name="add" size={20} color={"#FFFFFF"} />
                        <Text style={styles.addBtnText}>Register</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.filterSection, { zIndex: 100 }]}>
                    <View style={styles.searchBar}>
                        <MaterialIcons name="search" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search doctors..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <View style={styles.filterRow}>
                        <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'spec' ? 100 : 1 }]}>
                            <TouchableOpacity
                                style={[styles.dropdownBtn, openDropdown === 'spec' && styles.dropdownBtnActive]}
                                onPress={() => handleToggle('spec')}
                            >
                                <Text style={styles.dropdownBtnText}>{specializationFilter === 'All' ? 'All Specialties' : specializationFilter}</Text>
                                <MaterialIcons name={openDropdown === 'spec' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                            </TouchableOpacity>
                            <AnimatedDropdown
                                visible={openDropdown === 'spec'}
                                options={uniqueSpecializations}
                                currentValue={specializationFilter}
                                onSelect={setSpecializationFilter}
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
                </View>

                <FlatList
                    data={filtered}
                    renderItem={renderDoctor}
                    keyExtractor={(item) => item.id || item._id}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialIcons name="person-off" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No doctors found</Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 40, paddingBottom: 24, paddingHorizontal: 16, backgroundColor: '#F8FAFC' },
    pageHeaderLeft: { flex: 1, marginRight: 16 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, elevation: 2 },
    addBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, marginLeft: 4 },

    filterSection: { paddingHorizontal: 16, paddingBottom: 12, gap: 10, backgroundColor: '#F8FAFC' },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#E2E8F0', gap: 8
    },
    searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },
    filterRow: { flexDirection: 'row', gap: 10, zIndex: 100 },
    dropdownWrapper: { flex: 1, position: 'relative' },
    dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, height: 40 },
    dropdownBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    dropdownBtnText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },

    list: { padding: 16, paddingTop: 8, gap: 10 },
    card: {
        backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 2
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#D1FAE5',
        alignItems: 'center', justifyContent: 'center'
    },
    cardInfo: { flex: 1 },
    name: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    specialization: { fontSize: 13, color: '#10B981', fontWeight: '600', marginTop: 2 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    contactText: { fontSize: 11, color: '#64748B' },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: '#94A3B8', fontSize: 14, marginTop: 8 },
});

export default AdminDoctors;
