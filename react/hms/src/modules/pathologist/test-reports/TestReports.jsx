/**
 * TestReports.jsx
 * Pathologist test reports page - reuses admin pathology components for consistent theme
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Pathology from '../../admin/pathology/Pathology';

// Wrapper component that handles patient filtering from navigation state
const TestReports = () => {
  const location = useLocation();
  const [initialSearch, setInitialSearch] = useState('');

  useEffect(() => {
    // Check if we received patient filter from navigation state
    if (location.state?.patientFilter) {
      setInitialSearch(location.state.patientFilter);
      console.log('🔍 Filtering test reports for patient:', location.state.patientFilter);
    }
  }, [location.state]);

  return <Pathology initialSearchQuery={initialSearch} />;
};

export default TestReports;
