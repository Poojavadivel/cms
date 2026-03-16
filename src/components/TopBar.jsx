import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import NotificationDropdown from './NotificationDropdown';
import { getUserSession } from '../auth/sessionController';
import { cmsRoles } from '../data/roleConfig';
import { useCurrentUserProfile } from '../utils/currentUserProfile';

export default function TopBar({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const session = getUserSession();
  const roleFromQuery = new URLSearchParams(location.search).get('role');
  const role = session?.role || roleFromQuery || 'student';
  const userId = session?.userId || '';
  const roleData = cmsRoles[role] || cmsRoles.student;
  const roleLabel = roleData.label;
  const profile = useCurrentUserProfile(role, userId, { name: roleData.name });
  const userName = profile.name || roleData.name;
  const photoSrc = profile.profilePhoto || profile.avatar || '';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <header className="h-20 bg-white border-b border-slate-100 px-10 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-white/80">
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-[20px] font-bold text-[#2563eb] tracking-tight">EduCore {roleLabel} Portal</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 relative">
          <NotificationBell 
            role={role} 
            onBellClick={() => setIsNotificationOpen(!isNotificationOpen)}
          />
          <NotificationDropdown 
            role={role} 
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
          <button 
            type="button"
            className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
            onClick={() => navigate(`/settings?role=${encodeURIComponent(role)}`)}
            aria-label="Open settings"
          >
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </button>
        </div>
        <button
          type="button"
          className="flex items-center gap-4 border-l border-slate-100 pl-6 cursor-pointer group bg-transparent border-r-0 border-t-0 border-b-0 p-0"
          onClick={() => navigate(`/settings?role=${encodeURIComponent(role)}`)}
          aria-label={`View profile for ${userName}`}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1e293b]">{userName}</p>
            <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">{roleLabel}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#2563eb]/10 overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105 flex items-center justify-center">
            {photoSrc
              ? <img src={photoSrc} alt={userName} className="w-full h-full object-cover" />
              : <span className="text-[#2563eb] font-bold text-sm">{initials}</span>
            }
          </div>
        </button>
      </div>
    </header>
  )
}
