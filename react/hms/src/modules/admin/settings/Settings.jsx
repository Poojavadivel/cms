/**
 * Settings.jsx (Scanner Upload System)
 * React equivalent of Flutter's SettingsPage.dart
 * Bulk Lab Report Scanner Upload with OCR Patient Matching
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  MdUploadFile,
  MdLogout,
  MdPictureAsPdf,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../provider';
import axios from 'axios';
import './Settings.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api';

const Settings = () => {
  const navigate = useNavigate();
  const { signOut } = useApp();
  const fileInputRef = useRef(null);

  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState('');
  const [results, setResults] = useState([]);

  const appendLog = useCallback((msg) => {
    setLog(prev => `${prev}${msg}\n`);
  }, []);

  const formatSize = (bytes) => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = (bytes / Math.pow(1024, i)).toFixed(1);
    return `${value} ${units[i]}`;
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    // Limit to 10 files
    const selectedFiles = files.slice(0, 10);

    // Validate file types
    const validFiles = selectedFiles.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ['jpg', 'jpeg', 'png'].includes(ext);
    });

    if (validFiles.length === 0) {
      appendLog('❌ No valid files selected. Only JPG/PNG allowed.');
      return;
    }

    await uploadFiles(validFiles);

    // Reset input
    event.target.value = '';
  };

  const uploadFiles = async (files) => {
    try {
      setBusy(true);
      setResults([]);
      setLog('');

      appendLog(`📤 Uploading ${files.length} file(s) with scanner...`);

      // Create FormData
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('images', file);
        appendLog(`   ➤ ${file.name} (${formatSize(file.size)})`);
      });

      // Get token
      const token = localStorage.getItem('auth_token');

      // Send to backend
      const response = await axios.post(
        `${API_BASE_URL}/scanner-enterprise/bulk-upload-with-matching`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );

      const data = response.data;
      const resultsData = data.results || [];
      const failures = data.failures || [];

      appendLog(`✅ success=${data.success} processed=${resultsData.length} failed=${failures.length}`);

      // Parse results
      const parsed = resultsData.map(r => ({
        file: r.file || '',
        patientId: r.patient?.id || '',
        pdfId: r.report?.imagePath || '',
        labReportId: r.report?.intent || '',
        matchedBy: r.patient?.matchedBy || '',
        engine: r.ocr?.engine || '',
        confidence: r.ocr?.confidence || 0,
        resultsCount: 0,
        size: r.ocr?.textLength || 0,
        mime: 'image/jpeg',
      }));

      setResults(parsed);

      // Log failures
      if (failures.length > 0) {
        failures.forEach(f => {
          appendLog(`   ✗ ${f.file}: ${f.error} (Patient: ${f.extractedName})`);
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      appendLog(`💥 Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const openPdf = async (pdfId, suggestedName) => {
    try {
      const token = localStorage.getItem('auth_token');

      const response = await axios.get(
        `${API_BASE_URL}/scanner-enterprise/pdf/${pdfId}`,
        {
          responseType: 'blob',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = suggestedName || `report_${pdfId.substring(0, 6)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      appendLog(`📂 Downloaded ${suggestedName || 'report.pdf'}`);
    } catch (error) {
      console.error('Open PDF error:', error);
      appendLog(`💥 Open PDF error: ${error.message}`);
    }
  };

  return (
    <div className="scanner-upload-page">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFilesChange}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="scanner-header">
        <h1 className="scanner-title">Scan Upload</h1>
        <button
          className="logout-btn"
          onClick={handleLogout}
          disabled={busy}
        >
          <MdLogout />
          Logout
        </button>
      </div>

      {/* Upload Card */}
      <div className="upload-card">
        <h2>Upload Reports (JPG/PNG)</h2>
        <p className="upload-description">
          Select up to 10 files. OCR + auto-link to patients.
        </p>
        <div className="upload-actions">
          <button
            className="upload-btn"
            onClick={handleFileSelect}
            disabled={busy}
          >
            <MdUploadFile />
            {busy ? 'Processing…' : 'Select & Upload'}
          </button>
          {busy && <div className="spinner"></div>}
        </div>
      </div>

      {/* Results Table */}
      <div className="results-section">
        {results.length === 0 ? (
          <div className="empty-results">
            <p>No results yet. Upload to see processed files.</p>
          </div>
        ) : (
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Patient ID</th>
                  <th>Lab Report</th>
                  <th>OCR Engine</th>
                  <th>Confidence</th>
                  <th>Results</th>
                  <th>Size</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index}>
                    <td title={result.file}>{result.file}</td>
                    <td>{result.patientId || '-'}</td>
                    <td>{result.labReportId || '-'}</td>
                    <td>{result.engine}</td>
                    <td>{result.confidence ? result.confidence.toFixed(2) : '-'}</td>
                    <td>{result.resultsCount}</td>
                    <td>{formatSize(result.size)}</td>
                    <td>
                      {result.pdfId ? (
                        <button
                          className="pdf-btn"
                          onClick={() => openPdf(result.pdfId, result.file.replace(/\.(jpg|jpeg|png)$/i, '.pdf'))}
                          title="Download PDF"
                        >
                          <MdPictureAsPdf />
                          Open
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Console */}
      <div className="log-console">
        <div className="log-content">
          {log || 'logs will appear here…'}
        </div>
      </div>
    </div>
  );
};

export default Settings;
