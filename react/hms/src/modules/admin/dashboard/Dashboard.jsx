/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import 'react-calendar/dist/Calendar.css';
import './Dashboard.css';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenueTab, setRevenueTab] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setData({
      invoice: 1287,
      patients: 965,
      appointments: 128,
      beds: 315,
    });
    setLoading(false);
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

  const upcomingAppointments = [
    { name: "Arthur Morgan", doctor: "Dr. John", time: "10:00 AM - 10:30 AM", status: "Confirmed" },
    { name: "Regina Mills", doctor: "Dr. Joel", time: "10:30 AM - 11:00 AM", status: "Confirmed" },
    { name: "David Warner", doctor: "Dr. John", time: "11:00 AM - 11:30 AM", status: "Pending" },
    { name: "Joseph King", doctor: "Dr. John", time: "11:30 AM - 12:00 PM", status: "Confirmed" },
    { name: "Lokesh", doctor: "Dr. John", time: "12:00 PM - 12:30 PM", status: "Cancelled" },
    { name: "Kanagaraj", doctor: "Dr. John", time: "12:30 PM - 01:00 PM", status: "Confirmed" },
    { name: "Priya", doctor: "Dr. Olivia", time: "01:00 PM - 01:30 PM", status: "Confirmed" },
    { name: "Suresh K", doctor: "Dr. Petra", time: "01:30 PM - 02:00 PM", status: "Pending" },
    { name: "Anita", doctor: "Dr. Ameena", time: "02:00 PM - 02:30 PM", status: "Confirmed" },
    { name: "Ravi", doctor: "Dr. Damian", time: "02:30 PM - 03:00 PM", status: "Confirmed" },
  ];

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
                {upcomingAppointments.map((apt, idx) => (
                  <AppointmentItem key={idx} {...apt} />
                ))}
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

const AppointmentItem = ({ name, doctor, time, status }) => {
  const isGirl = name.toLowerCase().endsWith('a') || 
                 name.toLowerCase().endsWith('i') || 
                 name.toLowerCase().endsWith('y');
  
  const statusColors = {
    Confirmed: { bg: '#dcfce7', text: '#166534' },
    Pending: { bg: '#fef3c7', text: '#92400e' },
    Cancelled: { bg: '#fee2e2', text: '#991b1b' }
  };

  return (
    <div className="appointment-item">
      <div className="appointment-avatar">
        {isGirl ? '👧' : '👦'}
      </div>
      <div className="appointment-info">
        <p className="appointment-name">{name}</p>
        <p className="appointment-details">{doctor} • {time}</p>
      </div>
      <div 
        className="appointment-status"
        style={{ 
          backgroundColor: statusColors[status].bg, 
          color: statusColors[status].text 
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
