import React from 'react';

export default function AdmissionTable({ type, entries, onDelete, onChangeStatus, onView }) {
  const labels = {
    student: ['Application ID', 'Name', 'Course', 'Status', 'Payment', 'Actions'],
    faculty: ['Staff ID', 'Name', 'Role', 'Department', 'Status', 'Payment', 'Actions'],
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-100 text-gray-800 text-xs font-bold uppercase tracking-wider border-b border-gray-300">
            {labels[type].map(lbl => (
              <th key={lbl} className="px-6 py-4">{lbl}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {entries.length === 0 ? (
            <tr>
              <td colSpan={labels[type].length} className="px-10 py-24 text-center text-slate-400 bg-white">
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-10 text-slate-900">{type === 'student' ? 'group_off' : 'people_alt'}</span>
                  <p className="text-base font-bold text-slate-500">No {type} applications yet</p>
                </div>
              </td>
            </tr>
          ) : (
            entries.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                {type === 'student' && (
                  <>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{e.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{e.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{e.course || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        e.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        e.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>{e.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-20 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                        {e.payment || 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(evt) => evt.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button title="View" onClick={() => onView?.(e)} className="p-2 text-gray-600 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm border border-gray-200">
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button title="Approve" onClick={() => onChangeStatus(e.id, 'Approved')} className="p-2 text-green-600 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm border border-gray-200">
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        </button>
                        <button title="Reject" onClick={() => onChangeStatus(e.id, 'Rejected')} className="p-2 text-red-600 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm border border-gray-200">
                          <span className="material-symbols-outlined text-lg">cancel</span>
                        </button>
                        <button title="Delete" onClick={() => onDelete(e.id)} className="p-2 text-orange-600 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm border border-gray-200">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </>
                )}
                {type === 'faculty' && (
                  <>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{e.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{e.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{e.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{e.department}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        e.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        e.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>{e.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-20 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                        {e.payment || 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(evt) => evt.stopPropagation()}>
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button title="View" onClick={() => onView?.(e)} className="p-2 text-gray-600 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm border border-gray-200">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button title="Approve" onClick={() => onChangeStatus(e.id, 'Approved')} className="p-2 text-green-600 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm border border-gray-200">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                          </button>
                          <button title="Reject" onClick={() => onChangeStatus(e.id, 'Rejected')} className="p-2 text-red-600 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm border border-gray-200">
                            <span className="material-symbols-outlined text-lg">cancel</span>
                          </button>
                          <button title="Delete" onClick={() => onDelete(e.id)} className="p-2 text-orange-600 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm border border-gray-200">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
