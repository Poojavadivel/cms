/**
 * Report Detail View
 * Displays full details of a pathology report
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ReportDetail = ({ route, navigation }) => {
    const { report } = route.params;

    const handleDownload = () => {
        if (report.fileUrl) {
            Linking.openURL(report.fileUrl).catch(err => {
                console.error('Failed to open URL:', err);
                Alert.alert('Error', 'Could not open the file.');
            });
        } else {
            Alert.alert('Info', 'This is a demo. In a real app, this would download the PDF report.');
        }
    };

    const getStatusColor = (s) => {
        switch (s?.toLowerCase()) {
            case 'completed': return { bg: '#DCFCE7', text: '#16A34A' };
            case 'pending': return { bg: '#FEF3C7', text: '#D97706' };
            case 'in-progress': return { bg: '#DBEAFE', text: '#2563EB' };
            default: return { bg: '#F1F5F9', text: '#64748B' };
        }
    };

    const statusColor = getStatusColor(report.status);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report Details</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Main Info Card */}
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={styles.iconBox}>
                            <MaterialIcons name="biotech" size={32} color="#8B5CF6" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.testName}>{report.testName || 'Unknown Test'}</Text>
                            <Text style={styles.testType}>{report.testType || 'General Pathology'}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
                            <Text style={[styles.badgeText, { color: statusColor.text }]}>{report.status || 'Pending'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <View style={styles.infoItem}>
                            <Text style={styles.label}>Patient</Text>
                            <Text style={styles.value}>{report.patientName || 'Unknown'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.label}>Date</Text>
                            <Text style={styles.value}>{report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={[styles.row, { marginTop: 16 }]}>
                        <View style={styles.infoItem}>
                            <Text style={styles.label}>Doctor</Text>
                            <Text style={styles.value}>{report.doctorName ? `Dr. ${report.doctorName}` : 'N/A'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.label}>Report ID</Text>
                            <Text style={styles.value}>{report.reportId || report._id?.substring(0, 8) || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Results / Notes */}
                <Text style={styles.sectionTitle}>Results & Findings</Text>
                <View style={styles.card}>
                    {report.remarks || report.notes ? (
                        <Text style={styles.notes}>{report.remarks || report.notes}</Text>
                    ) : (
                        <Text style={styles.emptyText}>No detailed notes available.</Text>
                    )}
                </View>

                {/* File Attachment */}
                <Text style={styles.sectionTitle}>Attachments</Text>
                <TouchableOpacity style={styles.fileCard} onPress={handleDownload}>
                    <View style={styles.fileIcon}>
                        <MaterialIcons name="picture-as-pdf" size={24} color="#EF4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fileName}>Lab_Report_Final.pdf</Text>
                        <Text style={styles.fileSize}>2.5 MB • PDF</Text>
                    </View>
                    <MaterialIcons name="download" size={24} color="#64748B" />
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginTop: 30 },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    content: { flex: 1, padding: 16 },
    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' },
    testName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    testType: { fontSize: 13, color: '#64748B' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    infoItem: { flex: 1 },
    label: { fontSize: 12, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    value: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12, marginLeft: 4 },
    notes: { fontSize: 14, color: '#334155', lineHeight: 22 },
    emptyText: { fontSize: 14, color: '#94A3B8', fontStyle: 'italic' },
    fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
    fileIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
    fileName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    fileSize: { fontSize: 12, color: '#64748B' },
});

export default ReportDetail;
