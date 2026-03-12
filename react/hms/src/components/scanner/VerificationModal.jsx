/**
 * VerificationModal.jsx
 * Professional table-based verification UI
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import BillingTable from './tables/BillingTable';
import LabReportTable from './tables/LabReportTable';
import PrescriptionTable from './tables/PrescriptionTable';
import VitalsTable from './tables/VitalsTable';
import MedicalHistoryTable from './tables/MedicalHistoryTable';
import './VerificationModal.css';

const VerificationModal = ({ open, onClose, verificationData, onConfirm, onReject }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editedData, setEditedData] = useState({});

  // Group data rows by section
  const groupedSections = useMemo(() => {
    if (!verificationData?.dataRows) return [];

    const sections = [];
    let currentSection = null;

    verificationData.dataRows.forEach((row) => {
      if (row.dataType === 'section_header' || row.category === 'section') {
        if (currentSection && currentSection.rows.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          id: row.sectionIndex || sections.length,
          heading: row.displayLabel || row.currentValue,
          type: row.schemaType || row.sectionType || 'GENERAL',
          rows: []
        };
      } else if (currentSection) {
        currentSection.rows.push(row);
      }
    });

    if (currentSection && currentSection.rows.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }, [verificationData]);

  const tabs = groupedSections.map((section) => ({
    label: section.heading.replace(/━/g, '').replace(/SECTION \d+:/g, '').trim(),
    type: section.type,
    count: section.rows.length
  }));

  const handleRowEdit = (sectionIndex, rowIndex, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [`${sectionIndex}_${rowIndex}_${field}`]: value
    }));
  };

  const handleDownload = () => {
    const exportData = {
      documentType: verificationData.documentType,
      fileName: verificationData.fileName,
      sections: groupedSections.map(section => ({
        heading: section.heading,
        type: section.type,
        data: section.rows.map(row => ({
          field: row.fieldName,
          value: row.currentValue,
          confidence: row.confidence
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${verificationData.fileName}_extracted.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirm = () => {
    const updatedRows = verificationData.dataRows.map((row, idx) => {
      const key = `${row.sectionIndex || 0}_${idx}_currentValue`;
      if (editedData[key] !== undefined) {
        return { ...row, currentValue: editedData[key], wasEdited: true };
      }
      return row;
    });

    onConfirm({ ...verificationData, dataRows: updatedRows });
  };

  if (!verificationData) return null;

  const currentSection = groupedSections[activeTab];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={2} alignItems="center">
            <Typography variant="h6">Verify Extracted Data</Typography>
            <Chip label={verificationData.documentType} color="primary" size="small" />
          </Box>
          <Box>
            <Tooltip title="Download Data">
              <IconButton onClick={handleDownload}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable">
            {tabs.map((tab, idx) => (
              <Tab key={idx} label={<><span>{tab.label}</span> <Chip label={tab.count} size="small" /></>} />
            ))}
          </Tabs>
        </Box>

        {currentSection && (
          <SectionTable
            section={currentSection}
            sectionIndex={activeTab}
            onRowEdit={handleRowEdit}
            editedData={editedData}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onReject} startIcon={<ErrorIcon />} color="error" variant="outlined">
          Reject
        </Button>
        <Button onClick={handleConfirm} startIcon={<CheckIcon />} color="success" variant="contained">
          Confirm & Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SectionTable = ({ section, sectionIndex, onRowEdit, editedData }) => {
  const type = section.type.toUpperCase();

  switch (type) {
    case 'BILLING':
      return <BillingTable rows={section.rows} sectionIndex={sectionIndex} onRowEdit={onRowEdit} editedData={editedData} />;
    case 'LAB_REPORT':
      return <LabReportTable rows={section.rows} sectionIndex={sectionIndex} onRowEdit={onRowEdit} editedData={editedData} />;
    case 'PRESCRIPTION':
      return <PrescriptionTable rows={section.rows} sectionIndex={sectionIndex} onRowEdit={onRowEdit} editedData={editedData} />;
    case 'VITALS':
    case 'MEDICAL_HISTORY':
      return <VitalsTable rows={section.rows} sectionIndex={sectionIndex} onRowEdit={onRowEdit} editedData={editedData} />;
    default:
      return <MedicalHistoryTable rows={section.rows} sectionIndex={sectionIndex} onRowEdit={onRowEdit} editedData={editedData} />;
  }
};

export default VerificationModal;
