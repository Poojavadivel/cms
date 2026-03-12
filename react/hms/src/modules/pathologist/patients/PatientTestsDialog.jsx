/**
 * PatientTestsDialog.jsx
 * Modal to display all test reports for a specific patient with image viewing capability
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEye, FiCalendar, FiImage, FiFileText } from 'react-icons/fi';
import { MdScience } from 'react-icons/md';
import pathologyService from '../../../services/pathologyService';
import reportService from '../../../services/reportService';
import '../../admin/pathology/components/PathologyDialog.css';

const PatientTestsDialog = ({ isOpen, onClose, patient }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && patient) {
      loadPatientReports();
    }
  }, [isOpen, patient]);

  const loadPatientReports = async () => {
    setLoading(true);
    try {
      const data = await pathologyService.fetchReports({ limit: 100 });
      // Filter reports for this specific patient
      const patientReports = data.filter(report => 
        report.patientId === patient.id || 
        report.patientCode === patient.patientCode ||
        report.patientName === (patient.name || `${patient.firstName} ${patient.lastName}`)
      );
      setReports(patientReports);
      console.log('📋 Loaded reports for patient:', patient.name, patientReports);
    } catch (error) {
      console.error('Error loading patient reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewImage = (report) => {
    const fileId = report.imageRef || report.fileRef || report.pdfRef;
    if (!fileId) {
      alert('⚠️ No uploaded image/scan found for this test report.\n\nPlease upload a test report image first.');
      return;
    }
    console.log('🖼️ Viewing test report image for:', report.testName, fileId);
    reportService.viewPdf(fileId);
  };

  const getStatusStyle = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'completed' || statusLower === 'ready') {
      return { bg: 'rgba(32, 125, 192, 0.1)', color: '#207DC0' };
    } else if (statusLower === 'pending' || statusLower === 'in progress') {
      return { bg: 'rgba(251, 146, 60, 0.1)', color: '#FB923C' };
    } else if (statusLower === 'cancelled') {
      return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' };
    }
    return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
  };

  if (!isOpen || !patient) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#207DC0] to-[#165a8a] p-8 text-white">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <MdScience size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Test Reports History</h2>
                  <p className="text-white/80 text-sm">
                    {patient.name || `${patient.firstName} ${patient.lastName}`} • {patient.patientCode || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#207DC0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading test reports...</p>
                </div>
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FiFileText size={64} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Test Reports Found</h3>
                <p className="text-gray-500">This patient doesn't have any test reports yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => {
                  const statusStyle = getStatusStyle(report.status);
                  const hasImage = report.imageRef || report.fileRef || report.pdfRef;

                  return (
                    <div
                      key={report.id}
                      className="border-2 border-gray-100 rounded-2xl p-6 hover:border-[#207DC0]/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-[#207DC0]/10 flex items-center justify-center">
                              <FiFileText size={24} className="text-[#207DC0]" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{report.testName}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span
                                  style={{
                                    padding: '4px 12px',
                                    borderRadius: '9999px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    backgroundColor: statusStyle.bg,
                                    color: statusStyle.color
                                  }}
                                >
                                  {report.status || 'Unknown'}
                                </span>
                                <div className="flex items-center gap-1 text-gray-500 text-sm">
                                  <FiCalendar size={14} />
                                  <span>
                                    {report.reportDate 
                                      ? new Date(report.reportDate).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })
                                      : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {report.remarks && (
                            <p className="text-sm text-gray-600 ml-15 pl-3 border-l-2 border-gray-200">
                              {report.remarks}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 ml-6">
                          {hasImage ? (
                            <button
                              onClick={() => handleViewImage(report)}
                              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#207DC0] to-[#165a8a] text-white flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all font-bold"
                            >
                              <FiEye size={20} />
                              <span>View Image</span>
                            </button>
                          ) : (
                            <div className="px-6 py-3 rounded-xl bg-gray-100 text-gray-400 flex items-center gap-2 font-medium">
                              <FiImage size={20} />
                              <span>No Image</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-100 p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {reports.length} test report{reports.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PatientTestsDialog;
