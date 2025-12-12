/**
 * Staff Management Component
 * Manages hospital staff members, roles, and departments
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight, MdSearch } from 'react-icons/md';
import staffService from '../../../services/staffService';
import './Staff.css';

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
  )
};

const Staff = () => {
  // State management
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const itemsPerPage = 10;

  // Fetch staff from API
  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await staffService.fetchStaff();
      setStaff(data);
      setFilteredStaff(data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      setStaff([]);
      setFilteredStaff([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Apply filters
  useEffect(() => {
    let result = staff;

    // Apply department filter
    if (departmentFilter !== 'All') {
      result = result.filter(member => member.department === departmentFilter);
    }

    // Apply role filter
    if (roleFilter !== 'All') {
      result = result.filter(member => member.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      result = result.filter(member => member.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(member =>
        member.name?.toLowerCase().includes(query) ||
        member.employeeId?.toLowerCase().includes(query) ||
        member.department?.toLowerCase().includes(query) ||
        member.role?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.phone?.toLowerCase().includes(query)
      );
    }

    setFilteredStaff(result);
    setCurrentPage(0);
  }, [staff, departmentFilter, roleFilter, statusFilter, searchQuery]);

  // Get unique values for filters
  const uniqueDepartments = ['All', ...new Set(
    staff
      .map(member => member.department)
      .filter(dept => dept && dept.trim())
  )];

  const uniqueRoles = ['All', ...new Set(
    staff
      .map(member => member.role)
      .filter(role => role && role.trim())
  )];

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredStaff.length);
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

  const clearAllFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('All');
    setRoleFilter('All');
    setStatusFilter('All');
    setShowAdvancedFilters(false);
  };

  const hasActiveFilters = searchQuery || departmentFilter !== 'All' || roleFilter !== 'All' || statusFilter !== 'All';

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Action handlers
  const handleAdd = () => {
    console.log('Add new staff member');
  };

  const handleView = (member) => {
    console.log('View staff:', member);
  };

  const handleEdit = (member) => {
    console.log('Edit staff:', member);
  };

  const handleDelete = async (member) => {
    if (window.confirm(`Are you sure you want to delete ${member.name}?`)) {
      try {
        await staffService.deleteStaff(member.id);
        await fetchStaff();
        alert('Staff member deleted successfully');
      } catch (error) {
        console.error('Failed to delete staff:', error);
        alert('Failed to delete staff member');
      }
    }
  };

  const handleDownload = async (member) => {
    try {
      setIsDownloading(true);
      await staffService.downloadStaffReport(member.id);
      alert(`Downloading report for ${member.name}`);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'on leave': return 'status-on-leave';
      default: return 'status-inactive';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="main-title">Staff Management</h1>
          <p className="main-subtitle">Manage hospital staff members, roles, and departments.</p>
        </div>
        <button className="btn-new-appointment" onClick={handleAdd}>
          <span>+</span> New Staff Member
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar-container">
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

        <div className="filter-right-group">
          <div className="tabs-wrapper">
            <button
              className={`tab-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              All
            </button>
            <button
              className={`tab-btn ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              Active
            </button>
            <button
              className={`tab-btn ${statusFilter === 'Inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Inactive')}
            >
              Inactive
            </button>
          </div>
          <button 
            className="btn-filter-date"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            More Filters <span style={{ fontSize: '11px', marginLeft: '2px' }}>▼</span>
          </button>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}
              >
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
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
                <th style={{ width: '25%' }}>Staff Member</th>
                <th style={{ width: '15%' }}>Role</th>
                <th style={{ width: '15%' }}>Department</th>
                <th style={{ width: '15%' }}>Contact</th>
                <th style={{ width: '15%' }}>Join Date</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStaff.map((member, index) => {
                const avatarSrc = '/boyicon.png'; // Can be updated based on gender

                return (
                  <tr key={member.id || index}>
                    {/* STAFF MEMBER COLUMN */}
                    <td className="cell-patient">
                      <img 
                        src={avatarSrc} 
                        alt={member.name}
                        className="patient-avatar"
                      />
                      <div className="info-group">
                        <span className="primary">{member.name}</span>
                        <span className="secondary">{member.employeeId || `EMP${member.id}`}</span>
                      </div>
                    </td>

                    {/* ROLE */}
                    <td>
                      <div className="info-group">
                        <span className="primary">{member.role}</span>
                      </div>
                    </td>

                    {/* DEPARTMENT */}
                    <td>
                      <div className="cell-doctor">
                        <div className="doc-avatar-sm">
                          <Icons.Badge />
                        </div>
                        <span className="font-medium">{member.department}</span>
                      </div>
                    </td>

                    {/* CONTACT */}
                    <td>
                      <div className="info-group">
                        <span className="primary">{member.phone || 'N/A'}</span>
                        <span className="secondary">{member.email || 'N/A'}</span>
                      </div>
                    </td>

                    {/* JOIN DATE */}
                    <td>
                      <div className="info-group">
                        <span className="primary">{formatDate(member.joinDate)}</span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td>
                      <span className={`status-pill ${getStatusClass(member.status)}`}>
                        {member.status || 'Active'}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="action-buttons-group">
                        <button className="btn-action view" title="View" onClick={() => handleView(member)}>
                          <Icons.Eye />
                        </button>
                        <button className="btn-action edit" title="Edit" onClick={() => handleEdit(member)}>
                          <Icons.Edit />
                        </button>
                        <button className="btn-action delete" title="Delete" onClick={() => handleDelete(member)}>
                          <Icons.Delete />
                        </button>
                        <button className="btn-action download" title="Download" onClick={() => handleDownload(member)} disabled={isDownloading}>
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
                      <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
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
      </div>
    </div>
  );
};

export default Staff;
