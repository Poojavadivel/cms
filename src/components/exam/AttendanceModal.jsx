import React, { useState, useEffect } from 'react';
import { 
  getRegistrationsByExam, 
  getAttendanceByExam, 
  markAttendance 
} from '../../data/examData';
import { getUserSession } from '../../auth/sessionController';

export default function AttendanceModal({ exam, onClose, onSave }) {
  const [registrations, setRegistrations] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const session = getUserSession();

  useEffect(() => {
    const regs = getRegistrationsByExam(exam.id);
    setRegistrations(regs);

    // Load existing attendance
    const existingAttendance = getAttendanceByExam(exam.id);
    const attObj = {};
    existingAttendance.forEach(a => {
      attObj[a.studentId] = a.status;
    });
    setAttendanceData(attObj);
  }, [exam.id]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    registrations.forEach(reg => {
      updated[reg.studentId] = status;
    });
    setAttendanceData(updated);
  };

  const handleSave = () => {
    let count = 0;
    Object.entries(attendanceData).forEach(([studentId, status]) => {
      if (status) {
        markAttendance(exam.id, studentId, status, session.username);
        count++;
      }
    });
    alert(`Attendance saved for ${count} students`);
    onSave();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'Absent': return 'bg-red-100 text-red-700 border-red-300';
      case 'Late': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const stats = {
    total: registrations.length,
    present: Object.values(attendanceData).filter(s => s === 'Present').length,
    absent: Object.values(attendanceData).filter(s => s === 'Absent').length,
    late: Object.values(attendanceData).filter(s => s === 'Late').length
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-[#1162d4] text-white px-6 py-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="material-symbols-outlined mr-2">fact_check</span>
            Mark Attendance - {exam.name}
          </h2>
          <p className="text-sm mt-1 opacity-90">{exam.date} | {exam.startTime}</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Quick Actions & Stats */}
          <div className="mb-6 space-y-3">
            <div className="flex gap-3">
              <button
                onClick={() => handleMarkAll('Present')}
                className="px-4 py-2 bg-[#1162d4] text-white rounded-lg hover:bg-[#1162d4]/90 text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Mark All Present
              </button>
              <button
                onClick={() => handleMarkAll('Absent')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
                Mark All Absent
              </button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-sm text-slate-600">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                <p className="text-sm text-slate-600">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                <p className="text-sm text-slate-600">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                <p className="text-sm text-slate-600">Late</p>
              </div>
            </div>
          </div>

          {/* Attendance List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {registrations.map((reg) => (
              <div key={reg.id} className="flex items-center gap-4 p-3 bg-white border rounded-lg hover:shadow-sm">
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{reg.studentId}</p>
                  <p className="text-sm text-slate-600">{reg.studentName}</p>
                </div>
                <div className="flex gap-2">
                  {['Present', 'Absent', 'Late'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleAttendanceChange(reg.studentId, status)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                        attendanceData[reg.studentId] === status
                          ? getStatusColor(status)
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
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
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}
