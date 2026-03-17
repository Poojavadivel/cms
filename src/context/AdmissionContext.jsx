import React, { createContext, useContext, useState, useEffect } from 'react';

const AdmissionContext = createContext();

export const useAdmission = () => {
  const context = useContext(AdmissionContext);
  if (!context) {
    throw new Error('useAdmission must be used within an AdmissionProvider');
  }
  return context;
};

export const AdmissionProvider = ({ children }) => {
  const [studentApps, setStudentApps] = useState(() => {
    try {
      const stored = localStorage.getItem('admissions_students');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [facultyApps, setFacultyApps] = useState(() => {
    try {
      const stored = localStorage.getItem('admissions_faculty');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [approvedStudents, setApprovedStudents] = useState(() => {
    try {
      const stored = localStorage.getItem('approved_students_for_fees');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('admissions_students', JSON.stringify(studentApps));
  }, [studentApps]);

  useEffect(() => {
    localStorage.setItem('admissions_faculty', JSON.stringify(facultyApps));
  }, [facultyApps]);

  useEffect(() => {
    localStorage.setItem('approved_students_for_fees', JSON.stringify(approvedStudents));
  }, [approvedStudents]);

  const addStudentApp = (app) => {
    const cleaned = sanitizeAdmissionEntry(app);
    setStudentApps(prev => [cleaned, ...prev]);
  };

  const addFacultyApp = (app) => {
    const cleaned = sanitizeAdmissionEntry(app);
    setFacultyApps(prev => [cleaned, ...prev]);
  };

  const deleteStudentApp = (id) => {
    setStudentApps(prev => prev.filter(e => e.id !== id));
  };

  const deleteFacultyApp = (id) => {
    setFacultyApps(prev => prev.filter(e => e.id !== id));
  };

  const updateStudentStatus = (id, status) => {
    if (status === 'Approved') {
      const student = studentApps.find(s => s.id === id);
      if (student && !approvedStudents.some(s => s.id === id)) {
        setApprovedStudents(prev => [...prev, { ...student, status: 'Approved' }]);
      }
    }
    setStudentApps(prev => prev.map(e => (e.id === id ? { ...e, status } : e)));
  };

  const updateFacultyStatus = (id, status) => {
    setFacultyApps(prev => prev.map(e => (e.id === id ? { ...e, status } : e)));
  };

  return (
    <AdmissionContext.Provider value={{
      studentApps,
      facultyApps,
      approvedStudents,
      addStudentApp,
      addFacultyApp,
      deleteStudentApp,
      deleteFacultyApp,
      updateStudentStatus,
      updateFacultyStatus,
    }}>
      {children}
    </AdmissionContext.Provider>
  );
};

// Helper to sanitize admission entries for storage
const sanitizeAdmissionEntry = (data) => {
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
