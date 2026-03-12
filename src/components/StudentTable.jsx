import { useNavigate } from 'react-router-dom'

export default function StudentTable({ students, onEdit, onDelete }) {
  const navigate = useNavigate()

  function getStatusClass(status) {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE': return 'stu-badge stu-badge-green'
      case 'PENDING': return 'stu-badge stu-badge-orange'
      case 'INACTIVE': return 'stu-badge stu-badge-red'
      case 'GRADUATED': return 'stu-badge stu-badge-blue'
      default: return 'stu-badge'
    }
  }

  function getFeeClass(feeStatus) {
    switch ((feeStatus || 'PENDING').toUpperCase()) {
      case 'PAID': return 'stu-badge stu-badge-green'
      case 'OVERDUE': return 'stu-badge stu-badge-red'
      case 'PARTIAL':
      case 'PENDING': return 'stu-badge stu-badge-orange'
      default: return 'stu-badge'
    }
  }

  const isProfileComplete = (student) => {
    const requiredFields = [
      'name',
      'email',
      'phone',
      'guardian',
      'guardianPhone',
      'dob',
      'departmentId',
      'year',
      'semester'
    ];
    return requiredFields.every(field => {
      const val = student[field];
      return val !== undefined && val !== null && val !== '';
    });
  };

  const handleRowClick = (s) => {
    if (isProfileComplete(s)) {
      navigate(`/students/${encodeURIComponent(s.rollNumber || s._id)}`);
    } else {
      alert(`Profile Incomplete: ${s.name}'s profile is missing required information. Please edit the student to complete their profile before viewing the detail page.`);
    }
  };

  return (
    <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="students-table">
        <thead>
          <tr>
            <th>Student Information</th>
            <th>Department</th>
            <th>Semester</th>
            <th>Status</th>
            <th>Fee Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '64px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No students found matching your search</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your filters or search terms</div>
              </td>
            </tr>
          ) : (
            students.map((s) => (
              <tr
                key={s.rollNumber || s._id}
                onClick={() => handleRowClick(s)}
                style={{ cursor: isProfileComplete(s) ? 'pointer' : 'not-allowed', opacity: isProfileComplete(s) ? 1 : 0.8 }}
              >
                <td>
                  <div className="stu-info-cell">
                    <div className="stu-avatar">
                      <img
                        src={s.avatar || `https://ui-avatars.com/api/?name=${s.name}&background=2563eb&color=fff&bold=true`}
                        alt={s.name}
                      />
                    </div>
                    <div>
                      <div className="stu-name">{s.name}</div>
                      <div className="stu-id">{s.rollNumber || s.id}</div>
                    </div>
                  </div>
                </td>
                <td>{s.departmentId || s.department}</td>
                <td>
                  <div className="stu-name">Sem {s.semester || '1'}</div>
                  <div className="stu-id">{s.year ? `${s.year}${s.year === 1 ? 'st' : s.year === 2 ? 'nd' : s.year === 3 ? 'rd' : 'th'} Year` : '1st Year'}</div>
                </td>
                <td>
                  <span className={getStatusClass(s.status)}>{s.status}</span>
                </td>
                <td>
                  <span className={getFeeClass(s.feeStatus)}>{s.feeStatus || 'pending'}</span>
                </td>
                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  <div className="stu-actions">
                    <button
                      onClick={() => onEdit && onEdit(s)}
                      className="stu-action-btn"
                      title="Edit Student"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(s)}
                      className="stu-action-btn stu-action-btn-danger"
                      title="Delete Student"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
