import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Standardized Modal Component
 * 
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Called when modal should close
 * @param {string} title - Header title
 * @param {React.ReactNode} icon - Optional icon for the header
 * @param {React.ReactNode} children - Modal content
 * @param {React.ReactNode} footer - Optional footer content
 * @param {string} maxWidth - Tailwind max-width class (default: max-w-3xl)
 */
export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  icon, 
  children, 
  footer, 
  maxWidth = 'max-w-3xl' 
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = 'unset';
      }, 200); // Match duration-200
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 relative transition-all duration-300 transform ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 bg-[#1162d4]/10 rounded-lg flex items-center justify-center">
                {typeof icon === 'string' ? (
                  <span className="material-symbols-outlined text-[#1162d4] text-xl">{icon}</span>
                ) : (
                  icon
                )}
              </div>
            )}
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar focus:outline-none">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
