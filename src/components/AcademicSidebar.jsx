import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { destroyUserSession, getUserSession } from '../auth/sessionController'
import { roleMenuGroups } from '../data/roleConfig'

function GraduationIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 2.26L19.02 9 12 12.74 4.98 9 12 5.26zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  )
}

const NAV_ITEM_MAP = {
  'Dashboard':     { to: '/dashboard',     icon: 'dashboard' },
  'My Courses':    { to: '/courses',       icon: 'menu_book' },
  'Department':    { to: '/department',    icon: 'domain' },
  'Students':      { to: '/students',      icon: 'group' },
  'Faculty':       { to: '/faculty',       icon: 'person' },
  'Exams':         { to: '/exams',         icon: 'quiz' },
  'Timetable':     { to: '/timetable',     icon: 'calendar_today' },
  'Attendance':    { to: '/attendance',    icon: 'fact_check' },
  'Placement':     { to: '/placement',     icon: 'work' },
  'Facility':      { to: '/facility',      icon: 'apartment' },
  'Fees':          { to: '/fees',          icon: 'payments' },
  'Invoices':      { to: '/invoices',      icon: 'receipt' },
  'Admission':     { to: '/admission',     icon: 'how_to_reg' },
  'Payroll':       { to: '/payroll',       icon: 'account_balance_wallet' },
  'Analytics':     { to: '/analytics',     icon: 'analytics' },
  'Notifications': { to: '/notifications', icon: 'notifications' },
  'Settings':      { to: '/settings',      icon: 'settings' },
}

export { MenuIcon }

export default function AcademicSidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate()
  const session = getUserSession()
  const role = session?.role ?? 'student'
  const data = { label: role.charAt(0).toUpperCase() + role.slice(1) }
  const groups = roleMenuGroups[role] ?? roleMenuGroups.student

  function handleLogout() {
    destroyUserSession()
    navigate('/', { replace: true })
  }

  return (
    <>
      <div
        className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen && setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} id="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <GraduationIcon />
          </div>
          <div className="logo-text-wrap">
            <div className="logo-title">MIT Connect</div>
            <div className="logo-sub">MIT Connect - {data.label} Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="nav-section-label">{group.title}</div>
              <ul>
                {group.items.map((itemName) => {
                  const config = NAV_ITEM_MAP[itemName]
                  if (!config) return null
                  return (
                    <li key={config.to}>
                      <NavLink
                        to={config.to}
                        className={({ isActive }) => isActive ? 'active' : ''}
                        onClick={() => setSidebarOpen && setSidebarOpen(false)}
                      >
                        {itemName}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault()
              handleLogout()
            }}
          >
            <LogoutIcon />
            Logout
          </a>
        </div>
      </aside>
    </>
  )
}
