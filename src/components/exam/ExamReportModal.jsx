import { useState, useEffect } from 'react';
import { getRegistrationsByExam, getMarksByExam, updateExam } from '../../data/examData';

export default function ExamReportModal({ isOpen, onClose, exam }) {
  const [registrations, setRegistrations] = useState([]);
  const [marks, setMarks] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (isOpen && exam) {
      loadReportData();
    }
  }, [isOpen, exam]);

  const loadReportData = () => {
    const regs = getRegistrationsByExam(exam.id);
    const examMarks = getMarksByExam(exam.id);
    
    setRegistrations(regs);
    setMarks(examMarks);
    
    // Calculate statistics
    if (examMarks.length > 0) {
      const totalMarks = examMarks.reduce((sum, m) => sum + m.marks, 0);
      const avgMarks = totalMarks / examMarks.length;
      const maxMarks = Math.max(...examMarks.map(m => m.marks));
      const minMarks = Math.min(...examMarks.map(m => m.marks));
      
      const gradeCount = examMarks.reduce((acc, m) => {
        acc[m.grade] = (acc[m.grade] || 0) + 1;
        return acc;
      }, {});
      
      setStats({
        totalRegistered: regs.length,
        totalEvaluated: examMarks.length,
        pending: regs.length - examMarks.length,
        average: avgMarks.toFixed(2),
        highest: maxMarks,
        lowest: minMarks,
        passRate: ((examMarks.filter(m => m.grade !== 'F').length / examMarks.length) * 100).toFixed(1),
        gradeDistribution: gradeCount
      });
    } else {
      setStats({
        totalRegistered: regs.length,
        totalEvaluated: 0,
        pending: regs.length,
        average: 0,
        highest: 0,
        lowest: 0,
        passRate: 0,
        gradeDistribution: {}
      });
    }
  };

  const handlePublishResults = () => {
    if (stats.pending > 0) {
      alert(`Cannot publish results. ${stats.pending} students have not been evaluated yet.`);
      return;
    }

    if (confirm('Are you sure you want to publish the results? Students will be able to view their marks.')) {
      updateExam(exam.id, { resultsPublished: true });
      alert('Results published successfully!');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <span className="material-symbols-outlined text-emerald-600">assessment</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Exam Report</h3>
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

        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1162d4]/5 p-4 rounded-lg border border-[#1162d4]/20">
              <p className="text-xs font-semibold text-[#1162d4] uppercase mb-1">Registered</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalRegistered}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Evaluated</p>
              <p className="text-2xl font-bold text-emerald-900">{stats.totalEvaluated}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-xs font-semibold text-orange-600 uppercase mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-900">{stats.pending}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Pass Rate</p>
              <p className="text-2xl font-bold text-purple-900">{stats.passRate}%</p>
            </div>
          </div>

          {/* Performance Stats */}
          {stats.totalEvaluated > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Average Marks</p>
                <p className="text-xl font-bold text-slate-900">{stats.average} / {exam.maxMarks}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Highest Marks</p>
                <p className="text-xl font-bold text-emerald-600">{stats.highest}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Lowest Marks</p>
                <p className="text-xl font-bold text-red-600">{stats.lowest}</p>
              </div>
            </div>
          )}

          {/* Grade Distribution */}
          {stats.totalEvaluated > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase">Grade Distribution</h4>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map(grade => (
                  <div key={grade} className="bg-slate-50 p-3 rounded-lg text-center">
                    <p className="text-xs font-semibold text-slate-500 mb-1">{grade}</p>
                    <p className="text-lg font-bold text-slate-900">{stats.gradeDistribution[grade] || 0}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student List with Marks */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase">Student Performance</h4>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3 text-center">Marks</th>
                    <th className="px-4 py-3 text-center">Grade</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.map(reg => {
                    const studentMark = marks.find(m => m.studentId === reg.studentId);
                    return (
                      <tr key={reg.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{reg.studentName}</td>
                        <td className="px-4 py-3 text-slate-600">{reg.studentId}</td>
                        <td className="px-4 py-3 text-center">
                          {studentMark ? (
                            <span className="font-bold text-slate-900">{studentMark.marks}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {studentMark ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              studentMark.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {studentMark.grade}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {studentMark ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Evaluated
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-semibold"
          >
            Close
          </button>
          {!exam.resultsPublished && (
            <button
              onClick={handlePublishResults}
              disabled={stats.pending > 0}
              className="px-4 py-2 bg-[#1162d4] text-white rounded-lg hover:bg-[#1162d4]/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publish Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
