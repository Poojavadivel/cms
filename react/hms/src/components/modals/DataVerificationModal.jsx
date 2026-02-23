import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdClose,
  MdCheckCircle,
  MdCancel,
  MdDelete,
  MdEdit,
  MdSave,
  MdInfo,
  MdWarning
} from 'react-icons/md';
import { FiLoader } from 'react-icons/fi';
import axios from 'axios';
import './DataVerificationModal.css';

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

  const renderValue = (value, dataType) => {
    if (dataType === 'object') {
      return (
        <pre className="value-object">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return <span className="value-text">{value?.toString() || 'N/A'}</span>;
  };

  const getCategoryColor = (category) => {
    const colors = {
      patient_details: '#207DC0',
      medications: '#10b981',
      vitals: '#f59e0b',
      diagnosis: '#ef4444',
      lab_results: '#8b5cf6',
      other: '#6b7280'
    };
    return colors[category] || colors.other;
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
                  {/* Info Banner */}
                  <div className="info-banner">
                    <MdWarning className="info-icon" />
                    <div className="info-text">
                      <p>Review the extracted data below. You can edit, delete rows or confirm to save to patient record.</p>
                      <p className="info-subtext">
                        Confidence: {(verificationData.metadata?.ocrConfidence * 100).toFixed(1)}% • 
                        Expires: {new Date(verificationData.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="data-rows-container">
                    {verificationData.dataRows.map((row, index) => (
                      <motion.div
                        key={`${row.fieldName}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: row.isDeleted ? 0.3 : 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`data-row ${row.isDeleted ? 'deleted' : ''} ${row.isModified ? 'modified' : ''}`}
                      >
                        {/* Category Badge */}
                        <div 
                          className="category-badge"
                          style={{ backgroundColor: getCategoryColor(row.category) }}
                        >
                          {row.category.replace('_', ' ')}
                        </div>

                        <div className="row-content">
                          {/* Label */}
                          <div className="row-label">
                            <strong>{row.displayLabel}</strong>
                            {row.isModified && (
                              <span className="modified-badge">Modified</span>
                            )}
                          </div>

                          {/* Value */}
                          <div className="row-value">
                            {editingIndex === index ? (
                              <div className="edit-container">
                                {row.dataType === 'object' ? (
                                  <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="edit-textarea"
                                    rows={5}
                                  />
                                ) : (
                                  <input
                                    type={row.dataType === 'number' ? 'number' : 'text'}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="edit-input"
                                  />
                                )}
                                <div className="edit-actions">
                                  <button
                                    onClick={() => handleSaveEdit(index)}
                                    className="save-btn"
                                  >
                                    <MdSave /> Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingIndex(null);
                                      setEditValue('');
                                    }}
                                    className="cancel-btn"
                                  >
                                    <MdCancel /> Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              renderValue(row.currentValue, row.dataType)
                            )}
                          </div>

                          {/* Actions */}
                          {!row.isDeleted && editingIndex !== index && (
                            <div className="row-actions">
                              <button
                                onClick={() => handleEdit(index, row.currentValue)}
                                className="action-btn edit-btn-icon"
                                title="Edit"
                              >
                                <MdEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(index)}
                                className="action-btn delete-btn-icon"
                                title="Delete"
                              >
                                <MdDelete />
                              </button>
                            </div>
                          )}

                          {row.isDeleted && (
                            <div className="deleted-label">
                              <MdDelete /> DELETED
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

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
