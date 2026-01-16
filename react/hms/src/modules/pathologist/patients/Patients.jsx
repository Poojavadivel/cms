/**
 * Patients.jsx
 * Pathologist patients page - placeholder for future implementation
 */

import React from 'react';
import { MdPeople } from 'react-icons/md';
import './Patients.css';

const Patients = () => {
  return (
    <div className="pathologist-patients-page">
      <div className="coming-soon-container">
        <div className="coming-soon-icon">
          <MdPeople size={64} />
        </div>
        <h1>Patient Test History</h1>
        <p>Coming Soon</p>
      </div>
    </div>
  );
};

export default Patients;
