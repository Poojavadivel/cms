import { useState, useEffect } from 'react';
import { getRegistrationsByExam, getMarksByExam, addOrUpdateMarks, calculateGrade } from '../../data/examData';

export default function MarksEntryModal({ isOpen, onClose, exam, currentUserId }) {
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && exam) {
      loadStudentsAndMarks();
    }
  }, [isOpen, exam]);

  const loadStudentsAndMarks = () => {
    const registrations = getRegistrationsByExam(exam.id);
    const existingMarks = getMarksByExam(exam.id);
    
    const marksMap = {};
    existingMarks.forEach(m => {
      marksMap[m.studentId] = { marks: m.marks, grade: m.grade };
    });
    
    setStudents(registrations);
    setMarksData(marksMap);
  };

  const handleMarksChange = (studentId, value) => {
    const marks = parseFloat(value) || 0;
    const grade = calculateGrade(marks, parseFloat(exam.maxMarks));
    
    setMarksData(prev => ({
      ...prev,
      [studentId]: { marks, grade }
    }));
  };

  const handleSave = () => {
    setSaving(true);
    
    // Save all marks
    Object.keys(marksData).forEach(studentId => {
      const { marks, grade } = marksData[studentId];
      if (marks !== undefined && marks !== null && marks !== '') {
        addOrUpdateMarks(exam.id, studentId, marks, grade, currentUserId);
      }
    });
    
    setSaving(false);
    alert('Marks saved successfully!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1162d4]/10 rounded-lg">
              <span className="material-symbols-outlined text-[#1162d4]">edit_note</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Enter Marks</h3>
              <p className="text-sm text-slate-500">{exam.code} - {exam.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {students.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <span className="material-symbols-outlined text-5xl mb-2 opacity-20">person_off</span>
              <p className="text-sm">No students registered for this exam</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{student.studentName}</p>
                    <p className="text-xs text-slate-500">{student.studentId}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Marks (out of {exam.maxMarks})</label>
                      <input
                        type="number"
                        min="0"
                        max={exam.maxMarks}
                        value={marksData[student.studentId]?.marks || ''}
                        onChange={(e) => handleMarksChange(student.studentId, e.target.value)}
                        className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="w-16">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Grade</label>
                      <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-[#1162d4] text-center">
                        {marksData[student.studentId]?.grade || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="px-4 py-2 bg-[#1162d4] text-white rounded-lg hover:bg-[#1162d4]/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Marks'}
          </button>
        </div>
      </div>
    </div>
  );
}
