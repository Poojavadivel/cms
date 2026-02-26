/**
 * Admin Patients - Refined High-Fidelity Version
 * achieving 1:1 visual parity with the web interface screenshot
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, StyleSheet, RefreshControl,
    TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { patientsService, doctorService } from '../../../services';
import AnimatedDropdown from '../../../components/AnimatedDropdown';

const AdminPatients = ({ navigation }) => {
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Newest First');
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState('All');
    const [selectedAgeRange, setSelectedAgeRange] = useState('All Ages');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState(null);

    const ageRanges = ['All Ages', '0-18', '19-35', '36-50', '51-65', '65+'];
    const genderOptions = ['All', 'Male', 'Female'];
    const sortOptions = ['Newest First', 'Oldest First', 'Name (A-Z)'];

    const fetchData = useCallback(async () => {
        try {
            const [patientsData, doctorsData] = await Promise.all([
                patientsService.fetchPatients(),
                doctorService.fetchAllDoctors()
            ]);
            setPatients(patientsData);
            setDoctors(doctorsData);
        } catch (error) {
            console.error('Error fetching patient data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const filteredPatients = useMemo(() => {
        let result = patients.filter(p => {
            const name = p.name || p.fullName || '';
            const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.patientId || p._id || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesGender = genderFilter === 'All' ||
                (p.gender || '').toLowerCase() === genderFilter.toLowerCase();

            const matchesDoctor = selectedDoctor === 'All' ||
                (p.assignedDoctor || '').toLowerCase() === selectedDoctor.toLowerCase();

            // Age Range Logic
            let matchesAge = true;
            if (selectedAgeRange !== 'All Ages') {
                const age = parseInt(p.age) || 0;
                if (selectedAgeRange === '0-18') matchesAge = age <= 18;
                else if (selectedAgeRange === '19-35') matchesAge = age >= 19 && age <= 35;
                else if (selectedAgeRange === '36-50') matchesAge = age >= 36 && age <= 50;
                else if (selectedAgeRange === '51-65') matchesAge = age >= 51 && age <= 65;
                else if (selectedAgeRange === '65+') matchesAge = age >= 66;
            }

            return matchesSearch && matchesGender && matchesDoctor && matchesAge;
        });

        // Sorting
        if (sortBy === 'Newest First') {
            result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); // Assuming createdAt or similar
        } else if (sortBy === 'Oldest First') {
            result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        } else if (sortBy === 'Name (A-Z)') {
            result.sort((a, b) => (a.name || a.fullName || '').localeCompare(b.name || b.fullName || ''));
        }

        return result;
    }, [patients, searchQuery, genderFilter, selectedDoctor, selectedAgeRange, sortBy]);

    const paginatedPatients = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPatients.slice(start, start + itemsPerPage);
    }, [filteredPatients, currentPage]);

    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;

    const doctorOptions = ['All', ...doctors.map(d => d.name)];

    const handleToggle = (type) => {
        if (openDropdown === type) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(type);
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete Patient',
            'Are you sure you want to delete this patient record?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await patientsService.deletePatient(id);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete patient');
                        }
                    }
                }
            ]
        );
    };

    const renderPatient = ({ item }) => (
        <TouchableOpacity
            style={styles.premiumCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PatientDetail', { patient: item })}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.avatarPremium, { backgroundColor: item.gender === 'Female' ? '#FDF2F8' : '#EFF6FF' }]}>
                    <Text style={[styles.avatarTextPremium, { color: item.gender === 'Female' ? '#EC4899' : '#3B82F6' }]}>
                        {(item.name || item.fullName || 'P')[0]}
                    </Text>
                </View>
                <View style={styles.patientMainInfo}>
                    <Text style={styles.patientNamePremium} numberOfLines={1}>{item.name || item.fullName || 'Unknown Patient'}</Text>
                    <View style={styles.patientIdRow}>
                        <MaterialIcons name="fingerprint" size={12} color="#94A3B8" />
                        <Text style={styles.patientIdPremium}>PAT-{(item._id || '000').slice(-5).toUpperCase()}</Text>
                    </View>
                </View>
                <View style={styles.statusBadgePremium}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusTextPremium}>Active</Text>
                </View>
            </View>

            <View style={styles.cardInfoGrid}>
                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>AGE / GENDER</Text>
                    <Text style={styles.infoValue}>{item.age || '26'}Y / {item.gender || 'Male'}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>BLOOD GROUP</Text>
                    <Text style={[styles.bloodGroupText, { color: '#EF4444' }]}>{item.bloodGroup || 'O+'}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>PHONE</Text>
                    <Text style={styles.infoValue}>{item.phone || '9876543210'}</Text>
                </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardDoctorRow}>
                <View style={styles.doctorInfo}>
                    <View style={styles.docAvatarCircle}>
                        <MaterialIcons name="medical-services" size={12} color="#3B82F6" />
                    </View>
                    <View>
                        <Text style={styles.docLabel}>ASSIGNED DOCTOR</Text>
                        <Text style={styles.docNameSmall}>{item.assignedDoctor || 'Dr. Not Assigned'}</Text>
                    </View>
                </View>
                <View style={styles.visitInfo}>
                    <Text style={styles.visitLabel}>LAST VISIT</Text>
                    <Text style={styles.visitDate}>{item.lastVisit || '04/02/2026'}</Text>
                </View>
            </View>

            <View style={styles.cardActionsPremium}>
                <TouchableOpacity style={styles.actionBtnPremium} onPress={() => navigation.navigate('PatientDetail', { patient: item })}>
                    <MaterialIcons name="visibility" size={18} color="#64748B" />
                    <Text style={styles.actionBtnText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnPremium} onPress={() => navigation.navigate('PatientForm', { patient: item })}>
                    <MaterialIcons name="edit" size={18} color="#3B82F6" />
                    <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtnPremium, styles.deleteBtnPremium]} onPress={() => handleDelete(item._id || item.id)}>
                    <MaterialIcons name="delete" size={18} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Remove</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.container}>
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <View style={styles.pageHeaderLeft}>
                        <Text style={styles.pageTitle}>PATIENTS</Text>
                        <Text style={styles.pageSubtitle}>Manage patient records and medical history</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('PatientForm', {})}>
                        <MaterialIcons name="add" size={20} color={"#FFFFFF"} />
                        <Text style={styles.addBtnText}>New Record</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Filters Bar */}
                <View style={[styles.filtersBar, { zIndex: 100 }]}>
                    <View style={styles.searchBar}>
                        <MaterialIcons name="search" size={18} color="#94A3B8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name, ID..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={(t) => { setSearchQuery(t); setCurrentPage(1); }}
                        />
                    </View>

                    <View style={styles.filterRow}>
                        <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'gender' ? 100 : 1 }]}>
                            <TouchableOpacity
                                style={[styles.dropdownBtn, openDropdown === 'gender' && styles.dropdownBtnActive]}
                                onPress={() => handleToggle('gender')}
                            >
                                <Text style={styles.dropdownBtnText}>{genderFilter === 'All' ? 'All Genders' : genderFilter}</Text>
                                <MaterialIcons name={openDropdown === 'gender' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                            </TouchableOpacity>
                            <AnimatedDropdown
                                visible={openDropdown === 'gender'}
                                options={genderOptions}
                                currentValue={genderFilter}
                                onSelect={(val) => { setGenderFilter(val); setCurrentPage(1); }}
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

                        <TouchableOpacity
                            style={[styles.moreBtn, showMoreFilters && styles.activeMoreBtn]}
                            onPress={() => setShowMoreFilters(!showMoreFilters)}
                        >
                            <MaterialIcons name="filter-list" size={20} color={showMoreFilters ? "#3B82F6" : "#64748B"} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Advanced Filters Expandable Section */}
                {showMoreFilters && (
                    <View style={[styles.advancedFilters, { zIndex: 90 }]}>
                        <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'doctor' ? 100 : 1 }]}>
                            <Text style={styles.filterLabel}>Doctor</Text>
                            <TouchableOpacity
                                style={[styles.dropdownBtn, openDropdown === 'doctor' && styles.dropdownBtnActive]}
                                onPress={() => handleToggle('doctor')}
                            >
                                <Text style={styles.dropdownBtnText}>{selectedDoctor === 'All' ? 'All Doctors' : selectedDoctor}</Text>
                                <MaterialIcons name={openDropdown === 'doctor' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                            </TouchableOpacity>
                            <AnimatedDropdown
                                visible={openDropdown === 'doctor'}
                                options={doctorOptions}
                                currentValue={selectedDoctor}
                                onSelect={(val) => { setSelectedDoctor(val); setCurrentPage(1); }}
                                onClose={() => setOpenDropdown(null)}
                                topPosition={68}
                            />
                        </View>

                        <View style={[styles.dropdownWrapper, { zIndex: openDropdown === 'age' ? 100 : 1 }]}>
                            <Text style={styles.filterLabel}>Age Range</Text>
                            <TouchableOpacity
                                style={[styles.dropdownBtn, openDropdown === 'age' && styles.dropdownBtnActive]}
                                onPress={() => handleToggle('age')}
                            >
                                <Text style={styles.dropdownBtnText}>{selectedAgeRange}</Text>
                                <MaterialIcons name={openDropdown === 'age' ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#64748B" />
                            </TouchableOpacity>
                            <AnimatedDropdown
                                visible={openDropdown === 'age'}
                                options={ageRanges}
                                currentValue={selectedAgeRange}
                                onSelect={(val) => { setSelectedAgeRange(val); setCurrentPage(1); }}
                                onClose={() => setOpenDropdown(null)}
                                topPosition={68}
                            />
                        </View>
                    </View>
                )}

                {/* Patient List */}
                {isLoading ? (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                ) : (
                    <FlatList
                        data={paginatedPatients}
                        renderItem={renderPatient}
                        keyExtractor={(item, index) => item._id || item.id || `patient-${index}`}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <MaterialIcons name="person-off" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>No patients found</Text>
                            </View>
                        }
                    />
                )}

                {/* Pagination Footer */}
                <View style={styles.paginationFooter}>
                    <TouchableOpacity
                        disabled={currentPage === 1}
                        onPress={() => setCurrentPage(p => p - 1)}
                        style={[styles.pageBtn, currentPage === 1 && styles.disabledBtn]}
                    >
                        <MaterialIcons name="chevron-left" size={24} color={currentPage === 1 ? "#CBD5E1" : "#1E293B"} />
                    </TouchableOpacity>
                    <Text style={styles.pageInfoText}>Page {currentPage} of {totalPages}</Text>
                    <TouchableOpacity
                        disabled={currentPage === totalPages}
                        onPress={() => setCurrentPage(p => p + 1)}
                        style={[styles.pageBtn, currentPage === totalPages && styles.disabledBtn]}
                    >
                        <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages ? "#CBD5E1" : "#1E293B"} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 40, paddingBottom: 24, paddingHorizontal: 16, backgroundColor: '#F8FAFC' },
    pageHeaderLeft: { flex: 1, marginRight: 16 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, elevation: 2 },
    addBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, marginLeft: 4 },

    filtersBar: { backgroundColor: '#FFFFFF', paddingBottom: 16, gap: 12 },
    searchBar: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', marginHorizontal: 16, borderRadius: 12, height: 46, gap: 10 },
    searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },

    filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, alignItems: 'center', zIndex: 100 },
    dropdownWrapper: { flex: 1, position: 'relative' },
    dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 44 },
    dropdownBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    dropdownBtnText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },

    moreBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FFFFFF' },
    activeMoreBtn: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },

    advancedFilters: { backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 16, flexDirection: 'row' },
    filterLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 6 },

    list: { padding: 16, paddingBottom: 100 },
    premiumCard: { backgroundColor: '#FFFFFF', borderRadius: 24, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    avatarPremium: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
    avatarTextPremium: { fontSize: 18, fontWeight: '900' },
    patientMainInfo: { flex: 1 },
    patientNamePremium: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    patientIdRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    patientIdPremium: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
    statusBadgePremium: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F0FDF4', gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    statusTextPremium: { fontSize: 10, fontWeight: '800', color: '#10B981', textTransform: 'uppercase' },

    cardInfoGrid: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, gap: 16 },
    infoBox: { flex: 1, gap: 4 },
    infoLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    infoValue: { fontSize: 13, fontWeight: '700', color: '#475569' },
    bloodGroupText: { fontSize: 14, fontWeight: '900' },

    cardDivider: { height: 1, backgroundColor: '#F8FAFC', marginHorizontal: 16 },
    cardDoctorRow: { flexDirection: 'row', padding: 16, justifyContent: 'space-between', alignItems: 'center' },
    doctorInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    docAvatarCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    docLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8' },
    docNameSmall: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
    visitInfo: { alignItems: 'flex-end' },
    visitLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8' },
    visitDate: { fontSize: 11, fontWeight: '700', color: '#64748B' },

    cardActionsPremium: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F8FAFC', backgroundColor: '#F8FAFC', padding: 12, justifyContent: 'space-between' },
    actionBtnPremium: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FFFFFF', flex: 1, justifyContent: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#F1F5F9' },
    deleteBtnPremium: { borderColor: '#FEE2E2' },
    actionBtnText: { fontSize: 11, fontWeight: '800', color: '#64748B' },

    // Pagination
    paginationFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingBottom: 15 },
    pageBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
    disabledBtn: { opacity: 0.3 },
    pageInfoText: { fontSize: 14, fontWeight: '700', color: '#64748B' },

    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyText: { color: '#94A3B8', fontSize: 15, fontWeight: '600', marginTop: 12 }
});

export default AdminPatients;
