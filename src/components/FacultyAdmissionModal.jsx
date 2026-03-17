import { useState, useEffect } from 'react';
import EnhancedPaymentModal from './EnhancedPaymentModal';

export default function FacultyAdmissionModal({ isOpen, onClose, onSuccess }) {
  const steps = ['Personal', 'Professional', 'Qualification', 'Documents', 'Employment Type', 'Payment', 'Review'];
  const stepIcons = ['person', 'work', 'school', 'description', 'badge', 'payment', 'check_circle'];

  const generateFacultyID = () => {
    const count = Math.floor(Math.random() * 900) + 1;
    return `STAFF${String(count).padStart(3, '0')}`;
  };

  const initial = {
    id: generateFacultyID(),
    name: '',
    gender: 'Male',
    dob: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    department: '',
    role: '',
    joiningDate: '',
    experience: '',
    qualification: '',
    degree: '',
    university: '',
    passYear: '',
    specialization: '',
    employmentType: 'Temporary',
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
    applicationFeePaid: false,
    payment: 'Pending',
    status: 'Pending',
  };

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFormFields, setShowFormFields] = useState(true);

  // Form persistence - save to localStorage
  useEffect(() => {
    if (isOpen) {
      const savedForm = localStorage.getItem(`faculty_admission_${initial.id}`);
      if (savedForm) {
        try {
          setForm(JSON.parse(savedForm));
        } catch (e) {
          // If corrupted, use initial
        }
      }
    }
  }, [isOpen]);

  // Auto-save form to localStorage
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem(`faculty_admission_${form.id}`, JSON.stringify(form));
    }
  }, [form, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const validateStep = () => {
    const newErrors = {};
    
    if (step === 0) {
      if (!form.name.trim()) newErrors.name = 'Name is required';
      if (!form.email.trim()) newErrors.email = 'Email is required';
      if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    } else if (step === 1) {
      if (!form.department.trim()) newErrors.department = 'Department is required';
      if (!form.role.trim()) newErrors.role = 'Role is required';
    } else if (step === 5) {
      if (!form.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
      if (!form.cardName.trim()) newErrors.cardName = 'Card holder name is required';
      if (!form.expiry.trim()) newErrors.expiry = 'Expiry is required';
      if (!form.cvv.trim()) newErrors.cvv = 'CVV is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    setForm(f => ({ 
      ...f, 
      applicationFeePaid: true, 
      payment: 'Paid',
      cardName: paymentData.cardName,
      cardNumber: paymentData.cardNumber,
      expiry: paymentData.expiry,
      cvv: paymentData.cvv,
    }));
    setShowPaymentModal(false);
    setStep(s => Math.min(s + 1, steps.length - 1));
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(s => Math.min(steps.length - 1, s + 1));
    }
  };

  const handlePrevious = () => {
    setStep(s => Math.max(0, s - 1));
  };

  const handleSubmit = () => {
    if (!form.applicationFeePaid) {
      setErrors({ payment: 'Payment must be completed before submission' });
      return;
    }
    // Clear saved form from localStorage
    localStorage.removeItem(`faculty_admission_${form.id}`);
    onSuccess({ ...form });
  };

  const handleAutoFill = () => {
    setForm({
      ...form,
      name: 'Rajesh Kumar',
      gender: 'Male',
      dob: '1980-05-15',
      email: 'rajesh.kumar@email.com',
      phone: '9876543210',
      address: '42 Kailash Colony',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110012',
      department: 'Computer Science',
      role: 'Assistant Professor',
      joiningDate: '2023-06-01',
      experience: '8',
      qualification: 'PhD in Computer Science',
      degree: 'PhD',
      university: 'Delhi University',
      passYear: '2015',
      specialization: 'Artificial Intelligence',
      employmentType: 'Permanent',
      // Payment autofill
      cardName: 'Rajesh Kumar',
      cardNumber: '4539741057010280',
      expiry: '12/26',
      cvv: '123',
    });
  };

  const canSubmit = form.applicationFeePaid && step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-200">
        {/* Header with neutral gray colors */}
        <div className="bg-white text-gray-800 p-6 flex justify-between items-center border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold">Faculty Admission</h3>
            <p className="text-sm text-gray-600 mt-1">Staff ID: {form.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <div className="flex justify-between items-center overflow-x-auto gap-2">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    i < step
                      ? 'bg-green-500 text-white scale-100'
                      : i === step
                      ? 'bg-gray-800 text-white scale-125 shadow-lg'
                      : 'bg-gray-300 text-gray-600 scale-100'
                  }`}
                >
                  {i < step ? (
                    <span className="material-symbols-outlined text-lg">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg">{stepIcons[i]}</span>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-700 mt-2 text-center max-w-16">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {step === 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4] transition-all ${
                    errors.name ? 'border-red-500 ring-2 ring-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4] transition-all ${
                      errors.email ? 'border-red-500 ring-2 ring-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter email"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4] transition-all ${
                      errors.phone ? 'border-red-500 ring-2 ring-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                  placeholder="Enter address"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Professional Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4] transition-all ${
                      errors.department ? 'border-red-500 ring-2 ring-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Computer Science"
                  />
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <input
                    type="text"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4] transition-all ${
                      errors.role ? 'border-red-500 ring-2 ring-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Assistant Professor"
                  />
                  {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={form.joiningDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience (years)</label>
                  <input
                    type="number"
                    name="experience"
                    value={form.experience}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                    placeholder="e.g., 5"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Qualification Details</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Highest Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  value={form.qualification}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                  placeholder="e.g., PhD in Computer Science"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                  <input
                    type="text"
                    name="degree"
                    value={form.degree}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                    placeholder="e.g., PhD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">University / College</label>
                  <input
                    type="text"
                    name="university"
                    value={form.university}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                    placeholder="e.g., MIT"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year of Passing</label>
                  <input
                    type="text"
                    name="passYear"
                    value={form.passYear}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                    placeholder="e.g., 2015"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={form.specialization}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1162d4]"
                    placeholder="e.g., AI/ML"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Upload Documents</h4>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1162d4] transition-colors">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                  <input type="file" accept="image/*" className="w-full" />
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1162d4] transition-colors">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Card</label>
                  <input type="file" accept="application/pdf,image/*" className="w-full" />
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1162d4] transition-colors">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resume / CV</label>
                  <input type="file" accept="application/pdf,.doc,.docx" className="w-full" />
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1162d4] transition-colors">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualification Certificate</label>
                  <input type="file" accept="application/pdf,image/*" className="w-full" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Employment Type</h4>
              <div className="space-y-3">
                {['Temporary', 'Guest Staff', 'Permanent'].map(type => (
                  <label key={type} className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="employmentType"
                      value={type}
                      checked={form.employmentType === type}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#1162d4]"
                    />
                    <span className="ml-3 font-medium text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg">
                <p className="text-sm text-gray-600 font-medium mb-1">Application Fee</p>
                <p className="text-4xl font-bold text-[#1162d4]">₹500</p>
                <p className="text-xs text-gray-500 mt-2">One-time payment for faculty registration</p>
              </div>

              {!form.applicationFeePaid ? (
                <>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="material-symbols-outlined text-blue-600">info</span>
                    <p className="text-sm text-blue-700">
                      Click "Proceed to Payment" to complete your payment securely
                    </p>
                  </div>

                  <div className="mt-6 p-4 bg-white border-2 border-slate-200 rounded-lg">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">visibility</span>
                      Form Preview
                      <button
                        type="button"
                        onClick={() => setShowFormFields(!showFormFields)}
                        className="ml-auto text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-all"
                      >
                        {showFormFields ? 'Hide' : 'Show'}
                      </button>
                    </h4>
                    {showFormFields && (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500 font-medium">Name:</span>
                          <p className="text-slate-900 font-semibold">{form.name}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Email:</span>
                          <p className="text-slate-900 font-semibold">{form.email}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Department:</span>
                          <p className="text-slate-900 font-semibold">{form.department}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Staff ID:</span>
                          <p className="text-slate-900 font-mono font-bold text-[#1162d4]">{form.id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                    <div>
                      <p className="font-bold text-green-800">Payment Successful!</p>
                      <p className="text-sm text-green-700 mt-1">Transaction ID: TXN{Date.now()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Application Review</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Staff ID:</span>
                  <span className="text-gray-900">{form.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Name:</span>
                  <span className="text-gray-900">{form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Department:</span>
                  <span className="text-gray-900">{form.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Role:</span>
                  <span className="text-gray-900">{form.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Employment Type:</span>
                  <span className="text-gray-900">{form.employmentType}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-700 font-medium">Application Fee:</span>
                  <span className="text-gray-900">₹500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Payment Status:</span>
                  <span className={`font-bold ${form.applicationFeePaid ? 'text-green-600' : 'text-red-600'}`}>
                    {form.payment}
                  </span>
                </div>
              </div>
              {form.applicationFeePaid && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                  <p className="text-green-800 font-medium">All requirements completed. Ready to submit!</p>
                </div>
              )}
            </div>
          )}
          {errors.payment && <p className="text-red-500 text-sm mt-2">{errors.payment}</p>}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between gap-3">
          <div className="flex gap-2">
            <button
              disabled={step === 0}
              onClick={handlePrevious}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {step < steps.length - 1 && step !== steps.length - 2 && (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            )}
            {step === steps.length - 2 && (
              <button
                onClick={handlePaymentSubmit}
                disabled={form.applicationFeePaid}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="material-symbols-outlined">payment</span>
                {form.applicationFeePaid ? 'Payment Complete' : 'Proceed to Payment'}
              </button>
            )}
          </div>
          {step < steps.length - 1 && (
            <button
              onClick={handleAutoFill}
              className="px-4 py-3 text-blue-600 font-medium border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              Auto Fill Demo
            </button>
          )}
          {step === steps.length - 1 && (
            <button
              onClick={handleSubmit}
              disabled={!form.applicationFeePaid}
              className={`px-8 py-3 font-bold rounded-lg transition-colors flex items-center gap-2 ${
                form.applicationFeePaid
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined">check</span>
              Submit Application
            </button>
          )}
        </div>

        {/* Enhanced Payment Modal */}
        <EnhancedPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={500}
          studentName={form.name}
          studentId={form.id}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
}
