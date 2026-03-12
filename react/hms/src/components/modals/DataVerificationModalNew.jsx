/**
 * DataVerificationModal - Professional Table-Based UI
 * Enterprise-grade verification interface for medical documents
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdClose,
  MdCheckCircle,
  MdCancel,
  MdInfo,
  MdWarning,
  MdDownload,
  MdTrendingUp,
  MdTrendingDown,
  MdCheckCircleOutline
} from 'react-icons/md';
import { FiLoader } from 'react-icons/fi';
import axios from 'axios';
import './DataVerificationModal.css';
import './DataVerificationModalTables.css';

const API_BASE_URL = process.env.REACT_APP_API_URL ||
  ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000/api'
    : 'https://hms-dev.onrender.com/api');

const DataVerificationModal = ({ isOpen, onClose, verificationId, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [startTime] = useState(Date.now());
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    if (isOpen && verificationId) {
      fetchVerificationData();
    }
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

  // Group rows by section and category
  const groupedSections = useMemo(() => {
    if (!verificationData?.dataRows) return [];

    const sections = [];
    let currentSection = null;

    verificationData.dataRows.forEach((row, index) => {
      if (row.dataType === 'section_header') {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          index: row.sectionIndex,
          heading: row.currentValue,
          sectionType: row.sectionType,
          schemaType: row.schemaType,
          rows: []
        };
      } else if (currentSection) {
        currentSection.rows.push({ ...row, originalIndex: index });
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }, [verificationData]);

  const handleCellEdit = async (originalIndex, field, value) => {
    const key = `${originalIndex}_${field}`;
    setEditedData(prev => ({ ...prev, [key]: value }));

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token');
      await axios.put(
        `${API_BASE_URL}/scanner-enterprise/verification/${verificationId}/row/${originalIndex}`,
        { currentValue: value },
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const handleConfirm = async () => {
    if (!window.confirm('Confirm and save this data to the patient record?')) {
      return;
    }

    setConfirming(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('x-auth-token');
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

      const response = await axios.post(
        `${API_BASE_URL}/scanner-enterprise/verification/${verificationId}/confirm`,
        { processingTimeSeconds: elapsedTime },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (response.data.success) {
        alert(`Data verified and saved successfully! (Processing time: ${elapsedTime}s)`);
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

    const exportData = {
      fileName: verificationData.fileName,
      documentType: verificationData.documentType,
      extractedDate: new Date().toISOString(),
      patientId: verificationData.patientId,
      sections: groupedSections.map(section => ({
        heading: section.heading,
        type: section.sectionType,
        schema: section.schemaType,
        data: section.rows.map(row => ({
          field: row.fieldName,
          label: row.displayLabel,
          value: editedData[`${row.originalIndex}_currentValue`] || row.currentValue,
          category: row.category,
          confidence: row.confidence
        }))
      })),
      metadata: {
        ocrConfidence: verificationData.metadata?.ocrConfidence,
        processingTimeMs: verificationData.metadata?.processingTimeMs,
        sectionCount: groupedSections.length,
        exportedAt: new Date().toISOString()
      }
    };

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

  const renderSectionTable = (section) => {
    const schemaType = section.schemaType?.toUpperCase();

    if (schemaType === 'LAB_REPORT') {
      return <LabReportTable section={section} onEdit={handleCellEdit} editedData={editedData} />;
    } else if (schemaType === 'PRESCRIPTION') {
      return <PrescriptionTable section={section} onEdit={handleCellEdit} editedData={editedData} />;
    } else if (schemaType === 'BILLING') {
      return <BillingTable section={section} onEdit={handleCellEdit} editedData={editedData} />;
    } else if (schemaType === 'VITALS' || schemaType === 'MEDICAL_HISTORY') {
      return <GenericTable section={section} onEdit={handleCellEdit} editedData={editedData} />;
    } else {
      return <GenericTable section={section} onEdit={handleCellEdit} editedData={editedData} />;
    }
  };

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="verification-modal-overlay">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="verification-modal verification-modal-large"
          >
            {/* Header */}
            <div className="verification-modal-header verification-modal-header-gradient">
              <div className="header-content">
                <div className="header-left">
                  <MdInfo className="header-icon" size={28} />
                  <div>
                    <h2 className="header-title">Verify Extracted Data</h2>
                    <p className="header-subtitle">
                      {verificationData?.documentType?.replace(/_/g, ' ')} • {verificationData?.fileName}
                    </p>
                  </div>
                </div>
                <div className="header-right">
                  <div className="timer-badge">
                    <span className="timer-icon">⏱️</span>
                    <span className="timer-text">{elapsedTime}s</span>
                  </div>
                  <button
                    onClick={handleDownloadData}
                    className="header-action-btn"
                    title="Download extracted data"
                    disabled={loading}
                  >
                    <MdDownload size={20} />
                  </button>
                  <button onClick={onClose} className="close-button">
                    <MdClose size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="verification-modal-content verification-modal-content-tabbed">
              {loading ? (
                <div className="loading-container">
                  <FiLoader className="spinner" size={40} />
                  <p>Loading verification data...</p>
                </div>
              ) : verificationData && groupedSections.length > 0 ? (
                <>
                  {/* Tabs */}
                  <div className="verification-tabs">
                    {groupedSections.map((section, idx) => (
                      <button
                        key={idx}
                        className={`verification-tab ${activeTab === idx ? 'active' : ''}`}
                        onClick={() => setActiveTab(idx)}
                      >
                        <span className="tab-label">{section.heading}</span>
                        <span className="tab-count">{section.rows.filter(r => !r.isDeleted).length}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Tab Content */}
                  <div className="verification-tab-content">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        {renderSectionTable(groupedSections[activeTab])}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="error-container">
                  <MdWarning className="error-icon" size={48} />
                  <p>No verification data available</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="verification-modal-footer">
              <div className="footer-info">
                <MdInfo size={16} />
                <span>Review data carefully before confirming</span>
              </div>
              <div className="footer-actions">
                <button
                  onClick={handleReject}
                  className="footer-btn reject-btn"
                  disabled={confirming || loading}
                >
                  <MdCancel /> Reject
                </button>
                <button
                  onClick={handleConfirm}
                  className="footer-btn confirm-btn"
                  disabled={confirming || loading}
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

// Lab Report Table Component
const LabReportTable = ({ section, onEdit, editedData }) => {
  const getStatus = (row) => {
    const flagField = section.rows.find(r => r.fieldName === 'flag' && r.originalIndex === row.originalIndex);
    return flagField?.currentValue || 'NORMAL';
  };

  const getStatusIcon = (status) => {
    if (!status) return <MdCheckCircleOutline color="#4caf50" />;
    const s = status.toUpperCase();
    if (s.includes('HIGH') || s.includes('ABNORMAL')) return <MdTrendingUp color="#f44336" />;
    if (s.includes('LOW')) return <MdTrendingDown color="#ff9800" />;
    return <MdCheckCircleOutline color="#4caf50" />;
  };

  // Group lab rows by test
  const tests = [];
  let currentTest = {};

  section.rows.forEach(row => {
    if (row.fieldName === 'testName') {
      if (currentTest.testName) tests.push(currentTest);
      currentTest = { testName: row.currentValue, originalIndex: row.originalIndex };
    } else if (['value', 'unit', 'referenceRange', 'flag'].includes(row.fieldName)) {
      currentTest[row.fieldName] = {
        value: editedData[`${row.originalIndex}_currentValue`] || row.currentValue,
        originalIndex: row.originalIndex,
        confidence: row.confidence
      };
    }
  });
  if (currentTest.testName) tests.push(currentTest);

  return (
    <div className="table-container">
      <table className="verification-table lab-table">
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Value</th>
            <th>Unit</th>
            <th>Reference Range</th>
            <th>Status</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test, idx) => (
            <tr key={idx} className="table-row">
              <td><strong>{test.testName}</strong></td>
              <td>
                <input
                  type="text"
                  className="table-input"
                  value={test.value?.value || ''}
                  onChange={(e) => onEdit(test.value?.originalIndex, 'currentValue', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="table-input"
                  value={test.unit?.value || ''}
                  onChange={(e) => onEdit(test.unit?.originalIndex, 'currentValue', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="table-input"
                  value={test.referenceRange?.value || ''}
                  onChange={(e) => onEdit(test.referenceRange?.originalIndex, 'currentValue', e.target.value)}
                />
              </td>
              <td className="status-cell">
                {getStatusIcon(test.flag?.value)}
                <span className={`status-${test.flag?.value?.toLowerCase() || 'normal'}`}>
                  {test.flag?.value || 'NORMAL'}
                </span>
              </td>
              <td>
                <ConfidenceChip confidence={test.value?.confidence || 0} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Prescription Table Component
const PrescriptionTable = ({ section, onEdit, editedData }) => {
  const medications = [];
  let currentMed = {};

  section.rows.forEach(row => {
    if (row.dataType === 'medication_header') {
      if (currentMed.name) medications.push(currentMed);
      currentMed = {};
    } else if (['medicineName', 'dosage', 'frequency', 'duration', 'instructions'].includes(row.fieldName)) {
      currentMed[row.fieldName] = {
        value: editedData[`${row.originalIndex}_currentValue`] || row.currentValue,
        originalIndex: row.originalIndex,
        confidence: row.confidence
      };
    }
  });
  if (currentMed.medicineName) medications.push(currentMed);

  return (
    <div className="table-container">
      <table className="verification-table prescription-table">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
            <th>Instructions</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((med, idx) => (
            <tr key={idx} className="table-row">
              <td>
                <input
                  type="text"
                  className="table-input"
                  value={med.medicineName?.value || ''}
                  onChange={(e) => onEdit(med.medicineName?.originalIndex, 'currentValue', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="table-input"
                  value={med.dosage?.value || ''}
                  onChange={(e) => onEdit(med.dosage?.originalIndex, 'currentValue', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="table-input"
                  value={med.frequency?.value || ''}
                  onChange={(e) => onEdit(med.frequency?.originalIndex, 'currentValue', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="table-input"
                  value={med.duration?.value || ''}
                  onChange={(e) => onEdit(med.duration?.originalIndex, 'currentValue', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="table-input"
                  value={med.instructions?.value || ''}
                  onChange={(e) => onEdit(med.instructions?.originalIndex, 'currentValue', e.target.value)}
                />
              </td>
              <td>
                <ConfidenceChip confidence={med.medicineName?.confidence || 0} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Billing Table Component
const BillingTable = ({ section, onEdit, editedData }) => {
  const items = section.rows.filter(r => !r.isDeleted && r.category !== 'totals');
  const totalsRows = section.rows.filter(r => r.category === 'totals');

  return (
    <div className="table-container">
      <table className="verification-table billing-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Amount</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => (
            <tr key={idx} className="table-row">
              <td>
                <input
                  type="text"
                  className="table-input"
                  value={editedData[`${row.originalIndex}_currentValue`] || row.currentValue}
                  onChange={(e) => onEdit(row.originalIndex, 'currentValue', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="table-input"
                  value={editedData[`${row.originalIndex}_quantity`] || 1}
                  onChange={(e) => onEdit(row.originalIndex, 'quantity', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="table-input"
                  value={editedData[`${row.originalIndex}_amount`] || row.currentValue}
                  onChange={(e) => onEdit(row.originalIndex, 'amount', e.target.value)}
                />
              </td>
              <td>
                <ConfidenceChip confidence={row.confidence} />
              </td>
            </tr>
          ))}
        </tbody>
        {totalsRows.length > 0 && (
          <tfoot>
            {totalsRows.map((row, idx) => (
              <tr key={idx} className="totals-row">
                <td colSpan="2"><strong>{row.displayLabel}</strong></td>
                <td><strong>{editedData[`${row.originalIndex}_currentValue`] || row.currentValue}</strong></td>
                <td></td>
              </tr>
            ))}
          </tfoot>
        )}
      </table>
    </div>
  );
};

// Generic Table for Vitals, Medical History, etc.
const GenericTable = ({ section, onEdit, editedData }) => {
  return (
    <div className="table-container">
      <table className="verification-table generic-table">
        <thead>
          <tr>
            <th width="30%">Field</th>
            <th width="50%">Value</th>
            <th width="20%">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {section.rows.filter(r => !r.isDeleted).map((row, idx) => (
            <tr key={idx} className="table-row">
              <td><strong>{row.displayLabel}</strong></td>
              <td>
                <textarea
                  className="table-textarea"
                  value={editedData[`${row.originalIndex}_currentValue`] || row.currentValue}
                  onChange={(e) => onEdit(row.originalIndex, 'currentValue', e.target.value)}
                  rows={String(row.currentValue).length > 100 ? 3 : 1}
                />
              </td>
              <td>
                <ConfidenceChip confidence={row.confidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Confidence Chip Component
const ConfidenceChip = ({ confidence }) => {
  const percent = (confidence * 100).toFixed(0);
  const color = confidence >= 0.9 ? '#4caf50' : confidence >= 0.75 ? '#ff9800' : '#f44336';

  return (
    <span className="confidence-chip" style={{ backgroundColor: color }}>
      {percent}%
    </span>
  );
};

export default DataVerificationModal;
