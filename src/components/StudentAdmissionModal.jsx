import { useState, useEffect } from 'react';
import EnhancedPaymentModal from './EnhancedPaymentModal';

export default function StudentAdmissionModal({ isOpen, onClose, onSuccess }) {
  const steps = [
    { id: 1, label: 'Personal', icon: 'person' },
    { id: 2, label: 'Academic', icon: 'school' },
    { id: 3, label: 'Course', icon: 'menu_book' },
    { id: 4, label: 'Category', icon: 'assignment' },
    { id: 5, label: 'Accommodation', icon: 'home' },
    { id: 6, label: 'Documents', icon: 'file_present' },
    { id: 7, label: 'Payment', icon: 'payment' },
    { id: 8, label: 'Review', icon: 'task_alt' },
  ];

  const generateStudentID = () => {
    const randomNum = Math.floor(Math.random() * 900) + 100;
    return `STU${String(randomNum).padStart(3, '0')}`;
  };

  const initial = {
    id: generateStudentID(),
    name: '',
    gender: 'Male',
    dob: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    prevSchool: '',
    board: 'CBSE',
    passYear: '',
    marks: '',
    courseCategory: 'Engineering',
    course: 'CSE',
    quota: 'Government Quota',
    accommodation: 'Day Scholar',
    roomType: 'Single',
    passportPhoto: null,
    aadhaar: null,
    marksheet: null,
    tc: null,
    cardName: '',
    cardNumber: '',
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
  const [showCVV, setShowCVV] = useState(false);
  const [showFormFields, setShowFormFields] = useState(true);

  // Form persistence - save to localStorage
  useEffect(() => {
    if (isOpen) {
      const savedForm = localStorage.getItem(`student_admission_${initial.id}`);
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
      localStorage.setItem(`student_admission_${form.id}`, JSON.stringify(form));
    }
  }, [form, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: checked }));
    } else if (type === 'file') {
      setForm(f => ({ ...f, [name]: files[0] }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDemo = () => {
    setForm({
      ...form,
      name: 'Priya Sharma',
      gender: 'Female',
      dob: '2005-08-20',
      email: 'priya.sharma@student.edu',
      phone: '9876543210',
      address: '123 Tech Lane, Innovation Park',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      prevSchool: 'Delhi Public School',
      board: 'CBSE',
      passYear: '2023',
      marks: '92%',
      courseCategory: 'Engineering',
      course: 'CSE',
      quota: 'Government Quota',
      accommodation: 'Hostel Required',
      roomType: 'Double',
      // Payment autofill
      cardName: 'Priya Sharma',
      cardNumber: '4532015112830366',
      expiry: '12/26',
      cvv: '845',
    });
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      if (!form.name.trim()) newErrors.name = 'Name is required';
      if (!form.email.trim()) newErrors.email = 'Email is required';
      if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    } else if (step === 2) {
      if (!form.courseCategory) newErrors.courseCategory = 'Course Category is required';
      if (!form.course) newErrors.course = 'Course is required';
    } else if (step === 6) {
      if (!form.cardName.trim()) newErrors.cardName = 'Card holder name is required';
      if (!form.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
      if (!form.cvv.trim()) newErrors.cvv = 'CVV is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(s => Math.min(s + 1, steps.length - 1));
    }
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

  const handleSubmit = () => {
    if (!form.applicationFeePaid) {
      setErrors({ payment: 'Payment must be completed before submission' });
      return;
    }
    // Clear saved form from localStorage
    localStorage.removeItem(`student_admission_${form.id}`);
    onSuccess({ ...form });
  };

  const isPaymentStep = step === 6;
  const canSubmit = form.applicationFeePaid && step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col border border-blue-200">
        {/* Header */}
        <div className="bg-white text-gray-800 p-6 flex justify-between items-center border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold">Student Admission Form</h2>
            <p className="text-gray-600 text-sm mt-1">Complete all steps to submit your application</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-700">Step {step + 1} of {steps.length}</span>
            <button onClick={handleDemo} className="text-xs font-semibold px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-all">
              ↻ Auto-fill Demo
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-shrink-0">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                    idx < step
                      ? 'bg-green-500 text-white shadow-md'
                      : idx === step
                      ? 'bg-gray-800 text-white shadow-lg scale-110'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {idx < step ? <span className="material-symbols-outlined text-lg">check</span> : idx + 1}
                </div>
                <div className="ml-2 text-xs font-semibold text-gray-700 hidden sm:block">{s.label}</div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 transition-all ${
                      idx < step ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="animate-fadeIn">
            {step === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} className={`w-full px-4 py-2.5 border-2 rounded-lg outline-none transition-all ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-gray-500'}`} placeholder="Enter your full name" />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                    <select name="gender" value={form.gender} onChange={handleChange} className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-gray-500 outline-none transition-all bg-white">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
                    <input type="date" name="dob" value={form.dob} onChange={handleChange} className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-gray-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} className={`w-full px-4 py-2.5 border-2 rounded-lg outline-none transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-gray-500'}`} placeholder="your@email.com" />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone *</label>
                    <input name="phone" value={form.phone} onChange={handleChange} className={`w-full px-4 py-2.5 border-2 rounded-lg outline-none transition-all ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-gray-500'}`} placeholder="10-digit number" />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Student ID</label>
                    <input type="text" value={form.id} disabled className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg bg-slate-100 text-slate-600 font-bold" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                  <textarea name="address" value={form.address} onChange={handleChange} rows="2" className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-gray-500 outline-none transition-all" placeholder="Your residential address" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                    <input name="city" value={form.city} onChange={handleChange} className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-gray-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
                    <input name="state" value={form.state} onChange={handleChange} className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-gray-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pincode</label>
                    <input name="pincode" value={form.pincode} onChange={handleChange} className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-gray-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Academic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Previous School</label>
                    <input name="prevSchool" value={form.prevSchool} onChange={handleChange} className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-gray-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Board</label>
                    <select name="board" value={form.board} onChange={handleChange} className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-gray-500 outline-none transition-all bg-white">
                      <option>State</option>
                      <option>CBSE</option>
                      <option>ICSE</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Year of Passing</label>
                    <input name="passYear" value={form.passYear} onChange={handleChange} className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-gray-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Marks / Percentage</label>
                    <input name="marks" value={form.marks} onChange={handleChange} className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-gray-500 outline-none transition-all" placeholder="e.g., 88%" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Course Selection</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Course Category *</label>
                    <select name="courseCategory" value={form.courseCategory} onChange={handleChange} className={`w-full px-4 py-2.5 border-2 rounded-lg focus:border-gray-500 outline-none transition-all bg-white ${errors.courseCategory ? 'border-red-500' : 'border-gray-300'}`}>
                      <option>Engineering</option>
                      <option>Arts & Science</option>
                      <option>Commerce</option>
                      <option>Management</option>
                      <option>Diploma</option>
                    </select>
                    {errors.courseCategory && <p className="text-xs text-red-500 mt-1">{errors.courseCategory}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Course *</label>
                    <input name="course" value={form.course} onChange={handleChange} className={`w-full px-4 py-2.5 border-2 rounded-lg outline-none transition-all ${errors.course ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-gray-500'}`} placeholder="e.g., CSE" />
                    {errors.course && <p className="text-xs text-red-500 mt-1">{errors.course}</p>}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quota Selection</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                    <input type="radio" name="quota" value="Government Quota" checked={form.quota === 'Government Quota'} onChange={handleChange} className="w-4 h-4" />
                    <span className="ml-3 font-semibold text-gray-700">Government Quota</span>
                  </label>
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                    <input type="radio" name="quota" value="Management Quota" checked={form.quota === 'Management Quota'} onChange={handleChange} className="w-4 h-4" />
                    <span className="ml-3 font-semibold text-gray-700">Management Quota</span>
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Accommodation</h3>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                    <input type="radio" name="accommodation" value="Day Scholar" checked={form.accommodation === 'Day Scholar'} onChange={handleChange} className="w-4 h-4" />
                    <span className="ml-3 font-semibold text-gray-700">Day Scholar</span>
                  </label>
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                    <input type="radio" name="accommodation" value="Hostel Required" checked={form.accommodation === 'Hostel Required'} onChange={handleChange} className="w-4 h-4" />
                    <span className="ml-3 font-semibold text-gray-700">Hostel Required</span>
                  </label>
                </div>
                {form.accommodation === 'Hostel Required' && (
                  <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type</label>
                      <select name="roomType" value={form.roomType} onChange={handleChange} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-gray-500 outline-none transition-all bg-white">
                        <option>Single</option>
                        <option>Double</option>
                        <option>Triple</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Passport Photo</label>
                    <input type="file" name="passportPhoto" onChange={handleChange} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Aadhaar Card</label>
                    <input type="file" name="aadhaar" onChange={handleChange} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Marksheet</label>
                    <input type="file" name="marksheet" onChange={handleChange} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Transfer Certificate (optional)</label>
                    <input type="file" name="tc" onChange={handleChange} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-1">Application Fee</p>
                  <p className="text-4xl font-bold text-gray-800">₹500</p>
                  <p className="text-xs text-gray-500 mt-2">One-time application processing fee</p>
                </div>

                {!form.applicationFeePaid ? (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                      <span className="material-symbols-outlined text-gray-600">info</span>
                      <p className="text-sm text-gray-700">
                        Click "Proceed to Payment" to complete your payment securely
                      </p>
                    </div>

                    <div className="mt-6 p-4 bg-white border-2 border-gray-300 rounded-lg">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                        Form Preview
                        <button
                          type="button"
                          onClick={() => setShowFormFields(!showFormFields)}
                          className="ml-auto text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-all"
                        >
                          {showFormFields ? 'Hide' : 'Show'}
                        </button>
                      </h4>
                      {showFormFields && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500 font-medium">Name:</span>
                            <p className="text-gray-900 font-semibold">{form.name}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Email:</span>
                            <p className="text-gray-900 font-semibold">{form.email}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Course:</span>
                            <p className="text-gray-900 font-semibold">{form.course}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Student ID:</span>
                            <p className="text-gray-900 font-mono font-bold text-gray-800">{form.id}</p>
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

            {step === 7 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Review Your Application</h3>
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <p className="flex items-center text-green-700 font-semibold">
                    <span className="material-symbols-outlined mr-2">check_circle</span>
                    Payment Status: <span className="ml-2 text-lg text-green-600">{form.payment}</span>
                  </p>
                </div>
                <div className="space-y-3 mt-4 p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                  <p><span className="font-semibold text-gray-700">Name:</span> {form.name}</p>
                  <p><span className="font-semibold text-gray-700">Email:</span> {form.email}</p>
                  <p><span className="font-semibold text-gray-700">Course:</span> {form.course} ({form.courseCategory})</p>
                  <p><span className="font-semibold text-gray-700">Quota:</span> {form.quota}</p>
                  <p><span className="font-semibold text-gray-700">Student ID:</span> <span className="font-mono text-gray-800 font-bold text-lg">{form.id}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-100 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <button
            disabled={step === 0}
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
              step === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            <span className="material-symbols-outlined inline mr-1">arrow_back</span>
            Previous
          </button>

          <div className="text-xs text-gray-600 font-semibold">
            {step + 1} / {steps.length}
          </div>

          {isPaymentStep ? (
            <button
              onClick={handlePaymentSubmit}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={form.applicationFeePaid}
            >
              <span className="material-symbols-outlined inline mr-1">payment</span>
              {form.applicationFeePaid ? 'Payment Completed' : 'Proceed to Payment'}
            </button>
          ) : canSubmit ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 hover:shadow-lg transition-all shadow-md text-lg"
            >
              <span className="material-symbols-outlined inline mr-1">task_alt</span>
              Submit Application
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Next
              <span className="material-symbols-outlined inline ml-1">arrow_forward</span>
            </button>
          )}
        </div>
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
  );
}
