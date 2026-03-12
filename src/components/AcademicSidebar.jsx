import { NavLink, useNavigate } from 'react-router-dom'
import { getUserSession } from '../auth/sessionController'
import { destroyUserSession } from '../auth/sessionController'
import { roleMenuGroups } from '../data/roleConfig'

const iconMap = {
  Dashboard: 'dashboard',
  Students: 'group',
  Faculty: 'person',
  Department: 'domain',
  Exams: 'school',
  Timetable: 'calendar_today',
  Attendance: 'rule',
  Placement: 'work',
  Facility: 'apartment',
  Fees: 'payments',
  Reports: 'assessment',
  Admission: 'person_add',
  Payroll: 'receipt_long',
  Invoices: 'description',
  Analytics: 'query_stats',
  Notifications: 'notifications',
  Settings: 'settings',
  'My Courses': 'menu_book',
}

const routeMap = {
  Dashboard: '/dashboard',
  Students: '/students',
  Faculty: '/faculty',
  Department: '/departments',
  Exams: '/exams',
  Timetable: '/timetable',
  Attendance: '/attendance',
  Placement: '/placement',
  Facility: '/facility',
  Fees: '/fees',
  Reports: '/reports',
  Admission: '/admission',
  Payroll: '/payroll',
  Invoices: '/invoices',
  Analytics: '/analytics',
  Notifications: '/notifications',
  Settings: '/settings',
  'My Courses': '/my-courses',
}

export default function AcademicSidebar() {
  const navigate = useNavigate()
  const session = getUserSession()
  const role = session?.role || 'student'
  const menuGroups = roleMenuGroups[role] || []

  function handleLogout() {
    destroyUserSession()
    navigate('/', { replace: true })
  }

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col fixed h-full overflow-y-auto z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-[#2563eb] w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
          <span className="material-symbols-outlined text-2xl font-bold">school</span>
        </div>
        <div>
          <h1 className="font-extrabold text-[#1e293b] text-xl tracking-tight leading-none">EduCore</h1>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em] mt-1">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const to = `${routeMap[item] || '#'}${role !== 'student' && item !== 'Settings' ? `?role=${encodeURIComponent(role)}` : ''}`
                return (
                  <NavLink
                    key={item}
                    to={to}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="material-symbols-outlined text-[22px]">{iconMap[item] || 'circle'}</span>
                    <span>{item}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
