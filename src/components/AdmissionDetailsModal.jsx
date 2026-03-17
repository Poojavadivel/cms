import React from 'react';

export default function AdmissionDetailsModal({ isOpen, onClose, type, entry }) {
  if (!isOpen || !entry) return null;

  const title = type === 'student' ? 'Student Details' : 'Faculty Details';
  const rows = type === 'student' ? [
    { label: 'Student ID', value: entry.id },
    { label: 'Name', value: entry.name },
    { label: 'Email', value: entry.email },
    { label: 'Phone', value: entry.phone },
    { label: 'Course', value: entry.course },
    { label: 'Status', value: entry.status },
    { label: 'Payment', value: entry.payment },
  ] : [
    { label: 'Staff ID', value: entry.id },
    { label: 'Name', value: entry.name },
    { label: 'Email', value: entry.email },
    { label: 'Phone', value: entry.phone },
    { label: 'Department', value: entry.department },
    { label: 'Role', value: entry.role },
    { label: 'Status', value: entry.status },
    { label: 'Payment', value: entry.payment },
  ];

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto border border-slate-200">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">Basic details for the selected application.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 p-2 rounded-full transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between items-start">
              <span className="text-sm font-semibold text-slate-600">{row.label}</span>
              <span className="text-sm font-medium text-slate-900 text-right">{row.value || '—'}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#1162d4] text-white font-semibold hover:bg-[#0a47a8] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
