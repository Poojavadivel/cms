import Layout from '../components/Layout'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const C = {
  blue:    { color: 'border-blue-500 bg-blue-50',    textColor: 'text-blue-700' },
  emerald: { color: 'border-emerald-500 bg-emerald-50', textColor: 'text-emerald-700' },
  orange:  { color: 'border-orange-500 bg-orange-50', textColor: 'text-orange-700' },
  purple:  { color: 'border-purple-500 bg-purple-50', textColor: 'text-purple-700' },
  indigo:  { color: 'border-indigo-500 bg-indigo-50', textColor: 'text-indigo-700' },
  amber:   { color: 'border-amber-500 bg-amber-50',  textColor: 'text-amber-700' },
  rose:    { color: 'border-rose-500 bg-rose-50',    textColor: 'text-rose-700' },
}

const mk = (code, name, room, instructor, credits, type, theme) =>
  ({ code, name, room, instructor, credits, type, ...C[theme] })

const slots = [
  {
    time: '08:00–09:00',
    classes: [
      mk('CS401',  'Data Structures',   'Room 302',       'Dr. Patricia Moore',  3, 'Lecture', 'blue'),
      null,
      mk('MA405',  'Discrete Math',     'Hall A',         'Prof. James Carter',  3, 'Lecture', 'emerald'),
      mk('HU102',  'Tech Writing',      'Room 101',       'Ms. Sandra Lee',      2, 'Lecture', 'purple'),
      mk('CS406',  'Operating Systems', 'Room 304',       'Dr. Fatima Noor',     3, 'Lecture', 'indigo'),
    ],
  },
  {
    time: '09:00–10:00',
    classes: [
      mk('MA405',  'Discrete Math',     'Hall A',         'Prof. James Carter',  3, 'Lecture', 'emerald'),
      mk('CS401',  'Data Structures',   'Room 302',       'Dr. Patricia Moore',  3, 'Lecture', 'blue'),
      mk('CS403',  'Database Systems',  'Lab 2',          'Mr. Robert Hughes',   4, 'Lecture', 'orange'),
      mk('CS401',  'Data Structures',   'Room 302',       'Dr. Patricia Moore',  3, 'Lecture', 'blue'),
      null,
    ],
  },
  {
    time: '10:00–11:00',
    classes: [
      mk('HU102',  'Tech Writing',      'Room 101',       'Ms. Sandra Lee',      2, 'Lecture', 'purple'),
      mk('CS403',  'Database Systems',  'Room 302',       'Mr. Robert Hughes',   4, 'Lecture', 'orange'),
      mk('MA405',  'Discrete Math',     'Hall A',         'Prof. James Carter',  3, 'Lecture', 'emerald'),
      mk('CS403',  'Database Systems',  'Lab 2',          'Mr. Robert Hughes',   4, 'Lecture', 'orange'),
      mk('MA405',  'Discrete Math',     'Hall A',         'Prof. James Carter',  3, 'Lecture', 'emerald'),
    ],
  },
  {
    time: '11:15–12:15',
    classes: [
      mk('CS401L', 'DS Lab',            'Comp Lab 4',     'Dr. Patricia Moore',  1, 'Lab',     'amber'),
      mk('CS406',  'Operating Systems', 'Room 304',       'Dr. Fatima Noor',     3, 'Lecture', 'indigo'),
      { label: 'Seminar Hour' },
      mk('CS406',  'Operating Systems', 'Room 304',       'Dr. Fatima Noor',     3, 'Lecture', 'indigo'),
      mk('CS401',  'Data Structures',   'Room 302',       'Dr. Patricia Moore',  3, 'Lecture', 'blue'),
    ],
  },
  {
    time: '12:15–13:15',
    classes: [
      mk('CS406',  'Operating Systems', 'Room 304',       'Dr. Fatima Noor',     3, 'Lecture', 'indigo'),
      mk('HU102',  'Tech Writing',      'Room 101',       'Ms. Sandra Lee',      2, 'Lecture', 'purple'),
      mk('CS401',  'Data Structures',   'Room 302',       'Dr. Patricia Moore',  3, 'Lecture', 'blue'),
      null,
      mk('CS403',  'Database Systems',  'Lab 2',          'Mr. Robert Hughes',   4, 'Lecture', 'orange'),
    ],
  },
  {
    time: '14:00–15:00',
    classes: [
      mk('CS403',  'Database Systems',  'Lab 2',          'Mr. Robert Hughes',   4, 'Lecture', 'orange'),
      mk('MA405',  'Discrete Math',     'Hall A',         'Prof. James Carter',  3, 'Lecture', 'emerald'),
      mk('CS406',  'Operating Systems', 'Room 304',       'Dr. Fatima Noor',     3, 'Lecture', 'indigo'),
      mk('HU102',  'Tech Writing',      'Room 101',       'Ms. Sandra Lee',      2, 'Lecture', 'purple'),
      mk('CS401L', 'DS Lab',            'Comp Lab 4',     'Dr. Patricia Moore',  1, 'Lab',     'amber'),
    ],
  },
  {
    time: '15:00–16:00',
    classes: [
      null,
      mk('CS401L', 'DS Lab',            'Comp Lab 4',     'Dr. Patricia Moore',  1, 'Lab',     'amber'),
      mk('HU102',  'Tech Writing',      'Room 101',       'Ms. Sandra Lee',      2, 'Lecture', 'purple'),
      mk('MA405',  'Discrete Math',     'Hall A',         'Prof. James Carter',  3, 'Lecture', 'emerald'),
      mk('CS403',  'Database Systems',  'Lab 2',          'Mr. Robert Hughes',   4, 'Lecture', 'orange'),
    ],
  },
]

const legend = [
  { color: 'bg-blue-500', label: 'Core CS' },
  { color: 'bg-emerald-500', label: 'Mathematics' },
  { color: 'bg-orange-500', label: 'Database' },
  { color: 'bg-purple-500', label: 'Humanities' },
  { color: 'bg-indigo-500', label: 'Systems' },
  { color: 'bg-amber-500', label: 'Practical/Lab' },
]

function ClassCell({ cls }) {
  if (!cls) {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center rounded-lg border border-dashed border-slate-200">
        <span className="text-xs text-slate-400 font-medium">No Class</span>
      </div>
    )
  }
  if (cls.label) {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center rounded-lg border border-dashed border-slate-200">
        <span className="text-xs text-slate-400 font-medium">{cls.label}</span>
      </div>
    )
  }
  return (
    <div className="relative group h-full overflow-visible">
      {/* Compact card */}
      <div className={`h-full border-l-4 px-2 py-1.5 rounded-r-lg ${cls.color} cursor-default`}>
        <p className={`text-[10px] font-bold uppercase tracking-wide ${cls.textColor}`}>{cls.code}</p>
        <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 mt-0.5">{cls.name}</p>
      </div>

      {/* Hover tooltip — rendered below the card to avoid overflow clipping */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-52
                      invisible opacity-0 group-hover:visible group-hover:opacity-100
                      transition-all duration-150 pointer-events-none">
        {/* Arrow pointing up */}
        <div className="w-3 h-3 bg-slate-900 rotate-45 mx-auto -mb-1.5 rounded-sm"></div>
        <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-3 text-xs">
          <p className={`font-bold text-sm mb-1 ${cls.textColor.replace('700','400')}`}>{cls.code}</p>
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
    </div>
  )
}

export default function TimetablePage({ noLayout = false }) {
  const inner = (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-slate-500">Department of Computer Science — Semester 4 (Section A)</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-400 mr-2 uppercase">Dept:</span>
            <select className="border-none bg-transparent p-0 text-sm focus:ring-0 cursor-pointer outline-none">
              <option>Comp Science</option>
              <option>Electronics</option>
              <option>Mathematics</option>
            </select>
          </div>
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-400 mr-2 uppercase">Sem:</span>
            <select className="border-none bg-transparent p-0 text-sm focus:ring-0 cursor-pointer outline-none">
              <option>Semester 4</option>
              <option>Semester 5</option>
              <option>Semester 6</option>
            </select>
          </div>
          <button className="bg-white p-2 border border-slate-200 rounded-lg text-slate-600">
            <span className="material-symbols-outlined">print</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {(() => {
          // columns: day-label | slots 0-2 | coffee-break | slots 3-4 | lunch-break | slots 5-6
          const tpl = '72px repeat(3, minmax(80px, 1fr)) 54px repeat(2, minmax(80px, 1fr)) 54px repeat(2, minmax(80px, 1fr))'
          const headerCell = 'px-2 py-3 text-center text-[10px] font-bold text-slate-500 border-r border-slate-200 leading-tight flex flex-col items-center justify-center gap-0.5 bg-slate-50'
          return (
            <div style={{ minWidth: 780 }}>
              {/* Header row — time slots */}
              <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: tpl }}>
                <div className="bg-slate-50 border-r border-slate-200" />
                {[0, 1, 2].map(si => (
                  <div key={si} className={headerCell}>
                    {slots[si].time.split('–').map((t, i) => <span key={i}>{t}{i === 0 && '–'}</span>)}
                  </div>
                ))}
                <div className="bg-slate-100/80 border-r border-slate-200 flex flex-col items-center justify-center py-2 gap-0.5">
                  <span className="text-base leading-none">☕</span>
                  <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide text-center leading-tight">Break</span>
                </div>
                {[3, 4].map(si => (
                  <div key={si} className={headerCell}>
                    {slots[si].time.split('–').map((t, i) => <span key={i}>{t}{i === 0 && '–'}</span>)}
                  </div>
                ))}
                <div className="bg-amber-50 border-r border-slate-200 flex flex-col items-center justify-center py-2 gap-0.5">
                  <span className="text-base leading-none">🍽</span>
                  <span className="text-[8px] font-semibold text-amber-400 uppercase tracking-wide text-center leading-tight">Lunch</span>
                </div>
                {[5, 6].map(si => (
                  <div key={si} className={`${headerCell} last:border-r-0`}>
                    {slots[si].time.split('–').map((t, i) => <span key={i}>{t}{i === 0 && '–'}</span>)}
                  </div>
                ))}
              </div>

              {/* One row per day */}
              {days.map((day, di) => (
                <div key={di} className="grid border-b border-slate-100 last:border-b-0 min-h-[80px]" style={{ gridTemplateColumns: tpl }}>
                  {/* Day label */}
                  <div className="px-1 py-2 text-sm font-bold text-slate-700 border-r border-slate-200 flex items-center justify-center bg-slate-50">
                    {day}
                  </div>
                  {/* Slots 0–2 */}
                  {[0, 1, 2].map(si => (
                    <div key={si} className="p-1.5 border-r border-slate-100">
                      <ClassCell cls={slots[si].classes[di]} />
                    </div>
                  ))}
                  {/* Coffee break column */}
                  <div className="bg-slate-100/50 border-r border-slate-100" />
                  {/* Slots 3–4 */}
                  {[3, 4].map(si => (
                    <div key={si} className="p-1.5 border-r border-slate-100">
                      <ClassCell cls={slots[si].classes[di]} />
                    </div>
                  ))}
                  {/* Lunch break column */}
                  <div className="bg-amber-50/50 border-r border-slate-100" />
                  {/* Slots 5–6 */}
                  {[5, 6].map(si => (
                    <div key={si} className="p-1.5 border-r border-slate-100 last:border-r-0">
                      <ClassCell cls={slots[si].classes[di]} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      <div className="mt-8 flex flex-wrap gap-6 items-center">
        <p className="text-sm font-bold text-slate-700">Course Codes:</p>
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <span className={`size-3 rounded-full ${l.color}`}></span>
            <span className="text-xs text-slate-600">{l.label}</span>
          </div>
        ))}
      </div>
    </>
  )
  return noLayout ? inner : <Layout title="Timetable">{inner}</Layout>
}

