import React, { useState, useEffect } from 'react';
import { getAllTimetableDrafts, updateTimetableDraftStatus } from '../../data/examData';
import { getUserSession } from '../../auth/sessionController';

export default function TimetableApprovalModal({ onClose, onApprove }) {
  const [drafts, setDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [remarks, setRemarks] = useState('');
  const session = getUserSession();

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    const allDrafts = getAllTimetableDrafts();
    setDrafts(allDrafts);
  };

  const handleAction = (draftId, action) => {
    if (action === 'Rejected' && !remarks) {
      alert('Please provide remarks for rejection');
      return;
    }

    const status = action === 'approve' ? 'Approved' : 'Rejected';
    updateTimetableDraftStatus(draftId, status, session.username, remarks);
    
    alert(`Timetable ${status.toLowerCase()} successfully`);
    setSelectedDraft(null);
    setRemarks('');
    loadDrafts();
    onApprove();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700';
      case 'Submitted': return 'bg-[#1162d4]/10 text-[#1162d4]';
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-[#1162d4] text-white px-6 py-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="material-symbols-outlined mr-2">approval</span>
            Timetable Approval Management
          </h2>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300">event_note</span>
              <p className="text-slate-600 mt-4">No timetable drafts available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drafts.map((draft) => (
                <div key={draft.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-slate-800">{draft.session}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(draft.status)}`}>
                          {draft.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p><strong>Semester:</strong> {draft.semester} | <strong>Year:</strong> {draft.academicYear}</p>
                        <p><strong>Created by:</strong> {draft.createdBy} on {new Date(draft.createdAt).toLocaleDateString()}</p>
                        {draft.reviewedBy && (
                          <p><strong>Reviewed by:</strong> {draft.reviewedBy} on {new Date(draft.reviewedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    
                    {draft.status === 'Submitted' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedDraft(draft.id)}
                          className="px-4 py-2 bg-[#1162d4] text-white rounded-lg hover:bg-[#1162d4]/90 text-sm flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          Review
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Exam Details */}
                  {draft.exams && draft.exams.length > 0 && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 mb-2">Scheduled Exams ({draft.exams.length})</p>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                        {draft.exams.map((exam, idx) => (
                          <div key={idx} className="text-sm bg-white p-2 rounded border">
                            <div className="flex justify-between">
                              <span className="font-medium">{exam.subject}</span>
                              <span className="text-slate-600">{exam.date}</span>
                            </div>
                            <div className="text-slate-600 text-xs mt-1">
                              {exam.startTime} - {exam.endTime} | {exam.room}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Section */}
                  {selectedDraft === draft.id && (
                    <div className="mt-4 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <h4 className="font-medium text-slate-800 mb-3">Review Actions</h4>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add remarks (required for rejection)..."
                        className="w-full px-3 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500"
                        rows="3"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAction(draft.id, 'approve')}
                          className="px-4 py-2 bg-[#1162d4] text-white rounded-lg hover:bg-[#1162d4]/90 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(draft.id, 'reject')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDraft(null);
                            setRemarks('');
                          }}
                          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Previous Remarks */}
                  {draft.remarks && (
                    <div className="mt-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-slate-700">Remarks:</p>
                      <p className="text-sm text-slate-600 mt-1">{draft.remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
