/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import 'react-calendar/dist/Calendar.css';
import './Dashboard.css';
import { fetchAppointments } from '../../../services/appointmentsService';
import { fetchPatients } from '../../../services/patientsService';
import staffService from '../../../services/staffService';
import DashboardService from './DashboardService';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenueTab, setRevenueTab] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    loadAppointments();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch real data from APIs in parallel
      const [patientsData, staffData, statsData] = await Promise.all([
        fetchPatients({ limit: 1000 }).catch(() => []),
        staffService.fetchStaffs().catch(() => []),
        DashboardService.getStats().catch(() => null)
      ]);
      
      // Count patients
      const patientCount = Array.isArray(patientsData) 
        ? patientsData.length 
        : (patientsData?.patients?.length || 0);
      
      // Count staff/beds (you can adjust this logic)
      const staffCount = Array.isArray(staffData) 
        ? staffData.length 
        : (staffData?.staff?.length || 0);
      
      // Get stats from dashboard service or use calculated values
      const stats = statsData?.data || statsData || {};
      
      setData({
        invoice: stats.totalInvoices || stats.invoices || 0,
        patients: stats.totalPatients || patientCount,
        appointments: stats.totalAppointments || 0, // Will be updated by loadAppointments
        beds: stats.totalBeds || stats.beds || staffCount || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values on error
      setData({
        invoice: 0,
        patients: 0,
        appointments: 0,
        beds: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const appointments = await fetchAppointments();
      
      // Filter for today and upcoming appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = appointments
        .filter(apt => {
          const aptDate = new Date(apt.date || apt.startAt);
          return aptDate >= today;
        })
        .sort((a, b) => {
          const dateA = new Date(a.date || a.startAt);
          const dateB = new Date(b.date || b.startAt);
          return dateA - dateB;
        })
        .slice(0, 10) // Get top 10
        .map(apt => {
          // Extract patient info
          let patientName = '';
          let gender = '';
          
          if (apt.patientId && typeof apt.patientId === 'object') {
            const p = apt.patientId;
            patientName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
            gender = p.gender || '';
          } else if (typeof apt.patientId === 'string') {
            patientName = apt.clientName || '';
          }
          
          // Fallback to direct fields
          if (!patientName) {
            patientName = apt.clientName || apt.patientName || 'Unknown Patient';
          }
          
          // Check appointment metadata for gender
          if (!gender && apt.metadata && typeof apt.metadata === 'object') {
            gender = apt.metadata.gender || '';
          }
          
          // Extract doctor info
          let doctorName = '';
          if (apt.doctorId && typeof apt.doctorId === 'object') {
            const d = apt.doctorId;
            doctorName = `Dr. ${d.firstName || ''} ${d.lastName || ''}`.trim();
          } else if (typeof apt.doctorId === 'string') {
            doctorName = apt.doctorId;
          } else if (apt.doctorName) {
            doctorName = apt.doctorName;
          } else if (apt.doctor) {
            doctorName = apt.doctor;
          }
          
          if (!doctorName || doctorName === 'Dr. ') {
            doctorName = 'Unknown Doctor';
          }
          
          return {
            name: patientName,
            doctor: doctorName,
            time: apt.time || formatTime(apt.startAt),
            status: apt.status || 'Scheduled',
            gender: gender || 'Male',
            id: apt._id || apt.id
          };
        });
      
      setUpcomingAppointments(upcoming);
      
      // Update dashboard stats with real appointment count
      setData(prevData => ({
        ...prevData,
        appointments: appointments.length
      }));
    } catch (error) {
      console.error('Error loading appointments:', error);
      setUpcomingAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return 'N/A';
    }
  };

  const patientOverviewData = [
    { day: '4 Jul', Child: 95, Adult: 80, Elderly: 50 },
    { day: '5 Jul', Child: 101, Adult: 85, Elderly: 54 },
    { day: '6 Jul', Child: 107, Adult: 90, Elderly: 58 },
    { day: '7 Jul', Child: 113, Adult: 95, Elderly: 62 },
    { day: '8 Jul', Child: 119, Adult: 100, Elderly: 66 },
    { day: '9 Jul', Child: 125, Adult: 105, Elderly: 70 },
    { day: '10 Jul', Child: 131, Adult: 110, Elderly: 74 },
    { day: '11 Jul', Child: 137, Adult: 115, Elderly: 78 },
  ];

  const revenueDataWeek = [
    { day: 'Sun', current: 800, previous: 600 },
    { day: 'Mon', current: 1200, previous: 700 },
    { day: 'Tue', current: 1000, previous: 900 },
    { day: 'Wed', current: 1495, previous: 1000 },
    { day: 'Thu', current: 1100, previous: 950 },
    { day: 'Fri', current: 1200, previous: 970 },
    { day: 'Sat', current: 1150, previous: 930 },
  ];

  const revenueDataMonth = [
    { day: 'Week 1', current: 5200, previous: 4800 },
    { day: 'Week 2', current: 6300, previous: 5500 },
    { day: 'Week 3', current: 5800, previous: 5200 },
    { day: 'Week 4', current: 7100, previous: 6400 },
  ];

  const revenueDataYear = [
    { day: 'Jan', current: 25000, previous: 22000 },
    { day: 'Feb', current: 28000, previous: 24000 },
    { day: 'Mar', current: 32000, previous: 27000 },
    { day: 'Apr', current: 30000, previous: 26000 },
    { day: 'May', current: 35000, previous: 29000 },
    { day: 'Jun', current: 38000, previous: 32000 },
    { day: 'Jul', current: 36000, previous: 31000 },
    { day: 'Aug', current: 40000, previous: 34000 },
    { day: 'Sep', current: 42000, previous: 36000 },
    { day: 'Oct', current: 45000, previous: 38000 },
    { day: 'Nov', current: 48000, previous: 40000 },
    { day: 'Dec', current: 50000, previous: 42000 },
  ];

  const getRevenueData = () => {
    if (revenueTab === 0) return revenueDataWeek;
    if (revenueTab === 1) return revenueDataMonth;
    return revenueDataYear;
  };

  const reports = [
    { icon: "🧹", title: "Room Cleaning Needed", time: "1 min ago", tag: "Cleaning" },
    { icon: "🔧", title: "Equipment Maintenance", time: "3 min ago", tag: "Equipment" },
    { icon: "💊", title: "Medication Restock", time: "5 min ago", tag: "Medication" },
    { icon: "❄️", title: "HVAC System Issue", time: "1 hour ago", tag: "HVAC" },
    { icon: "🚚", title: "Patient Transport Required", time: "Yesterday", tag: "Transport" },
    { icon: "🧹", title: "Ward Sanitization Overdue", time: "2 hours ago", tag: "Cleaning" },
    { icon: "🔧", title: "X-Ray Calibration", time: "3 hours ago", tag: "Equipment" },
    { icon: "💊", title: "Vaccine Stock Low", time: "4 hours ago", tag: "Medication" },
    { icon: "❄️", title: "Ventilation Check", time: "5 hours ago", tag: "HVAC" },
    { icon: "🚚", title: "Wheelchair Request", time: "Yesterday", tag: "Transport" },
  ];

  const events = {
    [new Date().toDateString()]: [
      { title: "Morning Staff Meeting", time: "08:00 - 09:00", color: "#14b8a6" },
      { title: "Patient Consultation - General Medicine", time: "10:00 - 12:00", color: "#3b82f6" },
      { title: "Surgery - Orthopedics", time: "13:00 - 15:00", color: "#ef4444" },
      { title: "Training Session", time: "16:00 - 17:00", color: "#a855f7" },
    ],
  };

  const getEventsForDay = (day) => {
    return events[day.toDateString()] || [];
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-stats">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card"></div>)}
          </div>
          <div className="skeleton-main">
            <div className="skeleton-left">
              <div className="skeleton-chart"></div>
              <div className="skeleton-chart"></div>
              <div className="skeleton-list-row">
                <div className="skeleton-list"></div>
                <div className="skeleton-list"></div>
              </div>
            </div>
            <div className="skeleton-right">
              <div className="skeleton-calendar"></div>
              <div className="skeleton-activities"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          icon="📄"
          title="Total Invoice"
          value={data.invoice}
          subtitle="56 more than yesterday"
          iconColor="#3b82f6"
        />
        <StatCard
          icon="👥"
          title="Total Patients"
          value={data.patients}
          subtitle="45 more than yesterday"
          iconColor="#22c55e"
        />
        <StatCard
          icon="📅"
          title="Appointments"
          value={data.appointments}
          subtitle="18 less than yesterday"
          iconColor="#ef4444"
        />
        <StatCard
          icon="🛏️"
          title="Bedroom"
          value={data.beds}
          subtitle="56 more than yesterday"
          iconColor="#3b82f6"
        />
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="dashboard-left">
          {/* Top Row: Patient Overview + Revenue */}
          <div className="chart-row">
            <ChartCard title="Patient Overview" subtitle="by Age Stages">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientOverviewData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} domain={[0, 180]} ticks={[0, 40, 80, 120, 160]} />
                  <Tooltip />
                  <Bar dataKey="Child" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Adult" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Elderly" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                <LegendItem color="#3b82f6" label="Child" />
                <LegendItem color="#22c55e" label="Adult" />
                <LegendItem color="#ef4444" label="Elderly" />
              </div>
            </ChartCard>

            <ChartCard title="Revenue">
              <div className="revenue-tabs">
                {['Week', 'Month', 'Year'].map((tab, idx) => (
                  <button
                    key={tab}
                    className={`revenue-tab ${revenueTab === idx ? 'active' : ''}`}
                    onClick={() => setRevenueTab(idx)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={getRevenueData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="current" stroke="#1f2937" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="previous" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Bottom Row: Appointments + Reports */}
          <div className="list-row">
            <ListCard title="Upcoming Appointments" subtitle="Next scheduled visits">
              <div className="list-content">
                {appointmentsLoading ? (
                  <div className="loading-message" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    Loading appointments...
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="empty-message" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                    No upcoming appointments
                  </div>
                ) : (
                  upcomingAppointments.map((apt, idx) => (
                    <AppointmentItem key={apt.id || idx} {...apt} />
                  ))
                )}
              </div>
            </ListCard>

            <ListCard title="Report" subtitle="Recent system & facility reports">
              <div className="list-content">
                {reports.map((report, idx) => (
                  <ReportItem key={idx} {...report} />
                ))}
              </div>
            </ListCard>
          </div>
        </div>

        {/* Right Sidebar: Calendar */}
        <div className="dashboard-right">
          <ChartCard title="Calendar">
            <div className="calendar-wrapper">
              <Calendar
                value={selectedDay}
                onChange={setSelectedDay}
                className="react-calendar-custom"
              />
            </div>
            <div className="activities-section">
              <h4 className="activities-title">
                Activities
                <span className="activities-date">
                  {selectedDay.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </h4>
              <div className="activities-list">
                {getEventsForDay(selectedDay).map((event, idx) => (
                  <EventItem key={idx} {...event} />
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

// Component Definitions
const StatCard = ({ icon, title, value, subtitle, iconColor }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ 
      backgroundColor: `${iconColor}1A`, 
      borderColor: `${iconColor}4D` 
    }}>
      <span style={{ color: iconColor }}>{icon}</span>
    </div>
    <div className="stat-content">
      <p className="stat-label">{title}</p>
      <h3 className="stat-value">{value.toLocaleString()}</h3>
      <p className="stat-subtitle">{subtitle}</p>
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="chart-card">
    <div className="chart-header">
      <div>
        <h3 className="chart-title">{title}</h3>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </div>
    </div>
    <div className="chart-body">{children}</div>
  </div>
);

const ListCard = ({ title, subtitle, children }) => (
  <div className="list-card">
    <div className="list-header">
      <div>
        <h3 className="list-title">{title}</h3>
        <p className="list-subtitle">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

const LegendItem = ({ color, label }) => (
  <div className="legend-item">
    <div className="legend-dot" style={{ backgroundColor: color }}></div>
    <span>{label}</span>
  </div>
);

const AppointmentItem = ({ name, doctor, time, status, gender }) => {
  // Get avatar based on gender
  const getAvatar = () => {
    if (gender && gender.toLowerCase() === 'female') {
      return '/girlicon.png';
    }
    return '/boyicon.png';
  };
  
  const statusColors = {
    Confirmed: { bg: '#dcfce7', text: '#166534' },
    Scheduled: { bg: '#dbeafe', text: '#1e40af' },
    Pending: { bg: '#fef3c7', text: '#92400e' },
    Cancelled: { bg: '#fee2e2', text: '#991b1b' },
    Completed: { bg: '#e0e7ff', text: '#4338ca' }
  };

  // Default to Scheduled if status not found
  const statusStyle = statusColors[status] || statusColors['Scheduled'];

  return (
    <div className="appointment-item">
      <div className="appointment-avatar">
        <img 
          src={getAvatar()} 
          alt={name}
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = gender === 'Female' ? '👧' : '👦';
          }}
        />
      </div>
      <div className="appointment-info">
        <p className="appointment-name">{name}</p>
        <p className="appointment-details">{doctor} • {time}</p>
      </div>
      <div 
        className="appointment-status"
        style={{ 
          backgroundColor: statusStyle.bg, 
          color: statusStyle.text 
        }}
      >
        {status}
      </div>
    </div>
  );
};

const ReportItem = ({ icon, title, time }) => (
  <div className="report-item">
    <span className="report-icon">{icon}</span>
    <div className="report-info">
      <p className="report-title">{title}</p>
      <p className="report-time">{time}</p>
    </div>
    <span className="report-arrow">→</span>
  </div>
);

const EventItem = ({ title, time, color }) => (
  <div className="event-item">
    <div className="event-accent" style={{ background: `linear-gradient(180deg, ${color}E6, ${color}99)` }}></div>
    <div className="event-info">
      <p className="event-title">{title}</p>
      <p className="event-time">{time}</p>
    </div>
    <div className="event-action" style={{ backgroundColor: `${color}14` }}>
      <span>→</span>
    </div>
  </div>
);

export default AdminDashboard;
