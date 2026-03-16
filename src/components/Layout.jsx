import AcademicSidebar from './AcademicSidebar'
import TopBar from './TopBar'
import { useLocation } from 'react-router-dom'

export default function Layout({ children, title, skipTopBar = false }) {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#1e293b]">
      <AcademicSidebar />
      <main className="ml-64 flex-1 flex flex-col">
        {!skipTopBar && <TopBar title={title} />}
        <div key={`${location.pathname}${location.search}`} className={skipTopBar ? 'flex-1' : 'flex-1 p-8'}>
          {children}
        </div>
      </main>
    </div>
  )
}
