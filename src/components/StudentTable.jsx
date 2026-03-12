import { useNavigate } from 'react-router-dom'

export default function StudentTable({ students, onEdit, onDelete }) {
  const navigate = useNavigate()

  const statusStyles = {
    ACTIVE:   'bg-[#10b981]/10 text-[#10b981]',
    PENDING:  'bg-[#f59e0b]/10 text-[#f59e0b]',
    INACTIVE: 'bg-[#ef4444]/10 text-[#ef4444]',
    GRADUATED: 'bg-blue-100 text-blue-800',
  }

  const feeStyles = {
    PAID:     'bg-green-100 text-green-800',
    OVERDUE:  'bg-red-100 text-red-800',
    PARTIAL:  'bg-orange-100 text-orange-800',
    PENDING:  'bg-orange-100 text-orange-800',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            <th className="px-6 py-4">Student Information</th>
            <th className="px-6 py-4">Department</th>
            <th className="px-6 py-4">Semester</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Fee Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {students.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-10 py-24 text-center text-slate-400 bg-slate-50/30">
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-10 text-slate-900">group_off</span>
                  <p className="text-base font-bold text-slate-500">No students found matching your search</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">Try adjusting your filters or search terms</p>
                </div>
              </td>
            </tr>
          ) : (
            students.map((s) => (
              <tr
                key={s.rollNumber || s._id}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/students/${encodeURIComponent(s.rollNumber || s._id)}`)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                      <img
                        src={s.avatar || `https://ui-avatars.com/api/?name=${s.name}&background=1162d4&color=fff`}
                        alt={s.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.rollNumber || s.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{s.departmentId || s.department}</td>
                <td className="px-6 py-4">
                   <p className="text-sm font-medium text-slate-900">Sem {s.semester || '1'}</p>
                   <p className="text-xs text-slate-500">{s.year ? `${s.year}${s.year === 1 ? 'st' : s.year === 2 ? 'nd' : s.year === 3 ? 'rd' : 'th'} Year` : '1st Year'}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[s.status.toUpperCase()] || 'bg-slate-100 text-slate-700'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${feeStyles[(s.feeStatus || 'PENDING').toUpperCase()] || 'bg-slate-100 text-slate-700'}`}>
                    {s.feeStatus || 'PENDING'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEdit && onEdit(s)}
                      className="p-1.5 text-slate-400 hover:text-[#1162d4] hover:bg-[#1162d4]/10 rounded-lg transition-colors"
                      title="Edit Student"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button 
                      onClick={() => onDelete && onDelete(s)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Student"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
