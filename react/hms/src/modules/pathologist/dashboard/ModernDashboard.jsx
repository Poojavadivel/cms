/**
 * ModernDashboard.jsx
 * Modern medical pathology laboratory dashboard with clean, soft, enterprise SaaS look
 * Hospital-grade professionalism with 2025 design standards
 */

import React, { useState, useEffect } from 'react';
import {
  MdSearch,
  MdNotifications,
  MdDescription,
  MdAssignment,
  MdCheckCircle,
  MdWarning,
  MdRefresh,
  MdScience,
  MdBiotech,
  MdLocalHospital,
  MdArrowForward,
  MdChevronRight,
} from 'react-icons/md';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useApp } from '../../../provider';
import pathologyService from '../../../services/pathologyService';
import boyIcon from '../../../assets/boyicon.png';
import girlIcon from '../../../assets/girlicon.png';
import './ModernDashboard.css';

const ModernDashboard = () => {
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState(0);
  const [stats, setStats] = useState({
    total: 142,
    pending: 28,
    completed: 109,
    critical: 5,
  });

  // Doctor's feedback with multiple items
  const feedbackItems = [
    {
      text: "The turnaround time for biopsy reports has significantly improved this week. Excellent work by the lab team.",
      author: "Dr. Sarah Jenkin",
      title: "Senior Oncologist",
      avatar: "SJ"
    },
    {
      text: "Impressed with the accuracy and speed of the blood culture results. This helps in critical patient care decisions.",
      author: "Dr. Michael Chen",
      title: "Infectious Disease",
      avatar: "MC"
    },
    {
      text: "The new automated system has reduced errors dramatically. Great job on the implementation!",
      author: "Dr. Priya Sharma",
      title: "Chief Pathologist",
      avatar: "PS"
    }
  ];

  // Auto-scroll feedback every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeedback((prev) => (prev + 1) % feedbackItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [feedbackItems.length]);

  // Mock performance data with varying values
  const performanceData = [
    { day: 'Mon', efficiency: 85 },
    { day: 'Tue', efficiency: 92 },
    { day: 'Wed', efficiency: 78 },
    { day: 'Thu', efficiency: 95 },
    { day: 'Fri', efficiency: 88 },
    { day: 'Sat', efficiency: 91 },
    { day: 'Sun', efficiency: 82 },
  ];

  // Lab equipment status
  const labStatus = [
    { name: 'Centrifuge A', status: 'Spinning Cycle', statusColor: '#2ED573', icon: <MdRefresh /> },
    { name: 'Analyzer X1', status: 'Processing Batch', statusColor: '#5B7CFA', icon: <MdBiotech /> },
    { name: 'Hematology', status: 'Idle / Ready', statusColor: '#94A3B8', icon: <MdScience /> },
  ];

  // Recent test reports
  const recentReports = [
    { name: 'Rahul Raj', id: 'PT-2049', test: 'CBC', dept: 'Hematology', status: 'Pending', gender: 'Male' },
    { name: 'Karthik Iyer', id: 'PT-8832', test: 'Lipid Profile', dept: 'Biochemistry', status: 'Completed', gender: 'Male' },
    { name: 'Vikram Krishnan', id: 'PT-1290', test: 'Thyroid Profile', dept: 'Serology', status: 'Completed', gender: 'Male' },
    { name: 'Arjun Mehta', id: 'PT-5561', test: 'Dengue NS1', dept: 'Microbiology', status: 'High Risk', gender: 'Male' },
    { name: 'Priya Sharma', id: 'PT-3421', test: 'Blood Sugar', dept: 'Biochemistry', status: 'Completed', gender: 'Female' },
    { name: 'Amit Patel', id: 'PT-7823', test: 'Liver Function', dept: 'Biochemistry', status: 'Pending', gender: 'Male' },
    { name: 'Sneha Reddy', id: 'PT-9012', test: 'Kidney Profile', dept: 'Biochemistry', status: 'Completed', gender: 'Female' },
    { name: 'Ravi Kumar', id: 'PT-4567', test: 'Malaria Test', dept: 'Microbiology', status: 'Pending', gender: 'Male' },
    { name: 'Anjali Singh', id: 'PT-6789', test: 'Urine Analysis', dept: 'Pathology', status: 'Completed', gender: 'Female' },
    { name: 'Suresh Babu', id: 'PT-2345', test: 'HIV Test', dept: 'Serology', status: 'Pending', gender: 'Male' },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await pathologyService.fetchReports({ limit: 50 });
      setReports(data);
      
      // Calculate stats
      const pending = data.filter(r => !r.fileRef).length;
      const completed = data.filter(r => r.fileRef).length;
      const critical = data.filter(r => r.priority === 'urgent').length;
      
      setStats({
        total: data.length,
        pending,
        completed,
        critical,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-dashboard">
      {/* Top Header Bar */}
      <div className="top-header-bar">
        <div className="header-left-section">
          <div className="title-group">
            <h1 className="dashboard-title">Pathology Dashboard</h1>
            <p className="dashboard-subtitle">Central Laboratory</p>
          </div>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span className="status-text">System Online</span>
          </div>
        </div>
        
        <div className="header-right-section">
          <div className="search-bar">
            <MdSearch className="search-icon" />
            <input type="text" placeholder="Search reports…" />
          </div>
          <button className="notification-btn">
            <MdNotifications size={20} />
            <span className="notification-badge">3</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row + Performance Chart */}
      <div className="top-content-row">
        <div className="kpi-cards-column">
          <div className="kpi-card">
            <div className="kpi-icon purple">
              <MdDescription size={18} />
            </div>
            <div className="kpi-content">
              <div className="kpi-number">{stats.total}</div>
              <div className="kpi-label">Total Reports</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon orange">
              <MdAssignment size={18} />
            </div>
            <div className="kpi-content">
              <div className="kpi-number">{stats.pending}</div>
              <div className="kpi-label">Pending</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon green">
              <MdCheckCircle size={18} />
            </div>
            <div className="kpi-content">
              <div className="kpi-number">{stats.completed}</div>
              <div className="kpi-label">Completed</div>
            </div>
          </div>

          <div className="kpi-card critical">
            <div className="kpi-icon-critical">
              <MdWarning size={18} />
            </div>
            <div className="kpi-content-critical">
              <div className="kpi-number-critical">{stats.critical}</div>
              <div className="kpi-label-critical">Critical</div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="card performance-chart-top">
          <div className="card-header">
            <h3 className="card-title">Performance</h3>
            <select className="time-dropdown">
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B7CFA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5B7CFA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" style={{ fontSize: '10px' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Area 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#5B7CFA" 
                  strokeWidth={2}
                  fill="url(#colorEff)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card quick-stats-top">
          <div className="card-header">
            <h3 className="card-title">Quick Stats</h3>
          </div>
          <div className="stat-item-top">
            <span className="stat-label-top">Today's Tests</span>
            <span className="stat-value-top">48</span>
          </div>
          <div className="stat-item-top">
            <span className="stat-label-top">Avg. Turnaround</span>
            <span className="stat-value-top">2.3h</span>
          </div>
          <div className="stat-item-top">
            <span className="stat-label-top">Accuracy Rate</span>
            <span className="stat-value-top">99.2%</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="main-content-grid">
        {/* Left Section (8 columns) */}
        <div className="left-section">
          {/* Live Lab Status */}
          <div className="card live-lab-status">
            <div className="card-header">
              <h3 className="card-title">Live Lab Status</h3>
              <span className="update-time">Updated: Just now</span>
            </div>
            <div className="lab-status-pills">
              {labStatus.map((lab, index) => (
                <div key={index} className="status-pill">
                  <div className="pill-icon">{lab.icon}</div>
                  <div className="pill-content">
                    <div className="pill-name">{lab.name}</div>
                    <div className="pill-status">{lab.status}</div>
                  </div>
                  <div className="pill-dot" style={{ backgroundColor: lab.statusColor }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Test Reports */}
          <div className="card recent-reports">
            <div className="card-header">
              <h3 className="card-title">Recent Test Reports</h3>
              <button className="view-all-btn">
                View All <MdArrowForward size={16} />
              </button>
            </div>
            <div className="reports-table">
              {recentReports.map((report, index) => (
                <div key={index} className="report-row">
                  <img 
                    src={report.gender === 'Female' ? girlIcon : boyIcon}
                    alt={report.name}
                    className="report-avatar"
                  />
                  <div className="report-patient-info">
                    <div className="report-name">{report.name}</div>
                    <div className="report-id">{report.id}</div>
                  </div>
                  <div className="report-test">{report.test}</div>
                  <div className="report-dept">{report.dept}</div>
                  <span className={`report-status-badge ${report.status.toLowerCase().replace(' ', '-')}`}>
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section (4 columns) */}
        <div className="right-section">
          {/* Doctor's Feedback - Auto Scroll */}
          <div className="card doctors-feedback">
            <div className="feedback-content">
              <div className="quote-icon">"</div>
              <p className="feedback-text">
                {feedbackItems[currentFeedback].text}
              </p>
            </div>
            <div className="feedback-author">
              <div className="author-avatar">{feedbackItems[currentFeedback].avatar}</div>
              <div className="author-info">
                <div className="author-name">{feedbackItems[currentFeedback].author}</div>
                <div className="author-title">{feedbackItems[currentFeedback].title}</div>
              </div>
            </div>
            <div className="feedback-pagination">
              {feedbackItems.map((_, index) => (
                <span 
                  key={index}
                  className={`dot ${index === currentFeedback ? 'active' : ''}`}
                  onClick={() => setCurrentFeedback(index)}
                ></span>
              ))}
            </div>
          </div>

          {/* Reagents Alert */}
          <div className="card reagents-alert">
            <div className="alert-icon">
              <MdLocalHospital size={24} />
            </div>
            <div className="alert-content">
              <div className="alert-title">Reagents Low</div>
              <div className="alert-subtitle">3 Items</div>
            </div>
            <MdChevronRight size={20} className="alert-chevron" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
