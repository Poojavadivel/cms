import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import { getUserSession } from '../auth/sessionController'

function normalizeId(value) {
  return String(value || '').replace('#', '').trim().toUpperCase()
}

const initialData = [
  { name: 'Johnathan Doe', company: 'Google',    role: 'SWE Intern',     package: '$12,000/yr', status: 'Selected', date: 'Nov 5, 2023',  studentId: 'STU-2024-1547' },
  { name: 'Alice Smith',   company: 'Microsoft', role: 'Cloud Intern',   package: '$10,500/yr', status: 'Selected', date: 'Nov 8, 2023',  studentId: 'STU-2024-042'  },
  { name: 'Michael Ross',  company: 'Amazon',    role: 'Data Analyst',   package: '$9,000/yr',  status: 'Process',  date: 'Dec 1, 2023',  studentId: 'STU-2024-118'  },
  { name: 'Elena Lopez',   company: 'Figma',     role: 'Design Intern',  package: '$8,500/yr',  status: 'Process',  date: 'Dec 3, 2023',  studentId: 'STU-2024-089'  },
  { name: 'David Kim',     company: 'Stripe',    role: 'Backend Intern', package: '$11,000/yr', status: 'Selected', date: 'Nov 20, 2023', studentId: 'STU-2024-203'  },
]

const emptyForm = { name: '', company: '', role: '', package: '', status: 'Selected', date: '' }

export default function PlacementPage({ noLayout = false }) {
  const [entries, setEntries] = useState(initialData)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [statusFilter, setStatusFilter] = useState('All')
  const [companyFilter, setCompanyFilter] = useState('All')
  const [packageRange, setPackageRange] = useState('All')
  const [sortBy, setSortBy] = useState('date-new')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterTab, setFilterTab] = useState('status')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompaniesModal, setShowCompaniesModal] = useState(false)
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const filterRef = useRef(null)

  const session = getUserSession()
  const role = localStorage.getItem('role') || session?.role || 'student'
  const sessionUserId = localStorage.getItem('userId') || session?.userId || ''

  const visibleEntries = role === 'admin'
    ? entries
    : entries.filter(e => normalizeId(e.studentId) === normalizeId(sessionUserId))

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setEntries(prev => [...prev, form])
    setForm(emptyForm)
    setShowModal(false)
  }

  const getPackageValue = (pkg) => parseInt(pkg.replace(/[^\d]/g, ''))

  const getFilteredAndSortedEntries = () => {
    let filtered = visibleEntries.filter(e => {
      // Search filter
      const searchMatch = e.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Status filter
      const statusMatch = statusFilter === 'All' || e.status === statusFilter
      
      // Company filter
      const companyMatch = companyFilter === 'All' || e.company === companyFilter
      
      // Package range filter
      const pkg = getPackageValue(e.package)
      let packageMatch = true
      if (packageRange === '8k-10k') packageMatch = pkg >= 8000 && pkg < 10000
      else if (packageRange === '10k-12k') packageMatch = pkg >= 10000 && pkg < 12000
      else if (packageRange === '12k+') packageMatch = pkg >= 12000
      
      return searchMatch && statusMatch && companyMatch && packageMatch
    })

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'package-high') return getPackageValue(b.package) - getPackageValue(a.package)
      if (sortBy === 'package-low') return getPackageValue(a.package) - getPackageValue(b.package)
      if (sortBy === 'date-new') return new Date(b.date) - new Date(a.date)
      if (sortBy === 'date-old') return new Date(a.date) - new Date(b.date)
      return 0
    })
  }

  const inner = (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Placement Tracker</h1>
          <p className="text-slate-500 mt-1">Campus Recruitment — Batch 2024</p>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90"
          >
            <span className="material-symbols-outlined text-lg">add</span>Add Entry
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: 'emoji_events', label: 'Students Placed',   value: visibleEntries.filter(e => e.status === 'Selected').length,     color: 'text-[#1162d4] bg-[#1162d4]/10', clickable: true },
          { icon: 'business',    label: 'Companies Visited',  value: new Set(visibleEntries.map(e => e.company)).size,               color: 'text-purple-600 bg-purple-100', clickable: true },
          { icon: 'attach_money', label: 'Avg. Package',       value: '$10.2k',                                                color: 'text-emerald-600 bg-emerald-100', clickable: true },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() => {
              if (s.label === 'Students Placed') setShowStudentsModal(true)
              else if (s.label === 'Companies Visited') setShowCompaniesModal(true)
              else if (s.label === 'Avg. Package') setShowPackageModal(true)
            }}
            className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 ${
              s.clickable ? 'cursor-pointer hover:border-purple-300 hover:shadow-md transition-all' : ''
            }`}
          >
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

      {/* Search + Filter Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-3 mb-6">
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-56 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1162d4]/30 focus:border-[#1162d4] transition-all duration-200"
          />
        </div>

        {/* Filter Icon + Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
              statusFilter !== 'All' || companyFilter !== 'All' || packageRange !== 'All' || sortBy !== 'date-new'
                ? 'bg-[#1162d4] text-white border-[#1162d4] shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-20 animate-dropIn origin-top-right overflow-hidden">
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button
                  onClick={() => setFilterTab('status')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    filterTab === 'status'
                      ? 'bg-white text-[#1162d4] border-b-2 border-[#1162d4]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Status
                </button>
                <button
                  onClick={() => setFilterTab('company')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    filterTab === 'company'
                      ? 'bg-white text-[#1162d4] border-b-2 border-[#1162d4]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Company
                </button>
                <button
                  onClick={() => setFilterTab('package')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    filterTab === 'package'
                      ? 'bg-white text-[#1162d4] border-b-2 border-[#1162d4]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Package
                </button>
                <button
                  onClick={() => setFilterTab('sort')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    filterTab === 'sort'
                      ? 'bg-white text-[#1162d4] border-b-2 border-[#1162d4]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sort
                </button>
              </div>

              <div className="p-4">
                {filterTab === 'status' && (
                  <div className="space-y-2">
                    {['All', 'Selected', 'Process'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setStatusFilter(opt)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          statusFilter === opt
                            ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt !== 'All' && <span className={`w-2.5 h-2.5 rounded-full ${opt === 'Selected' ? 'bg-green-500' : 'bg-orange-500'}`} />}
                        {opt}
                        {statusFilter === opt && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                      </button>
                    ))}
                  </div>
                )}

                {filterTab === 'company' && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => setCompanyFilter('All')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                        companyFilter === 'All'
                          ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      All Companies
                      {companyFilter === 'All' && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                    </button>
                    {Array.from(new Set(visibleEntries.map(e => e.company))).map((company) => (
                      <button
                        key={company}
                        onClick={() => setCompanyFilter(company)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          companyFilter === company
                            ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {company}
                        {companyFilter === company && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                      </button>
                    ))}
                  </div>
                )}

                {filterTab === 'package' && (
                  <div className="space-y-2">
                    {[
                      { value: 'All', label: 'All Packages' },
                      { value: '8k-10k', label: '$8k - $10k' },
                      { value: '10k-12k', label: '$10k - $12k' },
                      { value: '12k+', label: '$12k+' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPackageRange(opt.value)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          packageRange === opt.value
                            ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                        {packageRange === opt.value && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                      </button>
                    ))}
                  </div>
                )}

                {filterTab === 'sort' && (
                  <div className="space-y-2">
                    {[
                      { value: 'package-high', label: 'Highest Package First' },
                      { value: 'package-low', label: 'Lowest Package First' },
                      { value: 'date-new', label: 'Newest First' },
                      { value: 'date-old', label: 'Oldest First' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          sortBy === opt.value
                            ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                        {sortBy === opt.value && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 p-3">
                <button
                  onClick={() => {
                    setStatusFilter('All')
                    setCompanyFilter('All')
                    setPackageRange('All')
                    setSortBy('date-new')
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-base mr-1 align-middle">restart_alt</span>
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Package</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {getFilteredAndSortedEntries().map((p, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{p.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{p.company}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{p.role}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{p.package}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{p.date}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    p.status === 'Selected' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Entry Modal */}
      {role === 'admin' && showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1162d4]/10 rounded-lg">
                  <span className="material-symbols-outlined text-[#1162d4]">work</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Add Placement Entry</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Student Name <span className="text-red-500">*</span></label>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange} required
                    placeholder="e.g., John Doe"
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Company <span className="text-red-500">*</span></label>
                  <input
                    type="text" name="company" value={form.company} onChange={handleChange} required
                    placeholder="e.g., Google"
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Role <span className="text-red-500">*</span></label>
                  <input
                    type="text" name="role" value={form.role} onChange={handleChange} required
                    placeholder="e.g., SWE Intern"
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Package <span className="text-red-500">*</span></label>
                  <input
                    type="text" name="package" value={form.package} onChange={handleChange} required
                    placeholder="e.g., $12,000/yr"
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date" name="date" value={form.date} onChange={handleChange} required
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Status <span className="text-red-500">*</span></label>
                  <select
                    name="status" value={form.status} onChange={handleChange} required
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                  >
                    <option value="Selected">Selected</option>
                    <option value="Process">In Process</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-colors"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Companies Modal */}
      {showCompaniesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedCompany ? (
              <>
                <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCompany(null)}
                      className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                    </button>
                    <h3 className="text-xl font-bold text-slate-900">{selectedCompany}</h3>
                  </div>
                  <button
                    onClick={() => setShowCompaniesModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-slate-400">close</span>
                  </button>
                </div>
                <div className="p-6">
                  {(() => {
                    const companyEntries = visibleEntries.filter(e => e.company === selectedCompany)
                    const studentsPlaced = companyEntries.filter(e => e.status === 'Selected').length
                    const avgPackage = companyEntries.length > 0
                      ? '$' + (companyEntries.reduce((sum, e) => {
                          const pkg = parseInt(e.package.replace(/[^\d]/g, ''))
                          return sum + pkg
                        }, 0) / companyEntries.length / 1000).toFixed(1) + 'k'
                      : '$0'
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Placements</p>
                            <p className="text-2xl font-bold text-blue-700 mt-1">{companyEntries.length}</p>
                          </div>
                          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Students Selected</p>
                            <p className="text-2xl font-bold text-green-700 mt-1">{studentsPlaced}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Avg. Package</p>
                            <p className="text-2xl font-bold text-emerald-700 mt-1">{avgPackage}</p>
                          </div>
                        </div>
                        <div className="border-t border-slate-200 pt-6">
                          <h4 className="font-semibold text-slate-900 mb-4">Students Placed at {selectedCompany}</h4>
                          <div className="space-y-3">
                            {companyEntries.map((entry, i) => (
                              <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-semibold text-slate-900">{entry.name}</p>
                                    <p className="text-sm text-slate-600">{entry.role}</p>
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    entry.status === 'Selected' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {entry.status}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                  <span>{entry.package}</span>
                                  <span>{entry.date}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </>
            ) : (
              <>
                <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                  <h3 className="text-xl font-bold text-slate-900">Companies Visited</h3>
                  <button
                    onClick={() => setShowCompaniesModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-slate-400">close</span>
                  </button>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {Array.from(new Set(visibleEntries.map(e => e.company))).map((company) => {
                      const companyCount = visibleEntries.filter(e => e.company === company).length
                      const selectedCount = visibleEntries.filter(e => e.company === company && e.status === 'Selected').length
                      return (
                        <button
                          key={company}
                          onClick={() => setSelectedCompany(company)}
                          className="w-full p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg hover:shadow-md hover:border-purple-300 transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{company}</p>
                              <p className="text-xs text-slate-600 mt-1">{companyCount} placements • {selectedCount} selected</p>
                            </div>
                            <span className="material-symbols-outlined text-purple-600">arrow_forward</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

        {/* Students Placed Modal */}
        {showStudentsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-xl font-bold text-slate-900">Students Placed</h3>
                <button
                  onClick={() => setShowStudentsModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-400">close</span>
                </button>
              </div>
              <div className="p-6">
                {(() => {
                  const placedStudents = visibleEntries.filter(e => e.status === 'Selected')
                  const avgPkg = placedStudents.length > 0
                    ? '$' + (placedStudents.reduce((sum, e) => sum + getPackageValue(e.package), 0) / placedStudents.length / 1000).toFixed(1) + 'k'
                    : '$0'
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Selected</p>
                          <p className="text-2xl font-bold text-blue-700 mt-1">{placedStudents.length}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Avg. Package</p>
                          <p className="text-2xl font-bold text-emerald-700 mt-1">{avgPkg}</p>
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="font-semibold text-slate-900 mb-4">All Placed Students</h4>
                        <div className="space-y-3">
                          {placedStudents.map((student, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-slate-900">{student.name}</p>
                                  <p className="text-sm text-slate-600 mt-1">{student.company} • {student.role}</p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Selected
                                </span>
                              </div>
                              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                <span className="font-semibold text-slate-900">{student.package}</span>
                                <span>{student.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Avg. Package Modal */}
        {showPackageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-xl font-bold text-slate-900">Package Statistics</h3>
                <button
                  onClick={() => setShowPackageModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-400">close</span>
                </button>
              </div>
              <div className="p-6">
                {(() => {
                  const allPkgs = visibleEntries.map(e => getPackageValue(e.package))
                  const avgPkg = allPkgs.length > 0 ? (allPkgs.reduce((a, b) => a + b) / allPkgs.length / 1000).toFixed(1) : 0
                  const minPkg = allPkgs.length > 0 ? (Math.min(...allPkgs) / 1000).toFixed(1) : 0
                  const maxPkg = allPkgs.length > 0 ? (Math.max(...allPkgs) / 1000).toFixed(1) : 0
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Highest</p>
                          <p className="text-2xl font-bold text-blue-700 mt-1">${maxPkg}k</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Average</p>
                          <p className="text-2xl font-bold text-purple-700 mt-1">${avgPkg}k</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
                          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Lowest</p>
                          <p className="text-2xl font-bold text-orange-700 mt-1">${minPkg}k</p>
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-6">
                        <h4 className="font-semibold text-slate-900 mb-4">All Packages (Highest to Lowest)</h4>
                        <div className="space-y-2">
                          {[...visibleEntries].sort((a, b) => getPackageValue(b.package) - getPackageValue(a.package)).map((entry, i) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{entry.name}</p>
                                <p className="text-xs text-slate-600">{entry.company}</p>
                              </div>
                              <span className="text-sm font-bold text-slate-900">{entry.package}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
    </>
  )
  return noLayout ? inner : <Layout title="Placement">{inner}</Layout>
}
