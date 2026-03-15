import { useState } from 'react';
import { applyForRevaluation } from '../../data/examData';

export default function RevaluationModal({ isOpen, onClose, exam, studentId, studentName }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Please provide a reason for revaluation');
      return;
    }

    setSubmitting(true);
    const result = applyForRevaluation(exam.id, studentId, studentName, reason);
    
    if (result.success) {
      alert('Revaluation request submitted successfully!');
      setReason('');
      onClose();
    } else {
      alert(result.message);
    }
    
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="material-symbols-outlined text-orange-600">rate_review</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Apply for Revaluation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Exam</p>
            <p className="text-sm font-bold text-slate-900">{exam.code} - {exam.name}</p>
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              Reason for Revaluation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              placeholder="Explain why you are requesting a revaluation..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none resize-none"
            />
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg">info</span>
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Please Note:</p>
                <ul className="space-y-1 pl-4">
                  <li>• Revaluation fee will be applicable</li>
                  <li>• Processing takes 7-10 working days</li>
                  <li>• Marks can increase, decrease, or remain the same</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-[#1162d4] text-white rounded-lg hover:bg-[#1162d4]/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
