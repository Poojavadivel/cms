/**
 * LabReportForm.js - High-Fidelity Premium Version
 * Enhanced form for creating lab reports with structured results and premium UI.
 */

import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { pathologyService } from '../../../services';

const LabReportForm = ({ route, navigation }) => {
    const { intake } = route.params || {};
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Test Results State
    const [testResults, setTestResults] = useState(
        (intake?.pathologyItems || []).map(test => ({
            testName: test.name || test.testName || '',
            result: '',
            unit: test.unit || '',
            referenceRange: test.referenceRange || '',
            status: 'Normal'
        }))
    );

    const handleResultChange = (index, value) => {
        const newResults = [...testResults];
        newResults[index].result = value;
        setTestResults(newResults);
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });

            if (result.canceled === false) {
                const file = result.assets ? result.assets[0] : result;
                setSelectedFile(file);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleSubmit = async () => {
        if (testResults.length > 0 && testResults.some(r => !r.result)) {
            Alert.alert('Incomplete Results', 'Please enter results for all prescribed tests.');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = {
                intakeId: intake?._id || intake?.id,
                patientId: intake?.patientId,
                patientName: intake?.patientName,
                doctorId: intake?.doctorId,
                doctorName: intake?.doctorName,
                testName: (intake?.pathologyItems || []).map(i => i.name || i.testName).join(', ') || 'General Lab Work',
                testResults: testResults,
                remarks: remarks,
                status: 'Completed'
            };

            await pathologyService.createReport(formData);
            Alert.alert('Success', 'Lab report generated successfully.');
            if (route.params?.onRefresh) route.params.onRefresh();
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message || 'Action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const FormSection = ({ title, icon, children }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                    <MaterialIcons name={icon} size={20} color="#3B82F6" />
                </View>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.sectionBody}>
                {children}
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Enter Lab Results</Text>
                    <Text style={styles.headerSubtitle}>{intake?.patientName || 'New Pathology Entry'}</Text>
                </View>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                <FormSection title="Structured Results" icon="biotech">
                    {testResults.length > 0 ? (
                        testResults.map((result, index) => (
                            <View key={index} style={styles.testCard}>
                                <Text style={styles.testLabel}>{result.testName}</Text>
                                <View style={styles.resultRow}>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.resultInput}
                                            placeholder="Enter Value"
                                            value={result.result}
                                            onChangeText={(val) => handleResultChange(index, val)}
                                            keyboardType="numeric"
                                            placeholderTextColor="#CBD5E1"
                                        />
                                    </View>
                                    <View style={styles.unitBadge}>
                                        <Text style={styles.unitText}>{result.unit || 'units'}</Text>
                                    </View>
                                </View>
                                {result.referenceRange ? (
                                    <View style={styles.refBox}>
                                        <MaterialIcons name="info-outline" size={14} color="#94A3B8" />
                                        <Text style={styles.refText}>Ref Range: {result.referenceRange}</Text>
                                    </View>
                                ) : null}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyTests}>
                            <MaterialIcons name="science" size={32} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No specific tests prescribed. Enter remarks below.</Text>
                        </View>
                    )}
                </FormSection>

                <FormSection title="Attachments & Scans" icon="cloud-upload">
                    <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
                        {selectedFile ? (
                            <View style={styles.fileRow}>
                                <MaterialIcons name="description" size={24} color="#3B82F6" />
                                <View style={{ flex: 1, marginHorizontal: 12 }}>
                                    <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                                    <Text style={styles.fileSize}>{(selectedFile.size / 1024).toFixed(1)} KB</Text>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                                    <MaterialIcons name="cancel" size={24} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <MaterialIcons name="file-upload" size={32} color="#94A3B8" />
                                <Text style={styles.uploadText}>Tap to upload diagnostic files</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </FormSection>

                <FormSection title="Pathologist Observations" icon="rate-review">
                    <View style={styles.inputWrapperMultiline}>
                        <TextInput
                            style={styles.textArea}
                            multiline
                            numberOfLines={4}
                            placeholder="Add clinical observations or findings..."
                            value={remarks}
                            onChangeText={setRemarks}
                            textAlignVertical="top"
                            placeholderTextColor="#CBD5E1"
                        />
                    </View>
                </FormSection>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <MaterialIcons name="send" size={20} color="#FFFFFF" />
                            <Text style={styles.submitText}>Submit Lab Report</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 40 },
    backBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    headerSubtitle: { fontSize: 13, color: '#64748B' },

    body: { flex: 1 },
    bodyContent: { padding: 16, paddingBottom: 40 },

    section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', paddingBottom: 12 },
    sectionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

    testCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    testLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 10, textTransform: 'uppercase' },
    resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    inputWrapper: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 12, height: 44 },
    resultInput: { flex: 1, fontSize: 16, fontWeight: '700', color: '#3B82F6' },
    unitBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', minWidth: 60 },
    unitText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    refBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    refText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },

    uploadBox: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 12, padding: 16 },
    uploadPlaceholder: { alignItems: 'center', gap: 8 },
    uploadText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
    fileRow: { flexDirection: 'row', alignItems: 'center' },
    fileName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    fileSize: { fontSize: 11, color: '#94A3B8' },

    inputWrapperMultiline: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 4 },
    textArea: { padding: 12, fontSize: 14, color: '#1E293B', height: 100 },

    footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    submitBtn: { backgroundColor: '#3B82F6', height: 56, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    emptyTests: { alignItems: 'center', padding: 20 },
    emptyText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' }
});

export default LabReportForm;
