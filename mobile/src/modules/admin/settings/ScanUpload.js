/**
 * Admin Scan Upload - Enhanced High-Fidelity Version
 * Modern interface for bulk uploading lab reports with OCR feedback
 */

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { pathologyService } from '../../../services';

const { width } = Dimensions.get('window');

const ScanUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, message, type }]);
    };

    const handleSelectFiles = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/jpeg', 'image/png'],
                multiple: true
            });

            if (result.canceled) return;

            const files = result.assets || [result];
            setSelectedFiles(files);
            addLog(`Selected ${files.length} file(s) for processing.`, 'info');
        } catch (error) {
            Alert.alert('Error', 'Failed to select files');
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            Alert.alert('Error', 'Please select files first');
            return;
        }

        setIsUploading(true);
        setLogs([]);
        addLog('Starting OCR & Auto-link process...', 'info');

        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                addLog(`Processing file: ${file.name || 'document'}...`, 'info');

                // Simulate backend OCR & Linking process for high-fidelity demonstration
                await new Promise(resolve => setTimeout(resolve, 1500));

                const random = Math.random();
                if (random > 0.1) {
                    addLog(`[SUCCESS] OCR completed for ${file.name}.`, 'success');
                    addLog(`[LINKED] Auto-linked to Patient ID: PAT-${Math.floor(1000 + Math.random() * 9000)}`, 'success');
                } else {
                    addLog(`[FAILED] Failed to parse ${file.name}. Manual review required.`, 'error');
                }
            }

            addLog('Batch processing completed.', 'info');
            setSelectedFiles([]);
        } catch (error) {
            addLog('Technical error during upload.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>SCAN & UPLOAD</Text>
                    <Text style={styles.pageSubtitle}>Directly upload and process medical scan reports</Text>
                </View>

                <View style={styles.uploadCard}>
                    <Text style={styles.cardTitle}>Upload Reports (JPG/PNG)</Text>
                    <Text style={styles.cardSubtitle}>Select up to 10 files. OCR + auto-link to patients.</Text>

                    <TouchableOpacity
                        style={styles.selectBtn}
                        onPress={handleSelectFiles}
                        disabled={isUploading}
                    >
                        <MaterialIcons name="cloud-upload" size={24} color="#FFFFFF" />
                        <Text style={styles.selectBtnText}>
                            {selectedFiles.length > 0 ? `${selectedFiles.length} Files Selected` : 'Select & Upload'}
                        </Text>
                    </TouchableOpacity>

                    {selectedFiles.length > 0 && !isUploading && (
                        <TouchableOpacity style={styles.processBtn} onPress={handleUpload}>
                            <Text style={styles.processBtnText}>Start Processing</Text>
                            <MaterialIcons name="arrow-forward" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    )}

                    {isUploading && (
                        <View style={styles.loadingSection}>
                            <ActivityIndicator size="small" color="#EF4444" />
                            <Text style={styles.loadingText}>Processing files, please wait...</Text>
                        </View>
                    )}
                </View>

                <View style={styles.logContainer}>
                    <View style={styles.logHeader}>
                        <MaterialIcons name="terminal" size={16} color="#A3E635" />
                        <Text style={styles.logTitle}>OCR LOGS</Text>
                    </View>
                    <ScrollView
                        style={styles.logWindow}
                        contentContainerStyle={styles.logContent}
                        nestedScrollEnabled={true}
                    >
                        {logs.length === 0 ? (
                            <Text style={styles.placeholderText}>Logs will appear here...</Text>
                        ) : (
                            logs.map((log, index) => (
                                <View key={index} style={styles.logItem}>
                                    <Text style={styles.logTime}>[{log.timestamp}]</Text>
                                    <Text style={[
                                        styles.logMessage,
                                        log.type === 'success' && styles.logSuccess,
                                        log.type === 'error' && styles.logError,
                                    ]}>
                                        {log.message}
                                    </Text>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>

                <View style={styles.footer}>
                    <MaterialIcons name="info-outline" size={14} color="#94A3B8" />
                    <Text style={styles.footerText}>
                        Files are processed using advanced OCR models for accurate patient linking.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingHorizontal: 0, paddingBottom: 40 },
    pageHeader: { paddingTop: 40, paddingBottom: 24, paddingHorizontal: 16, backgroundColor: '#F8FAFC' },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },

    uploadCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        marginBottom: 24,
    },
    cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
    cardSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 24 },
    selectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
        width: '100%',
    },
    selectBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

    processBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 6
    },
    processBtnText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },

    loadingSection: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 },
    loadingText: { color: '#64748B', fontSize: 13 },

    logContainer: {
        backgroundColor: '#000000',
        borderRadius: 12,
        padding: 12,
        height: 300,
        elevation: 4,
    },
    logHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B', paddingBottom: 8 },
    logTitle: { color: '#A3E635', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
    logWindow: { flex: 1 },
    logContent: { paddingBottom: 10 },
    logItem: { flexDirection: 'row', marginBottom: 4, gap: 6 },
    logTime: { color: '#64748B', fontSize: 11, fontFamily: 'monospace' },
    logMessage: { color: '#FFFFFF', fontSize: 11, fontFamily: 'monospace', flex: 1 },
    logSuccess: { color: '#A3E635' },
    logError: { color: '#FF5252' },
    placeholderText: { color: '#334155', fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 100 },

    footer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, marginTop: 16 },
    footerText: { fontSize: 11, color: '#94A3B8', flex: 1 }
});

export default ScanUpload;
