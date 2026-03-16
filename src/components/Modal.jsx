import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function Modal({
  isOpen,
  onClose,
  title,
  icon,
  maxWidth = 'max-w-2xl',
  footer,
  children,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    // Lock body scroll while modal is open
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Move focus into the dialog
    const focusable = dialogRef.current?.querySelector(FOCUSABLE_SELECTOR)
    focusable?.focus()

    // Trap focus within the dialog
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.()
        return
      }
      if (event.key !== 'Tab') return
      const focusableEls = Array.from(
        dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []
      )
      if (focusableEls.length === 0) return
      const first = focusableEls[0]
      const last = focusableEls[focusableEls.length - 1]
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal'}
    >
      <div
        ref={dialogRef}
        className={`w-full ${maxWidth} rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {icon && <span className="material-symbols-outlined text-slate-600">{icon}</span>}
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>

        {footer && <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
