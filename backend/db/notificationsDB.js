/**
 * Notifications Database
 * Dummy data for cross-module notifications across all four roles:
 * Student, Faculty, Finance Manager, Admin
 */

// Priority levels
const PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

// Notification categories/modules
const CATEGORIES = {
  ACADEMIC: 'Academic',
  FINANCE: 'Finance',
  ADMINISTRATIVE: 'Administrative',
  SYSTEM: 'System',
  ALERTS: 'Alerts'
};

// Notification status
const STATUS = {
  UNREAD: 'unread',
  READ: 'read',
  ARCHIVED: 'archived'
};

// Roles
const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  FINANCE: 'finance',
  ADMIN: 'admin'
};

/**
 * Master notifications database with cross-role notifications
 * Structure:
 * - id: unique identifier
 * - title: notification title
 * - message: notification message
 * - senderRole: who sent the notification
 * - receiverRole: who receives the notification
 * - module: category/module
 * - priority: level of importance
 * - status: read/unread/archived
 * - createdAt: timestamp
 * - actionId: optional action ID for trigger events
 * - relatedData: optional data related to notification
 */

let notificationsDB = [
  // ==================== STUDENT NOTIFICATIONS ====================

  // Faculty → Student (Academic Module)
  {
    id: 1,
    title: 'Assignment Posted',
    message: 'Assignment 3: Data Structures uploaded for CS201',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T10:30:00Z',
    actionId: 'assignment_posted_1',
    relatedData: {
      courseId: 'CS201',
      courseName: 'Data Structures',
      dueDate: '2026-03-19',
      faculty: 'Dr. Rajesh Kumar'
    }
  },
  {
    id: 2,
    title: 'Assignment Deadline Reminder',
    message: 'Assignment 2 is due tomorrow. Submit now to avoid late submission penalty.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T15:00:00Z',
    actionId: 'deadline_reminder_1',
    relatedData: {
      courseId: 'CS201',
      courseName: 'Data Structures',
      dueDate: '2026-03-12T23:59:00Z'
    }
  },
  {
    id: 3,
    title: 'Internal Marks Released',
    message: 'Internal exam marks for CS201 have been released. Check your grades.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-10T11:20:00Z',
    actionId: 'marks_released_1',
    relatedData: {
      courseId: 'CS201',
      courseName: 'Data Structures',
      marks: 42,
      total: 50
    }
  },
  {
    id: 4,
    title: 'Class Cancellation',
    message: 'CS201 class scheduled for today (2:00 PM) is cancelled due to faculty emergency.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.HIGH,
    status: STATUS.READ,
    createdAt: '2026-03-12T09:00:00Z',
    actionId: 'class_cancelled_1',
    relatedData: {
      courseId: 'CS201',
      courseName: 'Data Structures',
      cancelledTime: '2026-03-12T14:00:00Z'
    }
  },
  {
    id: 5,
    title: 'Exam Schedule Released',
    message: 'Final exam schedule for odd semester has been released. Download from your dashboard.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-09T14:50:00Z',
    actionId: 'exam_schedule_1',
    relatedData: {
      semester: 'Odd 2025-26',
      examStartDate: '2026-05-01'
    }
  },
  {
    id: 6,
    title: 'Feedback on Submission',
    message: 'Faculty has provided detailed feedback on your project submission. Review it now.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T13:15:00Z',
    actionId: 'feedback_1',
    relatedData: {
      projectId: 'proj_1',
      faculty: 'Dr. Priya Singh'
    }
  },

  // Student → Faculty (Academic Module)
  {
    id: 7,
    title: 'Assignment Submitted',
    message: 'Student submitted Assignment 3 for CS201.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T11:45:00Z',
    actionId: 'assignment_submitted_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      courseId: 'CS201',
      assignment: 'Assignment 3'
    }
  },
  {
    id: 8,
    title: 'Doubt Request',
    message: 'Student requested clarification on topic: Linked Lists',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T16:30:00Z',
    actionId: 'doubt_request_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      topic: 'Linked Lists',
      courseId: 'CS201'
    }
  },
  {
    id: 9,
    title: 'Leave Request',
    message: 'Student has applied for 3-day leave starting 2026-03-20.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T09:20:00Z',
    actionId: 'leave_request_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      leaveStartDate: '2026-03-20',
      leaveDays: 3
    }
  },
  {
    id: 10,
    title: 'Project Submission',
    message: 'Student submitted final project for Data Structures course.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-10T14:20:00Z',
    actionId: 'project_submitted_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      projectTitle: 'Graph Algorithms Implementation'
    }
  },
  {
    id: 11,
    title: 'Re-evaluation Request',
    message: 'Student requested re-evaluation for CS201 exam.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T10:15:00Z',
    actionId: 'reevaluation_request_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      courseId: 'CS201',
      examMarks: 42
    }
  },

  // Admin → Student (Administrative Module)
  {
    id: 12,
    title: 'Semester Registration Open',
    message: 'Spring 2026 semester registration is now open. Complete it before 2026-03-30.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T08:00:00Z',
    actionId: 'sem_registration_open_1',
    relatedData: {
      semester: 'Spring 2026',
      deadline: '2026-03-30'
    }
  },
  {
    id: 13,
    title: 'ID Card Update',
    message: 'Your new ID card is ready for collection from the main office.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T17:40:00Z',
    actionId: 'idcard_update_1',
    relatedData: {
      cardNumber: 'MIT001234',
      validityDate: '2029-03-31'
    }
  },
  {
    id: 14,
    title: 'Holiday Announcement',
    message: 'Campus will be closed on 2026-03-15 for Independence Day celebrations.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-09T10:20:00Z',
    actionId: 'holiday_announce_1',
    relatedData: {
      holiday: 'Independence Day',
      date: '2026-03-15'
    }
  },
  {
    id: 15,
    title: 'Exam Timetable Released',
    message: 'Final exam timetable for odd semester is now available. Check your schedule.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-08T15:30:00Z',
    actionId: 'exam_timetable_1',
    relatedData: {
      semester: 'Odd 2025-26',
      examStartDate: '2026-05-01'
    }
  },
  {
    id: 16,
    title: 'Placement Campaign Alert',
    message: 'Tech Corp is recruiting! Register before 2026-03-18 for campus interview.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T12:00:00Z',
    actionId: 'placement_alert_1',
    relatedData: {
      company: 'Tech Corp',
      registration_deadline: '2026-03-18',
      interview_date: '2026-03-25'
    }
  },
  {
    id: 17,
    title: 'Hostel Announcement',
    message: 'Hostel maintenance will be done from 2026-03-18 to 2026-03-22. Plan accordingly.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-10T13:45:00Z',
    actionId: 'hostel_announce_1',
    relatedData: {
      maintenanceStart: '2026-03-18',
      maintenanceEnd: '2026-03-22',
      hostel: 'All Hostels'
    }
  },
  {
    id: 18,
    title: 'Disciplinary Warning',
    message: 'Your recent behavior during college hours requires disciplinary action. Contact Dean of Students.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.CRITICAL,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T14:20:00Z',
    actionId: 'disciplinary_warning_1',
    relatedData: {
      reason: 'Violation of academic code of conduct',
      deanOffice: 'Room 201, Main Building'
    }
  },

  // Student → Admin (Administrative Module)
  {
    id: 19,
    title: 'Leave Application',
    message: 'Student submitted leave application for 5 days starting 2026-04-10.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T10:50:00Z',
    actionId: 'leave_application_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      leaveStartDate: '2026-04-10',
      leaveEndDate: '2026-04-15',
      reason: 'Family emergency'
    }
  },
  {
    id: 20,
    title: 'Certificate Request',
    message: 'Student requested official graduation certificate.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T11:30:00Z',
    actionId: 'cert_request_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      certificateType: 'Graduation Certificate'
    }
  },
  {
    id: 21,
    title: 'Grievance Submission',
    message: 'Student has filed an academic grievance regarding exam marking.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-10T13:15:00Z',
    actionId: 'grievance_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      grievanceType: 'Academic',
      subject: 'Marking discrepancy in CS201 exam'
    }
  },
  {
    id: 22,
    title: 'Hostel Request',
    message: 'Student requested hostel accommodation for the next academic year.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-09T15:45:00Z',
    actionId: 'hostel_request_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      hostelPreference: 'Boys Hostel - Block A'
    }
  },
  {
    id: 23,
    title: 'Profile Update Request',
    message: 'Student requested update to their contact information and emergency contact.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.LOW,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T09:30:00Z',
    actionId: 'profile_update_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      updateFields: ['phone', 'emergency_contact']
    }
  },

  // Finance → Student (Finance Module)
  {
    id: 24,
    title: 'Fee Payment Reminder',
    message: 'Your spring semester fees of ₹85,000 are due by 2026-03-25. Pay now to avoid penalty.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T07:30:00Z',
    actionId: 'fee_reminder_1',
    relatedData: {
      amount: 85000,
      currency: 'INR',
      dueDate: '2026-03-25',
      semesterCode: 'SP2026'
    }
  },
  {
    id: 25,
    title: 'Late Fee Warning',
    message: 'Your fee payment is overdue by 10 days. Late fee of ₹2,550 will be added from tomorrow.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.CRITICAL,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T14:00:00Z',
    actionId: 'late_fee_warning_1',
    relatedData: {
      originalAmount: 85000,
      lateFee: 2550,
      dueDate: '2026-03-25',
      warningDate: '2026-03-12'
    }
  },
  {
    id: 26,
    title: 'Scholarship Approval',
    message: 'Congratulations! Your merit scholarship of ₹10,000 has been approved.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-10T10:20:00Z',
    actionId: 'scholarship_approval_1',
    relatedData: {
      scholarshipAmount: 10000,
      scholarshipType: 'Merit',
      validFrom: '2026-03-01',
      validTo: '2026-12-31'
    }
  },
  {
    id: 27,
    title: 'Refund Processed',
    message: 'Your refund of ₹5,000 (for course withdrawal) has been processed. Check your account within 5 working days.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-09T16:15:00Z',
    actionId: 'refund_processed_1',
    relatedData: {
      refundAmount: 5000,
      reason: 'Course withdrawal',
      processedDate: '2026-03-09',
      expectedInAccountBy: '2026-03-14'
    }
  },
  {
    id: 28,
    title: 'Payment Confirmation',
    message: 'Your payment of ₹42,500 for spring semester has been successfully processed. Receipt sent to your email.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.STUDENT,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-08T11:45:00Z',
    actionId: 'payment_confirmation_1',
    relatedData: {
      amount: 42500,
      transactionId: 'TXN123456',
      paymentDate: '2026-03-08',
      receiptSent: true
    }
  },

  // Student → Finance (Finance Module)
  {
    id: 29,
    title: 'Fee Payment Submitted',
    message: 'Student has submitted payment of ₹42,500 for spring semester.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.FINANCE,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-08T10:30:00Z',
    actionId: 'payment_submitted_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      amount: 42500,
      transactionId: 'TXN123456'
    }
  },
  {
    id: 30,
    title: 'Scholarship Application',
    message: 'Student applied for merit scholarship for 2026 academic year.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.FINANCE,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-10T13:20:00Z',
    actionId: 'scholarship_app_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      scholarshipType: 'Merit',
      cgpa: 3.8
    }
  },
  {
    id: 31,
    title: 'Refund Request',
    message: 'Student requested refund for dropped course EC302.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.FINANCE,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: UNREAD,
    createdAt: '2026-03-09T14:50:00Z',
    actionId: 'refund_request_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      courseCode: 'EC302',
      refundAmount: 5000
    }
  },
  {
    id: 32,
    title: 'Payment Issue Report',
    message: 'Student reported that payment confirmation was not received despite successful transaction.',
    senderRole: ROLES.STUDENT,
    receiverRole: ROLES.FINANCE,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T15:30:00Z',
    actionId: 'payment_issue_1',
    relatedData: {
      studentId: 'STU001',
      studentName: 'Arjun Patel',
      transactionId: 'TXN123456',
      issue: 'Missing confirmation email'
    }
  },

  // ==================== FACULTY NOTIFICATIONS ====================

  // Admin → Faculty (Institution Module)
  {
    id: 33,
    title: 'Faculty Meeting Scheduled',
    message: 'Department meeting scheduled for 2026-03-15 at 2:00 PM in Conference Room A. Attendance mandatory.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T08:45:00Z',
    actionId: 'faculty_meeting_1',
    relatedData: {
      meetingDate: '2026-03-15',
      meetingTime: '14:00',
      location: 'Conference Room A',
      agenda: 'Curriculum updates and student grievances'
    }
  },
  {
    id: 34,
    title: 'New Policy Update',
    message: 'New attendance policy effective from 2026-04-01. Review the updated guidelines.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T12:30:00Z',
    actionId: 'policy_update_1',
    relatedData: {
      policyName: 'Attendance Policy',
      effectiveDate: '2026-04-01',
      documentUrl: '/policies/attendance-2026.pdf'
    }
  },
  {
    id: 35,
    title: 'Department Event Announcement',
    message: 'Tech fest 2026 will be held on 2026-04-20. Call for papers and event proposals open.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-09T10:15:00Z',
    actionId: 'event_announce_1',
    relatedData: {
      eventName: 'Tech Fest 2026',
      eventDate: '2026-04-20',
      proposalDeadline: '2026-03-25'
    }
  },
  {
    id: 36,
    title: 'Course Allocation',
    message: 'You have been allocated to teach EC401 (Advanced Electronics) in summer semester.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-10T14:40:00Z',
    actionId: 'course_allocation_1',
    relatedData: {
      courseCode: 'EC401',
      courseName: 'Advanced Electronics',
      semester: 'Summer 2026',
      students: 45
    }
  },
  {
    id: 37,
    title: 'Academic Calendar Update',
    message: 'Academic calendar for 2026-27 is now available. Check important dates and deadlines.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-08T09:20:00Z',
    actionId: 'calendar_update_1',
    relatedData: {
      year: '2026-27',
      semesterStart: '2026-07-15',
      semesterEnd: '2026-11-30'
    }
  },

  // Faculty → Admin (Institution Module)
  {
    id: 38,
    title: 'Faculty Leave Request',
    message: 'Faculty requested leave for 7 days starting 2026-04-15 for medical purposes.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T11:20:00Z',
    actionId: 'faculty_leave_1',
    relatedData: {
      facultyName: 'Dr. Rajesh Kumar',
      leaveStartDate: '2026-04-15',
      leaveEndDate: '2026-04-22',
      leaveType: 'Medical',
      replacement: 'Dr. Priya Singh'
    }
  },
  {
    id: 39,
    title: 'Grade Submission',
    message: 'Faculty submitted grades for CS201 mid-term exam.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T16:00:00Z',
    actionId: 'grade_submission_1',
    relatedData: {
      facultyName: 'Dr. Rajesh Kumar',
      courseCode: 'CS201',
      studentsGraded: 68,
      submissionDate: '2026-03-11'
    }
  },
  {
    id: 40,
    title: 'Course Completion Report',
    message: 'Faculty submitted course completion report for EC301.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.ACADEMIC,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-10T15:30:00Z',
    actionId: 'course_report_1',
    relatedData: {
      facultyName: 'Dr. Rajesh Kumar',
      courseCode: 'EC301',
      courseName: 'Digital Electronics',
      completionPercent: 95
    }
  },
  {
    id: 41,
    title: 'Event Proposal Submitted',
    message: 'Faculty proposed "Machine Learning Workshop" for tech fest.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-09T13:45:00Z',
    actionId: 'event_proposal_1',
    relatedData: {
      eventName: 'Machine Learning Workshop',
      eventDate: '2026-04-20',
      expectedParticipants: 150
    }
  },
  {
    id: 42,
    title: 'Research Approval Request',
    message: 'Faculty requested approval for research project on AI applications.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.ADMINISTRATIVE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-08T10:15:00Z',
    actionId: 'research_approval_1',
    relatedData: {
      facultyName: 'Dr. Rajesh Kumar',
      projectTitle: 'AI Applications in Healthcare',
      budget: 150000
    }
  },

  // Finance → Faculty (Finance Module)
  {
    id: 43,
    title: 'Salary Credited',
    message: 'Your March 2026 salary of ₹75,000 has been credited to your account.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-01T05:30:00Z',
    actionId: 'salary_credited_1',
    relatedData: {
      month: 'March 2026',
      amount: 75000,
      creditDate: '2026-03-01'
    }
  },
  {
    id: 44,
    title: 'Tax Documents Available',
    message: 'Your Form 16 for FY 2025-26 is now available in the portal.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-10T14:20:00Z',
    actionId: 'tax_doc_1',
    relatedData: {
      fiscalYear: '2025-26',
      document: 'Form 16',
      downloadUrl: '/documents/form16-2025-26.pdf'
    }
  },
  {
    id: 45,
    title: 'Expense Reimbursement Approved',
    message: 'Your expense claim for conference attendance (₹12,500) has been approved.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T12:10:00Z',
    actionId: 'reimbursement_approved_1',
    relatedData: {
      amount: 12500,
      reason: 'Conference attendance',
      approvedDate: '2026-03-11'
    }
  },
  {
    id: 46,
    title: 'Payslip Generated',
    message: 'Your payslip for March 2026 is available for download.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.FACULTY,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.LOW,
    status: STATUS.UNREAD,
    createdAt: '2026-03-01T06:00:00Z',
    actionId: 'payslip_1',
    relatedData: {
      month: 'March 2026',
      downloadUrl: '/payslips/payslip_mar_2026.pdf'
    }
  },

  // Faculty → Finance (Finance Module)
  {
    id: 47,
    title: 'Expense Reimbursement Claim',
    message: 'Faculty submitted expense claim of ₹12,500 for conference attendance.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.FINANCE,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-09T15:45:00Z',
    actionId: 'expense_claim_1',
    relatedData: {
      facultyName: 'Dr. Rajesh Kumar',
      amount: 12500,
      expense: 'Conference attendance',
      submissionDate: '2026-03-09'
    }
  },
  {
    id: 48,
    title: 'Travel Claim Submitted',
    message: 'Faculty submitted travel claim for official visit.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.FINANCE,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-10T11:30:00Z',
    actionId: 'travel_claim_1',
    relatedData: {
      facultyName: 'Dr. Rajesh Kumar',
      tripPurpose: 'Academic collaboration',
      amount: 8500,
      claimDate: '2026-03-10'
    }
  },
  {
    id: 49,
    title: 'Salary Issue Report',
    message: 'Faculty reported discrepancy in March 2026 salary.',
    senderRole: ROLES.FACULTY,
    receiverRole: ROLES.FINANCE,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-02T08:20:00Z',
    actionId: 'salary_issue_1',
    relatedData: {
      facultyName: 'Dr. Rajesh Kumar',
      issue: 'Missing allowance deduction',
      reportDate: '2026-03-02'
    }
  },

  // ==================== FINANCE NOTIFICATIONS ====================

  // Admin → Finance
  {
    id: 50,
    title: 'Fee Structure Update',
    message: 'Updated fee structure for 2026-27 academic year has been approved. Implement from July 2026.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.FINANCE,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T09:00:00Z',
    actionId: 'fee_structure_update_1',
    relatedData: {
      year: '2026-27',
      effectiveDate: '2026-07-01',
      docUrl: '/admin/fee-structure-2026-27.pdf'
    }
  },
  {
    id: 51,
    title: 'Scholarship Approval',
    message: 'Approved list of scholarship awardees for 2026. Process disbursement by 2026-04-15.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.FINANCE,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T10:30:00Z',
    actionId: 'scholarship_approval_admin_1',
    relatedData: {
      awardeeCount: 125,
      totalAmount: 1250000,
      disbursementDeadline: '2026-04-15'
    }
  },
  {
    id: 52,
    title: 'Financial Audit Request',
    message: 'Conduct audit of financial statements for 2025-26. Audit team will contact you by 2026-03-15.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.FINANCE,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-10T13:15:00Z',
    actionId: 'audit_request_1',
    relatedData: {
      fiscalYear: '2025-26',
      auditTeom: 'External Auditors Ltd',
      deadline: '2026-05-30'
    }
  },
  {
    id: 53,
    title: 'Budget Allocation',
    message: 'Department-wise budget allocation for 2026-27 has been finalized. View detailed breakdown.',
    senderRole: ROLES.ADMIN,
    receiverRole: ROLES.FINANCE,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.READ,
    createdAt: '2026-03-09T11:45:00Z',
    actionId: 'budget_allocation_1',
    relatedData: {
      year: '2026-27',
      totalBudget: 50000000,
      departments: 12
    }
  },

  // Finance → Admin
  {
    id: 54,
    title: 'Budget Approval Request',
    message: 'Finance department submitted budget proposal for 2026-27 (₹50 Cr). Awaiting approval.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-08T14:20:00Z',
    actionId: 'budget_request_1',
    relatedData: {
      year: '2026-27',
      totalBudget: 50000000,
      submissionDate: '2026-03-08'
    }
  },
  {
    id: 55,
    title: 'Financial Report Submitted',
    message: 'Monthly financial report for February 2026 submitted. Review and approve.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-05T16:30:00Z',
    actionId: 'financial_report_1',
    relatedData: {
      month: 'February 2026',
      totalRevenue: 15000000,
      totalExpense: 12000000
    }
  },
  {
    id: 56,
    title: 'Department Spending Alert',
    message: 'Computer Science department has exceeded budget by 15%. Immediate action required.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.CRITICAL,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T15:45:00Z',
    actionId: 'spending_alert_1',
    relatedData: {
      department: 'Computer Science',
      budgetLimit: 5000000,
      currentSpending: 5750000,
      percentageOver: 15
    }
  },
  {
    id: 57,
    title: 'Scholarship Fund Update',
    message: 'Scholarship fund balance is now at 80% capacity. Plan disbursement strategy.',
    senderRole: ROLES.FINANCE,
    receiverRole: ROLES.ADMIN,
    module: CATEGORIES.FINANCE,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-11T13:10:00Z',
    actionId: 'scholarship_fund_1',
    relatedData: {
      fundBalance: 2400000,
      capacity: 3000000,
      utilizationPercent: 80
    }
  },

  // ==================== ADMIN NOTIFICATIONS ====================

  // Admin to all roles - Universal Broadcast
  {
    id: 58,
    title: 'Emergency Announcement',
    message: 'Campus will remain closed on 2026-03-13 due to severe weather. All activities cancelled.',
    senderRole: ROLES.ADMIN,
    receiverRole: 'ALL',
    module: CATEGORIES.ALERTS,
    priority: PRIORITY.CRITICAL,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T17:30:00Z',
    actionId: 'emergency_announce_1',
    relatedData: {
      reason: 'Severe weather',
      date: '2026-03-13'
    }
  },
  {
    id: 59,
    title: 'Campus Closure',
    message: 'Campus closed for 3 days (2026-03-15 to 2026-03-17) for annual maintenance.',
    senderRole: ROLES.ADMIN,
    receiverRole: 'ALL',
    module: CATEGORIES.ALERTS,
    priority: PRIORITY.HIGH,
    status: STATUS.UNREAD,
    createdAt: '2026-03-10T10:20:00Z',
    actionId: 'campus_closure_1',
    relatedData: {
      startDate: '2026-03-15',
      endDate: '2026-03-17',
      reason: 'Annual maintenance'
    }
  },
  {
    id: 60,
    title: 'Event Announcement',
    message: 'MIT Annual Tech Fest 2026 launches with exciting competitions and workshops.',
    senderRole: ROLES.ADMIN,
    receiverRole: 'ALL',
    module: CATEGORIES.SYSTEM,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-08T14:00:00Z',
    actionId: 'event_announce_all_1',
    relatedData: {
      eventName: 'Tech Fest 2026',
      dateStart: '2026-04-20',
      dateEnd: '2026-04-22',
      registrationDeadline: '2026-04-15'
    }
  },
  {
    id: 61,
    title: 'System Maintenance Alert',
    message: 'Scheduled system maintenance on 2026-03-14 from 11:00 PM to 1:00 AM. Portal will be unavailable.',
    senderRole: ROLES.ADMIN,
    receiverRole: 'ALL',
    module: CATEGORIES.SYSTEM,
    priority: PRIORITY.MEDIUM,
    status: STATUS.UNREAD,
    createdAt: '2026-03-12T16:20:00Z',
    actionId: 'maintenance_alert_1',
    relatedData: {
      date: '2026-03-14',
      startTime: '23:00',
      endTime: '01:00',
      duration: '2 hours'
    }
  }
];

/**
 * Notifications API Functions
 */

// Get all notifications
function getAllNotifications() {
  return notificationsDB;
}

// Get notifications for a specific user/role
function getNotificationsByRole(role) {
  if (!role) return [];
  
  const roleUpper = role.toLowerCase();
  return notificationsDB.filter(notif => 
    notif.receiverRole === 'ALL' || 
    notif.receiverRole.toLowerCase() === roleUpper
  );
}

// Get unread notifications count for a role
function getUnreadCount(role) {
  return getNotificationsByRole(role).filter(n => n.status === STATUS.UNREAD).length;
}

// Mark notification as read
function markAsRead(notificationId) {
  const notification = notificationsDB.find(n => n.id === notificationId);
  if (notification) {
    notification.status = STATUS.READ;
    return notification;
  }
  return null;
}

// Mark all notifications as read for a role
function markAllAsRead(role) {
  const notifications = getNotificationsByRole(role);
  notifications.forEach(n => {
    n.status = STATUS.READ;
  });
  return notifications;
}

// Delete notification
function deleteNotification(notificationId) {
  const index = notificationsDB.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    const deleted = notificationsDB.splice(index, 1);
    return deleted[0];
  }
  return null;
}

// Create new notification
function createNotification(notificationData) {
  const newNotification = {
    id: Math.max(...notificationsDB.map(n => n.id), 0) + 1,
    status: STATUS.UNREAD,
    createdAt: new Date().toISOString(),
    ...notificationData
  };
  notificationsDB.unshift(newNotification);
  return newNotification;
}

// Get notifications by category
function getNotificationsByCategory(role, category) {
  return getNotificationsByRole(role).filter(n => n.module === category);
}

// Search notifications
function searchNotifications(role, query) {
  const roleNotifications = getNotificationsByRole(role);
  return roleNotifications.filter(n =>
    n.title.toLowerCase().includes(query.toLowerCase()) ||
    n.message.toLowerCase().includes(query.toLowerCase())
  );
}

// Get notifications filtered by priority
function getNotificationsByPriority(role, priority) {
  return getNotificationsByRole(role).filter(n => n.priority === priority);
}

module.exports = {
  notificationsDB,
  PRIORITY,
  CATEGORIES,
  STATUS,
  ROLES,
  // API functions
  getAllNotifications,
  getNotificationsByRole,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationsByCategory,
  searchNotifications,
  getNotificationsByPriority,
};
