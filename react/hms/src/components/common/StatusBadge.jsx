import React from 'react';
import {
    MdSchedule,
    MdCheckCircle,
    MdPersonPinCircle,
    MdMeetingRoom,
    MdCancel,
    MdPendingActions
} from 'react-icons/md';

const StatusBadge = ({ status, onClick, className = '' }) => {
    const s = String(status || '').toUpperCase();

    // Default config
    let config = {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        icon: <MdPendingActions size={14} className="text-slate-500" />,
        label: status || 'Unknown'
    };

    switch (s) {
        case 'SCHEDULED':
            config = {
                bg: 'bg-slate-100',
                text: 'text-slate-800',
                border: 'border-slate-300',
                icon: <MdSchedule size={14} className="text-slate-600" />,
                label: 'Scheduled'
            };
            break;
        case 'CONFIRMED':
            config = {
                bg: 'bg-emerald-50',
                text: 'text-emerald-700',
                border: 'border-emerald-200',
                icon: <MdCheckCircle size={14} className="text-emerald-600" />,
                label: 'Confirmed'
            };
            break;
        case 'CHECKED-IN':
        case 'ARRIVED':
        case 'WAITING':
            config = {
                bg: 'bg-blue-50',
                text: 'text-blue-700',
                border: 'border-blue-200',
                icon: <MdPersonPinCircle size={14} className="text-blue-600" />,
                label: status
            };
            break;
        case 'IN PROGRESS':
        case 'VITALS-DONE':
            config = {
                bg: 'bg-purple-50',
                text: 'text-purple-700',
                border: 'border-purple-200',
                icon: <MdMeetingRoom size={14} className="text-purple-600" />,
                label: status
            };
            break;
        case 'COMPLETED':
            config = {
                bg: 'bg-teal-50',
                text: 'text-teal-700',
                border: 'border-teal-200',
                icon: <MdCheckCircle size={14} className="text-teal-600" />,
                label: 'Completed'
            };
            break;
        case 'CANCELLED':
            config = {
                bg: 'bg-rose-50',
                text: 'text-rose-700',
                border: 'border-rose-200',
                icon: <MdCancel size={14} className="text-rose-600" />,
                label: 'Cancelled'
            };
            break;
        case 'PENDING':
            config = {
                bg: 'bg-amber-50',
                text: 'text-amber-700',
                border: 'border-amber-200',
                icon: <MdPendingActions size={14} className="text-amber-600" />,
                label: 'Pending'
            };
            break;
    }

    return (
        <span
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${config.bg} ${config.text} ${config.border} ${onClick ? 'cursor-pointer hover:shadow-sm hover:brightness-95 hover:scale-[1.02]' : ''} ${className}`}
            title={onClick ? "Click to toggle status" : ""}
        >
            {config.icon}
            <span>{config.label}</span>
        </span>
    );
};

export default StatusBadge;
