/**
 * PathologyFormEnterprise.jsx
 * Enterprise-level Add/Edit Pathology Report Form
 * Matches Flutter design with emerald theme
 */

import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiUpload, FiSave, FiArrowRight, FiCheck } from 'react-icons/fi';
import { MdOutlineScience, MdOutlineNoteAlt } from 'react-icons/md';

const PathologyFormEnterprise = ({ initial, onSubmit, onCancel }) => {
  // Multi-step form states
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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
    }
  }, [initial]);

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
      if (!formData.patientId.trim()) newErrors.patientId = 'Patient ID is required';
      if (!formData.patientName.trim()) newErrors.patientName = 'Patient name is required';
    }

    if (step === 2) {
      if (!formData.testName.trim()) newErrors.testName = 'Test name is required';
      if (!formData.testType.trim()) newErrors.testType = 'Test type is required';
      if (!formData.collectionDate) newErrors.collectionDate = 'Collection date is required';
    }

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
      <div className="bg-white shadow-2xl w-full max-h-[92vh] overflow-hidden flex flex-col" style={{ maxWidth: window.innerWidth >= 1200 ? '1980px' : '96vw', borderRadius: '12px' }}>

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {initial ? 'Edit Lab Report' : 'Add New Lab Report'}
              </h2>
              <p className="text-emerald-50 text-sm mt-1">
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
                      ? 'bg-emerald-600 text-white shadow-lg'
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
                      className={`text-sm font-semibold ${currentStep >= step.id ? 'text-emerald-600' : 'text-gray-500'
                        }`}
                    >
                      {step.name}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-all ${currentStep > step.id ? 'bg-emerald-600' : 'bg-gray-300'
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
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <FiUser className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Patient Information</h3>
                      <p className="text-sm text-gray-600">Enter patient details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient ID */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Patient ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="patientId"
                        value={formData.patientCode || formData.patientId}
                        onChange={handleChange}
                        placeholder="Enter patient ID"
                        readOnly={!!initial}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${errors.patientId ? 'border-red-500' : 'border-gray-300'
                          } ${initial ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                      {errors.patientId && <p className="text-red-500 text-xs mt-1">{errors.patientId}</p>}
                    </div>

                    {/* Patient Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Patient Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="patientName"
                        value={formData.patientName}
                        onChange={handleChange}
                        placeholder="Enter patient name"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${errors.patientName ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                      {errors.patientName && <p className="text-red-500 text-xs mt-1">{errors.patientName}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Test Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
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
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${errors.testName ? 'border-red-500' : 'border-gray-300'
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
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${errors.testType ? 'border-red-500' : 'border-gray-300'
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${errors.collectionDate ? 'border-red-500' : 'border-gray-300'
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <MdOutlineNoteAlt className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Additional Information</h3>
                      <p className="text-sm text-gray-600">Optional details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Doctor Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Referring Doctor
                      </label>
                      <input
                        type="text"
                        name="doctorName"
                        value={formData.doctorName}
                        onChange={handleChange}
                        placeholder="Enter doctor name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: File Upload */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <FiUpload className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Upload Report File</h3>
                      <p className="text-sm text-gray-600">Attach the lab report document</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer bg-white hover:bg-emerald-50 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FiUpload className="w-12 h-12 text-emerald-600 mb-3" />
                        <p className="mb-2 text-sm text-gray-700">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, JPG, PNG (max. 5MB)</p>
                        {formData.fileName && (
                          <p className="mt-3 text-sm text-emerald-600 font-semibold">
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

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-lg shadow-emerald-500/30"
            >
              Next
              <FiArrowRight size={18} />
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
