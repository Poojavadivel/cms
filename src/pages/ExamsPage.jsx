import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { getUserSession } from '../auth/sessionController'
import Modal from '../components/Modal'

const initialExamsData = [
  { id: 1, code: 'CS401', name: 'Data Structures',      date: '2023-12-10', time: '10:00', room: 'Hall A',    type: 'Mid-Sem',  status: 'Upcoming', duration: '120', maxMarks: '100' },
  { id: 2, code: 'MA405', name: 'Discrete Mathematics', date: '2023-12-12', time: '09:00', room: 'Hall B',    type: 'Mid-Sem',  status: 'Upcoming', duration: '120', maxMarks: '100' },
  { id: 3, code: 'CS403', name: 'Database Systems',     date: '2023-11-28', time: '11:00', room: 'Lab 2',     type: 'Practical',status: 'Completed', duration: '180', maxMarks: '50' },
  { id: 4, code: 'HU102', name: 'Tech Writing',         date: '2023-12-15', time: '14:00', room: 'Room 101',  type: 'Internal', status: 'Upcoming', duration: '90', maxMarks: '50' },
  { id: 5, code: 'CS406', name: 'Operating Systems',    date: '2023-11-20', time: '10:00', room: 'Room 304',  type: 'Quiz',     status: 'Completed', duration: '60', maxMarks: '25' },
]

export default function ExamsPage({ noLayout = false }) {
  const session = getUserSession()
  const isStudent = session?.role === 'student'
  const [exams, setExams] = useState(initialExamsData)
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

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    
    if (editingExam) {
      // Update existing exam
      setExams(exams.map(exam => 
        exam.id === editingExam.id ? { ...formData, id: exam.id } : exam
      ))
    } else {
      // Add new exam
      const newExam = {
        ...formData,
        id: Math.max(...exams.map(e => e.id), 0) + 1
      }
      setExams([...exams, newExam])
    }
    
    closeModal()
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      setExams(exams.filter(exam => exam.id !== id))
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

  const inputClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/10 focus:border-[#1162d4] outline-none transition-all text-sm text-slate-700 bg-white";
  const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-0.5";

  const inner = (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Exam Schedule</h1>
          <p className="text-slate-500 mt-1">Department of Computer Science — Semester 4</p>
        </div>
        {!isStudent && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">calendar_add_on</span>
            Schedule Exam
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
            {exams.length === 0 ? (
              <tr>
                <td colSpan={isStudent ? 6 : 7} className="px-6 py-12 text-center text-slate-500">
                  <span className="material-symbols-outlined text-5xl mb-2 opacity-20">quiz</span>
                  <p className="text-sm">{isStudent ? 'No exams scheduled yet.' : 'No exams scheduled yet. Click "Schedule Exam" to add one.'}</p>
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
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
                        onClick={() => handleDelete(exam.id)}
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
              className="px-6 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95"
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
    </>
  )
  return noLayout ? inner : <Layout title="Exams">{inner}</Layout>
}
