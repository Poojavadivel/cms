import { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import { getUserSession } from '../auth/sessionController'

export default function ExamsPage({ noLayout = false }) {
  const session = getUserSession()
  const isStudent = session?.role === 'student'
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

  // Fetch exams from backend
  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams')
      const json = await res.json()
      if (json.success) setExams(json.data)
    } catch (err) {
      console.error('Failed to fetch exams:', err)
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
    e.preventDefault()
    
    try {
      if (editingExam) {
        const res = await fetch(`/api/exams/${editingExam._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, senderRole: session?.role || 'faculty' })
        })
        const json = await res.json()
        if (json.success) {
          setExams(exams.map(exam => exam._id === editingExam._id ? json.data : exam))
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
          setExams(exams.filter(exam => exam._id !== id))
        }
      } catch (err) {
        console.error('Failed to delete exam:', err)
      }
    }
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

  const inner = (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-slate-500">Department of Computer Science — Semester 4</p>
        </div>
        {!isStudent && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>Schedule Exam
          </button>
        )}
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
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={isStudent ? 6 : 7} className="px-6 py-12 text-center text-slate-500">
                  <p className="text-sm">Loading exams...</p>
                </td>
              </tr>
            ) : exams.length === 0 ? (
              <tr>
                <td colSpan={isStudent ? 6 : 7} className="px-6 py-12 text-center text-slate-500">
                  <span className="material-symbols-outlined text-5xl mb-2 opacity-20">quiz</span>
                  <p className="text-sm">{isStudent ? 'No exams scheduled yet.' : 'No exams scheduled yet. Click "Schedule Exam" to add one.'}</p>
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam._id} className="hover:bg-slate-50 transition-colors">
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
                      exam.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {exam.status}
                    </span>
                  </td>
                  {!isStudent && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(exam)}
                        className="p-1.5 text-slate-400 hover:text-[#1162d4] hover:bg-[#1162d4]/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(exam._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1162d4]/10 rounded-lg">
                  <span className="material-symbols-outlined text-[#1162d4]">calendar_add_on</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingExam ? 'Edit Exam' : 'Schedule New Exam'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Course Code */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., CS401"
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>

                {/* Course Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Data Structures"
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>

                {/* Exam Date */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Exam Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>

                {/* Exam Time */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>

                {/* Room */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Room/Venue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Hall A"
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>

                {/* Exam Type */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Exam Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  >
                    <option value="Mid-Sem">Mid-Semester</option>
                    <option value="Final">Final Exam</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Practical">Practical</option>
                    <option value="Internal">Internal Assessment</option>
                    <option value="Assignment">Assignment</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    min="15"
                    max="300"
                    placeholder="e.g., 120"
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>

                {/* Max Marks */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Maximum Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="maxMarks"
                    value={formData.maxMarks}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="e.g., 100"
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>

                {/* Status */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-colors"
                >
                  {editingExam ? 'Update Exam' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
  return noLayout ? inner : <Layout title="Exams">{inner}</Layout>
}
