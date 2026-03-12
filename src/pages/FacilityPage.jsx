import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { getUserSession } from '../auth/sessionController'

const facilities = [
  { name: 'Computer Lab 4', type: 'Laboratory',   capacity: 40,  status: 'Available',   amenities: ['AC', 'Projector', '40 PCs'] },
  { name: 'Hall A',         type: 'Lecture Hall', capacity: 120, status: 'In Use',       amenities: ['AC', 'Mic System', 'Projector'] },
  { name: 'Room 302',       type: 'Classroom',    capacity: 60,  status: 'Available',   amenities: ['Whiteboard', 'Projector'] },
  { name: 'Room 304',       type: 'Classroom',    capacity: 60,  status: 'Maintenance', amenities: ['Whiteboard'] },
  { name: 'Seminar Hall',   type: 'Seminar',      capacity: 80,  status: 'Available',   amenities: ['AC', 'Videoconf', 'Projector'] },
  { name: 'Lab 2',          type: 'Laboratory',   capacity: 30,  status: 'In Use',       amenities: ['AC', '30 PCs', 'CCTV'] },
]

const statusStyle = {
  Available:   'bg-emerald-50 text-emerald-600',
  'In Use':    'bg-blue-50 text-[#1162d4]',
  Maintenance: 'bg-red-50 text-red-600',
}

export default function FacilityPage({ noLayout = false }) {
  const session = getUserSession()
  const role = localStorage.getItem('role') || session?.role || 'student'

  const [statusFilter, setStatusFilter] = useState('All')
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingForm, setBookingForm] = useState({ room: '', date: '', timeFrom: '', timeTo: '', purpose: '' })
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const filterRef = useRef(null)

  const visibleFacilities = role === 'admin'
    ? facilities
    : facilities.filter((facility) => facility.status === 'Available')

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = visibleFacilities.filter(
    f => (statusFilter === 'All' || f.status === statusFilter) &&
         f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableRooms = visibleFacilities.filter(f => f.status === 'Available')

  function handleBookRoom(e) {
    if (e) e.preventDefault()
    setBookingSuccess(true)
    setTimeout(() => {
      setBookingOpen(false)
      setBookingSuccess(false)
      setBookingForm({ room: '', date: '', timeFrom: '', timeTo: '', purpose: '' })
    }, 1500)
  }

  const inputClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/10 focus:border-[#1162d4] outline-none transition-all text-sm text-slate-700 bg-white";
  const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-0.5";

  const inner = (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Facility Management</h1>
          <p className="text-slate-500 mt-1">Room & Lab availability — Real-time status</p>
        </div>
        <button
          onClick={() => setBookingOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">meeting_room</span>Book Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: 'meeting_room', label: 'Available',   value: visibleFacilities.filter(f => f.status === 'Available').length, color: 'text-emerald-600 bg-emerald-100' },
          { icon: 'groups',       label: 'In Use',      value: visibleFacilities.filter(f => f.status === 'In Use').length,    color: 'text-blue-600 bg-blue-100' },
          { icon: 'build',        label: 'Maintenance', value: visibleFacilities.filter(f => f.status === 'Maintenance').length, color: 'text-red-600 bg-red-100' },
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

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div />
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-56 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1162d4]/10 focus:border-[#1162d4] transition-all duration-200"
            />
          </div>

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
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 origin-top-right">
                {['All', 'Available', 'In Use', 'Maintenance'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setStatusFilter(opt); setFilterOpen(false) }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-150 ${
                      statusFilter === opt
                        ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt !== 'All' && (
                      <span className={`w-2 h-2 rounded-full ${
                        opt === 'Available' ? 'bg-emerald-500' : opt === 'In Use' ? 'bg-[#1162d4]' : 'bg-red-500'
                      }`} />
                    )}
                    {opt}
                    {statusFilter === opt && (
                      <span className="material-symbols-outlined text-base ml-auto">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-slate-400 text-sm py-12">
            <span className="material-symbols-outlined text-5xl mb-2 opacity-20">search_off</span>
            <p>No facilities found matching your criteria</p>
          </div>
        )}
        {filtered.map((f, i) => (
          <div key={f.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3 hover:border-[#1162d4]/30 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-[#1162d4] transition-colors">{f.name}</p>
                <p className="text-xs text-slate-500">{f.type}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[f.status]}`}>{f.status}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm text-slate-400">group</span>
              Capacity: <span className="font-semibold text-slate-700">{f.capacity} Seats</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {f.amenities.map((a) => (
                <span key={a} className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded text-[10px] font-semibold uppercase tracking-wider">{a}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        title="Book a Room"
        icon="meeting_room"
        maxWidth="max-w-2xl"
        footer={
          !bookingSuccess && (
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                onClick={() => setBookingOpen(false)}
                className="px-6 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleBookRoom}
                className="px-6 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95"
              >
                Confirm Booking
              </button>
            </div>
          )
        }
      >
        {bookingSuccess ? (
          <div className="py-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <span className="material-symbols-outlined text-3xl text-emerald-600">check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Booking Confirmed!</h3>
            <p className="text-sm text-slate-500 mt-2">The room has been successfully reserved for your schedule.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className={labelClasses}>Select Room *</label>
              <select
                required
                value={bookingForm.room}
                onChange={e => setBookingForm({ ...bookingForm, room: e.target.value })}
                className={inputClasses}
              >
                <option value="">Choose an available room...</option>
                {availableRooms.map(r => (
                  <option key={r.name} value={r.name}>{r.name} — {r.type} (Cap: {r.capacity} Seats)</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Booking Date *</label>
              <input
                type="date" required value={bookingForm.date}
                onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Purpose *</label>
              <input
                type="text" required placeholder="e.g. Guest Lecture" value={bookingForm.purpose}
                onChange={e => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Time (From) *</label>
              <input
                type="time" required value={bookingForm.timeFrom}
                onChange={e => setBookingForm({ ...bookingForm, timeFrom: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Time (To) *</label>
              <input
                type="time" required value={bookingForm.timeTo}
                onChange={e => setBookingForm({ ...bookingForm, timeTo: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
  return noLayout ? inner : <Layout title="Facility">{inner}</Layout>
}
