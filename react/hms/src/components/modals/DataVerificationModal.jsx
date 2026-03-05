import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdClose,
  MdCheckCircle,
  MdCancel,
  MdDelete,
  MdEdit,
  MdSave,
  MdInfo,
  MdWarning,
  MdDownload,
  MdSearch,
  MdFilterList
} from 'react-icons/md';
import { FiLoader, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import './DataVerificationModal.css';
import '../verification/EnterpriseVerificationWorkspace.css';

// Use the same pattern as other services - API_BASE_URL already includes /api
const API_BASE_URL = process.env.REACT_APP_API_URL ||
  ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000/api'
    : 'https://hms-dev.onrender.com/api');

const DataVerificationModal = ({ isOpen, onClose, verificationId, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Enterprise features state
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAbnormal, setShowOnlyAbnormal] = useState(false);
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [verifiedFields, setVerifiedFields] = useState(new Set());

  useEffect(() => {
    if (isOpen && verificationId) {
      fetchVerificationData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, verificationId]);

  const fetchVerificationData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token');
      const response = await axios.get(
        `${API_BASE_URL}/scanner-enterprise/verification/${verificationId}`,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (response.data.success) {
        setVerificationData(response.data.verification);
      }
    } catch (error) {
      console.error('Error fetching verification data:', error);
      alert('Failed to load verification data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index, currentValue) => {
    setEditingIndex(index);
    // Convert object to readable format for editing
    if (typeof currentValue === 'object') {
      setEditValue(JSON.stringify(currentValue, null, 2));
    } else {
      setEditValue(currentValue?.toString() || '');
    }
  };

  const handleSaveEdit = async (index) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token');
      
      // Parse JSON if it's an object
      let valueToSave = editValue;
      const row = verificationData.dataRows[index];
      
      if (row.dataType === 'object') {
        try {
          valueToSave = JSON.parse(editValue);
        } catch (e) {
          alert('Invalid JSON format');
          return;
        }
      } else if (row.dataType === 'number') {
        valueToSave = parseFloat(editValue);
      }

      const response = await axios.put(
        `${API_BASE_URL}/scanner-enterprise/verification/${verificationId}/row/${index}`,
        { currentValue: valueToSave },
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Update local state
        const updatedData = { ...verificationData };
        updatedData.dataRows[index] = response.data.row;
        setVerificationData(updatedData);
        setEditingIndex(null);
        setEditValue('');
        // Mark as verified
        setVerifiedFields(prev => new Set([...prev, index]));
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes');
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Are you sure you want to delete this row?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token');
      
      const response = await axios.delete(
        `${API_BASE_URL}/scanner-enterprise/verification/${verificationId}/row/${index}`,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (response.data.success) {
        // Update local state
        const updatedData = { ...verificationData };
        updatedData.dataRows[index].isDeleted = true;
        setVerificationData(updatedData);
      }
    } catch (error) {
      console.error('Error deleting row:', error);
      alert('Failed to delete row');
    }
  };

  const handleConfirm = async () => {
    if (!window.confirm('Confirm and save this data to the patient record?')) {
      return;
    }

    setConfirming(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token');
      
      const response = await axios.post(
        `${API_BASE_URL}/scanner-enterprise/verification/${verificationId}/confirm`,
        {},
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (response.data.success) {
        alert('Data verified and saved successfully!');
        if (onConfirm) onConfirm(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error confirming verification:', error);
      alert('Failed to confirm verification: ' + (error.response?.data?.message || error.message));
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Reject and discard this scanned data?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token');
      
      const response = await axios.post(
        `${API_BASE_URL}/scanner-enterprise/verification/${verificationId}/reject`,
        {},
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (response.data.success) {
        alert('Verification rejected');
        onClose();
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert('Failed to reject verification');
    }
  };

  const handleDownloadData = () => {
    if (!verificationData) return;

    // Prepare data for download
    const exportData = {
      fileName: verificationData.fileName,
      documentType: verificationData.documentType,
      extractedDate: new Date().toISOString(),
      patientId: verificationData.patientId,
      sections: [],
      data: {}
    };

    // Check if section-based processing
    const isSectionBased = verificationData.metadata?.sectionCount > 0;

    if (isSectionBased) {
      // Group data by sections
      const sectionMap = {};
      
      verificationData.dataRows.forEach(row => {
        if (row.dataType === 'section_header') {
          const sectionKey = `section_${row.sectionIndex}`;
          if (!sectionMap[sectionKey]) {
            sectionMap[sectionKey] = {
              sectionIndex: row.sectionIndex,
              heading: row.currentValue,
              sectionType: row.sectionType,
              schemaType: row.schemaType,
              fields: []
            };
          }
        } else if (!row.isDeleted) {
          const sectionKey = `section_${row.sectionIndex || 0}`;
          if (!sectionMap[sectionKey]) {
            sectionMap[sectionKey] = {
              sectionIndex: row.sectionIndex || 0,
              heading: row.sectionHeading || 'Main',
              sectionType: row.sectionType || 'GENERAL',
              fields: []
            };
          }
          sectionMap[sectionKey].fields.push({
            field: row.fieldName,
            label: row.displayLabel,
            value: row.currentValue,
            category: row.category,
            confidence: row.confidence
          });
        }
      });

      exportData.sections = Object.values(sectionMap);
      exportData.processingType = 'section-level';
    } else {
      // Standard single-document processing
      verificationData.dataRows.forEach(row => {
        if (!row.isDeleted) {
          exportData.data[row.fieldName] = {
            label: row.displayLabel,
            value: row.currentValue,
            category: row.category,
            confidence: row.confidence
          };
        }
      });
      exportData.processingType = 'document-level';
    }

    exportData.metadata = {
      ocrEngine: verificationData.metadata?.ocrEngine,
      ocrConfidence: verificationData.metadata?.ocrConfidence,
      processingTimeMs: verificationData.metadata?.processingTimeMs,
      sectionCount: verificationData.metadata?.sectionCount || 0,
      exportedAt: new Date().toISOString()
    };

    // Create JSON file
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_data_${verificationData.documentType}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper functions - defined before useMemo
  const getSectionIcon = (sectionType) => {
    const icons = {
      'BILLING': '💰',
      'VITALS': '❤️',
      'LAB_REPORT': '🔬',
      'PRESCRIPTION': '💊',
      'MEDICAL_HISTORY': '📋',
      'PATIENT_DETAILS': '👤',
      'DIAGNOSIS': '🩺',
      'GENERAL': '📄'
    };
    return icons[sectionType] || '📄';
  };

  const getStatusColor = (value, fieldName) => {
    // For lab results, determine if value is normal/high/low
    const fieldLower = fieldName?.toLowerCase() || '';
    
    if (fieldLower.includes('status')) {
      if (typeof value === 'string') {
        const val = value.toLowerCase();
        if (val.includes('normal')) return '#10b981'; // Green
        if (val.includes('high') || val.includes('elevated')) return '#ef4444'; // Red
        if (val.includes('low')) return '#f59e0b'; // Orange
      }
    }
    
    return null;
  };

  // Parse prescription data for better display
  const parsePrescriptionRow = (row) => {
    // If value is an object with medicine details
    if (row.dataType === 'object' && row.currentValue) {
      const val = row.currentValue;
      return {
        medicine: val.medicine || val.name || val.drug || row.displayLabel,
        dosage: val.dosage || val.dose || val.strength || 'N/A',
        frequency: val.frequency || val.timing || 'N/A',
        duration: val.duration || val.days || 'N/A',
        instructions: val.instructions || val.notes || val.remarks || 'N/A'
      };
    }
    
    // Try to parse from displayLabel and value
    return {
      medicine: row.displayLabel || 'Unknown',
      dosage: row.currentValue?.dosage || row.currentValue?.dose || 'N/A',
      frequency: row.currentValue?.frequency || 'N/A',
      duration: row.currentValue?.duration || 'N/A',
      instructions: row.currentValue?.instructions || 'N/A'
    };
  };

  // Parse vitals data for better display
  const parseVitalsRow = (row) => {
    const fieldName = row.displayLabel || row.fieldName || '';
    let value = row.currentValue;
    let unit = '';
    let status = 'Normal';
    let statusColor = '#10b981'; // Green
    
    // Extract unit and value
    if (typeof value === 'object') {
      unit = value.unit || '';
      value = value.value || value.reading || value.measurement || JSON.stringify(value);
      status = value.status || 'Normal';
    } else if (typeof value === 'string') {
      // Try to extract unit from value (e.g., "120/80 mmHg" → value: "120/80", unit: "mmHg")
      const match = value.match(/^([\d./]+)\s*(.*)$/);
      if (match) {
        value = match[1];
        unit = match[2];
      }
    }
    
    // Determine status based on vital type and value
    const lowerField = fieldName.toLowerCase();
    
    if (lowerField.includes('bp') || lowerField.includes('blood pressure')) {
      const parts = value.toString().split('/');
      if (parts.length === 2) {
        const systolic = parseInt(parts[0]);
        const diastolic = parseInt(parts[1]);
        if (systolic > 140 || diastolic > 90) {
          status = 'High';
          statusColor = '#ef4444';
        } else if (systolic < 90 || diastolic < 60) {
          status = 'Low';
          statusColor = '#f59e0b';
        }
      }
    } else if (lowerField.includes('spo2') || lowerField.includes('oxygen')) {
      const spo2 = parseFloat(value);
      if (spo2 < 90) {
        status = 'Low';
        statusColor = '#ef4444';
      } else if (spo2 < 95) {
        status = 'Below Normal';
        statusColor = '#f59e0b';
      }
    } else if (lowerField.includes('pulse') || lowerField.includes('heart rate')) {
      const pulse = parseFloat(value);
      if (pulse > 100) {
        status = 'High';
        statusColor = '#ef4444';
      } else if (pulse < 60) {
        status = 'Low';
        statusColor = '#f59e0b';
      }
    } else if (lowerField.includes('temp')) {
      const temp = parseFloat(value);
      if (temp > 37.5) {
        status = 'High (Fever)';
        statusColor = '#ef4444';
      } else if (temp < 36) {
        status = 'Low';
        statusColor = '#f59e0b';
      }
    } else if (lowerField.includes('respiratory') || lowerField.includes('breathing')) {
      const rr = parseFloat(value);
      if (rr > 20) {
        status = 'High';
        statusColor = '#ef4444';
      } else if (rr < 12) {
        status = 'Low';
        statusColor = '#f59e0b';
      }
    }
    
    return {
      parameter: fieldName,
      value: value,
      unit: unit,
      status: status,
      statusColor: statusColor
    };
  };

  // Group data rows by section for tab-based display
  const groupedSections = useMemo(() => {
    if (!verificationData) return [];
    
    const sections = [];
    let currentSection = null;
    
    verificationData.dataRows.forEach((row, index) => {
      if (row.dataType === 'section_header') {
        // New section detected
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          sectionIndex: row.sectionIndex,
          heading: row.displayLabel || row.currentValue,
          sectionType: row.sectionType,
          schemaType: row.schemaType,
          rows: [],
          icon: getSectionIcon(row.sectionType)
        };
      } else {
        // Add row to current section
        if (!currentSection) {
          // Create default section for rows without section header
          currentSection = {
            sectionIndex: 0,
            heading: 'General Information',
            sectionType: 'GENERAL',
            schemaType: 'GENERAL',
            rows: [],
            icon: '📋'
          };
        }
        currentSection.rows.push({ ...row, originalIndex: index });
      }
    });
    
    // Push last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }, [verificationData]);

  // Check if row is abnormal
  const isAbnormal = (row) => {
    const value = row.currentValue?.toString().toLowerCase() || '';
    return value.includes('high') || value.includes('low') || 
           value.includes('abnormal') || value.includes('critical');
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!verificationData) return null;
    
    const allRows = verificationData.dataRows.filter(r => r.dataType !== 'section_header');
    const abnormalRows = allRows.filter(r => isAbnormal(r));
    const lowConfRows = allRows.filter(r => r.confidence < 0.8);
    
    return {
      totalFields: allRows.length,
      sectionsDetected: groupedSections.length,
      abnormalFields: abnormalRows.length,
      lowConfidenceFields: lowConfRows.length,
      verifiedFields: verifiedFields.size,
      progress: allRows.length > 0 ? (verifiedFields.size / allRows.length) * 100 : 0
    };
  }, [verificationData, groupedSections, verifiedFields]);

  // Filter rows based on search and filters
  const filteredRows = useMemo(() => {
    if (!groupedSections[activeTab]) return [];
    
    let rows = [...groupedSections[activeTab].rows];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      rows = rows.filter(r => 
        r.displayLabel?.toLowerCase().includes(query) ||
        r.currentValue?.toString().toLowerCase().includes(query)
      );
    }
    
    // Abnormal filter
    if (showOnlyAbnormal) {
      rows = rows.filter(r => isAbnormal(r));
    }
    
    // Low confidence filter
    if (showLowConfidence) {
      rows = rows.filter(r => r.confidence < 0.8);
    }
    
    return rows;
  }, [groupedSections, activeTab, searchQuery, showOnlyAbnormal, showLowConfidence]);

  // Bulk action handlers
  const handleRowSelect = (index, checked) => {
    const next = new Set(selectedRows);
    if (checked) {
      next.add(index);
    } else {
      next.delete(index);
    }
    setSelectedRows(next);
  };

  const handleBulkApprove = () => {
    setVerifiedFields(prev => new Set([...prev, ...selectedRows]));
    setSelectedRows(new Set());
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedRows.size} selected rows?`)) return;
    
    const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token');
    
    for (const rowIndex of selectedRows) {
      try {
        await axios.delete(
          `${API_BASE_URL}/scanner-enterprise/verification/${verificationId}/row/${rowIndex}`,
          { headers: { 'x-auth-token': token } }
        );
      } catch (error) {
        console.error(`Failed to delete row ${rowIndex}:`, error);
      }
    }
    
    fetchVerificationData();
    setSelectedRows(new Set());
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="verification-modal-overlay">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="verification-modal"
          >
            {/* Header */}
            <div className="verification-modal-header">
              <div className="header-content">
                <MdInfo className="header-icon" />
                <div>
                  <h2 className="header-title">Verify Extracted Data</h2>
                  <p className="header-subtitle">
                    {verificationData?.fileName} • {verificationData?.documentType}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="close-button">
                <MdClose />
              </button>
            </div>

            {/* Content */}
            <div className="verification-modal-content">
              {loading ? (
                <div className="loading-container">
                  <FiLoader className="spinner" />
                  <p>Loading verification data...</p>
                </div>
              ) : verificationData ? (
                <>
                  {/* Info Banner with Summary Stats */}
                  <div className="info-banner">
                    <MdWarning className="info-icon" />
                    <div className="info-text">
                      <p>Review the extracted data below. Use filters to focus on issues, bulk actions for efficiency.</p>
                      <p className="info-subtext">
                        Confidence: {(verificationData.metadata?.ocrConfidence * 100).toFixed(1)}% • 
                        {verificationData.metadata?.sectionCount > 0 && (
                          <span> Sections: {verificationData.metadata.sectionCount} • </span>
                        )}
                        Expires: {new Date(verificationData.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Summary Stats */}
                    {summary && (
                      <div className="summary-panel" style={{ marginLeft: 'auto', marginRight: '12px' }}>
                        <div className="summary-card">
                          <div className="summary-content">
                            <span className="summary-value">{summary.sectionsDetected}</span>
                            <span className="summary-label">Sections</span>
                          </div>
                        </div>
                        {summary.abnormalFields > 0 && (
                          <div className="summary-card alert">
                            <div className="summary-icon">⚠️</div>
                            <div className="summary-content">
                              <span className="summary-value">{summary.abnormalFields}</span>
                              <span className="summary-label">Abnormal</span>
                            </div>
                          </div>
                        )}
                        {summary.lowConfidenceFields > 0 && (
                          <div className="summary-card warning">
                            <div className="summary-icon">🔍</div>
                            <div className="summary-content">
                              <span className="summary-value">{summary.lowConfidenceFields}</span>
                              <span className="summary-label">Low Conf</span>
                            </div>
                          </div>
                        )}
                        <div className="summary-card progress">
                          <div className="summary-content">
                            <div className="progress-bar-container">
                              <div 
                                className="progress-bar"
                                style={{ width: `${summary.progress}%` }}
                              />
                            </div>
                            <span className="summary-label">{summary.progress.toFixed(0)}% Verified</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={handleDownloadData}
                      className="download-btn-banner"
                      title="Download extracted data as JSON"
                    >
                      <MdDownload size={20} />
                    </button>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="verification-toolbar">
                    <div className="toolbar-left">
                      <div className="search-box">
                        <MdSearch />
                        <input
                          type="text"
                          placeholder="Search fields..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="toolbar-right">
                      <button 
                        className={`filter-btn ${showOnlyAbnormal ? 'active' : ''}`}
                        onClick={() => setShowOnlyAbnormal(!showOnlyAbnormal)}
                      >
                        <FiAlertCircle /> Abnormal Only
                      </button>
                      <button 
                        className={`filter-btn ${showLowConfidence ? 'active' : ''}`}
                        onClick={() => setShowLowConfidence(!showLowConfidence)}
                      >
                        <MdWarning /> Low Confidence
                      </button>
                      {(searchQuery || showOnlyAbnormal || showLowConfidence) && (
                        <button 
                          className="filter-btn"
                          onClick={() => {
                            setSearchQuery('');
                            setShowOnlyAbnormal(false);
                            setShowLowConfidence(false);
                          }}
                        >
                          <MdFilterList /> Clear Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bulk Actions Bar */}
                  {selectedRows.size > 0 && (
                    <div className="bulk-actions">
                      <span>{selectedRows.size} selected</span>
                      <button onClick={handleBulkApprove} className="bulk-btn approve">
                        <MdCheckCircle /> Approve Selected
                      </button>
                      <button onClick={handleBulkDelete} className="bulk-btn delete">
                        <MdDelete /> Delete Selected
                      </button>
                      <button onClick={() => setSelectedRows(new Set())} className="bulk-btn cancel">
                        <MdCancel /> Clear
                      </button>
                    </div>
                  )}

                  {/* Section Tabs */}
                  {groupedSections.length > 1 && (
                    <div className="verification-tabs">
                      {groupedSections.map((section, idx) => (
                        <button
                          key={idx}
                          className={`verification-tab ${activeTab === idx ? 'active' : ''}`}
                          onClick={() => setActiveTab(idx)}
                        >
                          <span className="tab-icon">{section.icon}</span>
                          <span className="tab-label">{section.heading}</span>
                          <span className="tab-count">{section.rows.length}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Section Table */}
                  {groupedSections.length > 0 && (
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="section-table-container"
                    >
                      <div className="section-header-bar">
                        <h3 className="section-title-large">
                          {groupedSections[activeTab]?.icon} {groupedSections[activeTab]?.heading}
                        </h3>
                        <span className="section-type-badge">
                          {groupedSections[activeTab]?.sectionType}
                        </span>
                      </div>

                      <div className="table-wrapper">
                        {/* Prescription Table - Special Layout */}
                        {groupedSections[activeTab]?.sectionType === 'PRESCRIPTION' ? (
                          <table className="verification-table prescription-table">
                            <thead>
                              <tr>
                                <th style={{ width: '40px' }}><input type="checkbox" onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRows(new Set(filteredRows.map(r => r.originalIndex)));
                                  } else {
                                    setSelectedRows(new Set());
                                  }
                                }} /></th>
                                <th style={{ width: '23%' }}>Medicine</th>
                                <th style={{ width: '14%' }}>Dosage</th>
                                <th style={{ width: '14%' }}>Frequency</th>
                                <th style={{ width: '11%' }}>Duration</th>
                                <th style={{ width: '18%' }}>Instructions</th>
                                <th style={{ width: '13%' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredRows.map((row) => {
                                const med = parsePrescriptionRow(row);
                                return (
                                  <tr 
                                    key={row.originalIndex}
                                    className={`
                                      ${row.isDeleted ? 'deleted-row' : ''} 
                                      ${row.isModified ? 'modified-row' : ''}
                                      ${selectedRows.has(row.originalIndex) ? 'selected-row' : ''}
                                      ${verifiedFields.has(row.originalIndex) ? 'verified-row' : ''}
                                    `}
                                  >
                                    <td>
                                      <input
                                        type="checkbox"
                                        checked={selectedRows.has(row.originalIndex)}
                                        onChange={(e) => handleRowSelect(row.originalIndex, e.target.checked)}
                                      />
                                    </td>
                                    <td>
                                      <div className="medicine-name">
                                        💊 <strong>{med.medicine}</strong>
                                        {row.isModified && <span className="modified-badge-small">✏️</span>}
                                        {verifiedFields.has(row.originalIndex) && <span style={{ color: '#10b981', marginLeft: '4px' }}>✓</span>}
                                      </div>
                                    </td>
                                    <td>
                                      {editingIndex === row.originalIndex ? (
                                        <input
                                          type="text"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="edit-input-inline"
                                          autoFocus
                                        />
                                      ) : (
                                        <span className="dosage-value">{med.dosage}</span>
                                      )}
                                    </td>
                                    <td><span className="frequency-value">{med.frequency}</span></td>
                                    <td><span className="duration-value">{med.duration}</span></td>
                                    <td><span className="instructions-value">{med.instructions}</span></td>
                                    <td>
                                      {editingIndex === row.originalIndex ? (
                                        <div className="action-buttons-inline">
                                          <button onClick={() => handleSaveEdit(row.originalIndex)} className="action-btn-table save-btn-table" title="Save">
                                            <MdSave />
                                          </button>
                                          <button onClick={() => { setEditingIndex(null); setEditValue(''); }} className="action-btn-table cancel-btn-table" title="Cancel">
                                            <MdCancel />
                                          </button>
                                        </div>
                                      ) : !row.isDeleted ? (
                                        <div className="action-buttons-inline">
                                          <button onClick={() => handleEdit(row.originalIndex, row.currentValue)} className="action-btn-table edit-btn-table" title="Edit">
                                            <MdEdit />
                                          </button>
                                          <button onClick={() => handleDelete(row.originalIndex)} className="action-btn-table delete-btn-table" title="Delete">
                                            <MdDelete />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="deleted-text">Deleted</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : groupedSections[activeTab]?.sectionType === 'VITALS' ? (
                          /* Vitals Table - Special Layout */
                          <table className="verification-table vitals-table">
                            <thead>
                              <tr>
                                <th style={{ width: '40px' }}><input type="checkbox" onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRows(new Set(filteredRows.map(r => r.originalIndex)));
                                  } else {
                                    setSelectedRows(new Set());
                                  }
                                }} /></th>
                                <th style={{ width: '28%' }}>Parameter</th>
                                <th style={{ width: '18%' }}>Value</th>
                                <th style={{ width: '10%' }}>Unit</th>
                                <th style={{ width: '16%' }}>Status</th>
                                <th style={{ width: '18%' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredRows.map((row) => {
                                const vital = parseVitalsRow(row);
                                return (
                                  <tr 
                                    key={row.originalIndex}
                                    className={`
                                      ${row.isDeleted ? 'deleted-row' : ''} 
                                      ${row.isModified ? 'modified-row' : ''}
                                      ${selectedRows.has(row.originalIndex) ? 'selected-row' : ''}
                                      ${verifiedFields.has(row.originalIndex) ? 'verified-row' : ''}
                                    `}
                                  >
                                    <td>
                                      <input
                                        type="checkbox"
                                        checked={selectedRows.has(row.originalIndex)}
                                        onChange={(e) => handleRowSelect(row.originalIndex, e.target.checked)}
                                      />
                                    </td>
                                    <td>
                                      <div className="vital-parameter">
                                        <strong>{vital.parameter}</strong>
                                        {row.isModified && <span className="modified-badge-small">✏️</span>}
                                        {verifiedFields.has(row.originalIndex) && <span style={{ color: '#10b981', marginLeft: '4px' }}>✓</span>}
                                      </div>
                                    </td>
                                    <td>
                                      {editingIndex === row.originalIndex ? (
                                        <input
                                          type="text"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="edit-input-inline"
                                          autoFocus
                                        />
                                      ) : (
                                        <span className="vital-value">{vital.value}</span>
                                      )}
                                    </td>
                                    <td><span className="vital-unit">{vital.unit}</span></td>
                                    <td>
                                      <span 
                                        className="vital-status"
                                        style={{ 
                                          color: vital.statusColor,
                                          fontWeight: '700'
                                        }}
                                      >
                                        {vital.status === 'Normal' ? '✅' : vital.status === 'High' ? '⚠️' : '🟠'} {vital.status}
                                      </span>
                                    </td>
                                    <td>
                                      {editingIndex === row.originalIndex ? (
                                        <div className="action-buttons-inline">
                                          <button onClick={() => handleSaveEdit(row.originalIndex)} className="action-btn-table save-btn-table" title="Save">
                                            <MdSave />
                                          </button>
                                          <button onClick={() => { setEditingIndex(null); setEditValue(''); }} className="action-btn-table cancel-btn-table" title="Cancel">
                                            <MdCancel />
                                          </button>
                                        </div>
                                      ) : !row.isDeleted ? (
                                        <div className="action-buttons-inline">
                                          <button onClick={() => handleEdit(row.originalIndex, row.currentValue)} className="action-btn-table edit-btn-table" title="Edit">
                                            <MdEdit />
                                          </button>
                                          <button onClick={() => handleDelete(row.originalIndex)} className="action-btn-table delete-btn-table" title="Delete">
                                            <MdDelete />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="deleted-text">Deleted</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          /* Default Table - For Lab Reports, Billing, etc. */
                        <table className="verification-table">
                            <thead>
                              <tr>
                                <th style={{ width: '40px' }}><input type="checkbox" onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRows(new Set(filteredRows.map(r => r.originalIndex)));
                                  } else {
                                    setSelectedRows(new Set());
                                  }
                                }} /></th>
                                <th style={{ width: '33%' }}>Field</th>
                                <th style={{ width: '38%' }}>Value</th>
                                <th style={{ width: '12%' }}>Confidence</th>
                                <th style={{ width: '13%' }}>Actions</th>
                              </tr>
                            </thead>
                          <tbody>
                            {filteredRows.map((row) => (
                              <tr 
                                key={row.originalIndex}
                                className={`
                                  ${row.isDeleted ? 'deleted-row' : ''} 
                                  ${row.isModified ? 'modified-row' : ''}
                                  ${selectedRows.has(row.originalIndex) ? 'selected-row' : ''}
                                  ${verifiedFields.has(row.originalIndex) ? 'verified-row' : ''}
                                `}
                              >
                                {/* Checkbox */}
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedRows.has(row.originalIndex)}
                                    onChange={(e) => handleRowSelect(row.originalIndex, e.target.checked)}
                                  />
                                </td>
                                
                                {/* Field Name */}
                                <td>
                                  <div className="field-cell">
                                    <strong className="field-label">{row.displayLabel}</strong>
                                    {row.isModified && (
                                      <span className="modified-badge-small">✏️ Modified</span>
                                    )}
                                    {verifiedFields.has(row.originalIndex) && (
                                      <span style={{ color: '#10b981', marginLeft: '4px' }}>✓</span>
                                    )}
                                  </div>
                                </td>

                                {/* Value - Editable */}
                                <td>
                                  {editingIndex === row.originalIndex ? (
                                    <div className="edit-inline">
                                      {row.dataType === 'object' ? (
                                        <textarea
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="edit-textarea-inline"
                                          rows={3}
                                          autoFocus
                                        />
                                      ) : (
                                        <input
                                          type={row.dataType === 'number' ? 'number' : 'text'}
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="edit-input-inline"
                                          autoFocus
                                        />
                                      )}
                                    </div>
                                  ) : (
                                    <div 
                                      className="value-cell"
                                      style={{
                                        color: getStatusColor(row.currentValue, row.fieldName) || '#334155',
                                        fontWeight: getStatusColor(row.currentValue, row.fieldName) ? '600' : '500'
                                      }}
                                    >
                                      {row.dataType === 'object' ? (
                                        <pre className="value-object-compact">
                                          {JSON.stringify(row.currentValue, null, 2)}
                                        </pre>
                                      ) : (
                                        row.currentValue?.toString() || 'N/A'
                                      )}
                                      {row.isDeleted && (
                                        <span className="deleted-badge-inline">🗑️ Deleted</span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Confidence */}
                                <td>
                                  <div className="confidence-cell">
                                    <div 
                                      className="confidence-bar"
                                      style={{
                                        width: `${(row.confidence || 0) * 100}%`,
                                        backgroundColor: 
                                          row.confidence >= 0.9 ? '#10b981' :
                                          row.confidence >= 0.7 ? '#f59e0b' : '#ef4444'
                                      }}
                                    />
                                    <span className="confidence-text">
                                      {((row.confidence || 0) * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </td>

                                {/* Actions */}
                                <td>
                                  {editingIndex === row.originalIndex ? (
                                    <div className="action-buttons-inline">
                                      <button
                                        onClick={() => handleSaveEdit(row.originalIndex)}
                                        className="action-btn-table save-btn-table"
                                        title="Save"
                                      >
                                        <MdSave />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingIndex(null);
                                          setEditValue('');
                                        }}
                                        className="action-btn-table cancel-btn-table"
                                        title="Cancel"
                                      >
                                        <MdCancel />
                                      </button>
                                    </div>
                                  ) : !row.isDeleted ? (
                                    <div className="action-buttons-inline">
                                      <button
                                        onClick={() => handleEdit(row.originalIndex, row.currentValue)}
                                        className="action-btn-table edit-btn-table"
                                        title="Edit"
                                      >
                                        <MdEdit />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(row.originalIndex)}
                                        className="action-btn-table delete-btn-table"
                                        title="Delete"
                                      >
                                        <MdDelete />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="deleted-text">Deleted</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        )}
                      </div>

                      {/* Section Summary */}
                      <div className="section-summary">
                        <span className="summary-item">
                          Total: {groupedSections[activeTab]?.rows.length}
                        </span>
                        <span className="summary-item">
                          Active: {groupedSections[activeTab]?.rows.filter(r => !r.isDeleted).length}
                        </span>
                        <span className="summary-item">
                          Modified: {groupedSections[activeTab]?.rows.filter(r => r.isModified).length}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Stats */}
                  <div className="stats-row">
                    <div className="stat">
                      <span className="stat-label">Total Rows:</span>
                      <span className="stat-value">{verificationData.dataRows.length}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Active:</span>
                      <span className="stat-value">
                        {verificationData.dataRows.filter(r => !r.isDeleted).length}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Deleted:</span>
                      <span className="stat-value">
                        {verificationData.dataRows.filter(r => r.isDeleted).length}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Modified:</span>
                      <span className="stat-value">
                        {verificationData.dataRows.filter(r => r.isModified).length}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="error-container">
                  <MdWarning className="error-icon" />
                  <p>No verification data available</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="verification-modal-footer">
              <button
                onClick={handleReject}
                className="footer-btn reject-btn"
                disabled={confirming || loading}
              >
                <MdCancel /> Reject & Discard
              </button>
              
              <div className="footer-right">
                <button
                  onClick={onClose}
                  className="footer-btn cancel-btn-footer"
                  disabled={confirming}
                >
                  Close
                </button>
                <button
                  onClick={handleConfirm}
                  className="footer-btn confirm-btn"
                  disabled={confirming || loading || !verificationData}
                >
                  {confirming ? (
                    <>
                      <FiLoader className="spinner-small" /> Confirming...
                    </>
                  ) : (
                    <>
                      <MdCheckCircle /> Confirm & Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DataVerificationModal;
