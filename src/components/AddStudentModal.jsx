import { useState, useRef, useEffect } from 'react';

export default function AddStudentModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const initialData = {
    // Personal
    name: '',
    dob: '',
    gender: 'Male',
    email: '',
    phone: '',
    avatar: null,
    address: '',
    bloodGroup: '',
    // Academic
    id: `STU-2025-${Math.floor(1000 + Math.random() * 9000)}`,
    department: 'Computer Science',
    year: '1st Year',
    semester: '1',
    section: 'A',
    enrollDate: new Date().toISOString().split('T')[0],
    admissionType: 'Regular',
    previousInstitution: '',
    // Guardian
    guardianName: '',
    relationship: 'Father',
    guardianPhone: '',
    guardianEmail: '',
    guardianOccupation: '',
    // Documents
    docs: {
      marksheet10: null,
      marksheet12: null,
      aadhar: null,
      photo: null,
      tc: null,
      additional: [],
    }
  };

  const [formData, setFormData] = useState(initialData);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('add_student_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
        if (parsed.avatar) setAvatarPreview(parsed.avatar);
      } catch (e) {
        console.error("Failed to load draft");
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e, field = 'avatar') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'avatar') {
          setAvatarPreview(reader.result);
          setFormData(prev => ({ ...prev, avatar: reader.result }));
        } else {
          setFormData(prev => ({
            ...prev,
            docs: { ...prev.docs, [field]: { name: file.name, size: file.size, data: reader.result } }
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (s) => {
    let newErrors = {};
    if (s === 1) {
      if (!formData.name) newErrors.name = 'Full Name is required';
      if (!formData.dob) newErrors.dob = 'Date of Birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    } else if (s === 3) {
      if (!formData.guardianName) newErrors.guardianName = 'Guardian Name is required';
      if (!formData.guardianPhone) newErrors.guardianPhone = 'Guardian Phone is required';
    } else if (s === 4) {
      if (!formData.docs.marksheet10) newErrors.marksheet10 = '10th Marksheet is required';
      if (!formData.docs.marksheet12) newErrors.marksheet12 = '12th Marksheet is required';
      if (!formData.docs.aadhar) newErrors.aadhar = 'Aadhar Card is required';
      if (!formData.docs.photo) newErrors.photo = 'Passport Photo is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => s + 1);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('add_student_draft', JSON.stringify(formData));
    alert('Progress saved to draft!');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(step)) {
      console.log('Final Enrollment:', formData);
      if (onSuccess) onSuccess(formData);
      localStorage.removeItem('add_student_draft');
      alert('Student Enrollment Submitted Successfuly!');
      onClose();
      setStep(1);
      setFormData(initialData);
      setAvatarPreview(null);
    }
  };

  const getSemOptions = () => {
    const yearNum = parseInt(formData.year);
    if (yearNum === 1) return ['1', '2'];
    if (yearNum === 2) return ['3', '4'];
    if (yearNum === 3) return ['5', '6'];
    if (yearNum === 4) return ['7', '8'];
    return [];
  };

  const steps = [
    { id: 1, label: 'Personal' },
    { id: 2, label: 'Academic' },
    { id: 3, label: 'Guardian' },
    { id: 4, label: 'Documents' },
    { id: 5, label: 'Review' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Progress Bar */}
        <div className="bg-slate-50 flex items-center border-b border-slate-200">
          {steps.map((s, i) => (
            <div key={s.id} className="flex-1 flex items-center">
              <div className={`h-1.5 flex-1 transition-all duration-500 ${step >= s.id ? 'bg-[#1162d4]' : 'bg-slate-200'}`} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-[#1162d4]/10 rounded-lg">
                <span className="material-symbols-outlined text-[#1162d4]">person_add</span>
              </div>
              Enroll New Student
            </h2>
            <p className="text-sm text-slate-500 mt-1">Step {step} of 5: {steps[step-1].label} Information</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
          
          {/* Step 1: Personal */}
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4">
                  <div 
                    className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                    onClick={() => fileInputRef.current.click()}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <span className="material-symbols-outlined text-slate-300 text-3xl mb-1">add_a_photo</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Profile Photo</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-bold">CHANGE PHOTO</span>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                    <input name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-[#1162d4] focus:ring-[#1162d4]/20'} border border-slate-200 rounded-lg focus:ring-2 outline-none transition-colors text-slate-700`} placeholder="e.g. John Doe" />
                    {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Date of Birth *</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl border ${errors.dob ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'} outline-none transition-all text-slate-700`} />
                    {errors.dob && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.dob}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Gender *</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-700 bg-white">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'} outline-none transition-all text-slate-700`} placeholder="example@mit.edu" />
                    {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Phone Number</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-400 text-sm font-bold">+91</span>
                      <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-r-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-700" placeholder="00000 00000" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Blood Group</label>
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-700 bg-white">
                      <option value="">Select Group</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Permanent Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-700 bg-slate-50/30 resize-none" placeholder="Enter complete home address..." />
              </div>
            </div>
          )}

          {/* Step 2: Academic */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Student ID</label>
                  <input name="id" value={formData.id} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 bg-slate-50/50 font-mono text-[#2563eb] font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Department</label>
                  <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-700 bg-white">
                    {['Computer Science', 'Mechanical Eng.', 'Electrical Eng.', 'Civil Engineering', 'Automobile Eng.', 'Electronics Eng.'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Year</label>
                  <select name="year" value={formData.year} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-700 bg-white">
                    {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-700 bg-white">
                    {getSemOptions().map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Section</label>
                  <select name="section" value={formData.section} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-700 bg-white">
                    {['A', 'B', 'C', 'D'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Enrollment Date</label>
                  <input type="date" name="enrollDate" value={formData.enrollDate} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Admission Type</label>
                  <select name="admissionType" value={formData.admissionType} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-700 bg-white">
                    {['Regular', 'Lateral', 'Management', 'Quota'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Previous Institution</label>
                  <input name="previousInstitution" value={formData.previousInstitution} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-700" placeholder="College / High School Name" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Guardian */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Guardian Name *</label>
                  <input name="guardianName" value={formData.guardianName} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl border ${errors.guardianName ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-200 focus:border-blue-500'} outline-none text-slate-700 font-medium`} placeholder="Full name of parent/guardian" />
                  {errors.guardianName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.guardianName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Relationship *</label>
                  <select name="relationship" value={formData.relationship} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-700 bg-white">
                    {['Father', 'Mother', 'Legal Guardian', 'Sibling', 'Relative'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Guardian Phone *</label>
                  <input name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl border ${errors.guardianPhone ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-200 focus:border-blue-500'} outline-none text-slate-700`} placeholder="+91 00000 00000" />
                  {errors.guardianPhone && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.guardianPhone}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Guardian Email</label>
                  <input type="email" name="guardianEmail" value={formData.guardianEmail} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-700" placeholder="optional@email.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Guardian Occupation</label>
                  <input name="guardianOccupation" value={formData.guardianOccupation} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-700" placeholder="e.g. Business, Engineer" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex gap-3">
                <span className="material-symbols-outlined text-orange-600">file_upload</span>
                <p className="text-xs text-orange-700 leading-relaxed font-medium">Please upload valid certificates. Verification is mandatory for completing enrollment. Allowed formats: PDF, JPG, PNG.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: '10th Marksheet', field: 'marksheet10' },
                  { label: '12th Marksheet', field: 'marksheet12' },
                  { label: 'Aadhar Card', field: 'aadhar' },
                  { label: 'Passport Photo', field: 'photo' },
                  { label: 'Transfer Certificate', field: 'tc' },
                ].map((doc) => (
                  <div key={doc.field} className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${formData.docs[doc.field] ? 'border-green-200 bg-green-50/30' : errors[doc.field] ? 'border-red-300 bg-red-50/30' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'} group`}>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, doc.field)} />
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.docs[doc.field] ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                        <span className="material-symbols-outlined text-lg">{formData.docs[doc.field] ? 'verified' : 'upload'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{doc.label} *</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {formData.docs[doc.field] ? formData.docs[doc.field].name : 'Click to browse or drag & drop'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Additional Docs */}
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:bg-slate-50 transition-all group">
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700">Additional Documents</p>
                      <p className="text-[10px] text-slate-400">Multiple files allowed</p>
                    </div>
                  </div>
                </div>
              </div>
              {Object.keys(errors).length > 0 && <p className="text-xs text-red-500 font-bold px-1">* Required documents are missing</p>}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-[#2563eb]/5 border border-[#2563eb]/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                  <div className="w-24 h-24 rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden shrink-0">
                    <img src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.name}&background=2563eb&color=fff`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900">{formData.name || 'Anonymous Student'}</h3>
                      <button onClick={() => setStep(1)} className="text-[10px] font-bold text-[#2563eb] hover:underline uppercase tracking-widest">Edit Step 1</button>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5"><span className="material-symbols-outlined text-base">badge</span> {formData.id}</span>
                      <span className="text-slate-500 flex items-center gap-1.5"><span className="material-symbols-outlined text-base">domain</span> {formData.department}</span>
                      <span className="text-slate-500 flex items-center gap-1.5"><span className="material-symbols-outlined text-base">calendar_today</span> {formData.year} • Sem {formData.semester}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-5 scale-150">
                  <span className="material-symbols-outlined text-[120px] text-[#2563eb]">check_circle</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personal & Bio</h4>
                      <button onClick={() => setStep(1)} className="text-[10px] font-bold text-[#2563eb] hover:underline">Edit</button>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Email</span>
                        <span className="font-semibold text-slate-700">{formData.email}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Phone</span>
                        <span className="font-semibold text-slate-700">+91 {formData.phone}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">DOB / Gender</span>
                        <span className="font-semibold text-slate-700">{formData.dob} • {formData.gender}</span>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Guardian Details</h4>
                      <button onClick={() => setStep(3)} className="text-[10px] font-bold text-[#2563eb] hover:underline">Edit</button>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Guardian Name</span>
                        <span className="font-semibold text-slate-700">{formData.guardianName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Relationship</span>
                        <span className="font-semibold text-slate-700">{formData.relationship}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Contact</span>
                        <span className="font-semibold text-slate-700">{formData.guardianPhone}</span>
                      </div>
                    </div>
                 </div>
              </div>

              {/* Document Overview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documents Uploaded</h4>
                  <button onClick={() => setStep(4)} className="text-[10px] font-bold text-[#2563eb] hover:underline">Edit</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(formData.docs).filter(([k,v]) => v && k !== 'additional').map(([key, doc]) => (
                    <div key={key} className="px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                      <span className="text-[11px] font-bold text-green-700 uppercase tracking-wider">{key.replace('marksheet', 'M/S ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex gap-4">
                <span className="material-symbols-outlined text-blue-600 text-3xl">contract_edit</span>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-1">Confirmation Required</h4>
                  <p className="text-xs text-blue-700 leading-normal">By clicking "Complete Enrollment", you certify that all information is true. The system will auto-generate the credentials and notify the student via email.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={isOpen ? handleSaveDraft : null}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm text-slate-400">save</span>
              SAVE AS DRAFT
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
            >
              Cancel
            </button>
            
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button 
                  onClick={() => setStep(s => s - 1)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  PREVIOUS
                </button>
              )}
              {step < 5 ? (
                <button 
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-colors flex items-center gap-2"
                >
                  Continue
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              ) : (
                <button 
                   onClick={handleSubmit}
                   className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  Complete Enrollment
                  <span className="material-symbols-outlined text-base">verified_user</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
