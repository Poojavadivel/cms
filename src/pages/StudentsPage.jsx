import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import SearchFilter from '../components/SearchFilter'
import StudentTable from '../components/StudentTable'
import AddStudentModal from '../components/AddStudentModal'
import { fetchStudents, createStudent } from '../api/studentsApi'

export default function StudentsPage() {
  const [studentsList, setStudentsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const itemsPerPage = 8

  useEffect(() => {
    fetchStudents().then(data => {
      setStudentsList(data)
      setLoading(false)
    })
  }, [])

  const total = studentsList.length
  const active = studentsList.filter(s => s.status === 'Active').length
  const stats = { total, active }

  // Filter logic
  const filtered = studentsList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSearch = (val) => { setSearchQuery(val); setCurrentPage(1) }

  const handleEnrollSuccess = async (newStudent) => {
    const enrichedStudent = {
      ...newStudent,
      cgpa: 0.0,
      attendancePct: 0,
      feeStatus: 'Pending',
      status: 'Active',
      semester: newStudent.semester || '1',
      avatar: newStudent.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newStudent.name)}&background=4f46e5&color=fff`
    }
    const saved = await createStudent(enrichedStudent)
    setStudentsList(prev => [saved, ...prev])
    setIsModalOpen(false)
    setCurrentPage(1)
  }

  return (
    <Layout title="Students">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Manage and monitor comprehensive student enrollment records.</p>
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hidden xl:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Last Updated</p>
          <p className="text-xs font-semibold text-slate-600">March 12, 2026 • 10:25 AM</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon="group" label="Total Students" value={stats.total.toLocaleString()} color="blue" />
        <StatCard icon="bolt" label="Active Today" value={stats.active.toLocaleString()} color="green" trend="Live Updates" />
        <StatCard icon="person_add" label="New Admissions" value="45" color="purple" trend="+12% from last month" />
      </div>

      {/* Search / Filter Toolbar */}
      <div className="mb-6">
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onAddClick={() => setIsModalOpen(true)}
        />
      </div>

      {/* Student Table */}
      <StudentTable students={paginatedStudents} />

      {/* Add Student Modal */}
      <AddStudentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleEnrollSuccess}
      />

      {/* High-Fidelity Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4 px-4 pb-10">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-semibold text-slate-900">{filtered.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                    page === currentPage
                      ? 'bg-[#1162d4] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}
              {totalPages > 5 && <span className="text-slate-300 px-1">...</span>}
              {totalPages > 5 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                    totalPages === currentPage
                      ? 'bg-[#1162d4] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {totalPages}
                </button>
              )}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-5 py-2.5 text-xs font-bold rounded-[14px] border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
