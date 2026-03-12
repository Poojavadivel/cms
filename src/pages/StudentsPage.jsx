import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import StudentTable from '../components/StudentTable'
import AddStudentModal from '../components/AddStudentModal'

export default function StudentsPage() {
  const [studentsList, setStudentsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const itemsPerPage = 8

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/api/students')
      if (!res.ok) throw new Error('Failed to fetch students')
      const data = await res.json()
      setStudentsList(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Could not connect to backend. Please ensure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleDelete = async (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name} (Roll: ${student.rollNumber})? This action cannot be undone.`)) {
      try {
        const res = await fetch(`http://localhost:5000/api/students/${encodeURIComponent(student.rollNumber)}`, {
          method: 'DELETE'
        })
        if (!res.ok) throw new Error('Failed to delete student')
        alert('Student deleted successfully')
        fetchStudents()
      } catch (err) {
        console.error('Delete error:', err)
        alert(`Error: ${err.message}`)
      }
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingStudent(null)
  }

  const handleSuccess = () => {
    fetchStudents()
    handleModalClose()
    setCurrentPage(1)
  }

  const getStats = () => ({
    total: studentsList.length,
    active: studentsList.filter(s => s.status === 'active' || s.status === 'Active').length
  })

  const stats = getStats()

  // Filter logic
  const filtered = studentsList.filter(s => {
    const name = s.name || ''
    const rollNumber = s.rollNumber || s.id || ''
    const email = s.email || ''
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSearch = (val) => { setSearchQuery(val); setCurrentPage(1) }

  const now = new Date()
  const lastUpdated = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) +
                      ' • ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <Layout title="Students" subtitle="Manage and monitor comprehensive student enrollment records.">

      {/* Stats Cards - MIT Connect style */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card stat-card-blue">
          <div className="stat-body">
            <div className="stat-value">{loading ? '...' : stats.total}</div>
            <div className="stat-label">Total Students</div>
            <div className="stat-sub">Across all departments</div>
          </div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-body">
            <div className="stat-value">{loading ? '...' : stats.active}</div>
            <div className="stat-label">Active Today</div>
            <div className="stat-sub">Live Updates</div>
          </div>
        </div>
        <div className="stat-card stat-card-purple">
          <div className="stat-body">
            <div className="stat-value">45</div>
            <div className="stat-label">New Admissions</div>
            <div className="stat-sub">+12% from last month</div>
          </div>
        </div>
      </div>

      {/* Search / Filter / Add Toolbar */}
      <div className="students-toolbar">
        <div className="students-search-wrap">
          <svg className="students-search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search students by name, ID, or department..."
            className="students-search-input"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="students-toolbar-actions">
          <button className="btn-secondary-sm">
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
            Filter
          </button>
          <button className="btn-secondary-sm">
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            Export
          </button>
          <button
            onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
            className="btn-primary-sm"
          >
            + Add Student
          </button>
        </div>
      </div>

      {/* Student Table / State Displays */}
      {error ? (
        <div className="content-card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.15 }}>☁️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>Connection Error</div>
          <p style={{ color: '#6b7280', maxWidth: 360, margin: '0 auto 24px' }}>{error}</p>
          <button onClick={fetchStudents} className="btn-primary-sm">
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="content-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#9ca3af' }}>Loading students...</div>
        </div>
      ) : (
        <StudentTable
          students={paginatedStudents}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Add / Edit Student Modal */}
      <AddStudentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        editStudent={editingStudent}
      />

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="students-pagination">
          <p className="students-pagination-info">
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> results
          </p>
          <div className="students-pagination-controls">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="btn-secondary-sm"
            >
              Previous
            </button>
            <div className="students-page-numbers">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`students-page-btn ${page === currentPage ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
              {totalPages > 5 && <span style={{ color: '#9ca3af', padding: '0 4px' }}>...</span>}
              {totalPages > 5 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`students-page-btn ${totalPages === currentPage ? 'active' : ''}`}
                >
                  {totalPages}
                </button>
              )}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="btn-secondary-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
