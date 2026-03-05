/**
 * LabReportTable.jsx
 * Professional lab test results table with color-coded status
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
import {
  Edit as EditIcon,
  TrendingUp as HighIcon,
  TrendingDown as LowIcon,
  CheckCircle as NormalIcon
} from '@mui/icons-material';

const LabReportTable = ({ rows, sectionIndex, onRowEdit, editedData }) => {
  // Extract lab results from rows
  const labResults = rows.filter(row => row.category === 'lab_results' && row.originalValue);

  const getStatusColor = (status) => {
    if (!status) return 'default';
    const s = status.toUpperCase();
    if (s.includes('HIGH') || s.includes('ABNORMAL')) return 'error';
    if (s.includes('LOW')) return 'warning';
    if (s.includes('NORMAL')) return 'success';
    return 'default';
  };

  const getStatusIcon = (status) => {
    if (!status) return null;
    const s = status.toUpperCase();
    if (s.includes('HIGH')) return <HighIcon fontSize="small" />;
    if (s.includes('LOW')) return <LowIcon fontSize="small" />;
    if (s.includes('NORMAL')) return <NormalIcon fontSize="small" />;
    return null;
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell><strong>Test Name</strong></TableCell>
            <TableCell><strong>Value</strong></TableCell>
            <TableCell><strong>Unit</strong></TableCell>
            <TableCell><strong>Reference Range</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell align="center"><strong>Confidence</strong></TableCell>
            <TableCell align="center"><strong>Action</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {labResults.map((row, idx) => {
            const result = row.originalValue || {};
            const rowKey = `${sectionIndex}_${idx}`;
            const edited = editedData[`${rowKey}_currentValue`];

            return (
              <TableRow key={idx} hover>
                <TableCell>
                  <strong>{result.testName || 'Unknown Test'}</strong>
                </TableCell>
                <TableCell>
                  <TextField
                    value={edited !== undefined ? edited.value : result.value}
                    onChange={(e) => onRowEdit(sectionIndex, idx, 'currentValue', {
                      ...result,
                      value: e.target.value
                    })}
                    size="small"
                    variant="standard"
                    sx={{ width: '100px' }}
                  />
                </TableCell>
                <TableCell>{result.unit || '-'}</TableCell>
                <TableCell>
                  {result.referenceRange || 
                    (result.referenceMin && result.referenceMax 
                      ? `${result.referenceMin}-${result.referenceMax}` 
                      : '-')}
                </TableCell>
                <TableCell>
                  {result.flag ? (
                    <Chip
                      label={result.flag}
                      color={getStatusColor(result.flag)}
                      size="small"
                      icon={getStatusIcon(result.flag)}
                    />
                  ) : (
                    <span>-</span>
                  )}
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

export default LabReportTable;
