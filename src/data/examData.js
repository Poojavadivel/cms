// Exam Module Data Management
// All data stored in localStorage for persistence

const STORAGE_KEYS = {
  EXAMS: 'cms_exams',
  REGISTRATIONS: 'cms_exam_registrations',
  MARKS: 'cms_exam_marks',
  INVIGILATION: 'cms_invigilation',
  REVALUATION: 'cms_revaluation_requests',
  HALL_TICKETS: 'cms_hall_tickets',
  EXAM_HALLS: 'cms_exam_halls',
  SEAT_ASSIGNMENTS: 'cms_seat_assignments',
  INTERNAL_MARKS: 'cms_internal_marks',
  ATTENDANCE: 'cms_exam_attendance',
  TIMETABLE_DRAFTS: 'cms_timetable_drafts',
  EXAM_SESSIONS: 'cms_exam_sessions',
  NOTIFICATIONS: 'cms_exam_notifications',
  MARKS_LOCKED: 'cms_marks_locked'
};

// Initial mock data
const initialExams = [
  {
    id: 1,
    code: 'CS401',
    name: 'Data Structures',
    subject: 'Computer Science',
    date: '2024-03-25',
    time: '10:00',
    room: 'Hall A',
    type: 'Mid-Sem',
    status: 'Upcoming',
    duration: '120',
    maxMarks: '100',
    department: 'Computer Science',
    semester: '4',
    year: '2nd Year',
    resultsPublished: false,
    registrationOpen: true,
    createdBy: 'ADM-0001'
  },
  {
    id: 2,
    code: 'MA405',
    name: 'Discrete Mathematics',
    subject: 'Mathematics',
    date: '2024-03-27',
    time: '09:00',
    room: 'Hall B',
    type: 'Mid-Sem',
    status: 'Upcoming',
    duration: '120',
    maxMarks: '100',
    department: 'Computer Science',
    semester: '4',
    year: '2nd Year',
    resultsPublished: false,
    registrationOpen: true,
    createdBy: 'ADM-0001'
  },
  {
    id: 3,
    code: 'CS403',
    name: 'Database Systems',
    subject: 'Computer Science',
    date: '2024-03-15',
    time: '11:00',
    room: 'Lab 2',
    type: 'Practical',
    status: 'Completed',
    duration: '180',
    maxMarks: '50',
    department: 'Computer Science',
    semester: '4',
    year: '2nd Year',
    resultsPublished: true,
    registrationOpen: false,
    createdBy: 'ADM-0001'
  }
];

const initialMarks = [
  { id: 1, examId: 3, studentId: 'STU-2024-1547', marks: 42, grade: 'A', enteredBy: 'FAC-204', enteredAt: '2024-03-16T10:30:00' },
  { id: 2, examId: 3, studentId: 'STU-2024-1548', marks: 38, grade: 'B+', enteredBy: 'FAC-204', enteredAt: '2024-03-16T10:35:00' },
  { id: 3, examId: 3, studentId: 'STU-2024-1549', marks: 45, grade: 'A+', enteredBy: 'FAC-204', enteredAt: '2024-03-16T10:40:00' }
];

const initialInvigilation = [
  { id: 1, examId: 1, facultyId: 'FAC-204', facultyName: 'Dr. Rajesh Iyer', assignedBy: 'ADM-0001', assignedAt: '2024-03-10T09:00:00' },
  { id: 2, examId: 2, facultyId: 'FAC-204', facultyName: 'Dr. Rajesh Iyer', assignedBy: 'ADM-0001', assignedAt: '2024-03-10T09:05:00' },
  { id: 3, examId: 1, facultyId: 'FAC-205', facultyName: 'Prof. Anita Sharma', assignedBy: 'ADM-0001', assignedAt: '2024-03-10T09:10:00' }
];

const initialRegistrations = [
  { id: 1, examId: 1, studentId: 'STU-2024-1547', studentName: 'John Anderson', registeredAt: '2024-03-12T08:00:00', status: 'Registered' },
  { id: 2, examId: 2, studentId: 'STU-2024-1547', studentName: 'John Anderson', registeredAt: '2024-03-12T08:05:00', status: 'Registered' },
  { id: 3, examId: 3, studentId: 'STU-2024-1547', studentName: 'John Anderson', registeredAt: '2024-03-10T10:00:00', status: 'Completed' }
];

// Initialize data if not exists
export function initializeExamData() {
  if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(initialExams));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MARKS)) {
    localStorage.setItem(STORAGE_KEYS.MARKS, JSON.stringify(initialMarks));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVIGILATION)) {
    localStorage.setItem(STORAGE_KEYS.INVIGILATION, JSON.stringify(initialInvigilation));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(initialRegistrations));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVALUATION)) {
    localStorage.setItem(STORAGE_KEYS.REVALUATION, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HALL_TICKETS)) {
    localStorage.setItem(STORAGE_KEYS.HALL_TICKETS, JSON.stringify([]));
  }
  // New storages for extended features
  if (!localStorage.getItem(STORAGE_KEYS.EXAM_HALLS)) {
    localStorage.setItem(STORAGE_KEYS.EXAM_HALLS, JSON.stringify([
      { id: 1, name: 'Hall A', capacity: 100, building: 'Main Block' },
      { id: 2, name: 'Hall B', capacity: 80, building: 'Main Block' },
      { id: 3, name: 'Lab 1', capacity: 40, building: 'CS Block' },
      { id: 4, name: 'Lab 2', capacity: 40, building: 'CS Block' },
      { id: 5, name: 'Room 101', capacity: 60, building: 'Admin Block' }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SEAT_ASSIGNMENTS)) {
    localStorage.setItem(STORAGE_KEYS.SEAT_ASSIGNMENTS, JSON.stringify([
      { id: 1, examId: 1, studentId: 'STU-2024-1547', seatNumber: 'A-15', hallName: 'Hall A' },
      { id: 2, examId: 2, studentId: 'STU-2024-1547', seatNumber: 'B-22', hallName: 'Hall B' }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INTERNAL_MARKS)) {
    localStorage.setItem(STORAGE_KEYS.INTERNAL_MARKS, JSON.stringify([
      { id: 1, examId: 1, studentId: 'STU-2024-1547', internalMarks: 18, maxInternal: 20, enteredBy: 'FAC-204' },
      { id: 2, examId: 2, studentId: 'STU-2024-1547', internalMarks: 16, maxInternal: 20, enteredBy: 'FAC-204' }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TIMETABLE_DRAFTS)) {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_DRAFTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS)) {
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify([
      { id: 1, name: 'Mid-Term 2024', type: 'Midterm', semester: '4', startDate: '2024-03-25', endDate: '2024-04-05', status: 'Active' },
      { id: 2, name: 'End Semester 2024', type: 'End Semester', semester: '4', startDate: '2024-05-10', endDate: '2024-05-25', status: 'Upcoming' }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([
      { id: 1, studentId: 'STU-2024-1547', message: 'Exam registration open for CS401', type: 'info', read: false, createdAt: '2024-03-12T08:00:00' },
      { id: 2, studentId: 'STU-2024-1547', message: 'Hall ticket available for CS401', type: 'success', read: false, createdAt: '2024-03-20T10:00:00' }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MARKS_LOCKED)) {
    localStorage.setItem(STORAGE_KEYS.MARKS_LOCKED, JSON.stringify([]));
  }
}

// Exam CRUD operations
export function getAllExams() {
  const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
  return data ? JSON.parse(data) : [];
}

export function getExamById(examId) {
  const exams = getAllExams();
  return exams.find(e => e.id === examId);
}

export function addExam(exam) {
  const exams = getAllExams();
  const newExam = {
    ...exam,
    id: Math.max(...exams.map(e => e.id), 0) + 1,
    createdAt: new Date().toISOString()
  };
  exams.push(newExam);
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  return newExam;
}

export function updateExam(examId, updates) {
  const exams = getAllExams();
  const index = exams.findIndex(e => e.id === examId);
  if (index !== -1) {
    exams[index] = { ...exams[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    return exams[index];
  }
  return null;
}

export function deleteExam(examId) {
  const exams = getAllExams();
  const filtered = exams.filter(e => e.id !== examId);
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(filtered));
  
  // Also delete related data
  deleteExamRegistrations(examId);
  deleteExamMarks(examId);
  deleteExamInvigilation(examId);
}

// Registration operations
export function getAllRegistrations() {
  const data = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
  return data ? JSON.parse(data) : [];
}

export function getRegistrationsByExam(examId) {
  const registrations = getAllRegistrations();
  return registrations.filter(r => r.examId === examId);
}

export function getRegistrationsByStudent(studentId) {
  const registrations = getAllRegistrations();
  return registrations.filter(r => r.studentId === studentId);
}

export function registerForExam(examId, studentId, studentName) {
  const registrations = getAllRegistrations();
  
  // Check if already registered
  const existing = registrations.find(r => r.examId === examId && r.studentId === studentId);
  if (existing) {
    return { success: false, message: 'Already registered for this exam' };
  }
  
  const newReg = {
    id: Math.max(...registrations.map(r => r.id), 0) + 1,
    examId,
    studentId,
    studentName,
    registeredAt: new Date().toISOString(),
    status: 'Registered'
  };
  
  registrations.push(newReg);
  localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
  return { success: true, registration: newReg };
}

export function deleteExamRegistrations(examId) {
  const registrations = getAllRegistrations();
  const filtered = registrations.filter(r => r.examId !== examId);
  localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(filtered));
}

// Marks operations
export function getAllMarks() {
  const data = localStorage.getItem(STORAGE_KEYS.MARKS);
  return data ? JSON.parse(data) : [];
}

export function getMarksByExam(examId) {
  const marks = getAllMarks();
  return marks.filter(m => m.examId === examId);
}

export function getMarksByStudent(studentId) {
  const marks = getAllMarks();
  return marks.filter(m => m.studentId === studentId);
}

export function addOrUpdateMarks(examId, studentId, marksValue, grade, enteredBy) {
  const allMarks = getAllMarks();
  const existing = allMarks.find(m => m.examId === examId && m.studentId === studentId);
  
  if (existing) {
    // Update
    existing.marks = marksValue;
    existing.grade = grade;
    existing.enteredBy = enteredBy;
    existing.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.MARKS, JSON.stringify(allMarks));
    return existing;
  } else {
    // Add new
    const newMark = {
      id: Math.max(...allMarks.map(m => m.id), 0) + 1,
      examId,
      studentId,
      marks: marksValue,
      grade,
      enteredBy,
      enteredAt: new Date().toISOString()
    };
    allMarks.push(newMark);
    localStorage.setItem(STORAGE_KEYS.MARKS, JSON.stringify(allMarks));
    return newMark;
  }
}

export function deleteExamMarks(examId) {
  const marks = getAllMarks();
  const filtered = marks.filter(m => m.examId !== examId);
  localStorage.setItem(STORAGE_KEYS.MARKS, JSON.stringify(filtered));
}

// Invigilation operations
export function getAllInvigilation() {
  const data = localStorage.getItem(STORAGE_KEYS.INVIGILATION);
  return data ? JSON.parse(data) : [];
}

export function getInvigilationByExam(examId) {
  const invigilation = getAllInvigilation();
  return invigilation.filter(i => i.examId === examId);
}

export function getInvigilationByFaculty(facultyId) {
  const invigilation = getAllInvigilation();
  return invigilation.filter(i => i.facultyId === facultyId);
}

export function assignInvigilator(examId, facultyId, facultyName, assignedBy) {
  const invigilation = getAllInvigilation();
  
  // Check if already assigned
  const existing = invigilation.find(i => i.examId === examId && i.facultyId === facultyId);
  if (existing) {
    return { success: false, message: 'Faculty already assigned to this exam' };
  }
  
  const newAssignment = {
    id: Math.max(...invigilation.map(i => i.id), 0) + 1,
    examId,
    facultyId,
    facultyName,
    assignedBy,
    assignedAt: new Date().toISOString()
  };
  
  invigilation.push(newAssignment);
  localStorage.setItem(STORAGE_KEYS.INVIGILATION, JSON.stringify(invigilation));
  return { success: true, assignment: newAssignment };
}

export function removeInvigilator(assignmentId) {
  const invigilation = getAllInvigilation();
  const filtered = invigilation.filter(i => i.id !== assignmentId);
  localStorage.setItem(STORAGE_KEYS.INVIGILATION, JSON.stringify(filtered));
}

export function deleteExamInvigilation(examId) {
  const invigilation = getAllInvigilation();
  const filtered = invigilation.filter(i => i.examId !== examId);
  localStorage.setItem(STORAGE_KEYS.INVIGILATION, JSON.stringify(filtered));
}

// Revaluation operations
export function getAllRevaluations() {
  const data = localStorage.getItem(STORAGE_KEYS.REVALUATION);
  return data ? JSON.parse(data) : [];
}

export function getRevaluationsByStudent(studentId) {
  const revaluations = getAllRevaluations();
  return revaluations.filter(r => r.studentId === studentId);
}

export function applyForRevaluation(examId, studentId, studentName, reason) {
  const revaluations = getAllRevaluations();
  
  // Check if already applied
  const existing = revaluations.find(r => r.examId === examId && r.studentId === studentId);
  if (existing) {
    return { success: false, message: 'Already applied for revaluation' };
  }
  
  const newRequest = {
    id: Math.max(...revaluations.map(r => r.id), 0) + 1,
    examId,
    studentId,
    studentName,
    reason,
    status: 'Pending',
    appliedAt: new Date().toISOString()
  };
  
  revaluations.push(newRequest);
  localStorage.setItem(STORAGE_KEYS.REVALUATION, JSON.stringify(revaluations));
  return { success: true, request: newRequest };
}

export function updateRevaluationStatus(requestId, status, remarks) {
  const revaluations = getAllRevaluations();
  const request = revaluations.find(r => r.id === requestId);
  if (request) {
    request.status = status;
    request.remarks = remarks;
    request.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.REVALUATION, JSON.stringify(revaluations));
    return request;
  }
  return null;
}

// Utility functions
export function calculateGrade(marks, maxMarks) {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

export function isStudentRegistered(examId, studentId) {
  const registrations = getAllRegistrations();
  return registrations.some(r => r.examId === examId && r.studentId === studentId);
}

export function getExamStats() {
  const exams = getAllExams();
  const registrations = getAllRegistrations();
  const marks = getAllMarks();
  
  return {
    totalExams: exams.length,
    upcomingExams: exams.filter(e => e.status === 'Upcoming').length,
    completedExams: exams.filter(e => e.status === 'Completed').length,
    totalRegistrations: registrations.length,
    resultsPublished: exams.filter(e => e.resultsPublished).length,
    pendingResults: exams.filter(e => e.status === 'Completed' && !e.resultsPublished).length
  };
}

// ============ NEW EXTENDED FEATURES ============

// Exam Halls Management
export function getAllExamHalls() {
  const data = localStorage.getItem(STORAGE_KEYS.EXAM_HALLS);
  return data ? JSON.parse(data) : [];
}

export function addExamHall(hall) {
  const halls = getAllExamHalls();
  const newHall = {
    ...hall,
    id: Math.max(...halls.map(h => h.id), 0) + 1
  };
  halls.push(newHall);
  localStorage.setItem(STORAGE_KEYS.EXAM_HALLS, JSON.stringify(halls));
  return newHall;
}

// Seat Assignments
export function getAllSeatAssignments() {
  const data = localStorage.getItem(STORAGE_KEYS.SEAT_ASSIGNMENTS);
  return data ? JSON.parse(data) : [];
}

export function getSeatByExamAndStudent(examId, studentId) {
  const seats = getAllSeatAssignments();
  return seats.find(s => s.examId === examId && s.studentId === studentId);
}

export function assignSeat(examId, studentId, seatNumber, hallName) {
  const seats = getAllSeatAssignments();
  const existing = seats.find(s => s.examId === examId && s.studentId === studentId);
  
  if (existing) {
    existing.seatNumber = seatNumber;
    existing.hallName = hallName;
  } else {
    seats.push({
      id: Math.max(...seats.map(s => s.id), 0) + 1,
      examId,
      studentId,
      seatNumber,
      hallName
    });
  }
  
  localStorage.setItem(STORAGE_KEYS.SEAT_ASSIGNMENTS, JSON.stringify(seats));
  return { success: true };
}

export function autoAssignSeats(examId) {
  const registrations = getRegistrationsByExam(examId);
  const exam = getExamById(examId);
  if (!exam || !exam.room) return { success: false, message: 'Hall not assigned to exam' };
  
  const seats = getAllSeatAssignments();
  let seatNum = 1;
  
  registrations.forEach(reg => {
    const existing = seats.find(s => s.examId === examId && s.studentId === reg.studentId);
    if (!existing) {
      seats.push({
        id: Math.max(...seats.map(s => s.id), 0) + 1,
        examId,
        studentId: reg.studentId,
        seatNumber: `${exam.room.charAt(0)}-${seatNum}`,
        hallName: exam.room
      });
      seatNum++;
    }
  });
  
  localStorage.setItem(STORAGE_KEYS.SEAT_ASSIGNMENTS, JSON.stringify(seats));
  return { success: true, assigned: seatNum - 1 };
}

// Internal Marks
export function getAllInternalMarks() {
  const data = localStorage.getItem(STORAGE_KEYS.INTERNAL_MARKS);
  return data ? JSON.parse(data) : [];
}

export function getInternalMarksByExam(examId) {
  const marks = getAllInternalMarks();
  return marks.filter(m => m.examId === examId);
}

export function getInternalMarksByStudent(studentId) {
  const marks = getAllInternalMarks();
  return marks.filter(m => m.studentId === studentId);
}

export function addOrUpdateInternalMarks(examId, studentId, internalMarks, maxInternal, enteredBy) {
  const allMarks = getAllInternalMarks();
  const existing = allMarks.find(m => m.examId === examId && m.studentId === studentId);
  
  if (existing) {
    existing.internalMarks = internalMarks;
    existing.maxInternal = maxInternal;
    existing.enteredBy = enteredBy;
    existing.updatedAt = new Date().toISOString();
  } else {
    allMarks.push({
      id: Math.max(...allMarks.map(m => m.id), 0) + 1,
      examId,
      studentId,
      internalMarks,
      maxInternal,
      enteredBy,
      enteredAt: new Date().toISOString()
    });
  }
  
  localStorage.setItem(STORAGE_KEYS.INTERNAL_MARKS, JSON.stringify(allMarks));
  return { success: true };
}

// Attendance Management
export function getAllAttendance() {
  const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
  return data ? JSON.parse(data) : [];
}

export function getAttendanceByExam(examId) {
  const attendance = getAllAttendance();
  return attendance.filter(a => a.examId === examId);
}

export function markAttendance(examId, studentId, status, markedBy) {
  const attendance = getAllAttendance();
  const existing = attendance.find(a => a.examId === examId && a.studentId === studentId);
  
  if (existing) {
    existing.status = status;
    existing.markedBy = markedBy;
    existing.updatedAt = new Date().toISOString();
  } else {
    attendance.push({
      id: Math.max(...attendance.map(a => a.id), 0) + 1,
      examId,
      studentId,
      status, // 'Present', 'Absent', 'Late'
      markedBy,
      markedAt: new Date().toISOString()
    });
  }
  
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  return { success: true };
}

// Timetable Draft Management
export function getAllTimetableDrafts() {
  const data = localStorage.getItem(STORAGE_KEYS.TIMETABLE_DRAFTS);
  return data ? JSON.parse(data) : [];
}

export function createTimetableDraft(draft) {
  const drafts = getAllTimetableDrafts();
  const newDraft = {
    ...draft,
    id: Math.max(...drafts.map(d => d.id), 0) + 1,
    status: 'Draft', // Draft, Submitted, Approved, Rejected
    createdAt: new Date().toISOString()
  };
  drafts.push(newDraft);
  localStorage.setItem(STORAGE_KEYS.TIMETABLE_DRAFTS, JSON.stringify(drafts));
  return newDraft;
}

export function updateTimetableDraftStatus(draftId, status, reviewedBy, remarks) {
  const drafts = getAllTimetableDrafts();
  const draft = drafts.find(d => d.id === draftId);
  if (draft) {
    draft.status = status;
    draft.reviewedBy = reviewedBy;
    draft.remarks = remarks;
    draft.reviewedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_DRAFTS, JSON.stringify(drafts));
    return draft;
  }
  return null;
}

// Exam Sessions
export function getAllExamSessions() {
  const data = localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS);
  return data ? JSON.parse(data) : [];
}

export function addExamSession(session) {
  const sessions = getAllExamSessions();
  const newSession = {
    ...session,
    id: Math.max(...sessions.map(s => s.id), 0) + 1,
    createdAt: new Date().toISOString()
  };
  sessions.push(newSession);
  localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(sessions));
  return newSession;
}

export function updateExamSession(sessionId, updates) {
  const sessions = getAllExamSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(sessions));
    return sessions[index];
  }
  return null;
}

// Notifications
export function getAllNotifications() {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  return data ? JSON.parse(data) : [];
}

export function getNotificationsByStudent(studentId) {
  const notifications = getAllNotifications();
  return notifications.filter(n => n.studentId === studentId).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export function addNotification(studentId, message, type = 'info') {
  const notifications = getAllNotifications();
  const newNotif = {
    id: Math.max(...notifications.map(n => n.id), 0) + 1,
    studentId,
    message,
    type, // 'info', 'success', 'warning', 'error'
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(newNotif);
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  return newNotif;
}

export function markNotificationRead(notificationId) {
  const notifications = getAllNotifications();
  const notif = notifications.find(n => n.id === notificationId);
  if (notif) {
    notif.read = true;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }
}

export function markAllNotificationsRead(studentId) {
  const notifications = getAllNotifications();
  notifications.forEach(n => {
    if (n.studentId === studentId) {
      n.read = true;
    }
  });
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
}

// Marks Locking
export function isMarksLocked(examId) {
  const data = localStorage.getItem(STORAGE_KEYS.MARKS_LOCKED);
  const locked = data ? JSON.parse(data) : [];
  return locked.includes(examId);
}

export function lockMarks(examId, lockedBy) {
  const data = localStorage.getItem(STORAGE_KEYS.MARKS_LOCKED);
  const locked = data ? JSON.parse(data) : [];
  if (!locked.includes(examId)) {
    locked.push(examId);
    localStorage.setItem(STORAGE_KEYS.MARKS_LOCKED, JSON.stringify(locked));
    return { success: true, message: 'Marks locked successfully' };
  }
  return { success: false, message: 'Marks already locked' };
}

export function unlockMarks(examId) {
  const data = localStorage.getItem(STORAGE_KEYS.MARKS_LOCKED);
  const locked = data ? JSON.parse(data) : [];
  const filtered = locked.filter(id => id !== examId);
  localStorage.setItem(STORAGE_KEYS.MARKS_LOCKED, JSON.stringify(filtered));
  return { success: true };
}

// Advanced Statistics
export function getDetailedExamStatistics(examId) {
  const exam = getExamById(examId);
  const marks = getMarksByExam(examId);
  const registrations = getRegistrationsByExam(examId);
  const attendance = getAttendanceByExam(examId);
  
  if (marks.length === 0) {
    return {
      examName: exam.name,
      totalRegistered: registrations.length,
      totalEvaluated: 0,
      passCount: 0,
      failCount: 0,
      passPercentage: 0,
      averageMarks: 0,
      highestMarks: 0,
      lowestMarks: 0,
      gradeDistribution: {},
      toppers: [],
      absentCount: attendance.filter(a => a.status === 'Absent').length
    };
  }
  
  const passCount = marks.filter(m => m.grade !== 'F').length;
  const failCount = marks.filter(m => m.grade === 'F').length;
  const totalMarks = marks.reduce((sum, m) => sum + m.marks, 0);
  const average = totalMarks / marks.length;
  const highest = Math.max(...marks.map(m => m.marks));
  const lowest = Math.min(...marks.map(m => m.marks));
  
  const gradeDistribution = marks.reduce((acc, m) => {
    acc[m.grade] = (acc[m.grade] || 0) + 1;
    return acc;
  }, {});
  
  const toppers = marks
    .sort((a, b) => b.marks - a.marks)
    .slice(0, 3)
    .map(m => ({
      studentId: m.studentId,
      marks: m.marks,
      grade: m.grade
    }));
  
  return {
    examName: exam.name,
    totalRegistered: registrations.length,
    totalEvaluated: marks.length,
    passCount,
    failCount,
    passPercentage: ((passCount / marks.length) * 100).toFixed(2),
    averageMarks: average.toFixed(2),
    highestMarks: highest,
    lowestMarks: lowest,
    gradeDistribution,
    toppers,
    absentCount: attendance.filter(a => a.status === 'Absent').length
  };
}

export function getOverallSessionStatistics(sessionId) {
  const session = getAllExamSessions().find(s => s.id === sessionId);
  const allExams = getAllExams().filter(e => e.semester === session?.semester);
  const allMarks = getAllMarks().filter(m => 
    allExams.some(e => e.id === m.examId)
  );
  
  if (allMarks.length === 0) {
    return {
      sessionName: session?.name || 'Unknown',
      totalExams: allExams.length,
      totalStudentsEvaluated: 0,
      overallPassPercentage: 0,
      totalPassed: 0,
      totalFailed: 0
    };
  }
  
  const passedCount = allMarks.filter(m => m.grade !== 'F').length;
  const failedCount = allMarks.filter(m => m.grade === 'F').length;
  
  return {
    sessionName: session?.name || 'Unknown',
    totalExams: allExams.length,
    totalStudentsEvaluated: allMarks.length,
    overallPassPercentage: ((passedCount / allMarks.length) * 100).toFixed(2),
    totalPassed: passedCount,
    totalFailed: failedCount
  };
}

export function getFailedStudentsList(examId) {
  const marks = getMarksByExam(examId);
  return marks.filter(m => m.grade === 'F').map(m => ({
    studentId: m.studentId,
    marks: m.marks,
    grade: m.grade
  }));
}
