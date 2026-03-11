import { useState } from 'react'
import Layout from '../components/Layout'

const initialData = [
  { name: 'Johnathan Doe', company: 'Google',    role: 'SWE Intern',     package: '$12,000/yr', status: 'Selected', date: 'Nov 5, 2023'  },
  { name: 'Alice Smith',   company: 'Microsoft', role: 'Cloud Intern',   package: '$10,500/yr', status: 'Selected', date: 'Nov 8, 2023'  },
  { name: 'Michael Ross',  company: 'Amazon',    role: 'Data Analyst',   package: '$9,000/yr',  status: 'Process',  date: 'Dec 1, 2023'  },
  { name: 'Elena Lopez',   company: 'Figma',     role: 'Design Intern',  package: '$8,500/yr',  status: 'Process',  date: 'Dec 3, 2023'  },
  { name: 'David Kim',     company: 'Stripe',    role: 'Backend Intern', package: '$11,000/yr', status: 'Selected', date: 'Nov 20, 2023' },
]

const emptyForm = { name: '', company: '', role: '', package: '', status: 'Selected', date: '' }

export default function PlacementPage({ noLayout = false }) {
  const [entries, setEntries] = useState(initialData)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setEntries(prev => [...prev, form])
    setForm(emptyForm)
    setShowModal(false)
  }

  const inner = (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Placement Tracker</h1>
          <p className="text-slate-500 mt-1">Campus Recruitment — Batch 2024</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90"
        >
          <span className="material-symbols-outlined text-lg">add</span>Add Entry
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: 'emoji_events', label: 'Students Placed',   value: entries.filter(e => e.status === 'Selected').length,     color: 'text-[#1162d4] bg-[#1162d4]/10' },
          { icon: 'business',    label: 'Companies Visited',  value: new Set(entries.map(e => e.company)).size,               color: 'text-purple-600 bg-purple-100' },
          { icon: 'attach_money',label: 'Avg. Package',       value: '$10.2k',                                                color: 'text-emerald-600 bg-emerald-100' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
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
            {entries.map((p, i) => (
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
      {showModal && (
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
    </>
  )
  return noLayout ? inner : <Layout title="Placement">{inner}</Layout>
}
