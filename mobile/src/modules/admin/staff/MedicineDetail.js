/**
 * MedicineDetail.js
 * Read-only detail view for Medicines
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const MedicineDetail = ({ route, navigation }) => {
    const { medicine } = route.params;

    const handleEdit = () => {
        navigation.navigate('MedicineForm', { medicine });
    };

    const DetailSection = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>{children}</View>
        </View>
    );

    const DetailRow = ({ icon, label, value }) => (
        <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={20} color="#64748B" />
            </View>
            <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

    const getStockColor = (stock) => {
        if (stock <= 0) return { bg: '#FEE2E2', text: '#DC2626', label: 'Out of Stock' };
        if (stock < 10) return { bg: '#FEF3C7', text: '#D97706', label: 'Low Stock' };
        return { bg: '#DCFCE7', text: '#16A34A', label: 'In Stock' };
    };

    const stockInfo = getStockColor(medicine.stock || medicine.quantity || 0);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Medicine Details</Text>
                <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                    <MaterialIcons name="edit" size={22} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Banner */}
                <View style={styles.banner}>
                    <View style={styles.avatar}>
                        <MaterialIcons name="medication" size={40} color="#3B82F6" />
                    </View>
                    <Text style={styles.name}>{medicine.name}</Text>
                    <Text style={styles.role}>{medicine.category} • {medicine.manufacturer}</Text>

                    <View style={[styles.statusBadge, { backgroundColor: stockInfo.bg }]}>
                        <Text style={[styles.statusText, { color: stockInfo.text }]}>{stockInfo.label}</Text>
                    </View>
                </View>

                {/* Stock Info */}
                <DetailSection title="Inventory Status">
                    <DetailRow icon="inventory" label="Current Stock" value={`${medicine.stock || medicine.quantity || 0} ${medicine.unit || 'units'}`} />
                    <DetailRow icon="tag" label="Batch Number" value={medicine.batchNumber} />
                    <DetailRow icon="event-busy" label="Expiry Date" value={medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : null} />
                </DetailSection>

                {/* Pricing Info */}
                <DetailSection title="Pricing">
                    <DetailRow icon="attach-money" label="Price" value={`₹${medicine.price || 0}`} />
                    <DetailRow icon="sell" label="MRP" value={`₹${medicine.mrp || medicine.price || 0}`} />
                </DetailSection>

                {/* Medical Info */}
                <DetailSection title="Medical Information">
                    {medicine.dosage && (
                        <View style={styles.textBox}>
                            <Text style={styles.textLabel}>Dosage</Text>
                            <Text style={styles.textValue}>{medicine.dosage}</Text>
                        </View>
                    )}
                    {medicine.description && (
                        <View style={styles.textBox}>
                            <Text style={styles.textLabel}>Description</Text>
                            <Text style={styles.textValue}>{medicine.description}</Text>
                        </View>
                    )}
                    {medicine.sideEffects && (
                        <View style={styles.textBox}>
                            <Text style={styles.textLabel}>Side Effects</Text>
                            <Text style={styles.textValue}>{medicine.sideEffects}</Text>
                        </View>
                    )}
                </DetailSection>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    backButton: { padding: 4 },
    editButton: { padding: 4 },
    banner: {
        alignItems: 'center', padding: 24, backgroundColor: '#FFFFFF',
        borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 16
    },
    avatar: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#DBEAFE',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16
    },
    name: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 4, textAlign: 'center' },
    role: { fontSize: 14, color: '#64748B', marginBottom: 12, textAlign: 'center' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
    statusText: { fontSize: 12, fontWeight: '600' },
    section: { marginBottom: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0' },
    sectionTitle: {
        fontSize: 14, fontWeight: '700', color: '#475569',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F8FAFC',
        borderBottomWidth: 1, borderBottomColor: '#E2E8F0', textTransform: 'uppercase'
    },
    sectionContent: { paddingLeft: 16 },
    detailRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingRight: 16,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    iconContainer: { width: 40, alignItems: 'center' },
    detailInfo: { flex: 1 },
    detailLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
    detailValue: { fontSize: 15, color: '#1E293B' },
    textBox: {
        paddingVertical: 14, paddingRight: 16,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    textLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase' },
    textValue: { fontSize: 14, color: '#334155', lineHeight: 20 },
});

export default MedicineDetail;
