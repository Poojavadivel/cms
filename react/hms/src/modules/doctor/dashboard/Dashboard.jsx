/**
 * DoctorDashboard.jsx
 * Enterprise-grade Doctor Dashboard matching Flutter's EnterpriseDoctorDashboard
 * Professional medical color scheme, real-time stats, patient flow charts
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdPeople,
  MdCalendarToday,
  MdAccessTime,
  MdCheckCircle,
  MdPlayArrow,
  MdRemoveRedEye,
  MdLocalHospital,
  MdWarning,
  MdNote,
  MdMessage,
  MdTrendingUp,
} from 'react-icons/md';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useApp } from '../../../provider';
import appointmentsService from '../../../services/appointmentsService';
import patientsService from '../../../services/patientsService';
import './Dashboard.css';

const DoctorDashboard = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appointmentsData, patientsData] = await Promise.all([
        appointmentsService.fetchAppointments({ limit: 100 }),
        patientsService.fetchMyPatients(),
      ]);

      setAppointments(appointmentsData || []);
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalPatients = patients.length;

  const todayAppointments = appointments.filter(a => {
    try {
      const apptDate = new Date(a.startAt || a.date || a.appointmentDate);
      const today = new Date();
      return apptDate.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  }).length;

  const waitingNow = appointments.filter(a => {
    try {
      const apptDate = new Date(a.startAt || a.date || a.appointmentDate);
      const today = new Date();
      const isToday = apptDate.toDateString() === today.toDateString();
      const isScheduled = (a.status || '').toLowerCase() === 'scheduled';
      return isToday && isScheduled;
    } catch {
      return false;
    }
  }).length;

  const completedToday = appointments.filter(a => {
    try {
      const apptDate = new Date(a.startAt || a.date || a.appointmentDate);
      const today = new Date();
      const isToday = apptDate.toDateString() === today.toDateString();
      const isCompleted = (a.status || '').toLowerCase() === 'completed';
      return isToday && isCompleted;
    } catch {
      return false;
    }
  }).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const patientQueue = appointments
    .filter(a => {
      try {
        const apptDate = new Date(a.startAt || a.date || a.appointmentDate);
        const today = new Date();
        const isToday = apptDate.toDateString() === today.toDateString();
        const isScheduled = (a.status || '').toLowerCase() === 'scheduled';
        return isToday && isScheduled;
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      const timeA = a.time || a.appointmentTime || '';
      const timeB = b.time || b.appointmentTime || '';
      return timeA.localeCompare(timeB);
    })
    .slice(0, 5);

  const upcomingAppointments = appointments
    .filter(a => {
      try {
        const apptDate = new Date(a.startAt || a.date || a.appointmentDate);
        const now = new Date();
        const isFuture = apptDate > now;
        const isScheduled = (a.status || '').toLowerCase() === 'scheduled';
        return isFuture && isScheduled;
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.appointmentDate);
      const dateB = new Date(b.date || b.appointmentDate);
      return dateA - dateB;
    })
    .slice(0, 4);

  const statusCounts = {
    scheduled: appointments.filter(a => (a.status || '').toLowerCase() === 'scheduled').length,
    completed: appointments.filter(a => (a.status || '').toLowerCase() === 'completed').length,
    cancelled: appointments.filter(a => (a.status || '').toLowerCase() === 'cancelled').length,
    total: appointments.length,
  };

  const getChartData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      days.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: dateStr,
        scheduled: 0,
        completed: 0,
      });
    }

    appointments.forEach(a => {
      try {
        const apptDate = new Date(a.startAt || a.date || a.appointmentDate).toDateString();
        const dayData = days.find(d => d.fullDate === apptDate);
        if (dayData) {
          const status = (a.status || '').toLowerCase();
          if (status === 'scheduled') dayData.scheduled++;
          else if (status === 'completed') dayData.completed++;
        }
      } catch (e) { }
    });

    return days;
  };

  const chartData = getChartData();

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const navigateToDetails = () => {
    if (!selectedItem) return;
    setShowModal(false);

    // If it's a patient queue item or upcoming appointment
    if (selectedItem.patientId?._id || selectedItem.patientId) {
      navigate('/doctor/appointments');
    } else {
      navigate('/doctor/patients');
    }
  };

  if (loading) {
    return (
      <div className="doctor-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-icon">
          <MdLocalHospital />
        </div>
        <div className="header-content">
          <h1>{getGreeting()}, Dr. {user?.lastName || user?.fullName || 'Doctor'}</h1>
          <p>You have {waitingNow} patients waiting</p>
        </div>
        <div className="header-controls">
          <div className="period-selector">
            {['Today', 'Week', 'Month'].map(period => (
              <button
                key={period}
                className={selectedPeriod === period ? 'active' : ''}
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </button>
            ))}
          </div>
          <div className="current-date">
            <MdCalendarToday />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn success">
          <MdLocalHospital />
          <span>Start Consultation</span>
        </button>
        <button className="action-btn danger">
          <MdWarning />
          <span>Emergency</span>
        </button>
        <button className="action-btn warning">
          <MdNote />
          <span>Quick Notes</span>
        </button>
        <button className="action-btn purple">
          <MdMessage />
          <span>Messages</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Section */}
        <div className="content-left">
          {/* Stats Cards */}
          <div className="stats-cards">
            <StatCard
              icon={<MdPeople />}
              label="Total Patients"
              value={totalPatients}
              color="#0EA5E9"
              onClick={() => navigate('/doctor/patients')}
            />
            <StatCard
              icon={<MdCalendarToday />}
              label="Today's Appointments"
              value={todayAppointments}
              color="#8B5CF6"
              onClick={() => navigate('/doctor/appointments')}
            />
            <StatCard
              icon={<MdAccessTime />}
              label="Waiting Now"
              value={waitingNow}
              color="#F59E0B"
              onClick={() => navigate('/doctor/appointments')}
            />
            <StatCard
              icon={<MdCheckCircle />}
              label="Completed Today"
              value={completedToday}
              color="#10B981"
              onClick={() => navigate('/doctor/appointments')}
            />
          </div>

          {/* Patient Flow Chart */}
          <div className="chart-card">
            <div className="card-header">
              <div className="header-title">
                <MdTrendingUp />
                <h3>Patient Flow</h3>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-dot scheduled"></div>
                  <span>Scheduled</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot completed"></div>
                  <span>Completed</span>
                </div>
              </div>
            </div>
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="scheduled"
                    stroke="#0EA5E9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScheduled)"
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Patient Queue */}
          <div className="queue-card">
            <div className="card-header">
              <div className="header-title">
                <MdPeople />
                <h3>Patient Queue</h3>
              </div>
              <div className="queue-badge">{patientQueue.length} Waiting</div>
            </div>
            <div className="queue-list">
              {patientQueue.length === 0 ? (
                <div className="empty-state">
                  <MdCheckCircle />
                  <p>No patients in queue</p>
                  <span>All caught up! 🎉</span>
                </div>
              ) : (
                patientQueue.map((appointment, index) => (
                  <QueueItem
                    key={appointment._id || appointment.id}
                    appointment={appointment}
                    position={index + 1}
                    onClick={() => handleItemClick(appointment)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="content-right">
          {/* Upcoming Appointments */}
          <div className="upcoming-card">
            <div className="card-header">
              <div className="header-title">
                <MdCalendarToday />
                <h3>Upcoming</h3>
              </div>
              <div className="upcoming-badge">{upcomingAppointments.length}</div>
            </div>
            <div className="upcoming-list">
              {upcomingAppointments.length === 0 ? (
                <div className="empty-state">
                  <MdCalendarToday />
                  <p>No upcoming appointments</p>
                </div>
              ) : (
                upcomingAppointments.map(appointment => (
                  <UpcomingItem
                    key={appointment._id || appointment.id}
                    appointment={appointment}
                    onClick={() => handleItemClick(appointment)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="status-card">
            <div className="card-header">
              <div className="header-title">
                <MdCheckCircle />
                <h3>Status Overview</h3>
              </div>
            </div>
            <div className="status-content">
              <StatusBar
                label="Scheduled"
                count={statusCounts.scheduled}
                total={statusCounts.total}
                color="#0EA5E9"
              />
              <StatusBar
                label="Completed"
                count={statusCounts.completed}
                total={statusCounts.total}
                color="#10B981"
              />
              <StatusBar
                label="Cancelled"
                count={statusCounts.cancelled}
                total={statusCounts.total}
                color="#EF4444"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Detail Modal */}
      {showModal && selectedItem && (
        <QuickDetailModal
          item={selectedItem}
          onClose={() => setShowModal(false)}
          onNavigate={navigateToDetails}
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, label, value, color, onClick }) => (
  <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="stat-icon" style={{ background: `${color}1A`, color }}>
      {icon}
    </div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const StatusBar = ({ label, count, total, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="status-bar">
      <div className="status-header">
        <span className="status-label">{label}</span>
        <span className="status-count" style={{ color }}>
          {count} ({percentage}%)
        </span>
      </div>
      <div className="status-progress">
        <div
          className="status-fill"
          style={{
            width: `${percentage}%`,
            background: color,
          }}
        ></div>
      </div>
    </div>
  );
};

const QuickDetailModal = ({ item, onClose, onNavigate }) => {
  const patientName = item.patientName || item.patientId?.fullName || 'Unknown Patient';
  const reason = item.reason || item.appointmentType || 'Consultation';
  const time = item.time || item.appointmentTime || '--:--';
  const date = item.date || item.appointmentDate ? new Date(item.date || item.appointmentDate).toLocaleDateString() : 'Today';
  const status = item.status || 'Scheduled';

  return (
    <div className="dashboard-modal-overlay" onClick={onClose}>
      <div className="dashboard-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Quick Details</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <div className="detail-label">Patient</div>
            <div className="detail-value">{patientName}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Type</div>
            <div className="detail-value">{reason}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Schedule</div>
            <div className="detail-value">{date} • {time}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Status</div>
            <div className="detail-value">
              <span className={`status-pill ${status.toLowerCase()}`}>{status}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Close</button>
          <button className="primary-btn" onClick={onNavigate}>View Full Page</button>
        </div>
      </div>
    </div>
  );
};

const QueueItem = ({ appointment, position, onClick }) => {
  const patientName = appointment.patientName || appointment.patientId?.fullName || 'Unknown Patient';
  const reason = appointment.reason || 'General Consultation';
  const time = appointment.time || appointment.appointmentTime || '--:--';

  return (
    <div className="queue-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="queue-position">#{position}</div>
      <div className="queue-details">
        <div className="queue-name">{patientName}</div>
        <div className="queue-reason">{reason}</div>
      </div>
      <div className="queue-meta">
        <div className="queue-time">{time}</div>
        <div className="queue-status">Waiting</div>
      </div>
      <button className="queue-action" title="Start consultation" onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}>
        <MdPlayArrow />
      </button>
    </div>
  );
};

const UpcomingItem = ({ appointment, onClick }) => {
  const patientName = appointment.patientName || appointment.patientId?.fullName || 'Unknown Patient';
  const date = new Date(appointment.date || appointment.appointmentDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const time = appointment.time || appointment.appointmentTime || '--:--';

  return (
    <div className="upcoming-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="upcoming-icon">
        <MdCalendarToday />
      </div>
      <div className="upcoming-details">
        <div className="upcoming-name">{patientName}</div>
        <div className="upcoming-datetime">{date} • {time}</div>
      </div>
      <button className="upcoming-action" title="View details" onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}>
        <MdRemoveRedEye />
      </button>
    </div>
  );
};

export default DoctorDashboard;
