/**
 * PathologyFormEnterprise.jsx
 * Enterprise-level Add/Edit Pathology Report Form
 * Matches Flutter design with emerald theme
 */

import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiUpload, FiSave, FiArrowRight, FiCheck, FiSearch } from 'react-icons/fi';
import { MdOutlineScience, MdOutlineNoteAlt } from 'react-icons/md';
import { fetchPatients } from '../../../services/patientsService';
import { fetchAllDoctors } from '../../../services/doctorService';

const PathologyFormEnterprise = ({ initial, onSubmit, onCancel }) => {
  // Multi-step form states
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Patient search states
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(-1);
  const [patientSelected, setPatientSelected] = useState(false);

  // Doctor states
  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    patientId: '',
    patientCode: '',
    patientName: '',
    testName: '',
    testType: '',
    testCategory: '',
    collectionDate: '',
    reportDate: '',
    status: 'Pending',
    priority: 'Normal',
    doctorName: '',
    technician: '',
    notes: '',
    file: null,
    fileName: '',
    testResults: [], // Added to preserve existing results
    results: {}, // Added for schema compatibility
  });

  // Initialize form with existing data
  useEffect(() => {
    if (initial) {
      setFormData({
        patientId: initial.patientId || '',
        patientCode: initial.patientCode || '',
        patientName: initial.patientName || '',
        testName: initial.testName || '',
        testType: initial.testType || '',
        testCategory: initial.testCategory || '',
        collectionDate: initial.collectionDate ? new Date(initial.collectionDate).toISOString().split('T')[0] : '',
        reportDate: initial.reportDate ? new Date(initial.reportDate).toISOString().split('T')[0] : '',
        status: initial.status || 'Pending',
        priority: initial.priority || 'Normal',
        doctorName: initial.doctorName || '',
        technician: initial.technician || '',
        notes: initial.remarks || initial.notes || '',
        file: null,
        fileName: initial.fileName || '',
        testResults: initial.testResults || initial.results || [],
        results: initial.results || {},
      });
      setPatientSearchQuery(initial.patientName || '');
      setPatientSelected(true);
    } else {
      // Load all available patients on mount for new form
      loadAvailablePatients();
    }

    // Load doctors on mount
    loadDoctors();
  }, [initial]);

  // Load doctors from API
  const loadDoctors = async () => {
    try {
      setIsLoadingDoctors(true);
      const doctorsList = await fetchAllDoctors();
      setDoctors(doctorsList);
      console.log('✅ Loaded doctors:', doctorsList.length);
    } catch (error) {
      console.error('❌ Error loading doctors:', error);
      setDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  // Load available patients on mount
  const loadAvailablePatients = async () => {
    try {
      setIsSearchingPatients(true);
      const results = await fetchPatients({ limit: 50 }); // Load first 50 patients
      setPatientSearchResults(results);
      setShowPatientDropdown(true);
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatientSearchResults([]);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  // Search patients with debounce
  useEffect(() => {
    // Skip search if patient is already selected
    if (patientSelected) {
      return;
    }

    const timer = setTimeout(() => {
      if (patientSearchQuery && patientSearchQuery.length >= 2 && !initial) {
        searchPatients(patientSearchQuery);
      } else if (!patientSearchQuery && !initial) {
        // Show all patients when search is empty
        loadAvailablePatients();
      } else {
        setPatientSearchResults([]);
        setShowPatientDropdown(false);
      }
      setSelectedPatientIndex(-1); // Reset selection on search
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearchQuery, initial, patientSelected]);

  const searchPatients = async (query) => {
    try {
      setIsSearchingPatients(true);
      const results = await fetchPatients({ q: query, limit: 10 });
      setPatientSearchResults(results);
      setShowPatientDropdown(true);
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatientSearchResults([]);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  const selectPatient = (patient) => {
    console.log('Selecting patient:', patient);
    console.log('Patient object keys:', Object.keys(patient));
    console.log('Patient.patientId:', patient.patientId);
    console.log('Patient.id:', patient.id);
    console.log('Patient._id:', patient._id);

    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || '';
    // Try all possible ID fields
    const patientId = patient.patientId || patient.id || patient._id || '';
    const patientCode = patient.patientCode || patient.code || '';

    console.log('Extracted values:', { patientId, patientCode, fullName });

    if (!patientId) {
      console.error('❌ No patient ID found! Patient object:', JSON.stringify(patient, null, 2));
    }

    // Update form data synchronously
    setFormData(prev => ({
      ...prev,
      patientId: patientId,
      patientCode: patientCode,
      patientName: fullName,
    }));

    setPatientSearchQuery(fullName);
    setPatientSelected(true);
    setShowPatientDropdown(false);
    setPatientSearchResults([]);
    setSelectedPatientIndex(-1);

    // Clear any errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.patientName;
      delete newErrors.patientId;
      return newErrors;
    });

    console.log('Patient selection completed with ID:', patientId);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showPatientDropdown || patientSearchResults.length === 0) {
      // If dropdown is not shown, don't prevent default Enter behavior
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedPatientIndex(prev =>
          prev < patientSearchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedPatientIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        // Prevent form submission and next button
        e.preventDefault();
        e.stopPropagation();

        if (selectedPatientIndex >= 0 && selectedPatientIndex < patientSearchResults.length) {
          selectPatient(patientSearchResults[selectedPatientIndex]);
        } else if (patientSearchResults.length > 0) {
          // If no selection, select first result on Enter
          selectPatient(patientSearchResults[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowPatientDropdown(false);
        setSelectedPatientIndex(-1);
        break;
      default:
        break;
    }
  };

  // Form steps configuration
  const steps = [
    { id: 1, name: 'Patient Info', icon: FiUser },
    { id: 2, name: 'Test Details', icon: MdOutlineScience },
    { id: 3, name: 'Additional Info', icon: MdOutlineNoteAlt },
    { id: 4, name: 'File Upload', icon: FiUpload },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: 'File size must be less than 5MB' }));
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, file: 'Only PDF, JPG, and PNG files are allowed' }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        file: file,
        fileName: file.name
      }));
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      console.log('Validating step 1, formData:', formData);
      console.log('patientId:', formData.patientId);
      console.log('patientName:', formData.patientName);
      console.log('patientSelected flag:', patientSelected);

      // Check if patient is actually selected (has ID)
      if (!formData.patientId || (typeof formData.patientId === 'string' && formData.patientId.trim() === '')) {
        newErrors.patientName = 'Please search and select a patient from the list';
        console.log('Patient validation failed - no patientId');
      }

      if (!formData.patientName || (typeof formData.patientName === 'string' && formData.patientName.trim() === '')) {
        newErrors.patientName = 'Please search and select a patient from the list';
        console.log('Patient validation failed - no patientName');
      }
    }

    if (step === 2) {
      if (!formData.testName || !formData.testName.trim()) {
        newErrors.testName = 'Test name is required';
      }
      if (!formData.testType || !formData.testType.trim()) {
        newErrors.testType = 'Test type is required';
      }
      if (!formData.collectionDate) {
        newErrors.collectionDate = 'Collection date is required';
      }
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'file' && formData[key]) {
          submitData.append('file', formData[key]);
        } else if (key !== 'file' && key !== 'fileName') {
          // Serialize objects and arrays correctly for FormData
          const value = formData[key];
          if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            submitData.append(key, JSON.stringify(value));
          } else {
            submitData.append(key, value);
          }
        }
      });

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to save report: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white shadow-2xl overflow-hidden flex flex-col"
        style={{
          width: '95%',
          maxWidth: '1200px',
          height: '90vh',
          maxHeight: '850px',
          borderRadius: '20px'
        }}
      >

        {/* Header */}
        <div className="bg-gradient-to-r from-[#207DC0] to-[#165a8a] px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {initial ? 'Edit Lab Report' : 'Add New Lab Report'}
              </h2>
              <p className="text-blue-50 text-sm mt-1">
                {initial ? 'Update report information' : 'Fill in the details to create a new pathology report'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${currentStep >= step.id
                      ? 'bg-[#207DC0] text-white shadow-lg'
                      : 'bg-gray-300 text-gray-600'
                      }`}
                  >
                    {currentStep > step.id ? (
                      <FiCheck size={20} />
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p
                      className={`text-sm font-semibold ${currentStep >= step.id ? 'text-[#207DC0]' : 'text-gray-500'
                        }`}
                    >
                      {step.name}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-all ${currentStep > step.id ? 'bg-[#207DC0]' : 'bg-gray-300'
                      }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 py-6">

            {/* Step 1: Patient Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#207DC0] rounded-lg flex items-center justify-center">
                      <FiUser className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Patient Information</h3>
                      <p className="text-sm text-gray-600">Search and select patient</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Patient Search with Dropdown */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Search Patient <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={patientSearchQuery}
                          onChange={(e) => {
                            setPatientSearchQuery(e.target.value);
                            if (!e.target.value) {
                              setFormData(prev => ({
                                ...prev,
                                patientId: '',
                                patientCode: '',
                                patientName: ''
                              }));
                              setPatientSelected(false);
                            } else {
                              // When user types, allow searching again
                              setPatientSelected(false);
                            }
                          }}
                          onKeyDown={handleKeyDown}
                          onFocus={() => {
                            if (!initial) {
                              if (patientSearchQuery.length >= 2 && patientSearchResults.length > 0) {
                                setShowPatientDropdown(true);
                              } else if (!patientSearchQuery) {
                                loadAvailablePatients();
                              }
                            }
                          }}
                          placeholder="Type patient name or ID to search... (Press Enter to select)"
                          readOnly={!!initial}
                          className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#207DC0] focus:border-transparent transition-all ${errors.patientName ? 'border-red-500' : 'border-gray-300'
                            } ${initial ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                        {isSearchingPatients && (
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#207DC0]"></div>
                          </div>
                        )}
                      </div>
                      {errors.patientName && <p className="text-red-500 text-xs mt-1">{errors.patientName}</p>}

                      {/* Search Results Dropdown */}
                      {showPatientDropdown && patientSearchResults.length > 0 && !initial && (
                        <div
                          className="absolute w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          style={{ zIndex: 9999 }}
                        >
                          {patientSearchResults.map((patient, index) => (
                            <div
                              key={patient.id || patient._id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectPatient(patient);
                              }}
                              onMouseEnter={() => setSelectedPatientIndex(index)}
                              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${index === selectedPatientIndex
                                ? 'bg-blue-100 border-l-4 border-l-[#207DC0]'
                                : 'hover:bg-blue-50'
                                }`}
                            >
                              <div className="font-semibold text-gray-800">
                                {patient.firstName} {patient.lastName}
                              </div>
                              <div className="text-sm text-gray-600">
                                Code: {patient.patientCode || patient.code || 'N/A'} •
                                {patient.gender ? ` ${patient.gender}` : ''} •
                                {patient.age ? ` Age: ${patient.age}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No results message */}
                      {showPatientDropdown && patientSearchResults.length === 0 && !isSearchingPatients && patientSearchQuery.length >= 2 && (
                        <div
                          className="absolute w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
                          style={{ zIndex: 9999 }}
                        >
                          <p className="text-gray-600 text-sm text-center">No patients found</p>
                        </div>
                      )}
                    </div>

                    {/* Display Selected Patient Info */}
                    {formData.patientId && (
                      <div className="bg-white border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <FiUser className="text-[#207DC0]" size={24} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{formData.patientName}</p>
                            <p className="text-sm text-gray-600">
                              Patient Code: {formData.patientCode || formData.patientId}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Test Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#207DC0] rounded-lg flex items-center justify-center">
                      <MdOutlineScience className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Test Details</h3>
                      <p className="text-sm text-gray-600">Specify test information</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Test Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Test Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="testName"
                        value={formData.testName}
                        onChange={handleChange}
                        placeholder="e.g., Complete Blood Count"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#207DC0] focus:border-transparent transition-all ${errors.testName ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                      {errors.testName && <p className="text-red-500 text-xs mt-1">{errors.testName}</p>}
                    </div>

                    {/* Test Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Test Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="testType"
                        value={formData.testType}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#207DC0] focus:border-transparent transition-all ${errors.testType ? 'border-red-500' : 'border-gray-300'
                          }`}
                      >
                        <option value="">Select test type</option>
                        <option value="Blood Test">Blood Test</option>
                        <option value="Urine Test">Urine Test</option>
                        <option value="X-Ray">X-Ray</option>
                        <option value="MRI">MRI</option>
                        <option value="CT Scan">CT Scan</option>
                        <option value="Ultrasound">Ultrasound</option>
                        <option value="ECG">ECG</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.testType && <p className="text-red-500 text-xs mt-1">{errors.testType}</p>}
                    </div>

                    {/* Test Category */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        name="testCategory"
                        value={formData.testCategory}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#207DC0] focus:border-transparent transition-all"
                      >
                        <option value="">Select category</option>
                        <option value="Hematology">Hematology</option>
                        <option value="Biochemistry">Biochemistry</option>
                        <option value="Microbiology">Microbiology</option>
                        <option value="Histopathology">Histopathology</option>
                        <option value="Radiology">Radiology</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Collection Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Collection Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="collectionDate"
                        value={formData.collectionDate}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#207DC0] focus:border-transparent transition-all ${errors.collectionDate ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                      {errors.collectionDate && <p className="text-red-500 text-xs mt-1">{errors.collectionDate}</p>}
                    </div>

                    {/* Report Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Report Date
                      </label>
                      <input
                        type="date"
                        name="reportDate"
                        value={formData.reportDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#207DC0] focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#207DC0] focus:border-transparent transition-all"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Additional Information */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#207DC0] rounded-lg flex items-center justify-center">
                      <MdOutlineNoteAlt className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Additional Information</h3>
                      <p className="text-sm text-gray-600">Optional details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Doctor Name - Changed to Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Referring Doctor
                      </label>
                      {isLoadingDoctors ? (
                        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#207DC0]"></div>
                          Loading doctors...
                        </div>
                      ) : (
                        <select
                          name="doctorName"
                          value={formData.doctorName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#207DC0] focus:border-transparent transition-all"
                        >
                          <option value="">Select a doctor</option>
                          {doctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.name}>
                              {doctor.name} - {doctor.specialization}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Technician */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Lab Technician
                      </label>
                      <input
                        type="text"
                        name="technician"
                        value={formData.technician}
                        onChange={handleChange}
                        placeholder="Enter technician name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#207DC0] focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#207DC0] focus:border-transparent transition-all"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Notes - Full width */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notes / Remarks
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Enter any additional notes or observations..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#207DC0] focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: File Upload */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#207DC0] rounded-lg flex items-center justify-center">
                      <FiUpload className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Upload Report File</h3>
                      <p className="text-sm text-gray-600">Attach the lab report document</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#207DC0]/30 rounded-xl cursor-pointer bg-white hover:bg-[#207DC0]/5 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FiUpload className="w-12 h-12 text-[#207DC0] mb-3" />
                        <p className="mb-2 text-sm text-gray-700">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, JPG, PNG (max. 5MB)</p>
                        {formData.fileName && (
                          <p className="mt-3 text-sm text-[#207DC0] font-semibold">
                            ✓ {formData.fileName}
                          </p>
                        )}
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {errors.file && <p className="text-red-500 text-xs mt-2">{errors.file}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer with Navigation */}
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={currentStep === 1 ? onCancel : handleBack}
            className="flex items-center gap-2 px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-3">
            {/* Skip button for step 3 */}
            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 px-6 py-2.5 text-[#207DC0] bg-white border border-[#207DC0] rounded-lg hover:bg-[#207DC0]/5 transition-colors font-medium"
              >
                Skip
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#207DC0] text-white rounded-lg hover:bg-[#0F7D7E] transition-colors font-medium shadow-lg shadow-[#207DC0]/30"
              >
                Next
                <FiArrowRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-2.5 bg-[#207DC0] text-white rounded-lg hover:bg-[#0F7D7E] transition-colors font-medium shadow-lg shadow-[#207DC0]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave size={18} />
                    Save Report
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default PathologyFormEnterprise;
