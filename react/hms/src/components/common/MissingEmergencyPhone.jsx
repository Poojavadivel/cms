/**
 * MissingEmergencyPhone.jsx
 * Critical visual warning for missing emergency contact phone number.
 * Renders an actionable red CTA button when onEdit is available,
 * or a static red warning badge when it is not.
 */

import React from 'react';

const MissingEmergencyPhone = ({ onEdit, patient }) => {
  if (onEdit) {
    return (
      <button
        type="button"
        onClick={() => onEdit(patient)}
        className="flex items-center gap-1.5 text-red-600 hover:text-red-800 text-sm font-bold bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200 transition-colors cursor-pointer"
        title="Click to add emergency phone number"
      >
        ⚠️ Add Emergency Phone
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-red-600 text-sm font-semibold bg-red-50 px-2 py-1 rounded border border-red-200">
      ⚠️ Emergency Phone Missing
    </span>
  );
};

export default MissingEmergencyPhone;
