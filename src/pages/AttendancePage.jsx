import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import { getUserSession } from '../auth/sessionController'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const weeklyAttendance = [
  { day: 'Mon', attendance: 92 },
  { day: 'Tue', attendance: 88 },
  { day: 'Wed', attendance: 90 },
  { day: 'Thu', attendance: 86 },
  { day: 'Fri', attendance: 94 },
]

// ─── Attendance helpers ──────────────────────────────────────────────────────
const REQUIRED_PCT = 75

function calcPct(present, total) {
  if (!total) return 0
  return Number(((present / total) * 100).toFixed(1))
}

function getRiskStatus(pct) {
  if (pct >= 85) return 'Good'
  if (pct >= 75) return 'At Risk'
  return 'Critical'
}

function getEligibilityStatus(pct) {
  return pct >= REQUIRED_PCT ? 'Eligible for Exams' : 'Low Attendance'
}

function classesNeeded(present, total) {
  return Math.max(0, Math.ceil((0.75 * total - present) / 0.25))
}

function safeClasses(present, total) {
  return Math.max(0, Math.floor(present / 0.75 - total))
}

function normalizeId(v) {
  return String(v || '').replace('#', '').trim().toUpperCase()
}
// ────────────────────────────────────────────────────────────────────────────

const studentData = [
  { name: 'John Anderson',  id: '#STU-2024-1547', course: 'Data Structures',   present: 22, total: 24 },
  { name: 'Alice Smith',    id: '#STU-2024-042',  course: 'Discrete Math',     present: 23, total: 24 },
  { name: 'Michael Ross',   id: '#STU-2024-118',  course: 'Database Systems',   present: 18, total: 24 },
  { name: 'Elena Lopez',    id: '#STU-2024-089',  course: 'Tech Writing',       present: 20, total: 24 },
  { name: 'David Kim',      id: '#STU-2024-203',  course: 'Operating Systems',  present: 21, total: 24 },
]

const staffData = [
  { name: 'Dr. Rajesh Iyer',     id: '#FAC-204',      department: 'Computer Science',       present: 18, total: 20 },
  { name: 'Lydia Brooks',        id: '#FIN-880',      department: 'Finance Office',          present: 19, total: 20 },
  { name: 'Prof. James Carter',  id: '#STF-2024-002', department: 'Mathematics',             present: 17, total: 20 },
  { name: 'Ms. Sandra Lee',      id: '#STF-2024-003', department: 'English & Tech Writing',  present: 15, total: 20 },
  { name: 'Mr. Robert Hughes',   id: '#STF-2024-004', department: 'Database Systems',        present: 19, total: 20 },
  { name: 'Dr. Fatima Noor',     id: '#STF-2024-005', department: 'Operating Systems',       present: 14, total: 20 },
]

function AttendanceTable({ data, type, isAdmin }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            <th className="px-6 py-4">{type === 'staff' ? 'Staff Member' : 'Student'}</th>
            <th className="px-6 py-4">{type === 'staff' ? 'Department' : 'Course'}</th>
            <th className="px-6 py-4">Days Attended</th>
            <th className="px-6 py-4">Attendance %</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">No records found</td>
            </tr>
          )}
          {data.map((s, i) => {
            const pct     = calcPct(s.present, s.total)
            const risk    = getRiskStatus(pct)
            const isStaff = type === 'staff'
            const statusLabel = isStaff
              ? (pct >= 75 ? 'Regular Attendance' : 'Irregular Attendance')
              : getEligibilityStatus(pct)
            const statusGreen = pct >= 75
            const needed  = classesNeeded(s.present, s.total)
            const safe    = safeClasses(s.present, s.total)
            return (
              <tr
                key={s.id}
                className="hover:bg-slate-50 transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.id}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{isStaff ? s.department : s.course}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1162d4] transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600">{s.present}/{s.total}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Progress: {pct}%</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold">{pct}%</p>
                  <p className={`text-xs mt-1 font-medium ${statusGreen ? 'text-green-700' : 'text-red-600'}`}>
                    {statusLabel}
                  </p>
                  {!statusGreen ? (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isStaff ? `Attend ${needed} more sessions to reach 75%.` : `Attend ${needed} more classes to reach 75%.`}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isStaff ? `Can miss ${safe} more sessions and stay ≥75%.` : `Can miss ${safe} more and still stay ≥75%.`}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  {isAdmin ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      risk === 'Good'    ? 'bg-green-100 text-green-800'   :
                      risk === 'At Risk' ? 'bg-orange-100 text-orange-800' :
                                          'bg-red-100 text-red-800'
                    }`}>{risk}</span>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusGreen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>{statusLabel}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function AttendancePage({ noLayout = false }) {
  const session       = getUserSession()
  const role          = session?.role || 'student'
  const sessionUserId = session?.userId || ''
  const isAdmin       = role === 'admin'
  const isStudent     = role === 'student'

  const [activeTab,    setActiveTab]    = useState('students')
  const [statusFilter, setStatusFilter] = useState('All')
  const [filterOpen,   setFilterOpen]   = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const filterRef = useRef(null)

  // Scope records: non-admin sees only their own row
  const scopedStudents = isAdmin
    ? studentData
    : studentData.filter(e => normalizeId(e.id) === normalizeId(sessionUserId))

  const scopedStaff = isAdmin
    ? staffData
    : staffData.filter(e => normalizeId(e.id) === normalizeId(sessionUserId))

  const currentTabData   = isStudent ? scopedStudents : (isAdmin ? (activeTab === 'students' ? scopedStudents : scopedStaff) : scopedStaff)
  const currentTableType = isStudent ? 'student'      : (isAdmin ? (activeTab === 'students' ? 'student' : 'staff') : 'staff')

  const filterOptions = isAdmin
    ? ['All', 'Good', 'At Risk', 'Critical']
    : ['All', 'Eligible for Exams', 'Low Attendance']

  const filteredData = currentTabData.filter(s => {
    const pct = calcPct(s.present, s.total)
    const statusMatch = statusFilter === 'All' ||
      (isAdmin ? getRiskStatus(pct) === statusFilter : getEligibilityStatus(pct) === statusFilter)
    return statusMatch && s.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const inner = (
    <>
      {isAdmin && (
        <div className="flex justify-start mb-6">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90">
            <span className="material-symbols-outlined text-lg">download</span>Export Report
          </button>
        </div>
      )}

      {/* ── 1. ATTENDANCE SUMMARY CARDS ─────────────────────────────────── */}
      {(() => {
        if (isStudent) {
          const my = scopedStudents[0]
          if (!my) return null
          const pct      = calcPct(my.present, my.total)
          const canMiss  = safeClasses(my.present, my.total)
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl text-[#1162d4] bg-[#1162d4]/10">
                  <span className="material-symbols-outlined">calendar_today</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Classes</p>
                  <p className="text-2xl font-bold text-slate-900">{my.total}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl text-purple-600 bg-purple-100">
                  <span className="material-symbols-outlined">percent</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Attendance %</p>
                  <p className="text-2xl font-bold text-slate-900">{pct}%</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl text-emerald-600 bg-emerald-100">
                  <span className="material-symbols-outlined">event_available</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Classes Can Miss</p>
                  <p className="text-2xl font-bold text-slate-900">{canMiss}</p>
                </div>
              </div>
            </div>
          )
        }
        // Faculty / Admin view
        const allS        = studentData
        const avgPct      = allS.length
          ? Number((allS.reduce((acc, s) => acc + calcPct(s.present, s.total), 0) / allS.length).toFixed(1))
          : 0
        const below75     = allS.filter(s => calcPct(s.present, s.total) < 75).length
        const totalTaken  = allS.length > 0 ? allS[0].total : 0
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl text-[#1162d4] bg-[#1162d4]/10">
                <span className="material-symbols-outlined">school</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Classes Taken</p>
                <p className="text-2xl font-bold text-slate-900">{totalTaken}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl text-purple-600 bg-purple-100">
                <span className="material-symbols-outlined">bar_chart</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Average Attendance %</p>
                <p className="text-2xl font-bold text-slate-900">{avgPct}%</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl text-red-500 bg-red-100">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Students Below 75%</p>
                <p className="text-2xl font-bold text-slate-900">{below75}</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── 2. WEEKLY ATTENDANCE CHART ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-4">Weekly Attendance Trend</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyAttendance} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[70, 100]}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(v) => [`${v}%`, 'Attendance']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey="attendance" fill="#1162d4" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 3. LOW ATTENDANCE ALERT ─────────────────────────────────────── */}
      {(() => {
        if (isStudent) {
          const my  = scopedStudents[0]
          if (!my) return null
          const pct = calcPct(my.present, my.total)
          return pct < 75 ? (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
              <span className="material-symbols-outlined text-orange-500 mt-0.5">warning</span>
              <div>
                <p className="text-sm font-semibold text-orange-700">Warning: Your attendance is below 75%.</p>
                <p className="text-xs text-orange-600 mt-0.5">Attend upcoming classes to maintain eligibility.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              <p className="text-sm font-semibold text-emerald-700">Eligible for Exams</p>
            </div>
          )
        }
        // Faculty / Admin view
        const lowStudents = studentData.filter(s => calcPct(s.present, s.total) < 75)
        if (lowStudents.length === 0) return null
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-orange-500">warning</span>
              <p className="text-sm font-semibold text-orange-700">Students Below 75%</p>
            </div>
            <ul className="space-y-1">
              {lowStudents.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm text-orange-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                  {s.name} ({calcPct(s.present, s.total)}%)
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      {/* Summary Cards — admin only */}
      {isAdmin && (() => {
        const data     = activeTab === 'students' ? scopedStudents : scopedStaff
        const good     = data.filter(s => calcPct(s.present, s.total) >= 85).length
        const atRisk   = data.filter(s => { const p = calcPct(s.present, s.total); return p >= 75 && p < 85 }).length
        const critical = data.filter(s => calcPct(s.present, s.total) < 75).length
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.length}</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Good</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{good}</p>
            </div>
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">At Risk</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">{atRisk}</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Critical</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{critical}</p>
            </div>
          </div>
        )
      })()}

      {/* Tabs + Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {isAdmin ? (
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === 'students' ? 'bg-white text-[#1162d4] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">school</span>Students
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === 'staff' ? 'bg-white text-[#1162d4] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">badge</span>Staff
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold w-fit">
            <span className="material-symbols-outlined text-base">person</span>My Attendance
          </div>
        )}

        {isAdmin && (
          <div className="flex flex-col items-end gap-2">
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

            {/* Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  statusFilter !== 'All'
                    ? 'bg-[#1162d4] text-white border-[#1162d4] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <span className="material-symbols-outlined text-lg">filter_list</span>
                {statusFilter !== 'All' && <span>{statusFilter}</span>}
              </button>

              {filterOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 animate-dropIn origin-top-right">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setStatusFilter(opt); setFilterOpen(false) }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-150 ${
                        statusFilter === opt ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt !== 'All' && (
                        <span className={`w-2 h-2 rounded-full ${
                          opt === 'Good' || opt === 'Eligible for Exams' ? 'bg-green-500' :
                          opt === 'At Risk' ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                      )}
                      {opt}
                      {statusFilter === opt && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AttendanceTable data={filteredData} type={currentTableType} isAdmin={isAdmin} />
    </>
  )
  return noLayout ? inner : <Layout title="Attendance">{inner}</Layout>
}
