import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import AddMemberModal from '../components/AddMemberModal';
import AdmissionTable from '../components/AdmissionTable';
import AdmissionDetailsModal from '../components/AdmissionDetailsModal';
import { useAdmission } from '../context/AdmissionContext';

export default function AdmissionPage() {
  const { studentApps, facultyApps, addStudentApp, addFacultyApp, deleteStudentApp, deleteFacultyApp, updateStudentStatus, updateFacultyStatus, approvedStudents } = useAdmission();
  const [showStudent, setShowStudent] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [details, setDetails] = useState({ isOpen: false, type: null, entry: null });
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    { icon: 'group', label: 'Total Student Adm', value: studentApps.length },
    { icon: 'person', label: 'Total Faculty Adm', value: facultyApps.length },
    { icon: 'check_circle', label: 'Approved Students', value: approvedStudents.length + facultyApps.filter(a => a.status === 'Approved').length },
    { icon: 'cancel', label: 'Rejected', value: studentApps.filter(a => a.status === 'Rejected').length + facultyApps.filter(a => a.status === 'Rejected').length },
  ];

  const sanitizeAdmissionEntry = (data) => {
    // Keep only primitive values that can be persisted in localStorage.
    const {
      id,
      name,
      email,
      phone,
      course,
      courseCategory,
      department,
      role,
      status,
      payment,
    } = data;

    return {
      id,
      name,
      email,
      phone,
      course,
      courseCategory,
      department,
      role,
      status,
      payment,
    };
  };

  const handleAddSuccess = (app) => {
    if (app.type === 'student') {
      addStudentApp(app.data);
    } else {
      addFacultyApp(app.data);
    }
  };

  const handleView = (entry) => {
    setDetails({ isOpen: true, type: showStudent ? 'student' : 'faculty', entry });
  };

  const closeDetails = () => {
    setDetails({ isOpen: false, type: null, entry: null });
  };

  return (
    <Layout title="Admission">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[#2563EB]" style={{ fontFamily: 'Inter, sans-serif' }}>EduCore Admin Portal</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>notifications</span>
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
          </button>
          <div className="w-9 h-9 rounded-lg bg-[#E0E7FF] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#2563EB]" style={{ fontSize: '18px' }}>person</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#EEF2FF] rounded-xl p-4" style={{ width: '280px', height: '70px', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', borderRadius: '12px', padding: '16px' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold" style={{ fontSize: '22px', fontWeight: '600' }}>{studentApps.length}</p>
              <p className="text-xs" style={{ fontSize: '13px', color: '#6B7280' }}>Total Students</p>
            </div>
            <span className="material-symbols-outlined text-[#2563EB] opacity-20" style={{ fontSize: '24px' }}>group</span>
          </div>
        </div>
        <div className="bg-[#ECFDF5] rounded-xl p-4" style={{ width: '280px', height: '70px', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', borderRadius: '12px', padding: '16px' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold" style={{ fontSize: '22px', fontWeight: '600' }}>{facultyApps.length}</p>
              <p className="text-xs" style={{ fontSize: '13px', color: '#6B7280' }}>Total Faculty</p>
            </div>
            <span className="material-symbols-outlined text-[#16A34A] opacity-20" style={{ fontSize: '24px' }}>person</span>
          </div>
        </div>
        <div className="bg-[#FFF7ED] rounded-xl p-4" style={{ width: '280px', height: '70px', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', borderRadius: '12px', padding: '16px' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold" style={{ fontSize: '22px', fontWeight: '600' }}>{approvedStudents.length + facultyApps.filter(a => a.status === 'Approved').length}</p>
              <p className="text-xs" style={{ fontSize: '13px', color: '#6B7280' }}>Approved</p>
            </div>
            <span className="material-symbols-outlined text-[#EA580C] opacity-20" style={{ fontSize: '24px' }}>check_circle</span>
          </div>
        </div>
        <div className="bg-[#FEE2E2] rounded-xl p-4" style={{ width: '280px', height: '70px', boxShadow: '0 6px 16px rgba(0,0,0,0.06)', borderRadius: '12px', padding: '16px' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold" style={{ fontSize: '22px', fontWeight: '600' }}>{studentApps.filter(a => a.status === 'Rejected').length + facultyApps.filter(a => a.status === 'Rejected').length}</p>
              <p className="text-xs" style={{ fontSize: '13px', color: '#6B7280' }}>Rejected</p>
            </div>
            <span className="material-symbols-outlined text-[#DC2626] opacity-20" style={{ fontSize: '24px' }}>cancel</span>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex items-center justify-between mb-6">
        {/* Tabs */}
        <div className="inline-flex bg-[#F3F4F6] rounded-xl p-1" style={{ borderRadius: '10px', padding: '4px' }}>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              showStudent 
                ? 'bg-white text-[#2563EB] shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ padding: '8px 16px', fontSize: '14px' }}
            onClick={() => setShowStudent(true)}
          >
            Students
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              !showStudent 
                ? 'bg-white text-[#2563EB] shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ padding: '8px 16px', fontSize: '14px' }}
            onClick={() => setShowStudent(false)}
          >
            Staff
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              style={{ width: '260px', height: '38px', borderRadius: '8px', padding: '10px 14px 10px 42px', fontSize: '14px' }}
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ fontSize: '18px' }}>search</span>
          </div>
          <button
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            style={{ width: '38px', height: '38px', borderRadius: '8px' }}
            onClick={() => setIsModalOpen(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
          </button>
        </div>
      </div>

      <AdmissionTable
        type={showStudent ? 'student' : 'faculty'}
        entries={showStudent ? studentApps : facultyApps}
        onView={handleView}
        onDelete={(id) => {
          if (showStudent) deleteStudentApp(id);
          else deleteFacultyApp(id);
        }}
        onChangeStatus={(id, status) => {
          if (showStudent) updateStudentStatus(id, status);
          else updateFacultyStatus(id, status);
        }}
      />

      <AdmissionDetailsModal
        isOpen={details.isOpen}
        type={details.type}
        entry={details.entry}
        onClose={closeDetails}
      />

      <AddMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </Layout>
  );
}
