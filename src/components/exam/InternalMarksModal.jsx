import React, { useState, useEffect } from 'react';
import { 
  getRegistrationsByExam, 
  getInternalMarksByExam, 
  addOrUpdateInternalMarks 
} from '../../data/examData';
import { getUserSession } from '../../auth/sessionController';

export default function InternalMarksModal({ exam, onClose, onSave }) {
  const [registrations, setRegistrations] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [maxInternal, setMaxInternal] = useState(20);
  const session = getUserSession();

  useEffect(() => {
    const regs = getRegistrationsByExam(exam.id);
    setRegistrations(regs);

    // Load existing internal marks
    const existingMarks = getInternalMarksByExam(exam.id);
    const marksObj = {};
    existingMarks.forEach(m => {
      marksObj[m.studentId] = m.internalMarks;
    });
    setMarksData(marksObj);
  }, [exam.id]);

  const handleMarksChange = (studentId, value) => {
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0 && numValue <= maxInternal)) {
      setMarksData(prev => ({
        ...prev,
        [studentId]: value === '' ? '' : numValue
      }));
    }
  };

  const handleSave = () => {
    let count = 0;
    Object.entries(marksData).forEach(([studentId, marks]) => {
      if (marks !== '' && marks !== undefined) {
        addOrUpdateInternalMarks(exam.id, studentId, marks, maxInternal, session.username);
        count++;
      }
    });
    alert(`Internal marks saved for ${count} students`);
    onSave();
  };

  const getMarksColor = (marks) => {
    const percentage = (marks / maxInternal) * 100;
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-[#1162d4]';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-[#1162d4] text-white px-6 py-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="material-symbols-outlined mr-2">assignment</span>
            Internal Marks Entry - {exam.name}
          </h2>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Max Internal Marks */}
          <div className="mb-6 bg-slate-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Maximum Internal Marks
            </label>
            <input
              type="number"
              value={maxInternal}
              onChange={(e) => setMaxInternal(parseInt(e.target.value) || 20)}
              min="1"
              max="50"
              className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-slate-600 mt-2">
              Total Students: {registrations.length} | Marks Entered: {Object.keys(marksData).filter(k => marksData[k] !== '' && marksData[k] !== undefined).length}
            </p>
          </div>

          {/* Marks Entry Grid */}
          <div className="space-y-2">
            <h3 className="font-medium text-slate-700 mb-3">Enter Internal Marks</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Student ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Student Name</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-slate-700">Internal Marks (/{maxInternal})</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-slate-700">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => {
                    const marks = marksData[reg.studentId];
                    const percentage = marks !== '' && marks !== undefined ? ((marks / maxInternal) * 100).toFixed(1) : '-';
                    
                    return (
                      <tr key={reg.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">{reg.studentId}</td>
                        <td className="px-4 py-3 text-sm">{reg.studentName}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={marks === undefined ? '' : marks}
                            onChange={(e) => handleMarksChange(reg.studentId, e.target.value)}
                            min="0"
                            max={maxInternal}
                            step="0.5"
                            placeholder="0"
                            className="w-24 mx-auto px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-green-500"
                          />
                        </td>
                        <td className={`px-4 py-3 text-center font-medium ${marks !== '' && marks !== undefined ? getMarksColor(marks) : 'text-slate-400'}`}>
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#1162d4] text-white rounded-lg hover:bg-[#1162d4]/90"
          >
            Save Internal Marks
          </button>
        </div>
      </div>
    </div>
  );
}
