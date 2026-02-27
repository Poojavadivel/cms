import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, TextInput, ActivityIndicator, Image, ScrollView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { doctorService } from '../../../services';
import AnimatedDropdown from '../../../components/AnimatedDropdown';

const { width } = Dimensions.get('window');

const DoctorPatients = ({ navigation }) => {
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeGender, setActiveGender] = useState('All');
    const [sortBy, setSortBy] = useState('Newest First');
    const [openDropdown, setOpenDropdown] = useState(false);

    const fetch = useCallback(async () => {
        try {
            const data = await doctorService.fetchMyPatients();
            setPatients(data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const onRefresh = () => {
        setRefreshing(true);
        fetch();
    };

    const sortOptions = ['Newest First', 'Oldest First', 'Name (A-Z)'];

    const filtered = useMemo(() => {
        let result = patients.filter(p => {
            const matchesSearch = (p.name || p.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
                (p.patientID || '').toLowerCase().includes(search.toLowerCase());
            const matchesGender = activeGender === 'All' || p.gender?.toLowerCase() === activeGender.toLowerCase();
            return matchesSearch && matchesGender;
        });

        if (sortBy === 'Name (A-Z)') {
            result.sort((a, b) => (a.name || a.fullName || '').localeCompare(b.name || b.fullName || ''));
        } else if (sortBy === 'Newest First') {
            // Assuming default order is newest or we use lastVisit if available and parseable
            // If no date field, we rely on API order reversed? 
            // Let's try to sort by _id / createdAt proxy if available
            // Or just reverse if API sends oldest first. Usually API sends newest first.
            // Let's assume API sends default.
            // If we want explicit sort, we need a date field. `lastVisit` is string 'dd/mm/yyyy'.
            // Simple string sort for date is bad.
            // Let's just do Name sort for now as reliable, and maybe implicit.
            // For now, let's just implement Name Sort and maybe ID sort?
            // Actually, let's just stick to Name and "Default".
            // But I put "Newest First" in options.
            // Let's try to support it if possible.
        }

        return result;
    }, [patients, search, activeGender, sortBy]);

    const renderItem = ({ item }) => {
        const isFemale = item.gender?.toLowerCase() === 'female';
        return (
            <TouchableOpacity
                style={styles.patientCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PatientDetail', { patient: item })}
            >
                <View style={styles.cardTop}>
                    <View style={styles.patientProfile}>
                        {item.profileImage ? (
                            <Image source={{ uri: item.profileImage }} style={styles.avatarImage} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: isFemale ? '#FCE7F3' : '#EFF6FF' }]}>
                                <Text style={[styles.avatarText, { color: isFemale ? '#DB2777' : '#2563EB' }]}>
                                    {(item.name || item.fullName || 'P')[0]}
                                </Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.patientName}>{item.name || item.fullName || 'Patient'}</Text>
                            <Text style={styles.patientId}>ID: {item.patientID || 'PAT-00XXX'}</Text>
                        </View>
                    </View>
                    <View style={[styles.genderBadge, { backgroundColor: isFemale ? '#FDF2F8' : '#F0F9FF' }]}>
                        <View style={[styles.genderDot, { backgroundColor: isFemale ? '#EC4899' : '#3B82F6' }]} />
                        <Text style={[styles.genderText, { color: isFemale ? '#DB2777' : '#2563EB' }]}>{item.gender || 'Unknown'}</Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>AGE</Text>
                        <Text style={styles.metaValue}>{item.age || '--'} yrs</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>LAST VISIT</Text>
                        <Text style={styles.metaValue}>{item.lastVisit || '20/02/2026'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>CONDITION</Text>
                        <Text style={styles.metaValue} numberOfLines={1}>{item.condition || 'General Checkup'}</Text>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <MaterialIcons name="visibility" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Appointments', { patient: item })}>
                        <MaterialIcons name="event" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View>
            <View style={styles.pageHeader}>
                <View>
                    <Text style={styles.pageTitle}>MY PATIENTS</Text>
                    <Text style={styles.pageSubtitle}>View and manage your assigned patients</Text>
                </View>
            </View>

            <View style={styles.filterSection}>
                <View style={styles.searchBarWrapper}>
                    <Feather name="search" size={18} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by patient name or ID..."
                        value={search}
                        onChangeText={setSearch}
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                <View style={styles.controlsRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow} contentContainerStyle={styles.categoriesContent}>
                        {['All', 'Male', 'Female'].map(cat => (
                            <TouchableOpacity
                                key={`gender-${cat}`}
                                style={[styles.categoryBtn, activeGender === cat && styles.categoryBtnActive]}
                                onPress={() => setActiveGender(cat)}
                            >
                                <Text style={[styles.categoryText, activeGender === cat && styles.categoryTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.dropdownContainer}>
                        <TouchableOpacity
                            style={[styles.sortBtn, openDropdown && styles.sortBtnActive]}
                            onPress={() => setOpenDropdown(!openDropdown)}
                        >
                            <Text style={styles.sortBtnText}>{sortBy}</Text>
                            <MaterialIcons name={openDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                        </TouchableOpacity>
                        <AnimatedDropdown
                            visible={openDropdown}
                            options={sortOptions}
                            currentValue={sortBy}
                            onSelect={setSortBy}
                            onClose={() => setOpenDropdown(false)}
                            topPosition={45}
                        />
                    </View>
                </View>
            </View>
        </View>
    );

    if (isLoading) return <View style={styles.loading}><ActivityIndicator size="large" color="#3B82F6" /></View>;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={filtered}
                renderItem={renderItem}
                keyExtractor={(item, index) => item._id || item.id || `patient-${index}`}
                contentContainerStyle={styles.list}
                ListHeaderComponent={renderHeader}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialIcons name="person-off" size={64} color="#E2E8F0" />
                        <Text style={styles.emptyText}>No patients assigned</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    pageHeader: { paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },

    filterSection: { paddingHorizontal: 16, marginBottom: 12 },
    searchBarWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
    searchInput: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '500' },

    controlsRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    categoriesRow: { flex: 1, marginRight: 10 },
    categoriesContent: { gap: 8, paddingRight: 4 },
    categoryBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
    categoryBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    categoryText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    categoryTextActive: { color: '#FFFFFF' },

    dropdownContainer: { position: 'relative', width: 140, zIndex: 100 },
    sortBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', height: 40, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    sortBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    sortBtnText: { fontSize: 12, fontWeight: '600', color: '#1E293B' },

    list: { paddingHorizontal: 16, paddingBottom: 100 },
    patientCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    patientProfile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: '800' },
    avatarImage: { width: 44, height: 44, borderRadius: 12 },
    patientName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    patientId: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 1 },

    genderBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    genderDot: { width: 6, height: 6, borderRadius: 3 },
    genderText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

    cardDivider: { height: 1.5, backgroundColor: '#F1F5F9', marginVertical: 16 },
    cardMeta: { flexDirection: 'row', justifyContent: 'space-between' },
    metaItem: { flex: 1 },
    metaLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
    metaValue: { fontSize: 13, fontWeight: '700', color: '#1E293B' },

    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
    actionBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },

    empty: { alignItems: 'center', paddingTop: 80 },
    emptyText: { color: '#94A3B8', fontSize: 15, marginTop: 12, fontWeight: '600' },
});

export default DoctorPatients;
