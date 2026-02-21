/**
 * LogoutConfirmModal.jsx
 * Reusable logout confirmation modal component
 * Follows the application theme with medical color scheme
 */

import React from 'react';
import { MdWarning, MdClose } from 'react-icons/md';
import './LogoutConfirmModal.css';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="logout-modal-overlay" onClick={onClose}>
      <div className="logout-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="logout-modal-close" onClick={onClose}>
          <MdClose size={24} />
        </button>

        {/* Icon */}
        <div className="logout-modal-icon">
          <MdWarning size={48} />
        </div>

        {/* Content */}
        <div className="logout-modal-body">
          <h2 className="logout-modal-title">Confirm Logout</h2>
          <p className="logout-modal-message">
            Are you sure you want to logout{userName ? `, ${userName}` : ''}?
          </p>
          <p className="logout-modal-submessage">
            You will need to login again to access the system.
          </p>
        </div>

        {/* Actions */}
        <div className="logout-modal-actions">
          <button className="logout-modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="logout-modal-btn confirm" onClick={onConfirm}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
