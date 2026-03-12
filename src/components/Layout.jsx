import AcademicSidebar from './AcademicSidebar'
import TopBar from './TopBar'

export default function Layout({ children, title }) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#1e293b]">
      <AcademicSidebar />
      <main className="ml-64 flex-1 flex flex-col">
        <TopBar title={title} />
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
