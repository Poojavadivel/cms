/**
 * Dashboard.jsx — Complete Doctor Dashboard Overhaul
 * Design: Medical Teal Theme, Bento Grid, 30/70 Layout
 * Features: KPI cards, Active Queue with badges, ConsultationCanvas, Skeleton loaders, Toasts
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdLocalHospital, MdCalendarToday, MdScience, MdBed,
  MdTimelapse, MdSearch, MdNotifications, MdRefresh, MdTrendingUp,
} from 'react-icons/md';
import { useApp } from '../../../provider';
import { apiGet } from '../../../services/apiService';
import { ToastProvider, useToast } from './components/Toast';
import SkeletonLoader from './components/SkeletonLoader';
import ConsultationCanvas from './components/ConsultationCanvas';
import './Dashboard.css';

// ─── Inner component so it can use the ToastProvider context ─────────────────
const DashboardInner = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // ─── State ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ─── Data Loading ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/appointments', { limit: 200 });
      const list = Array.isArray(data) ? data : (data?.appointments || data?.data || []);
      setAppointments(list);
    } catch (err) {
      showToast(err.message || 'Failed to load schedule. Please try again.', 'error');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Derived data ─────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (d) => {
    try {
      const apd = new Date(d); apd.setHours(0, 0, 0, 0);
      return apd.getTime() === today.getTime();
    } catch { return false; }
  };

  const todayAppts = appointments.filter(a => isToday(a.startAt || a.date));
  const pendingLabs = appointments.filter(a =>
    (a.followUp?.labTests || []).some(l => l.ordered && !l.completed)
  ).length;
  const inPatients = appointments.filter(a =>
    (a.status || '').toLowerCase() === 'admitted'
  ).length;

  // Avg wait time (mock — real data would come from a dedicated endpoint)
  const avgWait = todayAppts.length > 0 ? Math.round(todayAppts.length * 4.5) : 0;

  // Active patient queue: today's scheduled/confirmed appointments
  const statusOrder = { emergency: 0, 'vitals-done': 1, 'checked-in': 2, scheduled: 3 };
  const patientQueue = todayAppts
    .filter(a => !['completed', 'cancelled'].includes((a.status || '').toLowerCase()))
    .sort((a, b) => {
      const ao = statusOrder[a.queueStatus?.toLowerCase()] ?? 3;
      const bo = statusOrder[b.queueStatus?.toLowerCase()] ?? 3;
      return ao - bo || new Date(a.startAt) - new Date(b.startAt);
    });

  // Search + filter
  const filteredQueue = patientQueue.filter(a => {
    const name = (a.patientId?.fullName || a.patientId?.firstName || a.patientName || '').toLowerCase();
    const code = (a.patientId?.patientCode || '').toLowerCase();
    const matchSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || code.includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === 'all' || (a.status || '').toLowerCase() === filterStatus;
    return matchSearch && matchFilter;
  });

  // Greetings
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // ─── Queue badge color ────────────────────────────────────────────────────
  const queueBadge = (appt) => {
    const st = (appt.queueStatus || appt.status || '').toLowerCase();
    if (st === 'emergency') return { label: 'Emergency', cls: 'badge--emergency' };
    if (st === 'vitals-done' || st === 'vitals done') return { label: 'Vitals Done', cls: 'badge--vitals' };
    if (st === 'confirmed' || st === 'checked-in') return { label: 'Checked In', cls: 'badge--checked' };
    return { label: 'Waiting', cls: 'badge--waiting' };
  };

  const kpiCards = [
    {
      label: "Today's Appointments",
      value: loading ? '—' : todayAppts.length,
      icon: <MdCalendarToday />,
      color: '#0d9488',
      bg: '#f0fdfa',
      onClick: () => navigate('/doctor/appointments'),
    },
    {
      label: 'Pending Labs',
      value: loading ? '—' : pendingLabs,
      icon: <MdScience />,
      color: '#d97706',
      bg: '#fffbeb',
      onClick: () => navigate('/doctor/patients'),
    },
    {
      label: 'In-Patients (IPD)',
      value: loading ? '—' : inPatients,
      icon: <MdBed />,
      color: '#7c3aed',
      bg: '#f5f3ff',
      onClick: () => navigate('/doctor/patients'),
    },
    {
      label: 'Avg Wait Time',
      value: loading ? '—' : `${avgWait}m`,
      icon: <MdTimelapse />,
      color: '#0369a1',
      bg: '#eff6ff',
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-50">

        {/* Left: Branding & Greeting */}
        <div className="flex items-center gap-4 min-w-[300px]">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
            <MdLocalHospital size={24} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight">
              {greeting}, <span className="text-primary-700">Dr. {user?.lastName || user?.firstName || 'Doctor'}</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-lg mx-4">
          <div className="relative group">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search patients by name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100/70 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
            {/* Command shortcut hint */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50 pointer-events-none">
              <span className="text-[10px] font-bold border border-slate-300 rounded px-1.5 py-0.5 bg-white">⌘</span>
              <span className="text-[10px] font-bold border border-slate-300 rounded px-1.5 py-0.5 bg-white">K</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
              title="Refresh Dashboard"
            >
              <MdRefresh size={22} className={loading ? "animate-spin" : ""} />
            </button>
            <button className="relative p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
              <MdNotifications size={22} />
              {pendingLabs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>
          </div>

          {/* Avatar Area */}
          <button className="flex items-center gap-2 pl-2 hover:bg-slate-50 p-1.5 rounded-2xl transition-colors text-left group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-xl shadow-sm flex items-center justify-center font-bold text-sm tracking-widest ring-2 ring-white group-hover:ring-primary-100 transition-all">
              {(user?.firstName || 'D').charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block pr-2">
              <div className="text-[12px] font-bold text-slate-700">Online</div>
              <div className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Available
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* ── 1. KPI Widget Grid ── */}
          {loading ? (
            <SkeletonLoader variant="kpi" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((kpi, i) => (
                <div
                  key={i}
                  onClick={kpi.onClick}
                  className={`relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200 rounded-[1.25rem] p-5 flex items-center justify-between shadow-sm transition-all duration-300 ${kpi.onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-slate-300 group' : ''}`}
                >
                  {/* Left Decoration Border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 scale-y-75 group-hover:scale-y-100 rounded-r-md transition-transform duration-300" style={{ backgroundColor: kpi.color }}></div>

                  <div>
                    <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight" style={{ color: kpi.color }}>
                      {kpi.value}
                    </h3>
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {kpi.label}
                    </p>
                  </div>

                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm"
                    style={{ backgroundColor: kpi.bg, color: kpi.color }}
                  >
                    {React.cloneElement(kpi.icon, { size: 24 })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Bento Grid Bottom (30/70 Split) ── */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Left Column: Smart List Queue (30%) */}
            <div className="w-full lg:w-[32%] flex flex-col gap-4">

              {/* "Next Up" Prominent Card */}
              {filteredQueue.length > 0 && !loading && (
                <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-[1.5rem] p-6 text-white shadow-lg overflow-hidden relative">
                  {/* Decorative Elements */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-20 mix-blend-overlay"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-primary-100">Up Next</span>
                    </div>

                    <h2 className="text-2xl font-extrabold mb-1">
                      {filteredQueue[0].patientId?.fullName ||
                        `${filteredQueue[0].patientId?.firstName || ''} ${filteredQueue[0].patientId?.lastName || ''}`.trim() ||
                        filteredQueue[0].patientName || 'Patient'}
                    </h2>

                    <div className="flex items-center gap-3 text-sm text-primary-100/90 font-medium mb-6">
                      <span className="flex items-center gap-1">
                        <MdCalendarToday size={14} />
                        {filteredQueue[0].appointmentType || 'Consultation'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MdTimelapse size={14} />
                        {new Date(filteredQueue[0].startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedAppt(filteredQueue[0])}
                      className="w-full bg-white text-primary-800 hover:bg-primary-50 font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group"
                    >
                      Start Consultation
                      <MdTrendingUp className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {/* Standard Patient Queue List */}
              <div className="bg-white border border-slate-200 rounded-[1.5rem] shadow-sm flex flex-col h-[600px] overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                  <h3 className="text-[15px] font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <MdTrendingUp className="text-primary-600" size={18} />
                    Active Queue
                  </h3>
                  <span className="bg-primary-100 text-primary-800 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    {filteredQueue.length} Wait
                  </span>
                </div>

                {/* Filters */}
                <div className="flex gap-2 p-3 border-b border-slate-100 shrink-0 bg-white">
                  {['all', 'scheduled', 'confirmed'].map(f => (
                    <button
                      key={f}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${filterStatus === f
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                        }`}
                      onClick={() => setFilterStatus(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {loading ? (
                    <SkeletonLoader variant="queue" count={5} />
                  ) : filteredQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 p-6 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-4xl mb-2">🎉</div>
                      <p className="font-bold text-slate-600">Queue is clear!</p>
                      <p className="text-xs font-medium">No pending patients {searchQuery ? 'matching your search' : 'today'}.</p>
                    </div>
                  ) : (
                    // Skip the first item as it's shown in the "Next Up" card
                    filteredQueue.slice(1).map((appt, idx) => {
                      const badge = queueBadge(appt);
                      const isActive = selectedAppointment?._id === appt._id;
                      const name = appt.patientId?.fullName || `${appt.patientId?.firstName || ''} ${appt.patientId?.lastName || ''}`.trim() || appt.patientName || 'Unknown Patient';
                      const time = appt.startAt ? new Date(appt.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';

                      return (
                        <button
                          key={appt._id}
                          onClick={() => setSelectedAppt(appt)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 group flex items-start gap-3
                            ${isActive
                              ? 'bg-primary-50 border-primary-200 shadow-sm ring-1 ring-primary-500/20'
                              : 'bg-white border-slate-100 hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5'
                            }
                            ${badge.cls === 'badge--emergency' ? 'border-rose-200 bg-rose-50 hover:border-rose-300' : ''}
                          `}
                        >
                          {/* Position Badge */}
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-extrabold shrink-0 
                            ${badge.cls === 'badge--emergency' ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30' : 'bg-slate-100 text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-700'}
                            ${isActive ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30' : ''}
                          `}>
                            {idx + 2} {/* +2 because index 0 is in the NextUp card */}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-bold text-slate-800 truncate">{name}</h4>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{appt.appointmentType || 'Consultation'}</p>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-[11px] font-bold text-slate-700">{time}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md
                              ${badge.cls === 'badge--emergency' ? 'bg-rose-100 text-rose-700' : ''}
                              ${badge.cls === 'badge--vitals' ? 'bg-emerald-100 text-emerald-700' : ''}
                              ${badge.cls === 'badge--checked' ? 'bg-primary-100 text-primary-700' : ''}
                              ${badge.cls === 'badge--waiting' ? 'bg-amber-100 text-amber-700' : ''}
                            `}>
                              {badge.label}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Consultation Canvas (70%) */}
            <div className="w-full lg:w-[68%]">
              <ConsultationCanvas
                appointment={selectedAppointment}
                onConsultationSaved={() => {
                  loadData();
                  setSelectedAppt(null); // Optional: stay on patient or close. Closing for now.
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Wrap with ToastProvider ──────────────────────────────────────────────────
const DoctorDashboard = () => (
  <ToastProvider>
    <DashboardInner />
  </ToastProvider>
);

export default DoctorDashboard;
