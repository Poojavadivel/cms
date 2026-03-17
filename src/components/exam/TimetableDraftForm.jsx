import React, { useState } from 'react';
import { createTimetableDraft, getAllExamHalls } from '../../data/examData';
import { getUserSession } from '../../auth/sessionController';

export default function TimetableDraftForm({ onClose, onSave }) {
  const session = getUserSession();
  const [formData, setFormData] = useState({
    session: '',
    semester: '1',
    academicYear: new Date().getFullYear().toString()
  });
  const [exams, setExams] = useState([
    {
      subject: '',
      subjectCode: '',
      date: '',
      startTime: '',
      endTime: '',
      room: ''
    }
  ]);
  const [halls, setHalls] = useState([]);

  React.useEffect(() => {
    setHalls(getAllExamHalls());
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExamChange = (index, field, value) => {
    const updated = [...exams];
    updated[index][field] = value;
    setExams(updated);
  };

  const addExam = () => {
    setExams([
      ...exams,
      {
        subject: '',
        subjectCode: '',
        date: '',
        startTime: '',
        endTime: '',
        room: ''
      }
    ]);
  };

  const removeExam = (index) => {
    if (exams.length > 1) {
      setExams(exams.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.session) {
      alert('Please enter session name');
      return;
    }

    const incompleteExams = exams.filter(
      exam => !exam.subject || !exam.date || !exam.startTime || !exam.endTime || !exam.room
    );

    if (incompleteExams.length > 0) {
      alert('Please fill all exam details');
      return;
    }

    // Create draft
    const draft = {
      ...formData,
      exams,
      createdBy: session.username,
      status: 'Draft'
    };

    createTimetableDraft(draft);
    alert('Timetable draft created successfully');
    onSave();
  };

  const handleSubmitForApproval = () => {
    const draft = {
      ...formData,
      exams,
      createdBy: session.username,
      status: 'Submitted'
    };

    if (!formData.session || exams.some(e => !e.subject || !e.date || !e.startTime || !e.endTime || !e.room)) {
      alert('Please fill all required fields before submitting');
      return;
    }

    createTimetableDraft(draft);
    alert('Timetable submitted for approval');
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-[#1162d4] text-white px-6 py-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="material-symbols-outlined mr-2">edit_calendar</span>
            Create Exam Timetable Draft
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Session Info */}
          <div className="mb-6 bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium text-slate-800 mb-4">Session Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Session Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="session"
                  value={formData.session}
                  onChange={handleFormChange}
                  placeholder="e.g., Mid-Term 2024"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem.toString()}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleFormChange}
                  placeholder="2024"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Exams List */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-slate-800">Exam Schedule</h3>
              <button
                type="button"
                onClick={addExam}
                className="px-4 py-2 bg-[#1162d4] text-white rounded-lg hover:bg-[#1162d4]/90 text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Exam
              </button>
            </div>

            <div className="space-y-4">
              {exams.map((exam, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-700">Exam #{index + 1}</h4>
                    {exams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExam(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={exam.subject}
                        onChange={(e) => handleExamChange(index, 'subject', e.target.value)}
                        placeholder="e.g., Mathematics"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Subject Code
                      </label>
                      <input
                        type="text"
                        value={exam.subjectCode}
                        onChange={(e) => handleExamChange(index, 'subjectCode', e.target.value)}
                        placeholder="e.g., MATH101"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={exam.date}
                        onChange={(e) => handleExamChange(index, 'date', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={exam.startTime}
                        onChange={(e) => handleExamChange(index, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        End Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={exam.endTime}
                        onChange={(e) => handleExamChange(index, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Hall <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={exam.room}
                        onChange={(e) => handleExamChange(index, 'room', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                        required
                      >
                        <option value="">Select Hall</option>
                        {halls.map((hall) => (
                          <option key={hall.id} value={hall.name}>
                            {hall.name} (Cap: {hall.capacity})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Save as Draft
            </button>
            <button
              type="button"
              onClick={handleSubmitForApproval}
              className="px-4 py-2 bg-[#1162d4] text-white rounded-lg hover:bg-[#1162d4]/90 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              Submit for Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
