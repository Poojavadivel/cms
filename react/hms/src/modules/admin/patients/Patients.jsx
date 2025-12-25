/**
 * PatientsReal.jsx
 * Patients page with REAL API integration
 * React equivalent of Flutter's PatientsScreen with live backend data
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MdChevronLeft, MdChevronRight, MdSearch } from 'react-icons/md';
import axios from 'axios';
import patientsService from '../../../services/patientsService';
import './Patients.css';
import AddPatientModal from '../../../components/patient/addpatient';
import EditPatientModal from '../../../components/patient/EditPatientModal';
import PatientDetailsDialog from '../../../components/doctor/PatientDetailsDialog';
import StaffDetailEnterprise from '../staff/StaffDetailEnterprise';
import doctorFemaleIcon from '../../../assets/doctor-femaleicon.png';
import doctorMaleIcon from '../../../assets/doctor-male icon.png';

// Toast notification helper (replace with react-toastify if available)
const toast = {
  success: (msg) => {
    console.log('✅ SUCCESS:', msg);
    // TODO: Implement proper toast notification
    alert(msg);
  },
  error: (msg) => {
    console.error('❌ ERROR:', msg);
    // TODO: Implement proper toast notification
    alert(msg);
  },
  info: (msg) => {
    console.log('ℹ️ INFO:', msg);
  }
};


// Custom SVG Icons (matching Appointments)
const Icons = {
  Doctor: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
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
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  )
};

// Configuration constants
const CONFIG = {
  ITEMS_PER_PAGE: 10,
  MAX_FETCH_LIMIT: 100,
  DEBOUNCE_DELAY: 300
};

const Patients = () => {
  // State management
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingPatients, setDownloadingPatients] = useState(new Set());
  const [loadingPatientId, setLoadingPatientId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [ageRangeFilter, setAgeRangeFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Modal state management - use single state to prevent multiple modals
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  
  // Doctor dialog states (same as Appointments page)
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDoctorDialog, setShowDoctorDialog] = useState(false);
  
  // Refs for cleanup
  const abortControllerRef = useRef(null);

  const itemsPerPage = CONFIG.ITEMS_PER_PAGE;

  // Fetch patients from API
  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await patientsService.fetchPatients({ limit: CONFIG.MAX_FETCH_LIMIT });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Fetched patients:', data);
      }

      // Helper functions for data extraction
      const normalizeGender = (gender) => {
        if (!gender) return 'Other';
        const normalized = gender.toString().trim();
        const lower = normalized.toLowerCase();
        if (lower === 'male' || lower === 'm') return 'Male';
        if (lower === 'female' || lower === 'f') return 'Female';
        return normalized;
      };

      const extractDoctorName = (patient) => {
        if (!patient) return '';
        const doctor = patient.doctor;
        if (!doctor) return patient.assignedDoctor || patient.doctorName || patient.doctorId || '';
        if (typeof doctor === 'object' && doctor !== null) {
          return doctor.name || doctor.fullName || '';
        }
        return String(doctor);
      };

      const extractDoctorId = (patient) => {
        if (!patient) return '';
        const doctor = patient.doctor;
        if (doctor && typeof doctor === 'object' && doctor !== null) {
          return doctor._id || doctor.id || '';
        }
        return patient.doctorId || '';
      };

      const extractDoctorGender = (patient) => {
        if (!patient) return 'Male';
        if (patient.doctor && typeof patient.doctor === 'object' && patient.doctor !== null) {
          return patient.doctor.gender || 'Male';
        }
        return patient.doctorGender || 'Male';
      };

      const formatCondition = (value) => {
        if (!value) return null;
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (!trimmed) return null;
          return trimmed.length > 30 ? `${trimmed.substring(0, 30)}...` : trimmed;
        }
        if (Array.isArray(value) && value.length > 0) {
          return value.length === 1 ? value[0] : `${value[0]} +${value.length - 1}`;
        }
        return null;
      };

      const extractCondition = (patient) => {
        if (!patient) return 'N/A';
        const sources = [
          patient.condition,
          patient.medicalHistory,
          patient.metadata?.medicalHistory,
          patient.metadata?.condition,
          patient.notes
        ];
        for (const source of sources) {
          const condition = formatCondition(source);
          if (condition) return condition;
        }
        return 'N/A';
      };

      // Transform data to match expected structure with proper ID handling
      const transformedData = data.map((patient, index) => ({
        id: patient._id || patient.id || patient.patientId || `temp-${index}-${Date.now()}`,
        name: patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown',
        age: patient.age || 0,
        gender: normalizeGender(patient.gender),
        lastVisit: patient.lastVisit || patient.lastVisitDate || patient.updatedAt || '',
        doctor: extractDoctorName(patient),
        doctorId: extractDoctorId(patient),
        doctorGender: extractDoctorGender(patient),
        doctorObj: patient.doctor && typeof patient.doctor === 'object' ? patient.doctor : null, // Store full doctor object
        condition: extractCondition(patient),
        reason: patient.reason || '',
        patientId: patient.patientId || patient._id || patient.id,
        patientCode: patient.patientCode || patient.patient_code || patient.metadata?.patientCode || null,
      }));

      setPatients(transformedData);
      setFilteredPatients(transformedData);
    } catch (error) {
      console.error('❌ Failed to fetch patients:', error);
      toast.error('Failed to load patients: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load patients on mount and cleanup on unmount
  useEffect(() => {
    fetchPatients();
    
    // Cleanup function to cancel pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPatients]);
  
  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, CONFIG.DEBOUNCE_DELAY);
    
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Filter patients - using debounced search
  useEffect(() => {
    let filtered = [...patients];

    // Apply search filter with debounced value
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(patient => {
        const name = (patient.name || '').toLowerCase();
        const doctor = (patient.doctor || '').toLowerCase();
        const id = (patient.id || '').toLowerCase();
        const patientId = (patient.patientId || '').toLowerCase();
        const condition = (patient.condition || '').toLowerCase();

        return name.includes(query) ||
          doctor.includes(query) ||
          id.includes(query) ||
          patientId.includes(query) ||
          condition.includes(query);
      });
    }

    // Apply doctor filter
    if (doctorFilter !== 'All') {
      filtered = filtered.filter(patient =>
        patient.doctor === doctorFilter
      );
    }

    // Apply gender filter with proper case handling
    if (genderFilter !== 'All') {
      filtered = filtered.filter(patient => {
        const patientGender = (patient.gender || '').trim();
        return patientGender.toLowerCase() === genderFilter.toLowerCase();
      });
    }

    // Apply age range filter with fixed edge cases
    if (ageRangeFilter !== 'All') {
      filtered = filtered.filter(patient => {
        const age = patient.age || 0;
        if (age < 0) return false; // Invalid age
        
        switch (ageRangeFilter) {
          case '0-18': return age <= 18;
          case '19-35': return age >= 19 && age <= 35;
          case '36-50': return age >= 36 && age <= 50;
          case '51-65': return age >= 51 && age <= 65;
          case '65+': return age >= 66; // Fixed: no overlap with 51-65
          default: return true;
        }
      });
    }

    setFilteredPatients(filtered);
    setCurrentPage(0); // Reset to first page
  }, [debouncedSearch, doctorFilter, genderFilter, ageRangeFilter, patients]);

  // Get unique doctors for filter with proper IDs
  const uniqueDoctors = useMemo(() => {
    const doctorMap = new Map();
    
    patients.forEach(patient => {
      if (patient.doctor && patient.doctor.trim()) {
        const doctorName = patient.doctor;
        if (!doctorMap.has(doctorName)) {
          doctorMap.set(doctorName, {
            id: patient.doctorId || doctorName,
            name: doctorName
          });
        }
      }
    });
    
    const doctors = Array.from(doctorMap.values());
    return ['All', ...doctors.map(d => d.name)];
  }, [patients]);

  // Age range options
  const ageRanges = ['All', '0-18', '19-35', '36-50', '51-65', '65+'];

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearch('');
    setDoctorFilter('All');
    setGenderFilter('All');
    setAgeRangeFilter('All');
    setShowAdvancedFilters(false);
  }, []);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => 
    searchQuery ||
    doctorFilter !== 'All' ||
    genderFilter !== 'All' ||
    ageRangeFilter !== 'All',
    [searchQuery, doctorFilter, genderFilter, ageRangeFilter]
  );

  // Pagination
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredPatients.length);
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  // Handlers - memoized for performance
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handleAdd = useCallback(() => {
    setActiveModal('add');
    setModalData(null);
  }, []);

  const handleView = useCallback(async (patient) => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoadingPatientId(patient.id);
    
    try {
      const fullPatient = await patientsService.fetchPatientById(patient.id);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('View patient:', fullPatient);
      }
      
      setActiveModal('view');
      setModalData(fullPatient);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }
      console.error('Failed to fetch patient details:', error);
      toast.error('Failed to load patient details: ' + error.message);
    } finally {
      setLoadingPatientId(null);
      abortControllerRef.current = null;
    }
  }, []);

  const handleEdit = useCallback(async (patient) => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoadingPatientId(patient.id);
    
    try {
      const fullPatient = await patientsService.fetchPatientById(patient.id);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Edit patient:', fullPatient);
      }
      
      setActiveModal('edit');
      setModalData(fullPatient);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }
      console.error('Failed to fetch patient details:', error);
      toast.error('Failed to load patient details: ' + error.message);
    } finally {
      setLoadingPatientId(null);
      abortControllerRef.current = null;
    }
  }, []);

  const handleDelete = useCallback(async (patient, retryCount = 0) => {
    if (!patient || !patient.id) {
      toast.error('Invalid patient data');
      return;
    }

    // Only show confirmation on first attempt, not on retries
    if (retryCount === 0) {
      const confirmed = window.confirm(
        `Are you sure you want to delete patient ${patient.name}?\n\nThis action cannot be undone.`
      );

      if (!confirmed) return;
    }

    // Show which patient is being deleted
    console.log(`Attempting to delete patient (attempt ${retryCount + 1}):`, {
      id: patient.id,
      name: patient.name,
      patientId: patient.patientId
    });

    // Store original data for rollback (only on first attempt)
    const originalPatients = retryCount === 0 ? [...patients] : null;
    const originalFiltered = retryCount === 0 ? [...filteredPatients] : null;

    try {
      setIsLoading(true);
      
      // Optimistic update - remove from UI immediately (only on first attempt)
      if (retryCount === 0) {
        setPatients(prev => prev.filter(p => p.id !== patient.id));
        setFilteredPatients(prev => prev.filter(p => p.id !== patient.id));
      }
      
      // Attempt to delete from backend
      const result = await patientsService.deletePatient(patient.id);
      
      console.log('Delete result:', result);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Deleted patient:', patient.id);
      }

      toast.success(`Successfully deleted patient: ${patient.name}`);

      // Reset to first page
      setCurrentPage(0);
      
      // Refresh patient list from backend to ensure sync
      await fetchPatients();
      
    } catch (error) {
      console.error(`❌ Failed to delete patient (attempt ${retryCount + 1}):`, {
        error: error,
        message: error.message,
        response: error.response?.data,
        patientId: patient.id
      });
      
      // Rollback on error (if we have original data)
      if (originalPatients && originalFiltered) {
        setPatients(originalPatients);
        setFilteredPatients(originalFiltered);
      }
      
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Failed to delete patient';
      
      // Retry logic - max 3 attempts with exponential backoff
      const maxRetries = 2;
      if (retryCount < maxRetries) {
        const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        
        toast.error(`${errorMessage}. Retrying in ${retryDelay / 1000} seconds... (${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          handleDelete(patient, retryCount + 1);
        }, retryDelay);
      } else {
        // Final failure after all retries
        toast.error(`Delete failed after ${maxRetries + 1} attempts: ${errorMessage}`);
        
        // Offer manual retry option
        const retry = window.confirm(
          `Failed to delete patient ${patient.name} after multiple attempts.\n\nWould you like to try again?`
        );
        
        if (retry) {
          handleDelete(patient, 0); // Start fresh
        } else {
          // Ensure we refresh to show accurate data
          await fetchPatients();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchPatients, patients, filteredPatients]);

  const handleDownload = useCallback(async (patient) => {
    // Add patient ID to downloading set
    setDownloadingPatients(prev => new Set(prev).add(patient.id));
    
    try {
      // Use the reportService (matching Flutter's implementation)
      const token = localStorage.getItem('x-auth-token') || localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      const endpoint = `${process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api'}/reports-proper/patient/${patient.id}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Get filename from header or create default
        let filename = `Patient_Report_${patient.name}_${Date.now()}.pdf`;
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        // Create blob and trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast.success('Patient report downloaded successfully');
      } else if (response.status === 404) {
        toast.error('Patient not found');
      } else {
        const errorData = await response.text();
        toast.error(`Failed to download report: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to download report:', error);
      toast.error('Error downloading report: ' + error.message);
    } finally {
      // Remove patient ID from downloading set
      setDownloadingPatients(prev => {
        const next = new Set(prev);
        next.delete(patient.id);
        return next;
      });
    }
  }, []);
  
  // Modal close handler
  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  // Modal success handler
  const handleModalSuccess = useCallback(async () => {
    setCurrentPage(0);
    await fetchPatients();
    handleCloseModal();
  }, [fetchPatients, handleCloseModal]);

  // Doctor dialog handlers - Match Appointments page implementation with robust fallbacks
  const handleDoctorClick = async (patient) => {
    // Show dialog immediately to avoid mis-touch
    setShowDoctorDialog(true);
    setSelectedDoctor({ loading: true, name: patient.doctor || 'Loading...' });

    try {
      console.log('🔍 [handleDoctorClick] Patient data:', patient);

      let doctorData = null;

      // Strategy 1: Check if we have the doctor object stored in memory
      const fullPatient = patients.find(p => p.id === patient.id);
      if (fullPatient?.doctorObj && typeof fullPatient.doctorObj === 'object') {
        doctorData = fullPatient.doctorObj;
        console.log('✅ Found doctor data from stored doctorObj:', doctorData);
      }

      // Strategy 2: Try fetching fresh patient data with populated doctor
      if (!doctorData) {
        try {
          const freshPatientData = await patientsService.fetchPatientById(patient.id);
          console.log('📋 Fresh patient data:', freshPatientData);
          
          // Check if doctor field is populated as object
          if (freshPatientData.doctor && typeof freshPatientData.doctor === 'object') {
            doctorData = freshPatientData.doctor;
            console.log('✅ Found doctor data from fresh patient.doctor:', doctorData);
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch fresh patient data:', err);
        }
      }

      // Strategy 3: If doctor is just an ID string, fetch all patients with populated data
      if (!doctorData && patient.doctorId) {
        try {
          console.log('🔄 Attempting to fetch all patients with populated doctor field...');
          const allPatients = await patientsService.fetchPatients({ limit: 1000 });
          const patientWithDoctor = allPatients.find(p => 
            (p.id === patient.id || p._id === patient.id) && 
            p.doctor && 
            typeof p.doctor === 'object'
          );
          
          if (patientWithDoctor?.doctor) {
            doctorData = patientWithDoctor.doctor;
            console.log('✅ Found doctor data from all patients fetch:', doctorData);
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch all patients:', err);
        }
      }

      // Strategy 4: Try fetching doctor directly by ID using staff/doctor API
      if (!doctorData && patient.doctorId && patient.doctorId !== 'Not Assigned') {
        try {
          console.log('🔄 Attempting to fetch doctor directly by ID:', patient.doctorId);
          const axiosInstance = axios.create({
            baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': localStorage.getItem('x-auth-token') || localStorage.getItem('authToken')
            }
          });
          
          // Try staff endpoint first (doctors are staff members)
          try {
            const response = await axiosInstance.get(`/staff/${patient.doctorId}`);
            doctorData = response.data.staff || response.data.data || response.data;
            console.log('✅ Found doctor data from staff API:', doctorData);
          } catch (staffErr) {
            // Fallback to doctors endpoint
            console.log('⚠️ Staff API failed, trying doctors endpoint...');
            const response = await axiosInstance.get(`/doctors/${patient.doctorId}`);
            doctorData = response.data.doctor || response.data.data || response.data;
            console.log('✅ Found doctor data from doctors API:', doctorData);
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch doctor by ID:', err);
        }
      }

      // Strategy 5: Search staff by name if we have doctor name
      if (!doctorData && patient.doctor && patient.doctor !== 'Not Assigned') {
        try {
          console.log('🔄 Attempting to search staff by name:', patient.doctor);
          const axiosInstance = axios.create({
            baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': localStorage.getItem('x-auth-token') || localStorage.getItem('authToken')
            }
          });
          
          // Search staff by name
          const response = await axiosInstance.get(`/staff?search=${encodeURIComponent(patient.doctor)}`);
          const staffList = response.data.staff || response.data.data || response.data || [];
          
          // Find exact or partial match
          const matchedStaff = staffList.find(s => {
            const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim();
            const name = s.name || fullName;
            return name === patient.doctor || 
                   name.toLowerCase() === patient.doctor.toLowerCase() ||
                   fullName === patient.doctor ||
                   fullName.toLowerCase() === patient.doctor.toLowerCase();
          });
          
          if (matchedStaff) {
            doctorData = matchedStaff;
            console.log('✅ Found doctor data from staff search by name:', doctorData);
          }
        } catch (err) {
          console.warn('⚠️ Could not search staff by name:', err);
        }
      }

      // Strategy 6: Get ALL staff and search in memory
      if (!doctorData && patient.doctor && patient.doctor !== 'Not Assigned') {
        try {
          console.log('🔄 Fetching all staff to search by name...');
          const axiosInstance = axios.create({
            baseURL: process.env.REACT_APP_API_URL || 'https://hms-dev.onrender.com/api',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': localStorage.getItem('x-auth-token') || localStorage.getItem('authToken')
            }
          });
          
          const response = await axiosInstance.get('/staff');
          const allStaff = response.data.staff || response.data.data || response.data || [];
          
          // Search for doctor in all staff
          const matchedStaff = allStaff.find(s => {
            const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim();
            const name = s.name || fullName;
            
            // Try multiple matching strategies
            return name === patient.doctor || 
                   name.toLowerCase() === patient.doctor.toLowerCase() ||
                   fullName === patient.doctor ||
                   fullName.toLowerCase() === patient.doctor.toLowerCase() ||
                   name.includes(patient.doctor) ||
                   patient.doctor.includes(name);
          });
          
          if (matchedStaff) {
            doctorData = matchedStaff;
            console.log('✅ Found doctor data from all staff list:', doctorData);
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch all staff:', err);
        }
      }

      if (!doctorData || typeof doctorData !== 'object') {
        console.error('❌ Could not extract doctor data after all strategies');
        console.error('Patient data:', patient);
        console.error('Doctor ID:', patient.doctorId);
        console.error('Doctor name:', patient.doctor);
        setShowDoctorDialog(false);
        setSelectedDoctor(null);
        toast.error(`Unable to load doctor details for "${patient.doctor}". The doctor may not exist in the system or the doctor ID is invalid.`);
        return;
      }

      // Transform doctor data to match Staff model format expected by StaffDetailEnterprise
      // This matches the exact transformation in Appointments.jsx (lines 777-797)
      const staffDetails = {
        id: doctorData._id || doctorData.id || patient.doctorId,
        _id: doctorData._id || doctorData.id || patient.doctorId,
        name: `${doctorData.firstName || ''} ${doctorData.lastName || ''}`.trim() || doctorData.name || patient.doctor,
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        email: doctorData.email,
        contact: doctorData.phone || doctorData.contact,
        phone: doctorData.phone || doctorData.contact,
        gender: doctorData.gender,
        designation: doctorData.role || doctorData.designation || 'Doctor',
        department: doctorData.department || 'Medical',
        status: doctorData.status || 'Active',
        joinDate: doctorData.joinDate || doctorData.createdAt,
        address: doctorData.address,
        salary: doctorData.salary,
        notes: doctorData.notes,
        tags: doctorData.tags,
        metadata: doctorData.metadata,
        ...doctorData // Spread any additional fields
      };

      console.log('✅ Transformed staff details:', staffDetails);

      setSelectedDoctor(staffDetails);
    } catch (error) {
      console.error('❌ Error loading doctor details:', error);
      setShowDoctorDialog(false);
      setSelectedDoctor(null);
      toast.error('Failed to load doctor details: ' + error.message);
    }
  };

  const handleCloseDoctorDialog = () => {
    setShowDoctorDialog(false);
    setSelectedDoctor(null);
  };

  // Format date with proper validation
  const formatLastVisit = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  }, []);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle if no modal is open
      if (activeModal) return;
      
      if (e.key === 'ArrowLeft' && currentPage > 0) {
        handlePreviousPage();
      }
      if (e.key === 'ArrowRight' && currentPage < totalPages - 1) {
        handleNextPage();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, activeModal, handlePreviousPage, handleNextPage]);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="main-title">Patient Management</h1>
          <p className="main-subtitle">Manage patient records, medical history, and appointments.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-new-appointment" onClick={handleAdd}>
            <span>+</span> New Patient
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar-container">
        <div className="search-wrapper">
          <span className="search-icon-lg"><MdSearch size={18} /></span>
          <input
            type="text"
            placeholder="Search by patient name, doctor, or ID..."
            className="search-input-lg"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filter-right-group">
          <div className="tabs-wrapper">
            <button
              className={`tab-btn ${genderFilter === 'All' ? 'active' : ''}`}
              onClick={() => setGenderFilter('All')}
            >
              All
            </button>
            <button
              className={`tab-btn ${genderFilter === 'Male' ? 'active' : ''}`}
              onClick={() => setGenderFilter('Male')}
            >
              Male
            </button>
            <button
              className={`tab-btn ${genderFilter === 'Female' ? 'active' : ''}`}
              onClick={() => setGenderFilter('Female')}
            >
              Female
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
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Doctor</label>
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}
              >
                {uniqueDoctors.map(doctor => (
                  <option key={doctor} value={doctor}>{doctor}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Age Range</label>
              <select
                value={ageRangeFilter}
                onChange={(e) => setAgeRangeFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}
              >
                {ageRanges.map(range => (
                  <option key={range} value={range}>{range === 'All' ? 'All Ages' : range}</option>
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
                <th style={{ width: '25%' }}>Patient</th>
                <th style={{ width: '10%' }}>Age</th>
                <th style={{ width: '12%' }}>Gender</th>
                <th style={{ width: '15%' }}>Last Visit</th>
                <th style={{ width: '18%' }}>Doctor</th>
                <th style={{ width: '15%' }}>Condition</th>
                <th style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPatients.map((patient) => {
                const genderStr = (patient.gender || '').toLowerCase().trim();
                const avatarSrc = genderStr.includes('female') || genderStr.startsWith('f')
                  ? '/girlicon.png'
                  : '/boyicon.png';

                return (
                  <tr key={patient.id}>
                    {/* PATIENT COLUMN */}
                    <td className="cell-patient">
                      <img
                        src={avatarSrc}
                        alt={patient.gender}
                        className="patient-avatar"
                      />
                      <div className="info-group">
                        <span className="primary">{patient.name}</span>
                        <span className="secondary">{patient.patientCode || patient.patientId || patient.id}</span>
                      </div>
                    </td>

                    {/* AGE */}
                    <td style={{ fontWeight: 500, color: '#334155' }}>{patient.age}</td>

                    {/* GENDER */}
                    <td style={{ fontWeight: 500, color: '#334155' }}>{patient.gender}</td>

                    {/* LAST VISIT */}
                    <td>
                      <div className="info-group">
                        <span className="primary">{formatLastVisit(patient.lastVisit)}</span>
                      </div>
                    </td>

                    {/* DOCTOR - Match Appointments page style */}
                    <td>
                      <div className="cell-doctor">
                        <img
                          src={patient.doctorGender === 'Female' ? doctorFemaleIcon : doctorMaleIcon}
                          alt={patient.doctor}
                          className="patient-avatar"
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span
                          className="doctor-name-clickable"
                          onClick={() => handleDoctorClick(patient)}
                        >
                          {patient.doctor || 'Not Assigned'}
                        </span>
                      </div>
                    </td>

                    {/* CONDITION */}
                    <td style={{ fontWeight: 500, color: '#334155' }}>{patient.condition}</td>

                    {/* ACTIONS */}
                    <td>
                      <div className="action-buttons-group">
                        <button 
                          className="btn-action view" 
                          title="View patient details"
                          aria-label={`View details for ${patient.name}`}
                          onClick={() => handleView(patient)}
                          disabled={loadingPatientId === patient.id}
                        >
                          {loadingPatientId === patient.id ? '...' : <Icons.Eye />}
                        </button>
                        <button 
                          className="btn-action edit" 
                          title="Edit patient"
                          aria-label={`Edit ${patient.name}`}
                          onClick={() => handleEdit(patient)}
                          disabled={loadingPatientId === patient.id}
                        >
                          <Icons.Edit />
                        </button>
                        <button 
                          className="btn-action delete" 
                          title="Delete patient"
                          aria-label={`Delete ${patient.name}`}
                          onClick={() => handleDelete(patient)}
                          disabled={isLoading}
                        >
                          <Icons.Delete />
                        </button>
                        <button 
                          className="btn-action download" 
                          title="Download report"
                          aria-label={`Download report for ${patient.name}`}
                          onClick={() => handleDownload(patient)} 
                          disabled={downloadingPatients.has(patient.id)}
                        >
                          {downloadingPatients.has(patient.id) ? '...' : <Icons.Download />}
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
                      <span>Loading patients...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && paginatedPatients.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
                    No patients found matching your criteria.
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
      {/* Modals - Single state management */}
      {activeModal === 'add' && (
        <AddPatientModal
          isOpen={true}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          patientId={null}
        />
      )}

      {activeModal === 'view' && modalData && (
        <PatientDetailsDialog
          patient={modalData}
          isOpen={true}
          onClose={handleCloseModal}
          showBillingTab={true}
        />
      )}

      {activeModal === 'edit' && modalData && (
        <EditPatientModal
          patient={modalData}
          isOpen={true}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Staff Detail Dialog - Show doctor/staff details (same as Appointments page) */}
      {showDoctorDialog && selectedDoctor && (
        <StaffDetailEnterprise
          staffId={selectedDoctor.id || selectedDoctor._id}
          initial={selectedDoctor}
          onClose={handleCloseDoctorDialog}
          onUpdate={(updatedStaff) => {
            console.log('Doctor updated:', updatedStaff);
            handleCloseDoctorDialog();
            fetchPatients(); // Refresh patient list
          }}
        />
      )}
    </div>
  );
};

export default Patients;
