/**
 * BillingTable.jsx
 * Professional billing items table
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
  Box,
  Typography
} from '@mui/material';

const BillingTable = ({ rows, sectionIndex, onRowEdit, editedData }) => {
  // Extract billing items
  const billingItems = rows.filter(row => 
    row.fieldName?.startsWith('item_') ||
    row.category === 'other' && row.dataType === 'object'
  );

  // Extract totals
  const totalAmount = rows.find(r => r.fieldName === 'total_amount')?.currentValue;
  const paidAmount = rows.find(r => r.fieldName === 'paid_amount')?.currentValue;
  const balance = rows.find(r => r.fieldName === 'balance')?.currentValue;

  return (
    <Box>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Item Description</strong></TableCell>
              <TableCell><strong>Quantity</strong></TableCell>
              <TableCell align="right"><strong>Amount</strong></TableCell>
              <TableCell align="center"><strong>Confidence</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billingItems.map((row, idx) => {
              const item = row.originalValue || {};
              const rowKey = `${sectionIndex}_${idx}`;
              const edited = editedData[`${rowKey}_currentValue`];

              return (
                <TableRow key={idx} hover>
                  <TableCell>
                    <TextField
                      value={edited !== undefined ? edited.description : item.description || '-'}
                      onChange={(e) => onRowEdit(sectionIndex, idx, 'currentValue', {
                        ...item,
                        description: e.target.value
                      })}
                      size="small"
                      variant="standard"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={edited !== undefined ? edited.quantity : item.quantity || '1'}
                      onChange={(e) => onRowEdit(sectionIndex, idx, 'currentValue', {
                        ...item,
                        quantity: e.target.value
                      })}
                      size="small"
                      variant="standard"
                      sx={{ width: '60px' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      value={edited !== undefined ? edited.amount : item.amount || '0'}
                      onChange={(e) => onRowEdit(sectionIndex, idx, 'currentValue', {
                        ...item,
                        amount: e.target.value
                      })}
                      size="small"
                      variant="standard"
                      sx={{ width: '100px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${(row.confidence * 100).toFixed(0)}%`}
                      size="small"
                      color={row.confidence >= 0.9 ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals */}
      <Paper sx={{ p: 2, bgcolor: '#f9f9f9' }}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body1"><strong>Total Amount:</strong></Typography>
          <Typography variant="body1" color="primary">{totalAmount || '-'}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body1"><strong>Paid Amount:</strong></Typography>
          <Typography variant="body1" color="success.main">{paidAmount || '-'}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6"><strong>Balance:</strong></Typography>
          <Typography variant="h6" color="error">{balance || '-'}</Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default BillingTable;
