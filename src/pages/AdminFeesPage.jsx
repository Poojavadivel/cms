import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAdmission } from "../context/AdmissionContext";
import { getUserSession } from "../auth/sessionController";

export default function AdminFeesPage() {
  const { approvedStudents } = useAdmission();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAssignFeeModal, setShowAssignFeeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [feeAssignments, setFeeAssignments] = useState(() => {
    const stored = localStorage.getItem('fee_assignments');
    return stored ? JSON.parse(stored) : [];
  });
  const [localApproved, setLocalApproved] = useState([]);

  useEffect(() => {
    setLocalApproved(approvedStudents);
  }, [approvedStudents]);

  // Get students who don't have fee assignments yet
  const unassignedStudents = localApproved.filter(student =>
    !feeAssignments.some(fee => fee.studentId === student.id)
  );

  const handleAssignFee = (student) => {
    setSelectedStudent(student);
    setShowAssignFeeModal(true);
  };

  const handleConfirmAssignFee = (feeData) => {
    const newAssignment = {
      id: `FEE${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      applicationId: selectedStudent.id,
      ...feeData,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'Assigned',
      paymentStatus: 'pending'
    };

    const updatedAssignments = [...feeAssignments, newAssignment];
    setFeeAssignments(updatedAssignments);
    localStorage.setItem('fee_assignments', JSON.stringify(updatedAssignments));
    
    // Also add to student fees
    const studentFeeData = {
      id: newAssignment.id,
      studentId: newAssignment.studentId,
      studentName: newAssignment.studentName,
      semester: newAssignment.semester.replace('Semester ', ''),
      amount: newAssignment.totalFee,
      paymentStatus: 'pending',
      transactionId: null,
      dueDate: newAssignment.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paidDate: null,
      course: newAssignment.course,
      feeBreakdown: {
        semesterFee: newAssignment.semesterFee,
        bookFee: newAssignment.bookFee,
        examFee: newAssignment.examFee,
        hostelFee: newAssignment.hostelFee,
        miscFee: newAssignment.miscFee
      }
    };
    
    const existingStudentFees = JSON.parse(localStorage.getItem('student_fees') || '[]');
    const updatedStudentFees = [...existingStudentFees, studentFeeData];
    localStorage.setItem('student_fees', JSON.stringify(updatedStudentFees));
    
    setShowAssignFeeModal(false);
    setSelectedStudent(null);
  };

  const handleDeleteAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteModal(true);
    setDeleteReason('');
  };

  const confirmDeleteAssignment = () => {
    if (!deleteReason.trim()) {
      alert('Please provide a reason for deleting this admission.');
      return;
    }

    // Remove from fee assignments
    const updatedAssignments = feeAssignments.filter(a => a.id !== selectedAssignment.id);
    setFeeAssignments(updatedAssignments);
    localStorage.setItem('fee_assignments', JSON.stringify(updatedAssignments));

    // Also remove from student fees
    const studentFees = JSON.parse(localStorage.getItem('student_fees') || '[]');
    const updatedStudentFees = studentFees.filter(f => f.id !== selectedAssignment.id);
    localStorage.setItem('student_fees', JSON.stringify(updatedStudentFees));

    // Remove any related invoices
    const invoices = JSON.parse(localStorage.getItem('admin_invoices') || '[]');
    const updatedInvoices = invoices.filter(inv => inv.generatedFrom !== selectedAssignment.id);
    localStorage.setItem('admin_invoices', JSON.stringify(updatedInvoices));

    // Log the deletion with reason
    const deletionLog = JSON.parse(localStorage.getItem('fee_deletion_log') || '[]');
    deletionLog.push({
      assignmentId: selectedAssignment.id,
      studentName: selectedAssignment.studentName,
      reason: deleteReason,
      deletedBy: 'Admin',
      deletedAt: new Date().toISOString()
    });
    localStorage.setItem('fee_deletion_log', JSON.stringify(deletionLog));

    alert(`Fee assignment for ${selectedAssignment.studentName} has been deleted.\nReason: ${deleteReason}`);
    setShowDeleteModal(false);
    setSelectedAssignment(null);
    setDeleteReason('');
  };

  const handleUpdatePaymentStatus = (assignmentId, newStatus) => {
    const updatedAssignments = feeAssignments.map(f => 
      f.id === assignmentId ? { ...f, paymentStatus: newStatus } : f
    );
    setFeeAssignments(updatedAssignments);
    localStorage.setItem('fee_assignments', JSON.stringify(updatedAssignments));
    
    // Also update in student fees
    const studentFees = JSON.parse(localStorage.getItem('student_fees') || '[]');
    const updatedStudentFees = studentFees.map(f => 
      f.id === assignmentId ? { ...f, paymentStatus: newStatus } : f
    );
    localStorage.setItem('student_fees', JSON.stringify(updatedStudentFees));
  };

  const handleGenerateInvoice = (assignment) => {
    const invoice = {
      id: `INV${Date.now()}`,
      studentId: assignment.studentId,
      studentName: assignment.studentName,
      applicationId: assignment.applicationId,
      course: assignment.course,
      semester: assignment.semester,
      invoiceDate: new Date().toISOString().split('T')[0],
      feeType: 'Semester Fee',
      paymentMethod: 'Pending',
      transactionId: null,
      paymentStatus: 'Pending',
      paymentDate: null,
      verifiedBy: null,
      items: [
        { description: 'Semester Fee', amount: assignment.semesterFee },
        { description: 'Book Fee', amount: assignment.bookFee },
        { description: 'Examination Fee', amount: assignment.examFee },
        ...(assignment.hostelFee > 0 ? [{ description: 'Hostel Fee', amount: assignment.hostelFee }] : []),
        ...(assignment.miscFee > 0 ? [{ description: 'Miscellaneous Fee', amount: assignment.miscFee }] : []),
      ],
      total: assignment.totalFee,
      generatedFrom: assignment.id
    };

    const existingInvoices = JSON.parse(localStorage.getItem('admin_invoices') || '[]');
    const updatedInvoices = [...existingInvoices, invoice];
    localStorage.setItem('admin_invoices', JSON.stringify(updatedInvoices));

    alert(`Invoice generated for ${assignment.studentName}`);
  };

  return (
    <Layout title="Admin Fee Management">
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Fee Management
        </h1>
        <p className="text-slate-500 mb-6">
          Assign fees to approved students
        </p>

        {/* Students needing fee assignment */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Students Awaiting Fee Assignment</h2>
          {unassignedStudents.length === 0 ? (
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-orange-300 mb-2">check_circle</span>
              <p className="text-slate-500">All approved students have been assigned fees</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedStudents.map(student => (
                <div key={student.id} className="bg-orange-50 rounded-xl border border-orange-200 p-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-green-600">check_circle</span>
                        <h3 className="text-lg font-semibold text-slate-900">{student.name}</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approved</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Application ID:</span>
                          <p>{student.id}</p>
                        </div>
                        <div>
                          <span className="font-medium">Course:</span>
                          <p>{student.course || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Email:</span>
                          <p>{student.email}</p>
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span>
                          <p>{student.phone}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignFee(student)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">assignment</span>
                      Assign Fee
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fee Assignments */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Fee Assignments</h2>
          {feeAssignments.length === 0 ? (
            <div className="bg-green-50 rounded-xl border border-green-200 p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-green-300 mb-2">receipt</span>
              <p className="text-slate-500">No fee assignments yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feeAssignments.map(assignment => (
                <div key={assignment.id} className="bg-green-50 rounded-xl border border-green-200 p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-blue-600">receipt</span>
                        <h3 className="text-lg font-semibold text-slate-900">{assignment.studentName}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Fee Assigned</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Application ID:</span>
                          <p>{assignment.applicationId}</p>
                        </div>
                        <div>
                          <span className="font-medium">Semester:</span>
                          <p>{assignment.semester}</p>
                        </div>
                        <div>
                          <span className="font-medium">Total Fee:</span>
                          <p className="font-semibold text-green-600">₹{assignment.totalFee?.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Assigned Date:</span>
                          <p>{assignment.assignedDate}</p>
                        </div>
                        <div>
                          <span className="font-medium">Payment Status:</span>
                          <p className={`font-semibold ${
                            assignment.paymentStatus === 'paid' ? 'text-green-600' : 
                            assignment.paymentStatus === 'pending' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {assignment.paymentStatus?.toUpperCase() || 'PENDING'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-white rounded-lg">
                        <h4 className="font-medium text-slate-700 mb-2">Fee Breakdown:</h4>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          <div className="flex justify-between">
                            <span>Semester Fee:</span>
                            <span>₹{assignment.semesterFee?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Book Fee:</span>
                            <span>₹{assignment.bookFee?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Exam Fee:</span>
                            <span>₹{assignment.examFee?.toLocaleString()}</span>
                          </div>
                          {assignment.hostelFee > 0 && (
                            <div className="flex justify-between">
                              <span>Hostel Fee:</span>
                              <span>₹{assignment.hostelFee?.toLocaleString()}</span>
                            </div>
                          )}
                          {assignment.miscFee > 0 && (
                            <div className="flex justify-between">
                              <span>Misc Fee:</span>
                              <span>₹{assignment.miscFee?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateInvoice(assignment)}
                      className="flex-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <span className="material-symbols-outlined text-sm">description</span>
                      Generate Invoice
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(assignment)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                      title="Delete Assignment"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign Fee Modal */}
        {showAssignFeeModal && selectedStudent && (
          <AssignFeeModal
            student={selectedStudent}
            onConfirm={handleConfirmAssignFee}
            onCancel={() => {
              setShowAssignFeeModal(false);
              setSelectedStudent(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Delete Fee Assignment</h3>
              <p className="text-slate-600 mb-4">
                Are you sure you want to delete this admission for {selectedAssignment.studentName}?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for deletion <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="Please provide a reason for deleting this admission..."
                  required
                />
              </div>
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-red-800 mb-2">Warning:</h4>
                <p className="text-sm text-red-700">
                  This action will permanently delete:
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1">
                  <li>• Fee assignment for {selectedAssignment.studentName}</li>
                  <li>• Student fee record</li>
                  <li>• Any related invoices</li>
                  <li>• Payment history</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteAssignment}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedAssignment(null);
                    setDeleteReason('');
                  }}
                  className="flex-1 bg-slate-300 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Assign Fee Modal Component
function AssignFeeModal({ student, onConfirm, onCancel }) {
  const [formData, setFormData] = useState({
    semester: '',
    isFirstGraduate: false,
    needsHostel: false,
    isAcHostel: false,
    course: student.course || '',
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fee calculations
  const semesterFee = formData.isFirstGraduate ? 85000 : 110000;
  const bookFee = 3950; // per semester
  const examFee = 250; // per semester (includes exam booklet)
  const hostelFee = formData.needsHostel
    ? (formData.isAcHostel ? 55000 + 60000 : 55000 + 30000) // mess + accommodation per year
    : 0;
  const miscFee = 10000; // placement + training
  const totalFee = semesterFee + bookFee + examFee + hostelFee + miscFee;

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const feeData = {
      semester: formData.semester,
      semesterFee,
      bookFee,
      examFee,
      hostelFee,
      miscFee,
      totalFee,
      isFirstGraduate: formData.isFirstGraduate,
      needsHostel: formData.needsHostel,
      isAcHostel: formData.isAcHostel,
      course: formData.course,
    };
    onConfirm(feeData);
    setShowConfirm(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onCancel();
    }, 2000);
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Confirm Fee Assignment</h3>
          <p className="text-slate-600 mb-6">
            Are you sure to assign fee to student {student.name}?
          </p>
          <div className="bg-slate-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-slate-800 mb-2">Fee Summary:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Semester Fee:</span>
                <span>₹{semesterFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Book Fee:</span>
                <span>₹{bookFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Exam Fee:</span>
                <span>₹{examFee.toLocaleString()}</span>
              </div>
              {hostelFee > 0 && (
                <div className="flex justify-between">
                  <span>Hostel Fee:</span>
                  <span>₹{hostelFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Misc Fee:</span>
                <span>₹{miscFee.toLocaleString()}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>₹{totalFee.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 bg-slate-300 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Success!</h3>
          <p className="text-slate-600">Successfully assigned fees to {student.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Assign Fee for {student.name}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Student Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Application ID:</span>
                  <p className="text-slate-700">{student.id}</p>
                </div>
                <div>
                  <span className="font-medium">Name:</span>
                  <p className="text-slate-700">{student.name}</p>
                </div>
              </div>
            </div>

            {/* Fee Assignment Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Semester</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter course name"
                  required
                />
              </div>
            </div>

            {/* Fee Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="firstGraduate"
                  checked={formData.isFirstGraduate}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFirstGraduate: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="firstGraduate" className="ml-2 text-sm text-slate-700">
                  First Graduate (₹85,000 semester fee instead of ₹1,10,000)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="needsHostel"
                  checked={formData.needsHostel}
                  onChange={(e) => setFormData(prev => ({ ...prev, needsHostel: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="needsHostel" className="ml-2 text-sm text-slate-700">
                  Needs Hostel Accommodation
                </label>
              </div>

              {formData.needsHostel && (
                <div className="flex items-center ml-6">
                  <input
                    type="checkbox"
                    id="acHostel"
                    checked={formData.isAcHostel}
                    onChange={(e) => setFormData(prev => ({ ...prev, isAcHostel: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="acHostel" className="ml-2 text-sm text-slate-700">
                    AC Hostel (+₹30,000 for accommodation)
                  </label>
                </div>
              )}
            </div>

            {/* Fee Summary */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold text-slate-800 mb-2">Fee Summary:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Semester Fee:</span>
                  <span>₹{semesterFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Book Fee:</span>
                  <span>₹{bookFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exam Fee:</span>
                  <span>₹{examFee.toLocaleString()}</span>
                </div>
                {hostelFee > 0 && (
                  <div className="flex justify-between">
                    <span>Hostel Fee:</span>
                    <span>₹{hostelFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Misc Fee:</span>
                  <span>₹{miscFee.toLocaleString()}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>₹{totalFee.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign Fee
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-slate-300 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
