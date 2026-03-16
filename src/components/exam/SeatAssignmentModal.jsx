import React, { useState, useEffect } from 'react';
import { 
  getAllExamHalls, 
  getRegistrationsByExam, 
  getSeatByExamAndStudent, 
  assignSeat,
  autoAssignSeats 
} from '../../data/examData';

export default function SeatAssignmentModal({ exam, onClose, onSave }) {
  const [registrations, setRegistrations] = useState([]);
  const [halls, setHalls] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [selectedHall, setSelectedHall] = useState(exam.room || '');

  useEffect(() => {
    const regs = getRegistrationsByExam(exam.id);
    setRegistrations(regs);
    setHalls(getAllExamHalls());

    // Load existing seat assignments
    const existing = {};
    regs.forEach(reg => {
      const seat = getSeatByExamAndStudent(exam.id, reg.studentId);
      if (seat) {
        existing[reg.studentId] = seat.seatNumber;
      }
    });
    setAssignments(existing);
  }, [exam.id]);

  const handleAutoAssign = () => {
    const result = autoAssignSeats(exam.id);
    if (result.success) {
      // Reload assignments
      const updated = {};
      registrations.forEach(reg => {
        const seat = getSeatByExamAndStudent(exam.id, reg.studentId);
        if (seat) {
          updated[reg.studentId] = seat.seatNumber;
        }
      });
      setAssignments(updated);
      alert(`Successfully assigned ${result.assigned} seats`);
    } else {
      alert(result.message || 'Auto-assignment failed');
    }
  };

  const handleManualAssign = (studentId, seatNumber) => {
    setAssignments(prev => ({
      ...prev,
      [studentId]: seatNumber
    }));
  };

  const handleSave = () => {
    // Save all assignments
    Object.entries(assignments).forEach(([studentId, seatNumber]) => {
      if (seatNumber) {
        assignSeat(exam.id, studentId, seatNumber, selectedHall);
      }
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-[#1162d4] text-white px-6 py-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="material-symbols-outlined mr-2">event_seat</span>
            Seat Assignment - {exam.name}
          </h2>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Hall Selection & Auto-assign */}
          <div className="mb-6 bg-slate-50 p-4 rounded-lg">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Exam Hall
                </label>
                <select
                  value={selectedHall}
                  onChange={(e) => setSelectedHall(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4]"
                >
                  <option value="">Select Hall</option>
                  {halls.map((hall) => (
                    <option key={hall.id} value={hall.name}>
                      {hall.name} (Capacity: {hall.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAutoAssign}
                disabled={!selectedHall}
                className="px-4 py-2 bg-[#1162d4] text-white rounded-lg hover:bg-[#1162d4]/90 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                Auto-assign Seats
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Total Students: {registrations.length} | Assigned: {Object.keys(assignments).filter(k => assignments[k]).length}
            </p>
          </div>

          {/* Student List with Seat Assignments */}
          <div className="space-y-2">
            <h3 className="font-medium text-slate-700 mb-3">Manual Seat Assignment</h3>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {registrations.map((reg) => (
                <div key={reg.id} className="flex items-center gap-4 p-3 bg-white border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{reg.studentId}</p>
                    <p className="text-sm text-slate-600">{reg.studentName}</p>
                  </div>
                  <div className="w-48">
                    <input
                      type="text"
                      value={assignments[reg.studentId] || ''}
                      onChange={(e) => handleManualAssign(reg.studentId, e.target.value)}
                      placeholder="e.g., A-15"
                      className="w-full px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4]"
                    />
                  </div>
                </div>
              ))}
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Assignments
          </button>
        </div>
      </div>
    </div>
  );
}
