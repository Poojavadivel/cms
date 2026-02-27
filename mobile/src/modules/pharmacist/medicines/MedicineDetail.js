/**
 * MedicineDetail.js
 * Detailed view of a Medicine item
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
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

    const DetailRow = ({ icon, label, value, isMonospace }) => (
        <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={20} color="#64748B" />
            </View>
            <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={[styles.detailValue, isMonospace && styles.monospace]}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

    const getStockColor = (qty) => {
        if (!qty || qty === 0) return { bg: '#FEE2E2', text: '#DC2626' }; // Out of stock
        if (qty < 20) return { bg: '#FEF3C7', text: '#D97706' }; // Low stock
        return { bg: '#DCFCE7', text: '#16A34A' }; // In stock
    };

    const stockStatus = getStockColor(medicine.quantity);

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
                {/* Banner / Main Info */}
                <View style={styles.banner}>
                    <View style={styles.medicineIcon}>
                        <MaterialIcons name="medication" size={40} color="#3B82F6" />
                    </View>
                    <Text style={styles.name}>{medicine.name}</Text>
                    <Text style={styles.manufacturer}>{medicine.manufacturer}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: '#DBEAFE' }]}>
                        <Text style={[styles.categoryText, { color: '#3B82F6' }]}>{medicine.category}</Text>
                    </View>
                </View>

                {/* Status Bar */}
                <View style={[styles.statusBar, { backgroundColor: stockStatus.bg }]}>
                    <Text style={[styles.statusText, { color: stockStatus.text }]}>
                        Stock Status: {medicine.quantity > 0 ? `${medicine.quantity} ${medicine.unit || 'units'}` : 'Out of Stock'}
                    </Text>
                </View>

                {/* Basic Info */}
                <DetailSection title="Product Information">
                    <DetailRow icon="description" label="Description" value={medicine.description} />
                    <DetailRow icon="qr-code" label="Batch Number" value={medicine.batchNumber} isMonospace />
                    <DetailRow icon="event" label="Expiry Date" value={medicine.expiryDate} isMonospace />
                </DetailSection>

                {/* Pricing */}
                <DetailSection title="Pricing">
                    <DetailRow icon="attach-money" label="Selling Price" value={`$${medicine.price}`} />
                    <DetailRow icon="local-offer" label="MRP" value={`$${medicine.mrp || medicine.price}`} />
                </DetailSection>

                {/* Medical Info */}
                <DetailSection title="Medical Details">
                    <DetailRow icon="science" label="Dosage Info" value={medicine.dosage} />
                    <DetailRow icon="warning" label="Side Effects" value={medicine.sideEffects} />
                    <DetailRow icon="block" label="Contraindications" value={medicine.contraindications} />
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
        borderBottomWidth: 1, borderBottomColor: '#E2E8F0'
    },
    medicineIcon: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: '#EFF6FF',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16
    },
    name: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 4, textAlign: 'center' },
    manufacturer: { fontSize: 14, color: '#64748B', marginBottom: 12, textAlign: 'center' },
    categoryBadge: {
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16,
    },
    categoryText: { fontSize: 12, fontWeight: '600' },

    statusBar: { padding: 12, alignItems: 'center', justifyContent: 'center' },
    statusText: { fontWeight: '600', fontSize: 13 },

    section: { marginTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0' },
    sectionTitle: {
        fontSize: 14, fontWeight: '700', color: '#475569',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F8FAFC',
        borderBottomWidth: 1, borderBottomColor: '#E2E8F0', textTransform: 'uppercase'
    },
    sectionContent: { paddingLeft: 16 },
    detailRow: {
        flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, paddingRight: 16,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    iconContainer: { width: 32, alignItems: 'center', marginRight: 8, marginTop: 1 },
    detailInfo: { flex: 1 },
    detailLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
    detailValue: { fontSize: 15, color: '#1E293B', lineHeight: 22 },
    monospace: { fontFamily: 'msgothic' }, // Fallback if monospace font not available
});

export default MedicineDetail;
