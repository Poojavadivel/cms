import { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import { getUserSession } from '../auth/sessionController'
import Modal from '../components/Modal'
import MarksEntryModal from '../components/exam/MarksEntryModal'
import HallTicket from '../components/exam/HallTicket'
import ExamSessionModal from '../components/exam/ExamSessionModal'
import TimetableDraftForm from '../components/exam/TimetableDraftForm'
import InvigilatorAssignModal from '../components/exam/InvigilatorAssignModal'
import RevaluationModal from '../components/exam/RevaluationModal'
import ExamReportModal from '../components/exam/ExamReportModal'
import AttendanceModal from '../components/exam/AttendanceModal'
import SeatAssignmentModal from '../components/exam/SeatAssignmentModal'
import InternalMarksModal from '../components/exam/InternalMarksModal'
import TimetableApprovalModal from '../components/exam/TimetableApprovalModal'
import NotificationPanel from '../components/exam/NotificationPanel'
import { initializeExamData, getAllExams } from '../data/examData'

export default function ExamsPage({ noLayout = false }) {
  const session = getUserSession()
  const isStudent = session?.role === 'student'
  const isFaculty = session?.role === 'faculty'
  const isAdmin = session?.role === 'admin'
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    date: '',
    time: '',
    room: '',
    type: 'Mid-Sem',
    status: 'Upcoming',
    duration: '',
    maxMarks: ''
  })
  
  // Modal states for exam features
  const [showMarksEntryModal, setShowMarksEntryModal] = useState(false)
  const [showHallTicket, setShowHallTicket] = useState(false)
  const [showExamSessionModal, setShowExamSessionModal] = useState(false)
  const [showTimetableDraftForm, setShowTimetableDraftForm] = useState(false)
  const [showInvigilatorModal, setShowInvigilatorModal] = useState(false)
  const [showRevaluationModal, setShowRevaluationModal] = useState(false)
  const [showExamReportModal, setShowExamReportModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showSeatAssignmentModal, setShowSeatAssignmentModal] = useState(false)
  const [showInternalMarksModal, setShowInternalMarksModal] = useState(false)
  const [showTimetableApprovalModal, setShowTimetableApprovalModal] = useState(false)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  
  // Initialize exam data on mount
  useEffect(() => {
    initializeExamData()
  }, [])

  // Handle exam registration
  const handleRegister = (examId) => {
    setExams(exams.map(exam => 
      (exam._id || exam.id) === examId ? { ...exam, registered: true } : exam
    ));
    alert('Successfully registered for the exam!');
  }

  // Handle opening unified hall ticket
  const handleOpenAllHallTickets = () => {
    // Get all registered exams
    const registeredExams = exams.filter(e => e.registered);
    if (registeredExams.length === 0) {
      alert('No exams registered yet.');
      return;
    }
    // For now, open hall ticket with first exam (can be enhanced to show all)
    setSelectedExam(registeredExams[0]);
    setShowHallTicket(true);
  }

  // Fetch exams from backend
  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    const localSampleExams = getAllExams()

    try {
      const res = await fetch('/api/exams')
      const raw = await res.text()
      const json = raw ? JSON.parse(raw) : null

      if (res.ok && json?.success && Array.isArray(json.data) && json.data.length > 0) {
        setExams(json.data)
      } else {
        setExams(localSampleExams)
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err)
      setExams(localSampleExams)
    } finally {
      setLoading(false)
    }
  }

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const upcoming = exams.filter(e => e.status === 'Upcoming').length
    const completed = exams.filter(e => e.status === 'Completed').length
    const pending = exams.filter(e => e.status === 'Upcoming' && new Date(e.date) < new Date()).length
    
    return { upcoming, completed, pending }
  }, [exams])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const openAddModal = () => {
    setEditingExam(null)
    setFormData({
      code: '',
      name: '',
      date: '',
      time: '',
      room: '',
      type: 'Mid-Sem',
      status: 'Upcoming',
      duration: '',
      maxMarks: ''
    })
    setShowModal(true)
  }

  const openEditModal = (exam) => {
    setEditingExam(exam)
    setFormData({ ...exam })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingExam(null)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    try {
      if (editingExam) {
        const res = await fetch(`/api/exams/${editingExam._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, senderRole: session?.role || 'faculty' })
        })
        const json = await res.json()
        if (json.success) {
          const editingId = editingExam._id || editingExam.id
          setExams(exams.map(exam => (exam._id || exam.id) === editingId ? json.data : exam))
        }
      } else {
        const res = await fetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, senderRole: session?.role || 'faculty' })
        })
        const json = await res.json()
        if (json.success) {
          setExams([...exams, json.data])
        }
      }
    } catch (err) {
      console.error('Failed to save exam:', err)
    }
    
    closeModal()
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      try {
        const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' })
        const json = await res.json()
        if (json.success) {
          setExams(exams.filter(exam => (exam._id || exam.id) !== id))
        }
      } catch (err) {
        console.error('Failed to delete exam:', err)
      }
    }
  }
  
  // Handlers for exam feature modals
  const handleOpenMarksEntry = (exam) => {
    setSelectedExam(exam)
    setShowMarksEntryModal(true)
  }
  
  const handleOpenHallTicket = (exam) => {
    setSelectedExam(exam)
    setShowHallTicket(true)
  }
  
  const handleOpenInvigilatorAssign = (exam) => {
    setSelectedExam(exam)
    setShowInvigilatorModal(true)
  }
  
  const handleOpenRevaluation = (exam) => {
    setSelectedExam(exam)
    setShowRevaluationModal(true)
  }
  
  const handleOpenExamReport = (exam) => {
    setSelectedExam(exam)
    setShowExamReportModal(true)
  }
  
  const handleOpenAttendance = (exam) => {
    setSelectedExam(exam)
    setShowAttendanceModal(true)
  }
  
  const handleOpenSeatAssignment = (exam) => {
    setSelectedExam(exam)
    setShowSeatAssignmentModal(true)
  }
  
  const handleOpenInternalMarks = (exam) => {
    setSelectedExam(exam)
    setShowInternalMarksModal(true)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const inputClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/10 focus:border-[#1162d4] outline-none transition-all text-sm text-slate-700 bg-white";
  const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-0.5";

  const inner = (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-slate-500 mt-1">Department of Computer Science — Semester 4</p>
        </div>
        <div className="flex items-center gap-2">
          {isStudent && (
            <button 
              onClick={handleOpenAllHallTickets}
              className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">badge</span>
              Download Hall Tickets
            </button>
          )}
          {isAdmin && (
            <>
              <button 
                onClick={() => setShowExamSessionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-all"
              >
                <span className="material-symbols-outlined text-lg">calendar_month</span>
                Manage Sessions
              </button>
              <button 
                onClick={() => setShowTimetableDraftForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-all"
              >
                <span className="material-symbols-outlined text-lg">draft</span>
                Create Timetable
              </button>
              <button 
                onClick={() => setShowTimetableApprovalModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-all"
              >
                <span className="material-symbols-outlined text-lg">approval</span>
                Approve Timetables
              </button>
            </>
          )}
          {(isAdmin || isFaculty) && (
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">calendar_add_on</span>
              Schedule Exam
            </button>
          )}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: 'event_upcoming', label: 'Upcoming Exams',  value: stats.upcoming, color: 'text-[#1162d4] bg-[#1162d4]/10' },
          { icon: 'check_circle',   label: 'Completed',       value: stats.completed, color: 'text-emerald-600 bg-emerald-100' },
          { icon: 'pending',        label: 'Results Pending', value: stats.pending, color: 'text-orange-600 bg-orange-100' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Exams Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Room</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Status</th>
              {isStudent && <th className="px-6 py-4 text-center">Score</th>}
              {isStudent && <th className="px-6 py-4 text-center">Register</th>}
              {isStudent && <th className="px-6 py-4 text-center">Revaluation</th>}
              {!isStudent && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={isStudent ? 9 : 7} className="px-6 py-12 text-center text-slate-500">
                  <span className="material-symbols-outlined text-5xl mb-2 opacity-20">quiz</span>
                  <p className="text-sm">Loading exams...</p>
                </td>
              </tr>
            ) : exams.length === 0 ? (
              <tr>
                <td colSpan={isStudent ? 9 : 7} className="px-6 py-12 text-center text-slate-500">
                  <span className="material-symbols-outlined text-5xl mb-2 opacity-20">quiz</span>
                  <p className="text-sm">{isStudent ? 'No exams scheduled yet.' : 'No exams scheduled yet. Click "Schedule Exam" to add one.'}</p>
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam._id || exam.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-[#1162d4] uppercase">{exam.code}</p>
                    <p className="text-sm font-semibold text-slate-900">{exam.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{formatDate(exam.date)}</p>
                    <p className="text-xs text-slate-500">{formatTime(exam.time)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{exam.room}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {exam.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{exam.duration} min</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      exam.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                      exam.status === 'Upcoming' ? 'bg-blue-50 text-[#1162d4]' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {exam.status}
                    </span>
                  </td>
                  {/* Student Columns */}
                  {isStudent && (
                    <>
                      <td className="px-6 py-4 text-center">
                        {exam.resultsPublished && exam.marks !== undefined ? (
                          <div>
                            <p className="text-lg font-bold text-slate-900">{exam.marks}/{exam.maxMarks}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              exam.grade === 'A+' || exam.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                              exam.grade === 'B+' || exam.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              Grade: {exam.grade}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {exam.status === 'Upcoming' && !exam.registered ? (
                          <button
                            onClick={() => handleRegister(exam._id || exam.id)}
                            className="px-3 py-1.5 bg-[#1162d4] text-white rounded-lg text-xs font-semibold hover:bg-[#1162d4]/90 transition-all"
                          >
                            Register
                          </button>
                        ) : exam.registered ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                            Registered
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {exam.status === 'Completed' && exam.resultsPublished ? (
                          <button
                            onClick={() => handleOpenRevaluation(exam)}
                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-all"
                            title="Apply for Revaluation"
                          >
                            Apply
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </>
                  )}
                  {/* Faculty/Admin Actions */}
                  {!isStudent && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      
                      {/* Faculty Actions */}
                      {isFaculty && (
                        <>
                          <button
                            onClick={() => handleOpenInternalMarks(exam)}
                            className="p-1.5 text-slate-400 hover:text-[#1162d4] hover:bg-[#1162d4]/10 rounded-lg transition-colors"
                            title="Internal Marks"
                          >
                            <span className="material-symbols-outlined text-lg">assignment</span>
                          </button>
                          <button
                            onClick={() => handleOpenMarksEntry(exam)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Enter Marks"
                          >
                            <span className="material-symbols-outlined text-lg">edit_note</span>
                          </button>
                          <button
                            onClick={() => handleOpenAttendance(exam)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Mark Attendance"
                          >
                            <span className="material-symbols-outlined text-lg">fact_check</span>
                          </button>
                          <button
                            onClick={() => handleOpenExamReport(exam)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Report"
                          >
                            <span className="material-symbols-outlined text-lg">assessment</span>
                          </button>
                          <button
                            onClick={() => openEditModal(exam)}
                            className="p-1.5 text-slate-400 hover:text-[#1162d4] hover:bg-[#1162d4]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                        </>
                      )}
                      
                      {/* Admin Actions */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenSeatAssignment(exam)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Seat Assignment"
                          >
                            <span className="material-symbols-outlined text-lg">event_seat</span>
                          </button>
                          <button
                            onClick={() => handleOpenInvigilatorAssign(exam)}
                            className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="Assign Invigilators"
                          >
                            <span className="material-symbols-outlined text-lg">person_add</span>
                          </button>
                          <button
                            onClick={() => handleOpenExamReport(exam)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Report"
                          >
                            <span className="material-symbols-outlined text-lg">assessment</span>
                          </button>
                          <button
                            onClick={() => openEditModal(exam)}
                            className="p-1.5 text-slate-400 hover:text-[#1162d4] hover:bg-[#1162d4]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(exam._id || exam.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingExam ? 'Edit Exam' : 'Schedule New Exam'}
        icon="calendar_add_on"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              onClick={closeModal}
              className="btn-secondary-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary-sm"
            >
              {editingExam ? 'Save Changes' : 'Schedule Exam'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className={labelClasses}>Course Code *</label>
            <input
              type="text" name="code" value={formData.code} onChange={handleInputChange} required
              placeholder="e.g., CS401" className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Course Name *</label>
            <input
              type="text" name="name" value={formData.name} onChange={handleInputChange} required
              placeholder="e.g., Data Structures" className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Date *</label>
            <input
              type="date" name="date" value={formData.date} onChange={handleInputChange} required
              className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Start Time *</label>
            <input
              type="time" name="time" value={formData.time} onChange={handleInputChange} required
              className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Room / Venue *</label>
            <input
              type="text" name="room" value={formData.room} onChange={handleInputChange} required
              placeholder="e.g., Hall A" className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Exam Type</label>
            <select name="type" value={formData.type} onChange={handleInputChange} className={inputClasses}>
              <option value="Mid-Sem">Mid-Semester</option>
              <option value="End-Sem">End-Semester</option>
              <option value="Practical">Practical</option>
              <option value="Internal">Internal Assessment</option>
              <option value="Quiz">Quiz</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Duration (mins)</label>
            <input
              type="number" name="duration" value={formData.duration} onChange={handleInputChange}
              className={inputClasses} placeholder="e.g., 120"
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Maximum Marks</label>
            <input
              type="number" name="maxMarks" value={formData.maxMarks} onChange={handleInputChange}
              className={inputClasses} placeholder="e.g., 100"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className={labelClasses}>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className={inputClasses}>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Exam Module Components */}
      {showMarksEntryModal && selectedExam && (
        <MarksEntryModal
          isOpen={showMarksEntryModal}
          onClose={() => setShowMarksEntryModal(false)}
          exam={selectedExam}
          currentUserId={session?.userId}
        />
      )}

      {showHallTicket && selectedExam && (
        <HallTicket
          exam={selectedExam}
          studentInfo={{
            name: session?.name || 'Student Name',
            rollNo: session?.userId || 'N/A',
            department: session?.team || 'Computer Science',
            semester: '4',
            photo: null
          }}
          onClose={() => setShowHallTicket(false)}
        />
      )}

      {showExamSessionModal && (
        <ExamSessionModal
          onClose={() => setShowExamSessionModal(false)}
          onSave={() => {
            setShowExamSessionModal(false);
          }}
        />
      )}

      {showTimetableDraftForm && (
        <TimetableDraftForm
          onClose={() => setShowTimetableDraftForm(false)}
          onSave={() => {
            setShowTimetableDraftForm(false);
          }}
        />
      )}

      {showInvigilatorModal && selectedExam && (
        <InvigilatorAssignModal
          isOpen={showInvigilatorModal}
          onClose={() => setShowInvigilatorModal(false)}
          exam={selectedExam}
          currentUserId={session?.userId}
        />
      )}

      {showRevaluationModal && selectedExam && (
        <RevaluationModal
          isOpen={showRevaluationModal}
          onClose={() => setShowRevaluationModal(false)}
          exam={selectedExam}
          studentId={session?.userId}
          studentName={session?.name || 'Student Name'}
        />
      )}

      {showExamReportModal && selectedExam && (
        <ExamReportModal
          isOpen={showExamReportModal}
          onClose={() => setShowExamReportModal(false)}
          exam={selectedExam}
        />
      )}

      {showAttendanceModal && selectedExam && (
        <AttendanceModal
          exam={selectedExam}
          onClose={() => setShowAttendanceModal(false)}
          onSave={() => {
            setShowAttendanceModal(false);
          }}
        />
      )}

      {showSeatAssignmentModal && selectedExam && (
        <SeatAssignmentModal
          exam={selectedExam}
          onClose={() => setShowSeatAssignmentModal(false)}
          onSave={() => {
            setShowSeatAssignmentModal(false);
          }}
        />
      )}

      {showInternalMarksModal && selectedExam && (
        <InternalMarksModal
          exam={selectedExam}
          onClose={() => setShowInternalMarksModal(false)}
          onSave={() => {
            setShowInternalMarksModal(false);
          }}
        />
      )}

      {showTimetableApprovalModal && (
        <TimetableApprovalModal
          onClose={() => setShowTimetableApprovalModal(false)}
          onApprove={() => {
            setShowTimetableApprovalModal(false);
          }}
        />
      )}

      {showNotificationPanel && (
        <NotificationPanel
          studentId={session?.userId}
          isOpen={showNotificationPanel}
          onClose={() => setShowNotificationPanel(false)}
        />
      )}
    </>
  )
  return noLayout ? inner : <Layout title="Exams">{inner}</Layout>
}
