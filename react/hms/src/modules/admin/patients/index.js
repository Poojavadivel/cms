/**
 * Patients module index
 * Exports the Patients component wrapped with ErrorBoundary
 */

import React from 'react';
import PatientsComponent from './Patients';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

const PatientsWithErrorBoundary = (props) => (
  <ErrorBoundary>
    <PatientsComponent {...props} />
  </ErrorBoundary>
);

export default PatientsWithErrorBoundary;
export { PatientsWithErrorBoundary as Patients };
