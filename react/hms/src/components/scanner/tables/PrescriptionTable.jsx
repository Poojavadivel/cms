/**
 * PrescriptionTable.jsx
 * Professional medication table for prescription verification
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

const PrescriptionTable = ({ rows, sectionIndex, onRowEdit, editedData }) => {
  // Extract medications
  const medications = rows.filter(row => 
    row.fieldName?.startsWith('medication_') || 
    (row.originalValue && typeof row.originalValue === 'object' && row.originalValue.name)
  );

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell><strong>Medicine Name</strong></TableCell>
            <TableCell><strong>Dosage</strong></TableCell>
            <TableCell><strong>Frequency</strong></TableCell>
            <TableCell><strong>Duration</strong></TableCell>
            <TableCell><strong>Instructions</strong></TableCell>
            <TableCell align="center"><strong>Confidence</strong></TableCell>
            <TableCell align="center"><strong>Action</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {medications.map((row, idx) => {
            const med = row.originalValue || {};
            const rowKey = `${sectionIndex}_${idx}`;
            const edited = editedData[`${rowKey}_currentValue`];

            return (
              <TableRow key={idx} hover>
                <TableCell>
                  <TextField
                    value={edited !== undefined ? edited.name : med.name || med.medicine_name || '-'}
                    onChange={(e) => onRowEdit(sectionIndex, idx, 'currentValue', {
                      ...med,
                      name: e.target.value
                    })}
                    size="small"
                    variant="standard"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={edited !== undefined ? edited.dose : med.dose || med.dosage || '-'}
                    onChange={(e) => onRowEdit(sectionIndex, idx, 'currentValue', {
                      ...med,
                      dose: e.target.value
                    })}
                    size="small"
                    variant="standard"
                    sx={{ width: '100px' }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={edited !== undefined ? edited.frequency : med.frequency || '-'}
                    onChange={(e) => onRowEdit(sectionIndex, idx, 'currentValue', {
                      ...med,
                      frequency: e.target.value
                    })}
                    size="small"
                    variant="standard"
                    sx={{ width: '80px' }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={edited !== undefined ? edited.duration : med.duration || '-'}
                    onChange={(e) => onRowEdit(sectionIndex, idx, 'currentValue', {
                      ...med,
                      duration: e.target.value
                    })}
                    size="small"
                    variant="standard"
                    sx={{ width: '80px' }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={edited !== undefined ? edited.instructions : med.instructions || '-'}
                    onChange={(e) => onRowEdit(sectionIndex, idx, 'currentValue', {
                      ...med,
                      instructions: e.target.value
                    })}
                    size="small"
                    variant="standard"
                    fullWidth
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${(row.confidence * 100).toFixed(0)}%`}
                    size="small"
                    color={row.confidence >= 0.9 ? 'success' : row.confidence >= 0.75 ? 'warning' : 'error'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PrescriptionTable;
