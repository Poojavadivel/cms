import { useState } from 'react'
import AcademicSidebar, { MenuIcon } from './AcademicSidebar'

export default function Layout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <div className="dashboard-wrapper role-layout">
        <AcademicSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="main-content">
          <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Toggle menu"
              >
                <MenuIcon />
              </button>
              <div className="topbar-left">
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
              </div>
            </div>
            <div className="topbar-right">
              <span className="badge badge-info">Admin</span>
            </div>
          </div>

          {children}
        </main>
      </div>
    </>
  )
}
