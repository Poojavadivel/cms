/**
 * MedicalHistoryTable.jsx
 * Generic table for medical history and other data
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
  Chip
} from '@mui/material';

const MedicalHistoryTable = ({ rows, sectionIndex, onRowEdit, editedData }) => {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell width="30%"><strong>Field</strong></TableCell>
            <TableCell width="50%"><strong>Value</strong></TableCell>
            <TableCell align="center"><strong>Confidence</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => {
            const rowKey = `${sectionIndex}_${idx}`;
            const edited = editedData[`${rowKey}_currentValue`];

            return (
              <TableRow key={idx} hover>
                <TableCell><strong>{row.displayLabel}</strong></TableCell>
                <TableCell>
                  <TextField
                    value={edited !== undefined ? edited : row.currentValue}
                    onChange={(e) => onRowEdit(sectionIndex, idx, 'currentValue', e.target.value)}
                    size="small"
                    variant="standard"
                    fullWidth
                    multiline
                    rows={String(row.currentValue).length > 100 ? 3 : 1}
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MedicalHistoryTable;
