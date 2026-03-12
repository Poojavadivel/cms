import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { getUserSession } from '../auth/sessionController'

const initialData = [
  { name: 'Johnathan Doe', company: 'Google',    role: 'SWE Intern',     package: '$12,000/yr', status: 'Selected', date: '2023-11-05'  },
  { name: 'Alice Smith',   company: 'Microsoft', role: 'Cloud Intern',   package: '$10,500/yr', status: 'Selected', date: '2023-11-08'  },
  { name: 'Michael Ross',  company: 'Amazon',    role: 'Data Analyst',   package: '$9,000/yr',  status: 'Process',  date: '2023-12-01'  },
  { name: 'Elena Lopez',   company: 'Figma',     role: 'Design Intern',  package: '$8,500/yr',  status: 'Process',  date: '2023-12-03'  },
  { name: 'David Kim',     company: 'Stripe',    role: 'Backend Intern', package: '$11,000/yr', status: 'Selected', date: '2023-11-20' },
]

const emptyForm = { name: '', company: '', role: '', package: '', status: 'Selected', date: '' }

export default function PlacementPage({ noLayout = false }) {
  const session = getUserSession()
  const role = session?.role || 'student'
  const isAdmin = role === 'admin'

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

  const visibleEntries = entries

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
    if (e) e.preventDefault()
    setEntries(prev => [...prev, form])
    setForm(emptyForm)
    setShowModal(false)
  }

  const getPackageValue = (pkg) => parseInt(pkg.replace(/[^\d]/g, ''))

  const getFilteredAndSortedEntries = () => {
    let filtered = visibleEntries.filter(e => {
      const searchMatch = e.name.toLowerCase().includes(searchQuery.toLowerCase())
      const statusMatch = statusFilter === 'All' || e.status === statusFilter
      const companyMatch = companyFilter === 'All' || e.company === companyFilter
      const pkg = getPackageValue(e.package)
      let packageMatch = true
      if (packageRange === '8k-10k') packageMatch = pkg >= 8000 && pkg < 10000
      else if (packageRange === '10k-12k') packageMatch = pkg >= 10000 && pkg < 12000
      else if (packageRange === '12k+') packageMatch = pkg >= 12000
      return searchMatch && statusMatch && companyMatch && packageMatch
    })
    return filtered.sort((a, b) => {
      if (sortBy === 'package-high') return getPackageValue(b.package) - getPackageValue(a.package)
      if (sortBy === 'package-low') return getPackageValue(a.package) - getPackageValue(b.package)
      if (sortBy === 'date-new') return new Date(b.date) - new Date(a.date)
      if (sortBy === 'date-old') return new Date(a.date) - new Date(b.date)
      return 0
    })
  }

  const inputClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/10 focus:border-[#1162d4] outline-none transition-all text-sm text-slate-700 bg-white";
  const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-0.5";

  const inner = (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Placement Tracker</h1>
          <p className="text-slate-500 mt-1">Campus Recruitment — Batch 2024</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add</span>Add Entry
          </button>
        )}
      </div>

      {/* Stats Cards */}
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
            <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-20 origin-top-right overflow-hidden">
              <div className="flex border-b border-slate-200 bg-slate-50">
                {['status', 'company', 'package', 'sort'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                      filterTab === tab ? 'bg-white text-[#1162d4] border-b-2 border-[#1162d4]' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >{tab}</button>
                ))}
              </div>
              <div className="p-4">
                {filterTab === 'status' && (
                  <div className="space-y-2">
                    {['All', 'Selected', 'Process'].map(opt => (
                      <button key={opt} onClick={() => setStatusFilter(opt)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          statusFilter === opt ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}>
                        {opt !== 'All' && <span className={`w-2.5 h-2.5 rounded-full ${opt === 'Selected' ? 'bg-green-500' : 'bg-orange-500'}`} />}
                        {opt}
                        {statusFilter === opt && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                      </button>
                    ))}
                  </div>
                )}
                {filterTab === 'company' && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {['All', ...Array.from(new Set(visibleEntries.map(e => e.company)))].map(company => (
                      <button key={company} onClick={() => setCompanyFilter(company)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          companyFilter === company ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}>
                        {company === 'All' ? 'All Companies' : company}
                        {companyFilter === company && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                      </button>
                    ))}
                  </div>
                )}
                {filterTab === 'package' && (
                  <div className="space-y-2">
                    {[{value:'All',label:'All Packages'},{value:'8k-10k',label:'$8k - $10k'},{value:'10k-12k',label:'$10k - $12k'},{value:'12k+',label:'$12k+'}].map(opt => (
                      <button key={opt.value} onClick={() => setPackageRange(opt.value)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          packageRange === opt.value ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}>
                        {opt.label}
                        {packageRange === opt.value && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                      </button>
                    ))}
                  </div>
                )}
                {filterTab === 'sort' && (
                  <div className="space-y-2">
                    {[{value:'package-high',label:'Highest Package First'},{value:'package-low',label:'Lowest Package First'},{value:'date-new',label:'Newest First'},{value:'date-old',label:'Oldest First'}].map(opt => (
                      <button key={opt.value} onClick={() => setSortBy(opt.value)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          sortBy === opt.value ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}>
                        {opt.label}
                        {sortBy === opt.value && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-slate-200 p-3">
                <button
                  onClick={() => { setStatusFilter('All'); setCompanyFilter('All'); setPackageRange('All'); setSortBy('date-new') }}
                  className="w-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-base mr-1 align-middle">restart_alt</span>Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Placement Table */}
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
                    p.status === 'Selected' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Placement Entry"
        icon="work"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              onClick={() => setShowModal(false)}
              className="px-6 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95"
            >
              Add Entry
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className={labelClasses}>Student Name *</label>
            <input
              type="text" name="name" value={form.name} onChange={handleChange} required
              placeholder="e.g., John Doe" className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Company *</label>
            <input
              type="text" name="company" value={form.company} onChange={handleChange} required
              placeholder="e.g., Google" className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Role *</label>
            <input
              type="text" name="role" value={form.role} onChange={handleChange} required
              placeholder="e.g., SWE Intern" className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Package *</label>
            <input
              type="text" name="package" value={form.package} onChange={handleChange} required
              placeholder="e.g., $12,000/yr" className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Date *</label>
            <input
              type="date" name="date" value={form.date} onChange={handleChange} required
              className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Status *</label>
            <select
              name="status" value={form.status} onChange={handleChange} required
              className={inputClasses}
            >
              <option value="Selected">Selected</option>
              <option value="Process">In Process</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Modal>
    </>
  )
  return noLayout ? inner : <Layout title="Placement">{inner}</Layout>
}
