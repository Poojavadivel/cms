/**
 * PathologyTable.jsx
 * Editable pathology/lab tests table matching Flutter's CustomEditableTable
 * 
 * Features:
 * - Editable cells for all fields
 * - Add/remove rows
 * - Category dropdown
 * - Priority dropdown
 * - Notes field
 * - Alternating row colors
 * - Responsive design
 */

import React from 'react';
import { MdAdd, MdDelete } from 'react-icons/md';
import './PathologyTable.css';

const PathologyTable = ({ rows, onRowsChanged }) => {
  const columns = ['Test Name', 'Category', 'Priority', 'Notes'];

  const addRow = () => {
    const newRow = {
      'Test Name': '',
      'Category': '',
      'Priority': '',
      'Notes': '',
    };
    onRowsChanged([...rows, newRow]);
  };

  const deleteRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    onRowsChanged(updatedRows);
  };

  const updateRow = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    onRowsChanged(updatedRows);
  };

  const categoryOptions = [
    'Blood Test',
    'Urine Test',
    'X-Ray',
    'Ultrasound',
    'CT Scan',
    'MRI',
    'ECG',
    'Echo',
    'Biopsy',
    'Culture',
    'Other',
  ];

  const priorityOptions = [
    'Routine',
    'Urgent',
    'STAT',
  ];

  return (
    <div className="pathology-table-container">
      {/* Table */}
      <div className="pathology-table-wrapper">
        <table className="pathology-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col.toUpperCase()}</th>
              ))}
              <th className="pathology-actions-col">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="pathology-empty-state">
                  No items — add one using the Add button.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                  {/* Test Name */}
                  <td>
                    <input
                      type="text"
                      value={row['Test Name'] || ''}
                      onChange={(e) => updateRow(index, 'Test Name', e.target.value)}
                      placeholder="Test Name"
                      className="pathology-input"
                    />
                  </td>
                  
                  {/* Category */}
                  <td>
                    <select
                      value={row['Category'] || ''}
                      onChange={(e) => updateRow(index, 'Category', e.target.value)}
                      className="pathology-select"
                    >
                      <option value="">Select category...</option>
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                  
                  {/* Priority */}
                  <td>
                    <select
                      value={row['Priority'] || ''}
                      onChange={(e) => updateRow(index, 'Priority', e.target.value)}
                      className="pathology-select"
                    >
                      <option value="">Select priority...</option>
                      {priorityOptions.map(pri => (
                        <option key={pri} value={pri}>{pri}</option>
                      ))}
                    </select>
                  </td>
                  
                  {/* Notes */}
                  <td>
                    <input
                      type="text"
                      value={row['Notes'] || ''}
                      onChange={(e) => updateRow(index, 'Notes', e.target.value)}
                      placeholder="Notes"
                      className="pathology-input"
                    />
                  </td>
                  
                  {/* Actions */}
                  <td className="pathology-actions-col">
                    <button
                      className="pathology-delete-btn"
                      onClick={() => deleteRow(index)}
                      title="Delete test"
                    >
                      <MdDelete size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="pathology-footer">
        <button className="pathology-add-btn" onClick={addRow}>
          <MdAdd size={20} />
          Add Test
        </button>
      </div>
    </div>
  );
};

export default PathologyTable;
