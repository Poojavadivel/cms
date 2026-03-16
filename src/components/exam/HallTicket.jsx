import { useEffect, useState } from 'react';
import { getExamById } from '../../data/examData';

export default function HallTicket({ exam, studentInfo, onClose }) {
  const [currentDate] = useState(new Date().toLocaleDateString());

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between print:hidden">
          <h3 className="text-xl font-bold text-slate-900">Hall Ticket</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg hover:bg-[#1162d4]/90 transition-colors text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-slate-400">close</span>
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6 print:p-12">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">COLLEGE MANAGEMENT SYSTEM</h1>
            <p className="text-sm text-slate-600 mt-1">Department of {exam.department}</p>
            <h2 className="text-xl font-bold text-[#1162d4] mt-3">EXAMINATION HALL TICKET</h2>
          </div>

          {/* Exam Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Exam Type</p>
              <p className="text-sm font-bold text-slate-900">{exam.type}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Academic Year</p>
              <p className="text-sm font-bold text-slate-900">{exam.year}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Semester</p>
              <p className="text-sm font-bold text-slate-900">Semester {exam.semester}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Date of Issue</p>
              <p className="text-sm font-bold text-slate-900">{currentDate}</p>
            </div>
          </div>

          {/* Student Information */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase border-b border-slate-300 pb-2">
              Student Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Student Name</p>
                <p className="text-sm font-bold text-slate-900">{studentInfo.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Roll Number</p>
                <p className="text-sm font-bold text-slate-900">{studentInfo.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Department</p>
                <p className="text-sm font-bold text-slate-900">{studentInfo.department || exam.department}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Semester</p>
                <p className="text-sm font-bold text-slate-900">Semester {studentInfo.semester || exam.semester}</p>
              </div>
            </div>
          </div>

          {/* Exam Schedule */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase border-b border-slate-300 pb-2">
              Examination Details
            </h3>
            <div className="bg-gradient-to-r from-[#1162d4]/5 to-transparent p-4 rounded-lg border border-[#1162d4]/20">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Course Code</p>
                  <p className="text-sm font-bold text-[#1162d4]">{exam.code}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Course Name</p>
                  <p className="text-sm font-bold text-slate-900">{exam.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Date</p>
                  <p className="text-sm font-bold text-slate-900">{formatDate(exam.date)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Time</p>
                  <p className="text-sm font-bold text-slate-900">{formatTime(exam.time)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Duration</p>
                  <p className="text-sm font-bold text-slate-900">{exam.duration} minutes</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Venue</p>
                  <p className="text-sm font-bold text-slate-900">{exam.room}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase border-b border-slate-300 pb-2">
              Important Instructions
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex gap-2">
                <span className="text-[#1162d4]">•</span>
                <span>Students must report to the examination hall 15 minutes before the scheduled time.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#1162d4]">•</span>
                <span>Carry this hall ticket along with your college ID card to the examination hall.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#1162d4]">•</span>
                <span>Mobile phones and electronic devices are strictly prohibited in the examination hall.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#1162d4]">•</span>
                <span>Use of unfair means will lead to cancellation of the examination.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#1162d4]">•</span>
                <span>Follow all instructions given by the invigilator during the examination.</span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end pt-8 border-t border-slate-300">
            <div>
              <p className="text-xs text-slate-500 mb-8">Student Signature</p>
              <div className="border-b border-slate-300 w-40"></div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-8">Controller of Examinations</p>
              <div className="border-b border-slate-300 w-40"></div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 pt-4">
            <p>This is a computer-generated hall ticket. No signature is required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
