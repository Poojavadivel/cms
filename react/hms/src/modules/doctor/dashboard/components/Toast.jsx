/**
 * Toast.jsx — Global toast notification system
 * Usage: import { useToast } from './Toast';
 *        const { showToast } = useToast();
 *        showToast('Failed to load patient history', 'error');
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container" role="region" aria-label="Notifications">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast--${toast.type}`} role="alert">
                        <span className="toast__icon">{toastIcon(toast.type)}</span>
                        <span className="toast__message">{toast.message}</span>
                        <button className="toast__close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">✕</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
};

function toastIcon(type) {
    switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
    }
}

export default ToastProvider;
