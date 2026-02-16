/**
 * Staff Management Component - Complete Implementation
 * Matches Flutter's StaffPage functionality exactly
 * Restored with Download Option
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight, MdSearch } from 'react-icons/md';
import staffService from '../../../services/staffService';
import { Staff as StaffModel } from '../../../models/Staff';
import AddStaffDialog from './components/AddStaffDialog';
import StaffDetailEnterprise from './StaffDetailEnterprise';
import './Staff.css';
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

// Custom SVG Icons (matching Appointments)
const Icons = {
  Badge: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <polyline points="17 11 19 13 23 9"></polyline>
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
};

const Staff = () => {
  // State management
  const [allStaff, setAllStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'

  // Toast/Notification state
  const [notification, setNotification] = useState(null);

  const itemsPerPage = 10;

  // Helper: Deduplicate staff by ID (matches Flutter)
  const dedupeById = (input) => {
    const seen = new Set();
    const output = [];
    for (const s of input) {
      const key = s.id || `tmp-${s.hashCode}`;
      if (!seen.has(key)) {
        seen.add(key);
        output.push(s);
      }
    }
    return output;
  };

  // Helper: Get staff code with fallback logic (matches Flutter)
  const getStaffCode = (staff) => {
    // 1. Try patientFacingId
    if (staff.patientFacingId && staff.patientFacingId.trim()) {
      return staff.patientFacingId.trim();
    }

    // 2. Try notes
    if (staff.notes) {
      const code = staff.notes.staffCode || staff.notes.staff_code ||
        staff.notes.code || staff.notes.patientFacingId;
      if (code && code.trim()) return code.trim();
    }

    // 3. Try tags starting with STF-
    if (staff.tags && staff.tags.length > 0) {
      const codeTag = staff.tags.find(t => t.startsWith('STF-') || t.startsWith('STF'));
      if (codeTag) return codeTag;
    }

    return '-';
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch staff from API
  const fetchStaff = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const data = await staffService.fetchStaffs(forceRefresh);
      const unique = dedupeById(data);
      setAllStaff(unique);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      showNotification('Failed to fetch staff: ' + error.message, 'error');
      setAllStaff([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Helper: Check if staff is active based on status
  const isStaffActive = (status) => {
    if (!status) return false;
    const normalizedStatus = status.toLowerCase().trim();
    // Active statuses
    const activeStatuses = ['active', 'available', 'on duty', 'working', 'present'];
    return activeStatuses.some(s => normalizedStatus.includes(s));
  };

  // Helper: Check if staff is inactive based on status
  const isStaffInactive = (status) => {
    if (!status) return true; // No status means inactive
    const normalizedStatus = status.toLowerCase().trim();
    // Inactive statuses
    const inactiveStatuses = ['inactive', 'off duty', 'on leave', 'absent', 'suspended', 'terminated'];
    return inactiveStatuses.some(s => normalizedStatus.includes(s));
  };

  // Apply filters (matches Flutter's _getFilteredStaff)
  useEffect(() => {
    let result = allStaff;

    // Apply department filter
    if (departmentFilter !== 'All') {
      result = result.filter(s => s.department === departmentFilter);
    }

    // Apply status filter with intelligent matching
    if (statusFilter !== 'All') {
      if (statusFilter === 'Active') {
        result = result.filter(s => isStaffActive(s.status));
      } else if (statusFilter === 'Inactive') {
        result = result.filter(s => isStaffInactive(s.status));
      } else {
        // Exact match for custom status values
        result = result.filter(s => s.status === statusFilter);
      }
    }

    // Apply search filter (comprehensive like Flutter)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.id?.toLowerCase().includes(query) ||
        s.department?.toLowerCase().includes(query) ||
        s.designation?.toLowerCase().includes(query) ||
        s.contact?.toLowerCase().includes(query) ||
        getStaffCode(s).toLowerCase().includes(query)
      );
    }

    // Sort alphabetically by name
    result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    setFilteredStaff(dedupeById(result));
    setCurrentPage(0);
  }, [allStaff, departmentFilter, statusFilter, searchQuery]);

  // Get unique values for filters
  const uniqueDepartments = ['All', ...new Set(
    allStaff
      .map(s => s.department)
      .filter(dept => dept && dept.trim())
  )];

  // Calculate counts for status filter tabs
  const activeCount = allStaff.filter(s => isStaffActive(s.status)).length;
  const inactiveCount = allStaff.filter(s => isStaffInactive(s.status)).length;
  const totalCount = allStaff.length;

  // Debug logging when filters change
  useEffect(() => {
    console.log('🔍 [STAFF FILTER DEBUG]');
    console.log('Total Staff:', totalCount);
    console.log('Active Count:', activeCount);
    console.log('Inactive Count:', inactiveCount);
    console.log('Current Filter:', statusFilter);
    console.log('Filtered Results:', filteredStaff.length);
    console.log('Sample Status Values:', allStaff.slice(0, 5).map(s => ({ name: s.name, status: s.status })));
  }, [statusFilter, filteredStaff.length, totalCount, activeCount, inactiveCount, allStaff]);

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredStaff.length);
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

  const clearAllFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('All');
    setStatusFilter('All');
    setShowAdvancedFilters(false);
  };

  const hasActiveFilters = searchQuery || departmentFilter !== 'All' || statusFilter !== 'All';

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1);
  };

  // Action handlers (matches Flutter exactly)
  const handleAdd = () => {
    setFormMode('create');
    setSelectedStaff(null);
    setShowForm(true);
  };

  const handleView = async (staff, index) => {
    try {
      setSelectedStaff(staff);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to open details:', error);
      showNotification('Failed to open details: ' + error.message, 'error');
    }
  };

  const handleEdit = async (staff, index) => {
    setFormMode('edit');
    setSelectedStaff(staff);
    setShowForm(true);
  };

  const handleDelete = async (staff, index) => {
    const confirmed = window.confirm(`Delete ${staff.name}?`);
    if (!confirmed) return;

    // Optimistic delete (Flutter pattern)
    const removedIndex = allStaff.findIndex(s => s.id === staff.id);
    let removed = null;
    if (removedIndex !== -1) {
      removed = allStaff[removedIndex];
      setAllStaff(prev => prev.filter(s => s.id !== staff.id));
    }

    setIsLoading(true);
    try {
      const ok = await staffService.deleteStaff(staff.id);
      if (ok) {
        showNotification(`Deleted ${staff.name}`, 'success');
        // Adjust pagination if needed
        if (currentPage * itemsPerPage >= filteredStaff.length - 1 && currentPage > 0) {
          setCurrentPage(0);
        }
      } else {
        // Revert on failure
        if (removed) {
          setAllStaff(prev => {
            const copy = [...prev];
            copy.splice(removedIndex, 0, removed);
            return copy;
          });
        }
        showNotification('Delete failed', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      // Revert on error
      if (removed) {
        setAllStaff(prev => {
          const copy = [...prev];
          copy.splice(removedIndex, 0, removed);
          return copy;
        });
      }
      showNotification(`Delete failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (staff, index) => {
    if (isDownloading) return;

    // Check if staff has doctor role (Flutter pattern)
    const isDoctor = staff.roles?.some(role => role.toLowerCase() === 'doctor') ||
      staff.designation?.toLowerCase().includes('doctor');

    setIsDownloading(true);
    try {
      let result;
      if (isDoctor) {
        result = await staffService.downloadDoctorReport(staff.id);
      } else {
        result = await staffService.downloadStaffReport(staff.id);
      }

      if (result.success) {
        showNotification(result.message || 'Report downloaded successfully', 'success');
      } else {
        showNotification(result.message || 'Failed to download report', 'error');
      }
    } catch (error) {
      console.error('Download error:', error);
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Form submission handlers
  const handleFormSubmit = async (formData) => {
    try {
      if (formMode === 'create') {
        // Create new staff
        const created = await staffService.createStaff(formData);

        // Optimistic insert (Flutter pattern)
        setAllStaff(prev => {
          const idx = prev.findIndex(s => s.id === created.id);
          if (idx === -1) {
            return [created, ...prev];
          } else {
            const copy = [...prev];
            copy[idx] = created;
            return copy;
          }
        });

        // If temp id, refresh from server
        if (created.id?.startsWith('temp-')) {
          await fetchStaff(true);
        }

        showNotification('Staff created successfully', 'success');
      } else {
        // Update existing staff
        await staffService.updateStaff(formData);

        // Optimistic update (Flutter pattern)
        setAllStaff(prev => {
          const idx = prev.findIndex(s => s.id === formData.id || s.id === formData._id);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = formData instanceof StaffModel ? formData : StaffModel.fromJSON(formData);
            return copy;
          }
          return prev;
        });

        // Fetch authoritative data if not temp
        if (formData.id && !formData.id.startsWith('temp-')) {
          try {
            const fresh = await staffService.fetchStaffById(formData.id);
            setAllStaff(prev => {
              const idx = prev.findIndex(s => s.id === fresh.id);
              if (idx !== -1) {
                const copy = [...prev];
                copy[idx] = fresh;
                return copy;
              }
              return prev;
            });
          } catch (e) {
            console.log('Could not fetch fresh data:', e);
          }
        }

        showNotification('Staff updated successfully', 'success');
      }
      setShowForm(false);
      setSelectedStaff(null);
    } catch (error) {
      console.error('Form submission error:', error);
      showNotification(`Failed: ${error.message}`, 'error');
      // Revert on error
      await fetchStaff(true);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedStaff(null);
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setSelectedStaff(null);
  };

  const handleDetailUpdate = (staff) => {
    setShowDetail(false);
    setFormMode('edit');
    setSelectedStaff(staff);
    setShowForm(true);
  };

  // Helper: Get status badge class (matches Flutter)
  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'available') return 'status-available';
    if (statusLower === 'on leave') return 'status-on-leave';
    if (statusLower === 'busy') return 'status-busy';
    return 'status-off-duty';
  };

  // Helper: Get avatar source with fallback (matches Flutter)
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

  return (
    <div className="staff-page dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="main-title">STAFF</h1>
          <p className="main-subtitle">Manage hospital staff members, roles, and departments.</p>
        </div>
        <div className="header-actions">
          <button className="btn-new-appointment" onClick={handleAdd}>
            <Icons.Plus /> New Staff Member
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar-container">
        <div className="filter-right-group">
          <div className="tabs-wrapper">
            <button
              className={`tab-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              All ({totalCount})
            </button>
            <button
              className={`tab-btn ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              Active ({activeCount})
            </button>
            <button
              className={`tab-btn ${statusFilter === 'Inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Inactive')}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
          <button
            className="btn-filter-date"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            More Filters <span style={{ fontSize: '11px', marginLeft: '2px' }}>▼</span>
          </button>
        </div>

        <div className="search-group">
          <div className="search-wrapper">
            <span className="search-icon-lg"><MdSearch size={18} /></span>
            <input
              type="text"
              placeholder="Search by name, employee ID, department, or role..."
              className="search-input-lg"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="filter-bar-container" style={{ marginTop: '12px' }}>
          <div className="filter-right-group" style={{ flex: 1, justifyContent: 'flex-start', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}
              >
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                style={{ alignSelf: 'flex-end', padding: '8px 16px', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#EF4444', cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="table-card">
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '16%' }}>Staff Code</th>
                <th style={{ width: '18%' }}>Staff Name</th>
                <th style={{ width: '14%' }}>Designation</th>
                <th style={{ width: '14%' }}>Department</th>
                <th style={{ width: '14%' }}>Contact</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '14%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStaff.map((staff, index) => {
                const avatarSrc = getAvatarSrc(staff);
                const staffCode = getStaffCode(staff);

                return (
                  <tr key={staff.id || index}>
                    {/* STAFF CODE COLUMN */}
                    <td>
                      <span className="primary font-semibold">{staffCode || '-'}</span>
                    </td>

                    {/* STAFF NAME COLUMN (with avatar) */}
                    <td>
                      <div className="cell-patient">
                        <img
                          src={avatarSrc}
                          alt={staff.name}
                          className="patient-avatar"
                          onError={(e) => {
                            e.target.src = '/boyicon.png';
                          }}
                        />
                        <span className="primary font-semibold">{staff.name || '-'}</span>
                      </div>
                    </td>

                    {/* DESIGNATION */}
                    <td>
                      <span className="primary font-semibold">{staff.designation || '-'}</span>
                    </td>

                    {/* DEPARTMENT */}
                    <td>
                      <div className="cell-doctor">
                        {/* Icon Removed as per request */}
                        <span className="font-medium">{staff.department || '-'}</span>
                      </div>
                    </td>

                    {/* CONTACT */}
                    <td>
                      <span className="primary">{staff.contact || '-'}</span>
                    </td>

                    {/* STATUS */}
                    <td>
                      <span className={`status-pill ${getStatusClass(staff.status)}`}>
                        {staff.status || 'Off Duty'}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="action-buttons-group">
                        <button className="btn-action view" title="View" onClick={() => handleView(staff, index)}>
                          <Icons.Eye />
                        </button>
                        <button className="btn-action edit" title="Edit" onClick={() => handleEdit(staff, index)}>
                          <Icons.Edit />
                        </button>
                        <button className="btn-action delete" title="Delete" onClick={() => handleDelete(staff, index)}>
                          <Icons.Delete />
                        </button>
                        <button
                          className="btn-action download"
                          title="Download Report"
                          onClick={() => handleDownload(staff, index)}
                          disabled={isDownloading}
                        >
                          <Icons.Download />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {isLoading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#207DC0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                      <span>Loading staff...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && paginatedStaff.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                    No staff members found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="pagination-footer">
          <button
            className="page-arrow-circle leading"
            disabled={currentPage === 0}
            onClick={handlePreviousPage}
          >
            <MdChevronLeft size={20} />
          </button>

          <div className="page-indicator-box">
            Page {currentPage + 1} of {totalPages || 1}
          </div>

          <button
            className="page-arrow-circle trailing"
            disabled={currentPage >= totalPages - 1 || totalPages === 0}
            onClick={handleNextPage}
          >
            <MdChevronRight size={20} />
          </button>
        </div>
      </div >

      {/* Modals */}
      {
        showForm && (
          <AddStaffDialog
            key={selectedStaff?.id || 'new'}
            initial={selectedStaff}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )
      }

      {
        showDetail && selectedStaff && (
          <StaffDetailEnterprise
            staffId={selectedStaff.id}
            initial={selectedStaff}
            onClose={handleDetailClose}
            onUpdate={handleDetailUpdate}
          />
        )
      }

      {/* Notification Toast */}
      {
        notification && (
          <div className={`notification-toast ${notification.type}`}>
            {notification.message}
          </div>
        )
      }
    </div >
  );
};

export default Staff;
