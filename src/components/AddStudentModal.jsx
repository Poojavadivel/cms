import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';

export default function AddStudentModal({ isOpen, onClose, onSuccess, editStudent }) {
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

  useEffect(() => {
    if (isOpen) {
      if (editStudent) {
        // Prepare data for editing
        setFormData({
          ...initialData,
          ...editStudent,
          id: editStudent.rollNumber,
          department: Object.keys(deptMapping).find(key => deptMapping[key] === editStudent.departmentId) || editStudent.departmentId,
          year: `${editStudent.year}${editStudent.year === 1 ? 'st' : editStudent.year === 2 ? 'nd' : editStudent.year === 3 ? 'rd' : 'th'} Year`,
          semester: String(editStudent.semester),
          guardianName: editStudent.guardian || editStudent.guardianName
        });
        if (editStudent.avatar) setAvatarPreview(editStudent.avatar);
        setStep(1); // Start at first step for editing
      } else {
        const draft = localStorage.getItem('add_student_draft');
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            setFormData(parsed);
            if (parsed.avatar) setAvatarPreview(parsed.avatar);
          } catch (e) {
            console.error("Failed to load draft");
          }
        } else {
          setFormData(initialData);
          setAvatarPreview(null);
        }
      }
    }
  }, [isOpen, editStudent]);

  // Dept mapping moved outside or inside handleSubmit depending on use
  const deptMapping = {
    'Computer Science': 'CS',
    'Mechanical Eng.': 'ME',
    'Electrical Eng.': 'EE',
    'Civil Engineering': 'CE'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    } else if (s === 3) {
      if (!formData.guardianName) newErrors.guardianName = 'Guardian Name is required';
      if (!formData.guardianPhone) newErrors.guardianPhone = 'Guardian Phone is required';
    } else if (s === 4) {
      ['marksheet10', 'marksheet12', 'aadhar', 'photo'].forEach(f => {
        if (!formData.docs[f]) newErrors[f] = true;
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => validateStep(step) && setStep(s => s + 1);

  const handleSaveDraft = () => {
    localStorage.setItem('add_student_draft', JSON.stringify(formData));
    alert('Progress saved to draft!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep(step)) {
      try {
        const payload = {
          ...formData,
          rollNumber: formData.id,
          departmentId: deptMapping[formData.department] || 'CS',
          year: parseInt(formData.year.split(' ')[0]) || 1, // '1st Year' -> 1
          semester: parseInt(formData.semester),
          guardian: formData.guardianName, // Map 'guardianName' to 'guardian'
          status: formData.status || 'active'
        };

        const url = editStudent 
          ? `http://localhost:5000/api/students/${encodeURIComponent(editStudent.rollNumber)}`
          : 'http://localhost:5000/api/students';
        
        const method = editStudent ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to enroll student');
          } else {
            const errorText = await res.text();
            console.error('Server returned non-JSON error:', errorText);
            throw new Error('Server error (check console)');
          }
        }

        if (!editStudent) {
          localStorage.removeItem('add_student_draft');
          alert('Student Enrollment Submitted Successfully!');
        } else {
          alert('Student Information Updated Successfully!');
        }
        if (onSuccess) onSuccess(); // Notify parent to refresh list
        onClose();
        
        // Reset after closing
        setTimeout(() => { 
          setStep(1); 
          setFormData(initialData); 
          setAvatarPreview(null); 
        }, 300);
      } catch (err) {
        console.error('Enrollment error:', err);
        alert(`Error: ${err.message}`);
      }
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

  const inputClasses = (error) => `w-full px-4 py-2.5 bg-white border ${error ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-[#1162d4] focus:ring-[#1162d4]/10'} rounded-lg outline-none transition-all text-sm text-slate-700`;
  const labelClasses = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editStudent ? "Edit Student Details" : "Enroll New Student"}
      icon={editStudent ? "edit" : "person_add"}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={handleSaveDraft}
            className="px-4 py-2 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            SAVE AS DRAFT
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600">Cancel</button>
            {step > 1 && (
              <button 
                onClick={() => setStep(s => s - 1)}
                className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Previous
              </button>
            )}
            {step < 5 ? (
              <button 
                onClick={handleNext}
                className="px-6 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-colors shadow-sm"
              >
                Continue
              </button>
            ) : (
              <button 
                 onClick={handleSubmit}
                 className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                {editStudent ? "Update Information" : "Complete Enrollment"}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step === s.id ? 'bg-[#1162d4] text-white ring-4 ring-[#1162d4]/10' : 
                  step > s.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s.id ? <span className="material-symbols-outlined text-sm">check</span> : s.id}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step === s.id ? 'text-[#1162d4]' : 'text-slate-400'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 -mt-6 transition-all duration-500 ${step > s.id ? 'bg-emerald-500' : 'bg-slate-100'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <div className="min-h-[400px]">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="w-32 h-40 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-[#1162d4] hover:bg-blue-50/30 transition-all shadow-inner"
                  onClick={() => fileInputRef.current.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">add_a_photo</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Profile Photo</p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                    <span className="text-white text-[10px] font-bold">CHANGE</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClasses}>Full Name *</label>
                  <input name="name" value={formData.name} onChange={handleChange} className={inputClasses(errors.name)} placeholder="e.g. John Doe" />
                  {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{errors.name}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Date of Birth *</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClasses(errors.dob)} />
                </div>
                <div>
                  <label className={labelClasses}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={inputClasses()}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses(errors.email)} placeholder="example@mit.edu" />
                  {errors.email && <p className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{errors.email}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className={inputClasses()} placeholder="+91 00000 00000" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className={labelClasses}>Student ID (Auto)</label>
                <input name="id" value={formData.id} readOnly className={`${inputClasses()} bg-slate-50 font-mono text-[#1162d4] font-semibold border-dashed`} />
              </div>
              <div>
                <label className={labelClasses}>Department</label>
                <select name="department" value={formData.department} onChange={handleChange} className={inputClasses()}>
                  {['Computer Science', 'Mechanical Eng.', 'Electrical Eng.', 'Civil Engineering'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Academic Year</label>
                <select name="year" value={formData.year} onChange={handleChange} className={inputClasses()}>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Semester</label>
                <select name="semester" value={formData.semester} onChange={handleChange} className={inputClasses()}>
                  {getSemOptions().map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4">
              <div className="md:col-span-2">
                <label className={labelClasses}>Guardian Full Name *</label>
                <input name="guardianName" value={formData.guardianName} onChange={handleChange} className={inputClasses(errors.guardianName)} placeholder="Parent/Guardian Name" />
              </div>
              <div>
                <label className={labelClasses}>Relationship</label>
                <select name="relationship" value={formData.relationship} onChange={handleChange} className={inputClasses()}>
                  {['Father', 'Mother', 'Legal Guardian', 'Relative'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Guardian Phone *</label>
                <input name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className={inputClasses(errors.guardianPhone)} placeholder="+91 00000 00000" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4">
              {[
                { label: '10th Marksheet', field: 'marksheet10' },
                { label: '12th Marksheet', field: 'marksheet12' },
                { label: 'Aadhar Card', field: 'aadhar' },
                { label: 'Passport Photo', field: 'photo' },
              ].map((doc) => (
                <div key={doc.field} className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${formData.docs[doc.field] ? 'border-emerald-200 bg-emerald-50/30' : errors[doc.field] ? 'border-red-200 bg-red-50/30' : 'border-slate-200 hover:border-[#1162d4]/50 hover:bg-slate-50'} group`}>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, doc.field)} />
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.docs[doc.field] ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <span className="material-symbols-outlined text-lg">{formData.docs[doc.field] ? 'check_circle' : 'upload_file'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{doc.label} *</p>
                      <p className="text-[10px] text-slate-400 truncate">{formData.docs[doc.field] ? formData.docs[doc.field].name : 'Click to upload'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-[#1162d4]/5 border border-[#1162d4]/10 rounded-xl p-6 flex items-center gap-6">
                <div className="w-20 h-20 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                  <img src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.name}&background=1162d4&color=fff`} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{formData.name || 'Student Name'}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">badge</span> {formData.id}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">domain</span> {formData.department}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Info</p>
                  <p className="text-sm font-semibold text-slate-700">{formData.email}</p>
                  <p className="text-sm text-slate-600">{formData.dob} • {formData.gender}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guardian Info</p>
                  <p className="text-sm font-semibold text-slate-700">{formData.guardianName} ({formData.relationship})</p>
                  <p className="text-sm text-slate-600">{formData.guardianPhone}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
