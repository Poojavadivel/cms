/**
 * Neo-Pro Staff Detail View
 * Matches the new StaffDetailEnterprise.css design system
 */

import React, { useState } from 'react';
import {
  FiPhone, FiMail, FiMapPin, FiCalendar, FiClock,
  FiShield, FiEdit2, FiX, FiCheckCircle, FiAlertCircle
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

// Also keep fallbacks just in case
import boyIcon from '../../../assets/boyicon.png';
import girlIcon from '../../../assets/girlicon.png';

const StaffDetailEnterprise = ({ staffId, initial, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // If no data, show nothing
  if (!initial) return null;

  // Show loading state while doctor data is being fetched
  if (initial.loading) {
    return (
      <div className="enterprise-modal" onClick={(e) => e.target.className === 'enterprise-modal' && onClose && onClose()}>
        <div className="enterprise-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#207DC0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#64748B', fontSize: '14px' }}>Loading doctor details...</p>
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

    // 1. Doctor
    if (lowerDesignation.includes('doctor') || lowerDesignation.includes('physician') || lowerDesignation.includes('surgeon')) {
      return isFemale ? doctorFemaleIcon : doctorMaleIcon;
    }

    // 2. Nurse
    if (lowerDesignation.includes('nurse') || lowerDesignation.includes('nursing')) {
      return isFemale ? nurseFemaleIcon : nurseMaleIcon;
    }

    // 3. Lab / Technician
    if (lowerDesignation.includes('lab') || lowerDesignation.includes('technician') || lowerDepartment.includes('laboratory') || lowerDepartment.includes('pathology')) {
      return isFemale ? labFemaleIcon : labMaleIcon;
    }

    // 4. Admin / Reception
    if (lowerDesignation.includes('admin') || lowerDesignation.includes('reception') || lowerDesignation.includes('manager') || lowerDesignation.includes('clerk')) {
      return isFemale ? adminFemaleIcon : adminMaleIcon;
    }

    // Default Fallback
    if (isFemale) return girlIcon;

    return boyIcon;
  };

  const renderStatusDot = (status) => {
    const color = status === 'Available' ? 'var(--neo-success)' :
      status === 'Busy' ? 'var(--neo-warning)' : '#64748b';
    return (
      <div
        className="status-dot"
        style={{ background: color, boxShadow: `0 0 12px ${color}` }}
      />
    );
  };

  return (
    <div className="enterprise-modal" onClick={(e) => e.target.className === 'enterprise-modal' && onClose && onClose()}>
      <div className="enterprise-content">

        {/* Close Button */}
        <button className="floating-close" onClick={() => onClose && onClose()}>
          <FiX size={20} />
        </button>

        {/* HEADER SECTION */}
        <div className="enterprise-header">
          <div className="avatar-container">
            {/* Avatars Logic */}
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
              <span className="id-badge">{initial.patientFacingId || 'NO-ID'}</span>
              <span>{initial.designation}</span>
              <span style={{ opacity: 0.3 }}>•</span>
              <span>{initial.department}</span>
            </div>
          </div>

          <div className="primary-actions">
<<<<<<< HEAD
            {initial.email && (
              <button
                className="btn-action-glass"
                onClick={() => window.location.href = `mailto:${initial.email}`}
                title="Send Email"
              >
                <FiMail size={18} />
                <span className="hidden md:inline">Email</span>
              </button>
            )}
            <button
              className="btn-action-glass btn-primary-glow"
              onClick={() => onUpdate && onUpdate(initial)}
=======
            <button
              className="btn-action-glass btn-primary-glow"
              onClick={() => {
                if (onUpdate) {
                  onUpdate(initial);
                }
              }}
>>>>>>> 249291b432e7793c91288d90a324e7631e7735b4
            >
              <FiEdit2 size={18} />
              <span>Edit Profile</span>
            </button>
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
              <FiCalendar size={16} /> Schedule
            </div>
            <div
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <FiShield size={16} /> Credentials
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="right-content custom-scrollbar">

            {activeTab === 'overview' && (
              <div className="content-grid animate-fade-in">
                {/* Contact Card */}
                <div className="data-card">
                  <div className="card-header">
                    <FiPhone className="card-icon" />
                    <span className="card-title">Contact Information</span>
                  </div>

                  <div className="data-row mt-4">
                    <span className="data-label">Phone Number</span>
                    <span className="data-value">{initial.contact}</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Email Address</span>
                    <span className="data-value">{initial.email}</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Residential Address</span>
                    <span className="data-value" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                      {initial.address || 'No address provided'}
                    </span>
                  </div>
                </div>

                {/* Professional Card */}
                <div className="data-card">
                  <div className="card-header">
                    <FiCheckCircle className="card-icon" />
                    <span className="card-title">Professional Status</span>
                  </div>

                  <div className="data-row mt-4">
                    <span className="data-label">Department</span>
                    <span className="data-value">
                      {initial.department}
                      <span className="chip chip-blue">Primary</span>
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Experience</span>
                    <span className="data-value">{initial.experienceYears} Years</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Specializations</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {initial.qualifications?.map((q, i) => (
                        <span key={i} className="chip">{q}</span>
                      )) || <span className="text-gray-500 text-xs">None listed</span>}
                    </div>
                  </div>
                </div>

                {/* Notes Card */}
                {initial.notes && (
                  <div className="data-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                      <FiAlertCircle className="card-icon" />
                      <span className="card-title">Administrative Notes</span>
                    </div>
                    <p className="mt-4 text-sm text-[var(--neo-text-primary)] leading-relaxed opacity-80">
                      {typeof initial.notes === 'string' ? initial.notes : initial.notes?.general || 'No notes available.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="content-grid animate-fade-in">
                <div className="data-card">
                  <div className="card-header">
                    <FiClock className="card-icon" />
                    <span className="card-title">Shift Details</span>
                  </div>
                  <div className="data-row mt-4">
                    <span className="data-label">Current Assignment</span>
                    <span className="data-value text-lg text-[var(--neo-accent)]">{initial.shift} Shift</span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Date Joined</span>
                    <span className="data-value">{formatDate(initial.joinedAt)}</span>
                  </div>
                </div>

                <div className="data-card">
                  <div className="card-header">
                    <FiMapPin className="card-icon" />
                    <span className="card-title">Location</span>
                  </div>
                  <div className="data-row mt-4">
                    <span className="data-label">Base Station</span>
                    <span className="data-value">{initial.location}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="content-grid animate-fade-in">
                <div className="data-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="card-header">
                    <FiShield className="card-icon" />
                    <span className="card-title">System Access</span>
                  </div>
                  <div className="data-row mt-4">
                    <span className="data-label">Roles & Permissions</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {initial.roles?.map((role, i) => (
                        <span key={i} className="chip chip-blue">{role}</span>
                      ))}
                      <span className="chip">View Only</span>
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
