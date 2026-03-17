import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getUserSession } from '../auth/sessionController'

// ── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const TIME_SLOTS = [
  '08:00–09:00',
  '09:00–10:00',
  '10:00–11:00',
  '11:15–12:15',
  '12:15–13:15',
  '14:00–15:00',
  '15:00–16:00',
]

const THEME_OPTIONS = ['blue', 'emerald', 'orange', 'purple', 'indigo', 'amber', 'rose']

const THEMES = {
  blue:    { color: 'border-blue-500 bg-blue-50',       textColor: 'text-blue-700' },
  emerald: { color: 'border-emerald-500 bg-emerald-50', textColor: 'text-emerald-700' },
  orange:  { color: 'border-orange-500 bg-orange-50',   textColor: 'text-orange-700' },
  purple:  { color: 'border-purple-500 bg-purple-50',   textColor: 'text-purple-700' },
  indigo:  { color: 'border-indigo-500 bg-indigo-50',   textColor: 'text-indigo-700' },
  amber:   { color: 'border-amber-500 bg-amber-50',     textColor: 'text-amber-700' },
  rose:    { color: 'border-rose-500 bg-rose-50',       textColor: 'text-rose-700' },
}

const LEGEND = [
  { color: 'bg-blue-500',    label: 'Core CS' },
  { color: 'bg-emerald-500', label: 'Mathematics' },
  { color: 'bg-orange-500',  label: 'Database' },
  { color: 'bg-purple-500',  label: 'Humanities' },
  { color: 'bg-indigo-500',  label: 'Systems' },
  { color: 'bg-amber-500',   label: 'Practical/Lab' },
]

const EMPTY_ENTRY = { code: '', name: '', room: '', instructor: '', credits: 1, type: 'Lecture', theme: 'blue' }

// kept for backward compat with initialData builder below
const C = {
  blue:    { color: 'border-blue-500 bg-blue-50',    textColor: 'text-blue-700' },
  emerald: { color: 'border-emerald-500 bg-emerald-50', textColor: 'text-emerald-700' },
  orange:  { color: 'border-orange-500 bg-orange-50', textColor: 'text-orange-700' },
  purple:  { color: 'border-purple-500 bg-purple-50', textColor: 'text-purple-700' },
  indigo:  { color: 'border-indigo-500 bg-indigo-50', textColor: 'text-indigo-700' },
  amber:   { color: 'border-amber-500 bg-amber-50',  textColor: 'text-amber-700' },
  rose:    { color: 'border-rose-500 bg-rose-50',    textColor: 'text-rose-700' },
}

function withTheme(entry) {
  if (!entry || !entry.code) {
    return entry
  }

  const theme = entry.theme || 'blue'
  return {
    ...entry,
    ...(THEMES[theme] || THEMES.blue),
  }
}

function normalizeSlots(slots = []) {
  return Array.from({ length: 7 }, (_, slotIndex) => (
    Array.from({ length: 5 }, (_, dayIndex) => {
      const entry = slots?.[slotIndex]?.[dayIndex] ?? null
      return entry ? withTheme(entry) : null
    })
  ))
}

function normalizeTimetableRecord(record) {
  return {
    label: record.label,
    dept: record.dept,
    semester: record.semester,
    section: record.section,
    slots: normalizeSlots(record.slots),
  }
}

function mk(code, name, room, instructor, credits, type, theme) {
  return { code, name, room, instructor, credits, type, theme, ...C[theme] }
}

// ── Initial timetables keyed by classId ──────────────────────────────────────
const INITIAL_TIMETABLES = {
  'CS-S4A': {
    label: 'CS — Sem 4 (Sec A)',
    dept: 'Computer Science',
    semester: 'Semester 4',
    section: 'Section A',
    slots: [
      [ mk('CS401','Data Structures','Room 302','Dr. Patricia Moore',3,'Lecture','blue'), null, mk('MA405','Discrete Math','Hall A','Prof. James Carter',3,'Lecture','emerald'), mk('HU102','Tech Writing','Room 101','Ms. Sandra Lee',2,'Lecture','purple'), mk('CS406','Operating Systems','Room 304','Dr. Fatima Noor',3,'Lecture','indigo') ],
      [ mk('MA405','Discrete Math','Hall A','Prof. James Carter',3,'Lecture','emerald'), mk('CS401','Data Structures','Room 302','Dr. Patricia Moore',3,'Lecture','blue'), mk('CS403','Database Systems','Lab 2','Mr. Robert Hughes',4,'Lecture','orange'), mk('CS401','Data Structures','Room 302','Dr. Patricia Moore',3,'Lecture','blue'), null ],
      [ mk('HU102','Tech Writing','Room 101','Ms. Sandra Lee',2,'Lecture','purple'), mk('CS403','Database Systems','Room 302','Mr. Robert Hughes',4,'Lecture','orange'), mk('MA405','Discrete Math','Hall A','Prof. James Carter',3,'Lecture','emerald'), mk('CS403','Database Systems','Lab 2','Mr. Robert Hughes',4,'Lecture','orange'), mk('MA405','Discrete Math','Hall A','Prof. James Carter',3,'Lecture','emerald') ],
      [ mk('CS401L','DS Lab','Comp Lab 4','Dr. Patricia Moore',1,'Lab','amber'), mk('CS406','Operating Systems','Room 304','Dr. Fatima Noor',3,'Lecture','indigo'), { label:'Seminar Hour', code:'', name:'', room:'', instructor:'', credits:0, type:'', theme:'', color:'', textColor:'' }, mk('CS406','Operating Systems','Room 304','Dr. Fatima Noor',3,'Lecture','indigo'), mk('CS401','Data Structures','Room 302','Dr. Patricia Moore',3,'Lecture','blue') ],
      [ mk('CS406','Operating Systems','Room 304','Dr. Fatima Noor',3,'Lecture','indigo'), mk('HU102','Tech Writing','Room 101','Ms. Sandra Lee',2,'Lecture','purple'), mk('CS401','Data Structures','Room 302','Dr. Patricia Moore',3,'Lecture','blue'), null, mk('CS403','Database Systems','Lab 2','Mr. Robert Hughes',4,'Lecture','orange') ],
      [ mk('CS403','Database Systems','Lab 2','Mr. Robert Hughes',4,'Lecture','orange'), mk('MA405','Discrete Math','Hall A','Prof. James Carter',3,'Lecture','emerald'), mk('CS406','Operating Systems','Room 304','Dr. Fatima Noor',3,'Lecture','indigo'), mk('HU102','Tech Writing','Room 101','Ms. Sandra Lee',2,'Lecture','purple'), mk('CS401L','DS Lab','Comp Lab 4','Dr. Patricia Moore',1,'Lab','amber') ],
      [ null, mk('CS401L','DS Lab','Comp Lab 4','Dr. Patricia Moore',1,'Lab','amber'), mk('HU102','Tech Writing','Room 101','Ms. Sandra Lee',2,'Lecture','purple'), mk('MA405','Discrete Math','Hall A','Prof. James Carter',3,'Lecture','emerald'), mk('CS403','Database Systems','Lab 2','Mr. Robert Hughes',4,'Lecture','orange') ],
    ],
  },
  'CS-S4B': {
    label: 'CS — Sem 4 (Sec B)',
    dept: 'Computer Science',
    semester: 'Semester 4',
    section: 'Section B',
    slots: Array(7).fill(null).map(() => Array(5).fill(null)),
  },
  'EC-S3A': {
    label: 'EC — Sem 3 (Sec A)',
    dept: 'Electronics',
    semester: 'Semester 3',
    section: 'Section A',
    slots: Array(7).fill(null).map(() => Array(5).fill(null)),
  },
}

// ── ClassCell ────────────────────────────────────────────────────────────────
function ClassCell({ cls, canEdit, onEdit, onClear }) {
  if (!cls || !cls.code) {
    return (
      <div className="relative group h-full bg-slate-50 flex items-center justify-center rounded-lg border border-dashed border-slate-200">
        <span className="text-xs text-slate-400 font-medium">{cls?.label || 'No Class'}</span>
        {canEdit && !cls?.label && (
          <button
            onClick={onEdit}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-100/80 rounded-lg transition-opacity"
          >
            <span className="material-symbols-outlined text-slate-500 text-lg">add</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative group h-full overflow-visible">
      <div className={`h-full border-l-4 px-2 py-1.5 rounded-r-lg ${cls.color} cursor-default`}>
        <p className={`text-[10px] font-bold uppercase tracking-wide ${cls.textColor}`}>{cls.code}</p>
        <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 mt-0.5">{cls.name}</p>
      </div>

      {/* Hover tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-52
                      invisible opacity-0 group-hover:visible group-hover:opacity-100
                      transition-all duration-150 pointer-events-none">
        <div className="w-3 h-3 bg-slate-900 rotate-45 mx-auto -mb-1.5 rounded-sm" />
        <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-3 text-xs">
          <p className={`font-bold text-sm mb-1 ${cls.textColor?.replace('700','400')}`}>{cls.code}</p>
          <p className="font-semibold text-white mb-2 leading-snug">{cls.name}</p>
          <div className="space-y-1 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">location_on</span>
              <span>{cls.room}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">person</span>
              <span>{cls.instructor}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">school</span>
              <span>{cls.type} · {cls.credits} credit{cls.credits !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit / clear overlay — only in edit mode */}
      {canEdit && (
        <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 bg-white/80 rounded-r-lg transition-opacity z-10">
          <button
            onClick={onEdit}
            className="p-1 rounded-md bg-[#1162d4] text-white hover:bg-[#1162d4]/90"
            title="Edit"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          <button
            onClick={onClear}
            className="p-1 rounded-md bg-red-500 text-white hover:bg-red-600"
            title="Remove"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Entry editor modal ────────────────────────────────────────────────────────
function EntryModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial?.code ? { ...initial } : { ...EMPTY_ENTRY }
  )

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

  function handleSave() {
    if (!form.code.trim() || !form.name.trim()) return
    onSave({ ...form, ...(THEMES[form.theme] || THEMES.blue) })
  }

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] transition-all'
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1162d4]">schedule</span>
            <h2 className="text-base font-bold text-slate-800">
              {form.code ? 'Edit Class Entry' : 'Add Class Entry'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Course Code *</label>
            <input className={inputCls} value={form.code} onChange={e => set('code', e.target.value)} placeholder="e.g. CS401" />
          </div>
          <div>
            <label className={labelCls}>Credits</label>
            <input type="number" min={1} max={6} className={inputCls} value={form.credits} onChange={e => set('credits', Number(e.target.value))} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Course Name *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Data Structures" />
          </div>
          <div>
            <label className={labelCls}>Room / Venue</label>
            <input className={inputCls} value={form.room} onChange={e => set('room', e.target.value)} placeholder="e.g. Room 302" />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
              <option>Lecture</option>
              <option>Lab</option>
              <option>Tutorial</option>
              <option>Seminar</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Instructor</label>
            <input className={inputCls} value={form.instructor} onChange={e => set('instructor', e.target.value)} placeholder="e.g. Dr. Patricia Moore" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Color Theme</label>
            <div className="flex gap-2 mt-1">
              {THEME_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => set('theme', t)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.theme === t ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: { blue:'#3b82f6', emerald:'#10b981', orange:'#f97316', purple:'#a855f7', indigo:'#6366f1', amber:'#f59e0b', rose:'#f43f5e' }[t] }}
                  title={t}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 active:scale-95 shadow-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New class/timetable creation modal ────────────────────────────────────────
function NewClassModal({ onSave, onClose }) {
  const [form, setForm] = useState({ dept: 'Computer Science', semester: 'Semester 4', section: 'Section A' })
  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

  function handleSave() {
    const deptCode = form.dept.slice(0, 2).toUpperCase()
    const semCode  = form.semester.replace('Semester ', 'S')
    const secCode  = form.section.replace('Section ', '')
    const id       = `${deptCode}-${semCode}${secCode}`
    const label    = `${deptCode} — ${form.semester} (${form.section})`
    onSave({ id, label, ...form })
  }

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] transition-all'
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1162d4]">add_circle</span>
            <h2 className="text-base font-bold text-slate-800">Create New Timetable</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Department</label>
            <select className={inputCls} value={form.dept} onChange={e => set('dept', e.target.value)}>
              <option>Computer Science</option>
              <option>Electronics</option>
              <option>Mathematics</option>
              <option>Mechanical</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Semester</label>
            <select className={inputCls} value={form.semester} onChange={e => set('semester', e.target.value)}>
              {[1,2,3,4,5,6,7,8].map(n => <option key={n}>Semester {n}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Section</label>
            <select className={inputCls} value={form.section} onChange={e => set('section', e.target.value)}>
              {['A','B','C','D'].map(s => <option key={s}>Section {s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 active:scale-95 shadow-sm"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TimetablePage({ noLayout = false }) {
  const session = getUserSession()
  const role    = session?.role || 'student'
  const canEdit = role === 'admin' || role === 'faculty'

  const [timetables,   setTimetables]   = useState(INITIAL_TIMETABLES)
  const [activeClass,  setActiveClass]  = useState('CS-S4A')
  const [editMode,     setEditMode]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)   // { slotIdx, dayIdx }
  const [showNewClass, setShowNewClass] = useState(false)
  const [isSyncing,    setIsSyncing]    = useState(false)

  const current = timetables[activeClass]

  useEffect(() => {
    let isMounted = true

    async function fetchTimetables() {
      try {
        const response = await fetch('/api/academics/timetable')
        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload?.success || !Array.isArray(payload.data) || payload.data.length === 0) {
          return
        }

        const mapped = payload.data.reduce((accumulator, record) => {
          accumulator[record.classId] = normalizeTimetableRecord(record)
          return accumulator
        }, {})

        if (isMounted && Object.keys(mapped).length > 0) {
          setTimetables(mapped)
          if (!mapped[activeClass]) {
            setActiveClass(Object.keys(mapped)[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch timetables:', error)
      }
    }

    fetchTimetables()

    return () => {
      isMounted = false
    }
  }, [])

  async function persistTimetable(classId, timetable) {
    try {
      setIsSyncing(true)
      await fetch(`/api/academics/timetable/${encodeURIComponent(classId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          label: timetable.label,
          dept: timetable.dept,
          semester: timetable.semester,
          section: timetable.section,
          slots: timetable.slots,
        }),
      })
    } catch (error) {
      console.error('Failed to sync timetable:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  function handleEntrySave(entry) {
    const slots = current.slots.map(row => [...row])
    slots[editTarget.slotIdx][editTarget.dayIdx] = withTheme(entry)
    const updated = { ...current, slots }
    setTimetables(prev => ({ ...prev, [activeClass]: updated }))
    void persistTimetable(activeClass, updated)
    setEditTarget(null)
  }

  function handleClearCell(slotIdx, dayIdx) {
    const slots = current.slots.map(row => [...row])
    slots[slotIdx][dayIdx] = null
    const updated = { ...current, slots }
    setTimetables(prev => ({ ...prev, [activeClass]: updated }))
    void persistTimetable(activeClass, updated)
  }

  function handleCreateClass({ id, label, dept, semester, section }) {
    if (!timetables[id]) {
      const created = {
        label,
        dept,
        semester,
        section,
        slots: Array.from({ length: 7 }, () => Array(5).fill(null)),
      }
      setTimetables(prev => ({
        ...prev,
        [id]: created,
      }))
      void persistTimetable(id, created)
    }
    setActiveClass(id)
    setShowNewClass(false)
  }

  const tpl = '72px repeat(3, minmax(80px, 1fr)) 54px repeat(2, minmax(80px, 1fr)) 54px repeat(2, minmax(80px, 1fr))'
  const headerCell = 'px-2 py-3 text-center text-[10px] font-bold text-slate-500 border-r border-slate-200 leading-tight flex flex-col items-center justify-center gap-0.5 bg-slate-50'

  const inner = (
    <>
      {/* ── Class Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {Object.entries(timetables).map(([id, tt]) => (
          <button
            key={id}
            onClick={() => { setActiveClass(id); setEditMode(false) }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
              activeClass === id
                ? 'bg-[#1162d4] text-white border-[#1162d4] shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {tt.label}
          </button>
        ))}
        {canEdit && (
          <button
            onClick={() => setShowNewClass(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-dashed border-slate-300 text-slate-500 hover:border-[#1162d4] hover:text-[#1162d4] transition-all"
          >
            <span className="material-symbols-outlined text-base">add</span>New Class
          </button>
        )}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <p className="text-slate-500">
          {current.dept} — {current.semester} ({current.section})
        </p>
        <div className="flex gap-3 items-center">
          {isSyncing && (
            <span className="text-xs font-medium text-slate-500">Syncing changes...</span>
          )}
          {canEdit && (
            <button
              onClick={() => setEditMode(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                editMode
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#1162d4] hover:text-[#1162d4]'
              }`}
            >
              <span className="material-symbols-outlined text-base">{editMode ? 'check_circle' : 'edit'}</span>
              {editMode ? 'Done Editing' : 'Edit Timetable'}
            </button>
          )}
          <button className="bg-white p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-slate-300">
            <span className="material-symbols-outlined">print</span>
          </button>
        </div>
      </div>

      {editMode && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-sm text-amber-700">
          <span className="material-symbols-outlined text-amber-500">info</span>
          <span>Hover over any cell to <strong>add</strong>, <strong>edit</strong>, or <strong>remove</strong> a class entry.</span>
        </div>
      )}

      {/* ── Timetable Grid ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div style={{ minWidth: 780 }}>
          {/* Header */}
          <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: tpl }}>
            <div className="bg-slate-50 border-r border-slate-200" />
            {[0,1,2].map(si => (
              <div key={si} className={headerCell}>
                {TIME_SLOTS[si].split('–').map((t, i) => <span key={i}>{t}{i===0 && '–'}</span>)}
              </div>
            ))}
            <div className="bg-slate-100/80 border-r border-slate-200 flex flex-col items-center justify-center py-2 gap-0.5">
              <span className="text-base leading-none">☕</span>
              <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide text-center leading-tight">Break</span>
            </div>
            {[3,4].map(si => (
              <div key={si} className={headerCell}>
                {TIME_SLOTS[si].split('–').map((t, i) => <span key={i}>{t}{i===0 && '–'}</span>)}
              </div>
            ))}
            <div className="bg-amber-50 border-r border-slate-200 flex flex-col items-center justify-center py-2 gap-0.5">
              <span className="text-base leading-none">🍽</span>
              <span className="text-[8px] font-semibold text-amber-400 uppercase tracking-wide text-center leading-tight">Lunch</span>
            </div>
            {[5,6].map(si => (
              <div key={si} className={`${headerCell} ${si===6?'border-r-0':''}`}>
                {TIME_SLOTS[si].split('–').map((t, i) => <span key={i}>{t}{i===0 && '–'}</span>)}
              </div>
            ))}
          </div>

          {/* Days */}
          {DAYS.map((day, di) => (
            <div key={di} className="grid border-b border-slate-100 last:border-b-0 min-h-[80px]" style={{ gridTemplateColumns: tpl }}>
              <div className="px-1 py-2 text-sm font-bold text-slate-700 border-r border-slate-200 flex items-center justify-center bg-slate-50">
                {day}
              </div>
              {[0,1,2].map(si => (
                <div key={si} className="p-1.5 border-r border-slate-100">
                  <ClassCell
                    cls={current.slots[si]?.[di]}
                    canEdit={editMode}
                    onEdit={() => setEditTarget({ slotIdx: si, dayIdx: di })}
                    onClear={() => handleClearCell(si, di)}
                  />
                </div>
              ))}
              <div className="bg-slate-100/50 border-r border-slate-100" />
              {[3,4].map(si => (
                <div key={si} className="p-1.5 border-r border-slate-100">
                  <ClassCell
                    cls={current.slots[si]?.[di]}
                    canEdit={editMode}
                    onEdit={() => setEditTarget({ slotIdx: si, dayIdx: di })}
                    onClear={() => handleClearCell(si, di)}
                  />
                </div>
              ))}
              <div className="bg-amber-50/50 border-r border-slate-100" />
              {[5,6].map(si => (
                <div key={si} className={`p-1.5 border-r border-slate-100 ${si===6?'border-r-0':''}`}>
                  <ClassCell
                    cls={current.slots[si]?.[di]}
                    canEdit={editMode}
                    onEdit={() => setEditTarget({ slotIdx: si, dayIdx: di })}
                    onClear={() => handleClearCell(si, di)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap gap-6 items-center">
        <p className="text-sm font-bold text-slate-700">Course Codes:</p>
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <span className={`size-3 rounded-full ${l.color}`} />
            <span className="text-xs text-slate-600">{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── Entry Modal ────────────────────────────────────────────────── */}
      {editTarget && (
        <EntryModal
          initial={current.slots[editTarget.slotIdx]?.[editTarget.dayIdx]?.code
            ? current.slots[editTarget.slotIdx][editTarget.dayIdx]
            : null}
          onSave={handleEntrySave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* ── New Class Modal ─────────────────────────────────────────────── */}
      {showNewClass && (
        <NewClassModal onSave={handleCreateClass} onClose={() => setShowNewClass(false)} />
      )}
    </>
  )

  return noLayout ? inner : <Layout title="Timetable">{inner}</Layout>
}
