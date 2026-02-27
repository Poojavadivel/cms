/**
 * Staff Detail Enterprise - Premium View
 */

import React, { useState } from 'react';
import {
  FiPhone, FiMail, FiMapPin, FiCalendar, FiClock,
  FiShield, FiEdit2, FiX, FiCheckCircle, FiAlertCircle,
  FiBriefcase
} from 'react-icons/fi';
import './StaffDetailEnterprise.css';
import adminFemaleIcon from '../../../assets/admin-femaleicon.png';
import adminMaleIcon from '../../../assets/admin-maleicon.png';
import doctorFemaleIcon from '../../../assets/doctor-femaleicon.png';
import doctorMaleIcon from '../../../assets/doctor-male icon.png';
import labFemaleIcon from '../../../assets/labfemaleicon.png';
import labMaleIcon from '../../../assets/labmaleicon.png';
import nurseFemaleIcon from '../../../assets/nursefemaleicon.png';
import nurseMaleIcon from '../../../assets/nursemaleicon.png';
import boyIcon from '../../../assets/boyicon.png';
import girlIcon from '../../../assets/girlicon.png';

const StaffDetailEnterprise = ({ staffId, initial, onClose, onUpdate, showUpdate = false }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // If no data, show nothing
  if (!initial) return null;

  // Show loading state while doctor data is being fetched
  if (initial.loading) {
    return (
      <div className="enterprise-modal" onClick={(e) => e.target.className === 'enterprise-modal' && onClose && onClose()}>
        <div className="enterprise-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', border: '5px solid #f1f5f9', borderTopColor: '#207DC0', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }}></div>
            <p style={{ color: '#207DC0', fontSize: '16px', fontWeight: 600 }}>Gathering Doctor Information...</p>
          </div>
        </div>
      </div>
    );
  }


  // Helper to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Helper: Get avatar source
  const getAvatarSrc = (staff) => {
    if (staff.avatarUrl) return staff.avatarUrl;

    const lowerDesignation = staff.designation?.toLowerCase() || '';
    const lowerDepartment = staff.department?.toLowerCase() || '';
    const gender = staff.gender?.toLowerCase() || '';
    const isFemale = gender === 'female' || gender === 'f' || gender === 'girl';

    if (lowerDesignation.includes('doctor') || lowerDesignation.includes('physician') || lowerDesignation.includes('surgeon')) {
      return isFemale ? doctorFemaleIcon : doctorMaleIcon;
    }
    if (lowerDesignation.includes('nurse') || lowerDesignation.includes('nursing')) {
      return isFemale ? nurseFemaleIcon : nurseMaleIcon;
    }
    if (lowerDesignation.includes('lab') || lowerDesignation.includes('technician') || lowerDepartment.includes('laboratory') || lowerDepartment.includes('pathology')) {
      return isFemale ? labFemaleIcon : labMaleIcon;
    }
    if (lowerDesignation.includes('admin') || lowerDesignation.includes('reception') || lowerDesignation.includes('manager') || lowerDesignation.includes('clerk')) {
      return isFemale ? adminFemaleIcon : adminMaleIcon;
    }
    return isFemale ? girlIcon : boyIcon;
  };

  const renderStatusDot = (status) => {
    const color = status === 'Available' ? '#10b981' :
      status === 'Busy' ? '#f59e0b' : '#94a3b8';
    return (
      <div
        className="status-dot"
        style={{ background: color }}
      />
    );
  };

  return (
    <div className="enterprise-modal" onClick={(e) => e.target.className === 'enterprise-modal' && onClose && onClose()}>
      <div className="enterprise-content">

        {/* Floating Close Button */}
        <button className="floating-close" onClick={() => onClose && onClose()}>
          <FiX size={20} />
        </button>

        {/* HEADER SECTION */}
        <div className="enterprise-header">
          <div className="avatar-container">
            <img
              src={getAvatarSrc(initial)}
              alt={initial.name}
              className="avatar-large"
              onError={(e) => { e.target.src = boyIcon; }}
            />
            {renderStatusDot(initial.status)}
          </div>

          <div className="header-info">
            <h1 className="staff-name">{initial.name}</h1>
            <div className="staff-subtitle">
              <span className="id-badge">{initial.patientFacingId || 'KGF-STAFF'}</span>
              <span>{initial.designation}</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{initial.department}</span>
            </div>
          </div>

          <div className="primary-actions">
            {initial.email && (
              <button
                className="btn-action-glass"
                onClick={() => window.location.href = `mailto:${initial.email}`}
              >
                <FiMail size={16} />
                <span>Contact</span>
              </button>
            )}
            {showUpdate && (
              <button
                className="btn-action-glass btn-primary-glow"
                onClick={() => onUpdate && onUpdate(initial)}
              >
                <FiEdit2 size={16} />
                <span>Update Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* BODY SECTION */}
        <div className="enterprise-body">
          {/* Navigation Sidebar */}
          <div className="left-sidebar">
            <div
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FiCheckCircle size={16} /> Overview
            </div>
            <div
              className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              <FiClock size={16} /> Schedule
            </div>
            <div
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <FiShield size={16} /> Credentials
            </div>
          </div>

          {/* Main Content Area */}
          <div className="right-content">

            {activeTab === 'overview' && (
              <div className="content-grid animate-fade-in">
                {/* Contact Card */}
                <div className="data-card">
                  <div className="card-header">
                    <div className="card-icon"><FiPhone /></div>
                    <span className="card-title">Contact Details</span>
                  </div>

                  <div className="data-row">
                    <span className="data-label">Mobile Number</span>
                    <span className="data-value">{initial.contact || 'No contact saved'}</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Email Address</span>
                    <span className="data-value">{initial.email || 'No email saved'}</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Home Address</span>
                    <span className="data-value" style={{ fontSize: '13px' }}>
                      {initial.address || 'Address not listed'}
                    </span>
                  </div>
                </div>

                {/* Professional Card */}
                <div className="data-card">
                  <div className="card-header">
                    <div className="card-icon"><FiBriefcase /></div>
                    <span className="card-title">Professional Info</span>
                  </div>

                  <div className="data-row">
                    <span className="data-label">Primary Dept</span>
                    <span className="data-value">
                      {initial.department}
                      <span className="chip chip-blue">Core</span>
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Work Experience</span>
                    <span className="data-value">{initial.experienceYears || '0'} Years Prof.</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Certifications</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      {initial.qualifications?.map((q, i) => (
                        <span key={i} className="chip">{q}</span>
                      )) || <span style={{ color: '#94a3b8', fontSize: '12px' }}>Standard</span>}
                    </div>
                  </div>
                </div>

                {/* Notes Card */}
                {initial.notes && (
                  <div className="data-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                      <div className="card-icon"><FiAlertCircle /></div>
                      <span className="card-title">Medical/Admin Notes</span>
                    </div>
                    <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                      {typeof initial.notes === 'string' ? initial.notes : initial.notes?.general || 'Detailed clinical notes or administrative remarks are stored here.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="content-grid animate-fade-in">
                <div className="data-card">
                  <div className="card-header">
                    <div className="card-icon"><FiClock /></div>
                    <span className="card-title">Shift Assignment</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Current Scheduled Shift</span>
                    <span className="data-value" style={{ color: '#207DC0', fontSize: '18px' }}>{initial.shift || 'General'} Shift</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Hospital Join Date</span>
                    <span className="data-value">{formatDate(initial.joinedAt)}</span>
                  </div>
                </div>

                <div className="data-card">
                  <div className="card-header">
                    <div className="card-icon"><FiMapPin /></div>
                    <span className="card-title">Current Location</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Assigned Station</span>
                    <span className="data-value">{initial.location || 'Main Hospital'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="content-grid animate-fade-in">
                <div className="data-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="card-header">
                    <div className="card-icon"><FiShield /></div>
                    <span className="card-title">System Permissions</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Authorization Roles</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {initial.roles?.map((role, i) => (
                        <span key={i} className="chip chip-blue">{role}</span>
                      )) || <span className="chip">Staff Member</span>}
                      <span className="chip">Validated</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailEnterprise;
