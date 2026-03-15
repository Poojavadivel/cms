export const demoUsers = {
  student: { userId: 'STU-2024-1547', password: 'student123' },
  admin: { userId: 'ADM-0001', password: 'admin123' },
  faculty: { userId: 'FAC-204', password: 'faculty123' },
  finance: { userId: 'FIN-880', password: 'finance123' },
};

export const cmsRoles = {
  student: {
    label: 'Student',
    name: 'John Anderson',
    team: 'Computer Science',
    focus: 'Academics',
    primaryAction: 'View Timetable',
    secondaryAction: 'Track Attendance',
    subtitle: 'Track academics, attendance, and upcoming exams.',
    stats: [
      { value: '8.7', label: 'Current GPA', sub: 'Improved this term' },
      { value: '92%', label: 'Attendance', sub: 'Good standing' },
      { value: '4', label: 'Pending Exams', sub: 'This month' },
      { value: '1', label: 'Fee Reminder', sub: 'Due in 10 days' },
    ],
    tasks: [
      { title: 'Complete DBMS assignment', desc: 'Submit before Friday 5:00 PM' },
      { title: 'Download exam hall ticket', desc: 'Available in Academics > Exams' },
      { title: 'Review placement drive list', desc: '3 companies added this week' },
    ],
    alerts: [
      { title: 'Attendance warning in CN', desc: 'Need 75% minimum, current 72%' },
      { title: 'Fee due reminder', desc: 'Semester fee payment closes on 31 March' },
    ],
  },
  admin: {
    label: 'Admin',
    name: 'Nisha Verma',
    team: 'Campus Administration',
    focus: 'Operations',
    primaryAction: 'Approve Admissions',
    secondaryAction: 'Manage Department',
    subtitle: 'Manage students, faculty, admissions, and departments.',
    stats: [
      { value: '1840', label: 'Total Students', sub: 'Across all departments' },
      { value: '128', label: 'Faculty Members', sub: 'Active this semester' },
      { value: '76', label: 'New Admissions', sub: 'Awaiting review' },
      { value: '12', label: 'Dept Requests', sub: 'Need action today' },
    ],
    tasks: [
      { title: 'Approve 24 admission applications', desc: 'Priority: Merit scholarship batch' },
      { title: 'Publish department circular', desc: 'Academic calendar for next term' },
      { title: 'Assign new faculty to sections', desc: '6 classes still unassigned' },
    ],
    alerts: [
      { title: 'Document mismatch found', desc: '8 admission forms require verification' },
      { title: 'Department budget exceeded', desc: 'Civil Engineering crossed monthly cap' },
    ],
  },
  faculty: {
    label: 'Faculty',
    name: 'Dr. Rajesh Iyer',
    team: 'School of Engineering',
    focus: 'Teaching',
    primaryAction: 'Mark Attendance',
    secondaryAction: 'Publish Internal Marks',
    subtitle: 'Handle classes, evaluations, timetables, and student progress.',
    stats: [
      { value: '6', label: 'Classes Today', sub: '2 completed' },
      { value: '312', label: 'Students Mapped', sub: 'Across 4 subjects' },
      { value: '18', label: 'Assessments Pending', sub: 'Need grading' },
      { value: '89%', label: 'Avg Attendance', sub: 'This week' },
    ],
    tasks: [
      { title: 'Upload quiz-2 results', desc: 'CS-303 section B before 4:00 PM' },
      { title: 'Finalize exam paper blueprint', desc: 'Submit to HoD for approval' },
      { title: 'Counsel low attendance students', desc: 'Schedule 6 student meetings' },
    ],
    alerts: [
      { title: 'Timetable updated', desc: 'Friday lecture moved to Lab-4' },
      { title: 'Exam invigilation duty', desc: 'Assigned for 21 March, Morning session' },
    ],
  },
  finance: {
    label: 'Finance',
    name: 'Arun Kumar',
    team: 'Accounts & Billing',
    focus: 'Billing',
    primaryAction: 'Generate Invoices',
    secondaryAction: 'Run Payroll',
    subtitle: 'Monitor fees, payroll, invoices, and financial compliance.',
    stats: [
      { value: 'INR 2.4Cr', label: 'Fees Collected', sub: 'Current quarter' },
      { value: '148', label: 'Unpaid Invoices', sub: 'Requires follow-up' },
      { value: '3', label: 'Payroll Cycles', sub: 'Upcoming this month' },
      { value: '97%', label: 'Collection Rate', sub: 'On target' },
    ],
    tasks: [
      { title: 'Send unpaid fee reminders', desc: 'Batch reminder to 148 accounts' },
      { title: 'Prepare payroll sheet', desc: 'Finalize before 25 March' },
      { title: 'Reconcile invoice register', desc: 'Match 2nd week transactions' },
    ],
    alerts: [
      { title: 'Fee gateway delay', desc: '12 transactions pending confirmation' },
      { title: 'Payroll exception', desc: '2 employee records missing bank details' },
    ],
  },
};

export const roleMenuGroups = {
  student: [
    {
      title: 'Overview',
      items: ['Dashboard', 'My Courses', 'Department'],
    },
    {
      title: 'Academics',
      items: ['Exams', 'Timetable', 'Attendance', 'Placement', 'Facility'],
    },
    {
      title: 'Administration',
      items: ['Fees', 'Invoices'],
    },
    {
      title: 'Intelligence',
      items: ['Notifications', 'Settings'],
    },
  ],
  admin: [
    {
      title: 'Overview',
      items: ['Dashboard', 'Students', 'Faculty', 'Department'],
    },
    {
      title: 'Administration',
      items: ['Admission', 'Fees', 'Payroll', 'Invoices'],
    },
    {
      title: 'Intelligence',
      items: ['Analytics', 'Notifications', 'Settings'],
    },
    {
      title: 'Academics',
      items: ['Exams', 'Timetable', 'Attendance', 'Placement', 'Facility'],
    },
  ],
  faculty: [
    {
      title: 'Overview',
      items: ['Dashboard', 'Students', 'Department'],
    },
    {
      title: 'Academics',
      items: ['Exams', 'Timetable', 'Attendance', 'Placement'],
    },
    {
      title: 'Intelligence',
      items: ['Analytics', 'Notifications', 'Settings'],
    },
  ],
  finance: [
    {
      title: 'Overview',
      items: ['Dashboard', 'Department'],
    },
    {
      title: 'Administration',
      items: ['Fees', 'Payroll', 'Invoices'],
    },
    {
      title: 'Intelligence',
      items: ['Analytics', 'Notifications', 'Settings'],
    },
  ],
};

export function getValidRole(role) {
  return cmsRoles[role] ? role : 'student';
}
