import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cmsRoles, getValidRole, roleMenuGroups } from '../data/roleConfig';
import Layout from '../components/Layout';
import { destroyUserSession } from '../auth/sessionController';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Graduation: () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 2.26L19.02 9 12 12.74 4.98 9 12 5.26zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  ),
  Back: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#6b7280">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="#9ca3af">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  ),
  Pin: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  ),
  Archive: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
    </svg>
  ),
  Delete: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ),
};

// ─── Role-based filter config ─────────────────────────────────────────────────
const ROLE_FILTERS = {
  student: [
    { key: 'all',      label: 'All',      emoji: '📋' },
    { key: 'academic', label: 'Academic', emoji: '📚' },
    { key: 'finance',  label: 'Finance',  emoji: '💰' },
    { key: 'events',   label: 'Events',   emoji: '🎉' },
    { key: 'system',   label: 'System',   emoji: '🔧' },
  ],
  faculty: [
    { key: 'all',        label: 'All',        emoji: '📋' },
    { key: 'department', label: 'Department', emoji: '🏫' },
    { key: 'academic',   label: 'Academic',   emoji: '📚' },
    { key: 'meetings',   label: 'Meetings',   emoji: '🤝' },
    { key: 'system',     label: 'System',     emoji: '🔧' },
  ],
  admin: [
    { key: 'all',      label: 'All',      emoji: '📋' },
    { key: 'academic', label: 'Academic', emoji: '📚' },
    { key: 'finance',  label: 'Finance',  emoji: '💰' },
    { key: 'staff',    label: 'Staff',    emoji: '👥' },
    { key: 'system',   label: 'System',   emoji: '🔧' },
  ],
  finance: [
    { key: 'all',         label: 'All',          emoji: '📋' },
    { key: 'payments',    label: 'Payments',      emoji: '💳' },
    { key: 'pending',     label: 'Pending Fees',  emoji: '⏳' },
    { key: 'scholarship', label: 'Scholarships',  emoji: '🎓' },
    { key: 'system',      label: 'System',        emoji: '🔧' },
  ],
};

// ─── Category metadata ────────────────────────────────────────────────────────
const CAT_META = {
  academic:   { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', emoji: '📚', label: 'Academic'    },
  finance:    { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', emoji: '💰', label: 'Finance'     },
  events:     { color: '#d97706', bg: '#fffbeb', border: '#fde68a', emoji: '🎉', label: 'Events'      },
  system:     { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', emoji: '🔧', label: 'System'      },
  department: { color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', emoji: '🏫', label: 'Department'  },
  meetings:   { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', emoji: '🤝', label: 'Meetings'    },
  staff:      { color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8', emoji: '👥', label: 'Staff'       },
  payments:   { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', emoji: '💳', label: 'Payments'    },
  pending:    { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', emoji: '⏳', label: 'Pending'     },
  scholarship:{ color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', emoji: '🎓', label: 'Scholarship' },
  exams:      { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', emoji: '📝', label: 'Exams'       },
  administrative:{ color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', emoji: '🏫', label: 'Administrative' },
  alerts:     { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', emoji: '🚨', label: 'Alerts'      },
};

// ─── Sample notifications per role ───────────────────────────────────────────
const SAMPLE_NOTIFICATIONS = {
  student: [
    { id: 's1',  title: 'DBMS Assignment Uploaded',       message: 'Faculty has uploaded a new DBMS assignment. Deadline: March 20, 2026.',   category: 'academic',   sender: 'Dr. Ramesh Kumar',    date: '2026-03-11T09:14:00', read: false, pinned: true,  archived: false },
    { id: 's2',  title: 'Mid-Semester Exam Timetable',    message: 'Mid-semester examination schedule has been released. Check the portal.',   category: 'academic',   sender: 'Academic Office',     date: '2026-03-10T14:30:00', read: false, pinned: false, archived: false },
    { id: 's3',  title: 'Semester Fee Reminder',          message: 'Your semester fee of ₹45,000 is due by March 25, 2026. Pay now.',          category: 'finance',    sender: 'Finance Department',  date: '2026-03-09T11:00:00', read: false, pinned: false, archived: false },
    { id: 's4',  title: 'Annual Tech Fest – Registrations Open', message: 'TechFest 2026 registrations are open. Register before March 18.',  category: 'events',     sender: 'Student Council',     date: '2026-03-08T16:45:00', read: true,  pinned: false, archived: false },
    { id: 's5',  title: 'Class Cancelled – Data Structures', message: 'DS class scheduled for March 12 is cancelled due to faculty leave.',   category: 'academic',   sender: 'Prof. Ananya Singh',  date: '2026-03-08T10:20:00', read: true,  pinned: false, archived: false },
    { id: 's6',  title: 'Fee Payment Confirmed',          message: 'Your payment of ₹45,000 for Semester 4 has been successfully processed.',  category: 'finance',    sender: 'Finance Department',  date: '2026-03-07T13:05:00', read: true,  pinned: false, archived: false },
    { id: 's7',  title: 'Portal Maintenance – March 15',  message: 'MIT Connect portal will be under maintenance on Mar 15, 2:00–4:00 AM.',    category: 'system',     sender: 'IT Department',       date: '2026-03-06T09:00:00', read: true,  pinned: false, archived: false },
    { id: 's8',  title: 'Workshop: AI & Machine Learning', message: 'Register for the 2-day ML workshop. Seats are limited. Mar 20–21.',       category: 'events',     sender: 'CS Department',       date: '2026-03-05T15:30:00', read: true,  pinned: false, archived: false },
    { id: 's9',  title: 'Internal Marks Updated',         message: 'Your internal assessment marks for all subjects have been updated.',        category: 'academic',   sender: 'Academic Office',     date: '2026-03-04T11:45:00', read: true,  pinned: false, archived: false },
    { id: 's10', title: 'Scholarship Disbursement',       message: 'Merit scholarship of ₹10,000 has been credited to your account.',           category: 'finance',    sender: 'Finance Department',  date: '2026-03-03T10:00:00', read: true,  pinned: false, archived: false },
  ],
  faculty: [
    { id: 'f1',  title: 'Department Meeting – March 13',  message: 'Mandatory department meeting at 3:00 PM in Conference Room B.',             category: 'meetings',   sender: 'HoD – CS Dept',       date: '2026-03-11T08:30:00', read: false, pinned: true,  archived: false },
    { id: 'f2',  title: 'Assignment Submission Alert',    message: '28 students have submitted the DBMS Assignment. Review and grade now.',      category: 'academic',   sender: 'Academic Portal',     date: '2026-03-10T17:00:00', read: false, pinned: false, archived: false },
    { id: 'f3',  title: 'Exam Paper Submission Deadline', message: 'Submit your mid-semester exam paper by March 14, 5:00 PM.',                 category: 'academic',   sender: 'Exam Cell',           date: '2026-03-09T12:00:00', read: false, pinned: false, archived: false },
    { id: 'f4',  title: 'Faculty Training – LMS Tools',  message: 'Mandatory LMS training session on March 16, 10 AM–1 PM. Hall 3.',           category: 'meetings',   sender: 'Training Coordinator',date: '2026-03-08T09:00:00', read: true,  pinned: false, archived: false },
    { id: 'f5',  title: 'Department Circular – Syllabus Revision', message: 'Revised syllabus for AY 2026–27 shared. Please review and confirm.', category: 'department', sender: 'HoD – CS Dept',    date: '2026-03-07T14:20:00', read: true,  pinned: false, archived: false },
    { id: 'f6',  title: 'Attendance Report Due',         message: 'Monthly attendance report for February must be submitted by March 12.',       category: 'academic',   sender: 'Academic Office',     date: '2026-03-06T10:00:00', read: true,  pinned: false, archived: false },
    { id: 'f7',  title: 'Portal Update v3.2',            message: 'MIT Connect updated to v3.2. Grade module now supports bulk upload.',         category: 'system',     sender: 'IT Department',       date: '2026-03-05T08:00:00', read: true,  pinned: false, archived: false },
    { id: 'f8',  title: 'Research Grant Announcement',   message: 'AICTE research grants open for applications. Deadline: April 10, 2026.',      category: 'department', sender: 'Research Cell',       date: '2026-03-04T11:00:00', read: true,  pinned: false, archived: false },
  ],
  admin: [
    { id: 'a1',  title: 'Server CPU Alert – 91%',        message: 'Server CPU usage reached 91% at 10:42 AM. Investigate immediately.',         category: 'system',     sender: 'Monitoring System',   date: '2026-03-11T10:42:00', read: false, pinned: true,  archived: false },
    { id: 'a2',  title: 'New Faculty Account Request',   message: 'Prof. Vijay Mehta (CS Dept) has requested portal access. Approve/reject.',   category: 'staff',      sender: 'HR Department',       date: '2026-03-11T09:00:00', read: false, pinned: false, archived: false },
    { id: 'a3',  title: 'Fee Collection Report – Feb',   message: 'February fee collection summary is ready. Total collected: ₹1.24 Cr.',        category: 'finance',    sender: 'Finance Department',  date: '2026-03-10T16:00:00', read: false, pinned: false, archived: false },
    { id: 'a4',  title: 'Exam Schedule Published',       message: 'Mid-semester examination schedule has been published to all students.',        category: 'academic',   sender: 'Exam Cell',           date: '2026-03-09T11:30:00', read: true,  pinned: false, archived: false },
    { id: 'a5',  title: 'Staff Leave Application',       message: 'Dr. Priya Nair has applied for 3-day leave (Mar 14–16). Approval needed.',    category: 'staff',      sender: 'HR Department',       date: '2026-03-08T14:00:00', read: true,  pinned: false, archived: false },
    { id: 'a6',  title: 'Database Backup Completed',     message: 'Scheduled database backup completed successfully at 02:00 AM.',               category: 'system',     sender: 'IT Department',       date: '2026-03-08T02:01:00', read: true,  pinned: false, archived: false },
    { id: 'a7',  title: 'Scholarship Disbursement Done', message: '142 students received merit scholarships. Total: ₹14.2L disbursed.',          category: 'finance',    sender: 'Finance Department',  date: '2026-03-07T13:00:00', read: true,  pinned: false, archived: false },
    { id: 'a8',  title: 'Annual Accreditation Report',   message: 'NAAC accreditation report draft is ready for your review and sign-off.',      category: 'academic',   sender: 'Academic Office',     date: '2026-03-06T10:30:00', read: true,  pinned: false, archived: false },
  ],
  finance: [
    { id: 'fi1', title: 'Fee Payment – Alex Chen',       message: 'Alex Chen (Roll: CS2021042) paid ₹45,000. Transaction ID: TXN2026031101.',   category: 'payments',   sender: 'Payment Gateway',     date: '2026-03-11T11:05:00', read: false, pinned: false, archived: false },
    { id: 'fi2', title: 'Overdue Fee – 6 Students',      message: '6 students have overdue semester fees. Reminder sent automatically.',          category: 'pending',    sender: 'Finance System',      date: '2026-03-10T09:30:00', read: false, pinned: true,  archived: false },
    { id: 'fi3', title: 'Scholarship Application Received', message: 'Priya Sharma applied for National Merit Scholarship. Review required.',    category: 'scholarship',sender: 'Scholarship Cell',    date: '2026-03-09T15:00:00', read: false, pinned: false, archived: false },
    { id: 'fi4', title: 'Bulk Fee Collection – March',   message: 'March bulk fee collection of ₹38.6L completed. Report attached.',             category: 'payments',   sender: 'Finance Department',  date: '2026-03-08T17:00:00', read: true,  pinned: false, archived: false },
    { id: 'fi5', title: '12 Students Pending Hostel Fee',message: '12 students have not paid hostel fees for March. Action required.',            category: 'pending',    sender: 'Finance System',      date: '2026-03-07T10:00:00', read: true,  pinned: false, archived: false },
    { id: 'fi6', title: 'Scholarship Approved – Merit',  message: 'AICTE scholarship for 18 students approved. Disbursement pending.',           category: 'scholarship',sender: 'Scholarship Cell',    date: '2026-03-06T14:30:00', read: true,  pinned: false, archived: false },
    { id: 'fi7', title: 'Finance Portal Audit Log',      message: 'Monthly audit log exported successfully. File ready for download.',            category: 'system',     sender: 'IT Department',       date: '2026-03-05T09:00:00', read: true,  pinned: false, archived: false },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const pill = (active, color = '#2563eb') => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '6px 14px', borderRadius: 999, border: '1.5px solid',
  cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
  borderColor: active ? color : '#e5e7eb',
  background:  active ? color : '#fff',
  color:       active ? '#fff' : '#6b7280',
  boxShadow:   active ? `0 3px 10px ${color}30` : 'none',
});

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function NotificationsPage({ role: propRole }) {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef(null);

  const storedRole = localStorage.getItem('cmsRole') || 'student';
  const role       = getValidRole(propRole || searchParams.get('role') || storedRole);
  const data       = cmsRoles[role];
  const menuGroups = roleMenuGroups[role] || roleMenuGroups.student;
  const filters    = ROLE_FILTERS[role] || ROLE_FILTERS.student;

  // ── State
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter]   = useState('all');
  const [searchQuery, setSearchQuery]     = useState('');
  const [expandedId, setExpandedId]       = useState(null);
  const [showArchived, setShowArchived]   = useState(false);
  const [statusFilter, setStatusFilter]   = useState('all'); // 'all' | 'unread' | 'read'
  const [toastMsg, setToastMsg]           = useState('');

  // ── Fetch from MongoDB API
  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch(`/api/notifications/${role}`);
        const json = await res.json();
        if (json.success && json.data) {
          const mapped = json.data.map(n => ({
            id: n._id,
            title: n.title,
            message: n.message,
            category: (n.module || 'system').toLowerCase(),
            sender: n.senderRole || 'System',
            date: n.createdAt,
            read: n.status === 'read',
            pinned: false,
            archived: false,
          }));
          setNotifications(mapped.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
        // Fallback to sample data
        setNotifications(
          [...(SAMPLE_NOTIFICATIONS[role] || SAMPLE_NOTIFICATIONS.student)].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          )
        );
      }
    }
    loadNotifications();
  }, [role]);
  const [justMarked, setJustMarked]       = useState(null); // for micro-animation

  // ── Compose state (admin/faculty only)
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [compose, setCompose] = useState({
    title: '',
    message: '',
    receivers: { student: true, faculty: false, admin: false, finance: false },
    module: 'Academic',
    priority: 'Medium',
  });

  function resetCompose() {
    setCompose({ title: '', message: '', receivers: { student: true, faculty: false, admin: false, finance: false }, module: 'Academic', priority: 'Medium' });
  }

  async function handleSendNotification(e) {
    e.preventDefault();
    if (!compose.title.trim() || !compose.message.trim()) return;
    setSending(true);

    const selectedRoles = Object.entries(compose.receivers).filter(([, v]) => v).map(([k]) => k);
    const sendAll = selectedRoles.length === 4;

    try {
      if (sendAll) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: compose.title, message: compose.message, senderRole: role, receiverRole: 'ALL', module: compose.module, priority: compose.priority }),
        });
      } else {
        await Promise.all(selectedRoles.map(r =>
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: compose.title, message: compose.message, senderRole: role, receiverRole: r, module: compose.module, priority: compose.priority }),
          })
        ));
      }

      // Reload notifications
      const res = await fetch(`/api/notifications/${role}`);
      const json = await res.json();
      if (json.success && json.data) {
        const mapped = json.data.map(n => ({
          id: n._id, title: n.title, message: n.message,
          category: (n.module || 'system').toLowerCase(), sender: n.senderRole || 'System',
          date: n.createdAt, read: n.status === 'read', pinned: false, archived: false,
        }));
        setNotifications(mapped.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }

      resetCompose();
      setShowCompose(false);
      toast('Notification sent successfully!');
    } catch (err) {
      console.error('Failed to send notification:', err);
      toast('Failed to send notification');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    document.title = `MIT Connect – Notifications`;
    localStorage.setItem('cmsRole', role);
  }, [role]);

  function handleLogout() {
    destroyUserSession();
    navigate('/', { replace: true });
  }

  // ── Derived
  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
  localStorage.setItem("cmsUnreadCount", unreadCount);

  const visible = useMemo(() => {
    let list = notifications.filter(n => showArchived ? n.archived : !n.archived);
    if (activeFilter !== 'all') list = list.filter(n => n.category === activeFilter);
    if (statusFilter === 'unread') list = list.filter(n => !n.read);
    if (statusFilter === 'read')   list = list.filter(n => n.read);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.sender.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [notifications, activeFilter, statusFilter, searchQuery, showArchived]);

  const pinnedVisible   = visible.filter(n => n.pinned);
  const unpinnedVisible = visible.filter(n => !n.pinned);

  // ── Actions
  function toast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2400);
  }

  function markRead(id) {
    setJustMarked(id);
    setTimeout(() => setJustMarked(null), 500);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    fetch(`/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
    toast('Marked as read');
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    fetch(`/api/notifications/${role}/read-all`, { method: 'PUT' }).catch(() => {});
    toast('All notifications marked as read');
  }

  function togglePin(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  }

  function archiveNotif(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: true, read: true } : n));
    if (expandedId === id) setExpandedId(null);
    toast('Notification archived');
  }

  function deleteNotif(id) {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (expandedId === id) setExpandedId(null);
    fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
    toast('Notification deleted');
  }

  function handleCardClick(id) {
    const n = notifications.find(x => x.id === id);
    if (!n.read) markRead(id);
    setExpandedId(prev => prev === id ? null : id);
  }

  // ── Notification card ─────────────────────────────────────────────────────
  function NotifCard({ n }) {
    const cat     = CAT_META[n.category] || CAT_META.system;
    const isExp   = expandedId === n.id;
    const isNew   = justMarked === n.id;

    return (
      <div
        onClick={() => handleCardClick(n.id)}
        style={{
          position: 'relative',
          background: n.read ? '#fff' : '#f8faff',
          border: `1.5px solid ${isExp ? '#2563eb' : n.read ? '#f3f4f6' : '#bfdbfe'}`,
          borderRadius: 14,
          padding: '16px 18px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: isExp ? '0 4px 16px rgba(37,99,235,0.12)' : n.read ? 'none' : '0 2px 8px rgba(37,99,235,0.07)',
          opacity: isNew ? 0.6 : 1,
        }}
      >
        {/* Unread dot */}
        {!n.read && (
          <span style={{
            position: 'absolute', top: 18, right: 18,
            width: 9, height: 9, borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 0 3px #fee2e2',
            animation: 'pulse-dot 2s infinite',
          }} />
        )}

        {/* Pinned badge */}
        {n.pinned && (
          <span style={{
            position: 'absolute', top: -1, left: 18,
            fontSize: 10, fontWeight: 700,
            background: '#2563eb', color: '#fff',
            padding: '2px 8px', borderRadius: '0 0 8px 8px',
            letterSpacing: 0.4,
          }}>📌 PINNED</span>
        )}

        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginTop: n.pinned ? 8 : 0 }}>
          {/* Category icon bubble */}
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: cat.bg, border: `1.5px solid ${cat.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {cat.emoji}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 14, color: '#111827', lineHeight: 1.4, flex: 1 }}>
                {n.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '2px 9px', borderRadius: 999,
                  background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`,
                }}>{cat.label}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{timeAgo(n.date)}</span>
              </div>
            </div>

            {/* Sender */}
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>{n.sender}</span>
              {' · '}
              <span>{fmtDate(n.date)}</span>
            </div>

            {/* Message preview */}
            <div style={{
              fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: isExp ? 99 : 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {n.message}
            </div>

            {/* Expanded action row */}
            {isExp && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}
              >
                {!n.read && (
                  <button type="button" onClick={() => markRead(n.id)} style={actionBtn('#2563eb')}>
                    <Icon.Check /> Mark as Read
                  </button>
                )}
                <button type="button" onClick={() => togglePin(n.id)} style={actionBtn('#7c3aed')}>
                  <Icon.Pin /> {n.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button type="button" onClick={() => archiveNotif(n.id)} style={actionBtn('#6b7280')}>
                  <Icon.Archive /> Archive
                </button>
                <button type="button" onClick={() => deleteNotif(n.id)} style={actionBtn('#b91c1c', '#fef2f2')}>
                  <Icon.Delete /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function actionBtn(color, bg = '#f9fafb') {
    return {
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 7, border: `1px solid ${color}22`,
      background: bg, color, cursor: 'pointer', fontSize: 12, fontWeight: 600,
      transition: 'all 0.15s',
    };
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout title="Notifications">
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 3px #fee2e2; }
          50%       { box-shadow: 0 0 0 6px #fecaca; }
        }
        @keyframes slide-in-toast {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fade-in-card {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .notif-card-enter { animation: fade-in-card 0.25s ease forwards; }
      `}</style>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#1f2937', color: '#fff', padding: '10px 20px',
          borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'slide-in-toast 0.25s ease',
        }}>
          ✓ {toastMsg}
        </div>
      )}

      <div className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />

          {/* ── Control bar ── */}
          <div className="content-card" style={{ marginBottom: 20, padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>

              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}>
                  <Icon.Search />
                </span>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notifications by title, message, or sender…"
                  style={{
                    width: '100%', height: 42, borderRadius: 10,
                    border: '1.5px solid #e5e7eb', paddingLeft: 38, paddingRight: 14,
                    fontSize: 13, color: '#1f2937', outline: 'none',
                    background: '#f9fafb', transition: 'border 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = '#e5e7eb')}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16,
                  }}>×</button>
                )}
              </div>

              {/* Mark all read */}
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  height: 42, padding: '0 16px', borderRadius: 10,
                  border: '1.5px solid #bfdbfe', background: '#eff6ff',
                  color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}>
                  <Icon.Check /> Mark All as Read
                </button>
              )}

              {/* Archive toggle */}
              <button type="button" onClick={() => setShowArchived(!showArchived)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 42, padding: '0 14px', borderRadius: 10,
                border: `1.5px solid ${showArchived ? '#6b7280' : '#e5e7eb'}`,
                background: showArchived ? '#f3f4f6' : '#fff',
                color: showArchived ? '#374151' : '#9ca3af',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                <Icon.Archive /> {showArchived ? 'Show Active' : 'Archived'}
              </button>

              {/* Send Notification button (admin/faculty only) */}
              {(role === 'admin' || role === 'faculty') && (
                <button type="button" onClick={() => { setShowCompose(!showCompose); if (showCompose) resetCompose(); }} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  height: 42, padding: '0 18px', borderRadius: 10,
                  border: 'none', background: showCompose ? '#dc2626' : '#2563eb',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                }}>
                  {showCompose ? '✕ Cancel' : '✉ Send Notification'}
                </button>
              )}
            </div>

            {/* ── Compose Notification Form (admin/faculty) ── */}
            {showCompose && (role === 'admin' || role === 'faculty') && (
              <form onSubmit={handleSendNotification} style={{
                marginTop: 16, padding: 20, background: '#f8faff', borderRadius: 14,
                border: '1.5px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>✉</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1e40af' }}>Compose Notification</span>
                </div>

                {/* Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: 0.3 }}>Title *</label>
                  <input type="text" required value={compose.title} onChange={e => setCompose(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g., Exam Schedule Updated" style={{
                      height: 40, borderRadius: 8, border: '1.5px solid #d1d5db', padding: '0 12px',
                      fontSize: 13, outline: 'none', transition: 'border 0.15s',
                    }} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                </div>

                {/* Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: 0.3 }}>Description *</label>
                  <textarea required value={compose.message} onChange={e => setCompose(p => ({ ...p, message: e.target.value }))}
                    placeholder="Write the notification message here..." rows={3} style={{
                      borderRadius: 8, border: '1.5px solid #d1d5db', padding: '10px 12px',
                      fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', transition: 'border 0.15s',
                    }} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
                </div>

                {/* Send To — Checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: 0.3 }}>Send To *</label>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                      { key: 'student', label: 'Students', emoji: '🎓' },
                      { key: 'faculty', label: 'Faculty', emoji: '👨‍🏫' },
                      { key: 'admin', label: 'Admin', emoji: '🛡️' },
                      { key: 'finance', label: 'Finance', emoji: '💰' },
                    ].map(r => (
                      <label key={r.key} style={{
                        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                        padding: '6px 14px', borderRadius: 8,
                        border: `1.5px solid ${compose.receivers[r.key] ? '#2563eb' : '#e5e7eb'}`,
                        background: compose.receivers[r.key] ? '#eff6ff' : '#fff',
                        fontSize: 13, fontWeight: 600, color: compose.receivers[r.key] ? '#1e40af' : '#6b7280',
                        transition: 'all 0.15s',
                      }}>
                        <input type="checkbox" checked={compose.receivers[r.key]}
                          onChange={e => setCompose(p => ({ ...p, receivers: { ...p.receivers, [r.key]: e.target.checked } }))}
                          style={{ accentColor: '#2563eb', width: 15, height: 15 }} />
                        <span>{r.emoji}</span> {r.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Module + Priority row */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: 0.3 }}>Module</label>
                    <select value={compose.module} onChange={e => setCompose(p => ({ ...p, module: e.target.value }))} style={{
                      height: 40, borderRadius: 8, border: '1.5px solid #d1d5db', padding: '0 10px',
                      fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer',
                    }}>
                      <option value="Academic">📚 Academic</option>
                      <option value="Finance">💰 Finance</option>
                      <option value="Administrative">🏫 Administrative</option>
                      <option value="Exams">📝 Exams</option>
                      <option value="System">🔧 System</option>
                      <option value="Alerts">🚨 Alerts</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: 0.3 }}>Priority</label>
                    <select value={compose.priority} onChange={e => setCompose(p => ({ ...p, priority: e.target.value }))} style={{
                      height: 40, borderRadius: 8, border: '1.5px solid #d1d5db', padding: '0 10px',
                      fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer',
                    }}>
                      <option value="Low">🟢 Low</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="High">🟠 High</option>
                      <option value="Critical">🔴 Critical</option>
                    </select>
                  </div>
                </div>

                {/* Send button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => { setShowCompose(false); resetCompose(); }} style={{
                    height: 40, padding: '0 20px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                    background: '#fff', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>Cancel</button>
                  <button type="submit" disabled={sending || !Object.values(compose.receivers).some(v => v)} style={{
                    height: 40, padding: '0 24px', borderRadius: 8, border: 'none',
                    background: sending ? '#93c5fd' : '#2563eb', color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: sending ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.3)', transition: 'all 0.15s',
                  }}>{sending ? 'Sending...' : '✉ Send Notification'}</button>
                </div>
              </form>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: '#f3f4f6', margin: '12px 0 0' }} />

            {/* Single row — Filter + Status */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>

              {/* Category filter pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Icon.Filter /> Filter:
                </span>
                {filters.map(f => (
                  <button key={f.key} type="button" onClick={() => setActiveFilter(f.key)} style={pill(activeFilter === f.key)}>
                    <span>{f.emoji}</span>
                    {f.label}
                    {f.key !== 'all' && (
                      <span style={{
                        marginLeft: 2, fontSize: 10, fontWeight: 800,
                        background: activeFilter === f.key ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                        color: activeFilter === f.key ? '#fff' : '#9ca3af',
                        padding: '1px 5px', borderRadius: 999,
                      }}>
                        {notifications.filter(n => !n.archived && n.category === f.key).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Divider between filter and status */}
              <div style={{ width: 1, height: 28, background: '#e5e7eb', flexShrink: 0 }} />

              {/* Status segmented control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 0 }}>
                  Status:
                </span>
                <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 10, padding: 3, gap: 2 }}>
                  {(() => {
                    // Scope status counts to whatever category is active
                    const scoped = notifications.filter(n =>
                      !n.archived &&
                      (activeFilter === 'all' || n.category === activeFilter)
                    );
                    return [
                      { key: 'all',    label: 'All',    count: scoped.length,                        dot: null      },
                      { key: 'unread', label: 'Unread', count: scoped.filter(n => !n.read).length,   dot: '#ef4444' },
                      { key: 'read',   label: 'Read',   count: scoped.filter(n =>  n.read).length,   dot: '#22c55e' },
                    ];
                  })().map(({ key, label, count, dot }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStatusFilter(key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                        background: statusFilter === key ? '#fff' : 'transparent',
                        color:      statusFilter === key ? '#1f2937' : '#9ca3af',
                        boxShadow:  statusFilter === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />}
                      {label}
                      <span style={{ fontSize: 10, fontWeight: 800, background: statusFilter === key ? '#f3f4f6' : 'transparent', color: '#9ca3af', padding: '1px 5px', borderRadius: 999 }}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Context label — tells user what the status counts are scoped to */}
              {activeFilter !== 'all' && (
                <div style={{ width: '100%', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    Status counts scoped to: <strong style={{ color: '#374151' }}>
                      {filters.find(f => f.key === activeFilter)?.emoji} {filters.find(f => f.key === activeFilter)?.label}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Results summary ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              {searchQuery
                ? `${visible.length} result${visible.length !== 1 ? 's' : ''} for "${searchQuery}"`
                : `Showing ${visible.length} notification${visible.length !== 1 ? 's' : ''}${showArchived ? ' (archived)' : ''}`
              }
            </span>
            {unreadCount > 0 && !showArchived && (
              <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                🔴 {unreadCount} unread
              </span>
            )}
          </div>

          {/* ── Empty state ── */}
          {visible.length === 0 && (
            <div className="content-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                {searchQuery ? '🔍' : showArchived ? '📂' : '🔔'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
                {searchQuery ? 'No matching notifications' : showArchived ? 'No archived notifications' : 'All caught up!'}
              </div>
              <div style={{ fontSize: 14, color: '#9ca3af' }}>
                {searchQuery
                  ? `No notifications match "${searchQuery}". Try a different keyword.`
                  : showArchived
                  ? 'Archived notifications will appear here.'
                  : 'You have no notifications in this category.'}
              </div>
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} style={{ marginTop: 16, ...actionBtn('#2563eb', '#eff6ff'), fontSize: 13 }}>
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* ── Pinned section ── */}
          {pinnedVisible.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon.Pin /> Pinned
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pinnedVisible.map(n => <NotifCard key={n.id} n={n} />)}
              </div>
            </div>
          )}

          {/* ── Main list ── */}
          {unpinnedVisible.length > 0 && (
            <div>
              {pinnedVisible.length > 0 && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                  All Notifications
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {unpinnedVisible.map(n => <NotifCard key={n.id} n={n} />)}
              </div>
            </div>
          )}

          {/* ── Footer legend ── */}
          {visible.length > 0 && (
            <div style={{ marginTop: 28, padding: '14px 18px', background: '#f9fafb', borderRadius: 12, border: '1px solid #f3f4f6', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>LEGEND:</span>
              {[
                { dot: '#ef4444', label: 'Unread' },
                { dot: '#22c55e', label: 'Read'   },
                { dot: '#2563eb', label: 'Pinned' },
              ].map(({ dot, label }) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block' }} />
                  {label}
                </span>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>
                Click any card to expand · Click again to collapse
              </span>
            </div>
          )}
    </Layout>
  );
}