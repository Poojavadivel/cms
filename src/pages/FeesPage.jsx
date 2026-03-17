import { useState, useMemo, useEffect } from "react";
import Layout from "../components/Layout";
import { getUserSession } from "../auth/sessionController";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function FeesPage() {

  const session = getUserSession();
  const isStudent = session?.role === "student";
  const currentUserId = session?.userId;

  const [fees, setFees] = useState([]); // Start with empty array

  // Load fees from admin assignments on component mount
  useEffect(() => {
    const loadFees = () => {
      const feeAssignments = JSON.parse(localStorage.getItem('fee_assignments') || '[]');
      if (feeAssignments.length > 0) {
        const studentFees = feeAssignments.map(assignment => ({
          id: assignment.id,
          studentId: assignment.studentId,
          studentName: assignment.studentName,
          applicationId: assignment.applicationId,
          semester: assignment.semester,
          course: assignment.course,
          totalFee: assignment.totalFee,
          assignedDate: assignment.assignedDate,
          paymentStatus: assignment.paymentStatus || 'pending',
          semesterFee: assignment.semesterFee,
          bookFee: assignment.bookFee,
          examFee: assignment.examFee,
          hostelFee: assignment.hostelFee,
          miscFee: assignment.miscFee,
          feeBreakdown: {
            semesterFee: assignment.semesterFee,
            bookFee: assignment.bookFee,
            examFee: assignment.examFee,
            hostelFee: assignment.hostelFee,
            miscFee: assignment.miscFee
          }
        }));
        setFees(studentFees);
      } else {
        // Only use fallback if no admin assignments exist
        setFees([
          { id:"SEM1", studentId:"STU-2024-1547", studentName:"John Anderson", semester:1, amount:5000, paymentStatus:"paid", transactionId:"TXN1001", dueDate:"2026-01-10", paidDate:"2026-01-05" },
          { id:"SEM2", studentId:"STU-2024-1547", studentName:"John Anderson", semester:2, amount:5000, paymentStatus:"paid", transactionId:"TXN1002", dueDate:"2026-02-10", paidDate:"2026-02-05" },
          { id:"SEM3", studentId:"STU-2024-1547", studentName:"John Anderson", semester:3, amount:5000, paymentStatus:"paid", transactionId:"TXN1003", dueDate:"2026-03-10", paidDate:"2026-03-05" },
          { id:"SEM4", studentId:"STU-2024-1547", studentName:"John Anderson", semester:4, amount:5000, paymentStatus:"paid", transactionId:"TXN1004", dueDate:"2026-04-10", paidDate:"2026-04-05" },
          { id:"SEM5", studentId:"STU-2024-1547", studentName:"John Anderson", semester:5, amount:5000, paymentStatus:"pending", transactionId:null, dueDate:"2026-05-10" },
          { id:"SEM6", studentId:"STU-2024-1547", studentName:"John Anderson", semester:6, amount:5000, paymentStatus:"pending", transactionId:null, dueDate:"2026-06-10" },
          { id:"SEM7", studentId:"STU-2024-1547", studentName:"John Anderson", semester:7, amount:5000, paymentStatus:"pending", transactionId:null, dueDate:"2026-07-10" },
          { id:"SEM8", studentId:"STU-2024-1547", studentName:"John Anderson", semester:8, amount:5000, paymentStatus:"pending", transactionId:null, dueDate:"2026-08-10" }
        ]);
      }
    };
    
    loadFees();
  }, []);

  const [selectedFee,setSelectedFee] = useState(null);
  const [paymentMethod,setPaymentMethod] = useState("debit");
  const [searchName, setSearchName] = useState("");
  const [searchDepartment, setSearchDepartment] = useState("");

  const displayFees = useMemo(() => {
    let filteredFees = fees;
    
    // Apply search filters for all users
    if (searchName) {
      filteredFees = filteredFees.filter(f => 
        f.studentName.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    if (searchDepartment) {
      filteredFees = filteredFees.filter(f => 
        f.course && f.course.toLowerCase().includes(searchDepartment.toLowerCase())
      );
    }
    
    // Show all admin fee containers (not filtered by student)
    // Students can see all fees and pay for their own
    return filteredFees;
  }, [fees, searchName, searchDepartment]);

  // Listen for storage changes to auto-update when admin assigns fees
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'fee_assignments') {
        const feeAssignments = JSON.parse(localStorage.getItem('fee_assignments') || '[]');
        if (feeAssignments.length > 0) {
          const studentFees = feeAssignments.map(assignment => ({
            id: assignment.id,
            studentId: assignment.studentId,
            studentName: assignment.studentName,
            applicationId: assignment.applicationId,
            semester: assignment.semester,
            course: assignment.course,
            totalFee: assignment.totalFee,
            assignedDate: assignment.assignedDate,
            paymentStatus: assignment.paymentStatus || 'pending',
            semesterFee: assignment.semesterFee,
            bookFee: assignment.bookFee,
            examFee: assignment.examFee,
            hostelFee: assignment.hostelFee,
            miscFee: assignment.miscFee,
            feeBreakdown: {
              semesterFee: assignment.semesterFee,
              bookFee: assignment.bookFee,
              examFee: assignment.examFee,
              hostelFee: assignment.hostelFee,
              miscFee: assignment.miscFee
            }
          }));
          setFees(studentFees);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const downloadPDF = async (fee) => {
    try {
      const pdf = new jsPDF();
      
      // Add custom font for better Unicode support
      pdf.setFont('helvetica');
      
      // Title
      pdf.setFontSize(20);
      pdf.text('FEE RECEIPT', 105, 20, { align: 'center' });
      
      // Line separator
      pdf.setLineWidth(0.5);
      pdf.line(20, 30, 190, 30);
      
      // Fee details
      pdf.setFontSize(12);
      let yPosition = 45;
      
      pdf.text(`Fee ID: ${fee.id}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Semester: ${fee.semester}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Student: ${fee.studentName}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Student ID: ${fee.studentId}`, 20, yPosition);
      yPosition += 10;
      
      // Amount in larger font
      pdf.setFontSize(16);
      pdf.text(`Amount: ₹${fee.totalFee || fee.amount}`, 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      pdf.text(`Status: ${fee.paymentStatus.toUpperCase()}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Transaction: ${fee.transactionId || "Pending"}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Assigned Date: ${fee.assignedDate || fee.dueDate}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Paid Date: ${fee.paidDate || "-"}`, 20, yPosition);
      yPosition += 10;
      
      // Fee breakdown if available
      if (fee.feeBreakdown) {
        yPosition += 10;
        pdf.setFontSize(14);
        pdf.text('Fee Breakdown:', 20, yPosition);
        yPosition += 10;
        pdf.setFontSize(11);
        
        if (fee.feeBreakdown.semesterFee) {
          pdf.text(`  Semester Fee: ₹${fee.feeBreakdown.semesterFee.toLocaleString()}`, 25, yPosition);
          yPosition += 8;
        }
        if (fee.feeBreakdown.bookFee) {
          pdf.text(`  Book Fee: ₹${fee.feeBreakdown.bookFee.toLocaleString()}`, 25, yPosition);
          yPosition += 8;
        }
        if (fee.feeBreakdown.examFee) {
          pdf.text(`  Exam Fee: ₹${fee.feeBreakdown.examFee.toLocaleString()}`, 25, yPosition);
          yPosition += 8;
        }
        if (fee.feeBreakdown.hostelFee) {
          pdf.text(`  Hostel Fee: ₹${fee.feeBreakdown.hostelFee.toLocaleString()}`, 25, yPosition);
          yPosition += 8;
        }
        if (fee.feeBreakdown.miscFee) {
          pdf.text(`  Misc Fee: ₹${fee.feeBreakdown.miscFee.toLocaleString()}`, 25, yPosition);
          yPosition += 8;
        }
      }
      
      // Footer
      pdf.line(20, 270, 190, 270);
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
      
      // Save the PDF
      pdf.save(`fee_receipt_${fee.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text download
      const content = `
FEE RECEIPT
================
Fee ID: ${fee.id}
Semester: ${fee.semester}
Student: ${fee.studentName}
Student ID: ${fee.studentId}
Amount: ₹${fee.totalFee || fee.amount}
Status: ${fee.paymentStatus}
Transaction: ${fee.transactionId || "Pending"}
Assigned Date: ${fee.assignedDate || fee.dueDate}
Paid Date: ${fee.paidDate || "-"}
${fee.feeBreakdown ? `
Fee Breakdown:
${fee.feeBreakdown.semesterFee ? `Semester Fee: ₹${fee.feeBreakdown.semesterFee}\n` : ''}
${fee.feeBreakdown.bookFee ? `Book Fee: ₹${fee.feeBreakdown.bookFee}\n` : ''}
${fee.feeBreakdown.examFee ? `Exam Fee: ₹${fee.feeBreakdown.examFee}\n` : ''}
${fee.feeBreakdown.hostelFee ? `Hostel Fee: ₹${fee.feeBreakdown.hostelFee}\n` : ''}
${fee.feeBreakdown.miscFee ? `Misc Fee: ₹${fee.feeBreakdown.miscFee}\n` : ''}` : ''}
Generated on: ${new Date().toLocaleString()}
`;

      const element = document.createElement("a");
      element.setAttribute("href","data:text/plain;charset=utf-8," + encodeURIComponent(content));
      element.setAttribute("download",`receipt_${fee.id}.txt`);
      element.click();
    }
  };

  const processPayment = () => {
    const transactionId = "TXN" + Math.floor(Math.random()*1000000);
    const today = new Date().toISOString().split("T")[0];

    // Show GPay-like payment modal
    const paymentModal = document.createElement('div');
    paymentModal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50';
    paymentModal.innerHTML = `
      <div class="bg-white p-8 rounded-2xl w-[500px] h-[450px] shadow-2xl">
        <div class="text-center">
          <div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-2">GPay Payment</h3>
          <p class="text-gray-600 mb-2">Paying to College Management System</p>
          <div class="bg-gray-100 rounded-lg p-4 mb-4">
            <p class="text-lg font-bold">₹${selectedFee.totalFee || selectedFee.amount}</p>
            <p class="text-sm text-gray-500">${selectedFee.studentName} - Semester ${selectedFee.semester}</p>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div class="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full animate-pulse" style="width: 0%" id="progressBar"></div>
          </div>
          <p class="text-sm text-gray-500 mb-4">Processing payment...</p>
        </div>
      </div>
    `;
    document.body.appendChild(paymentModal);

    // Animate progress bar
    let progress = 0;
    const progressBar = paymentModal.querySelector('#progressBar');
    const progressInterval = setInterval(() => {
      progress += 20;
      progressBar.style.width = progress + '%';
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, 400);

    // Simulate payment processing
    setTimeout(() => {
      // Update payment modal to show success
      paymentModal.innerHTML = `
        <div class="bg-white p-8 rounded-2xl w-[500px] h-[450px] shadow-2xl">
          <div class="text-center">
            <div class="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h3>
            <div class="bg-green-50 rounded-lg p-4 mb-4">
              <p class="text-lg font-bold text-green-700">₹${selectedFee.totalFee || selectedFee.amount}</p>
              <p class="text-sm text-gray-600">Transaction ID: ${transactionId}</p>
              <p class="text-sm text-gray-500">Paid to: College Management System</p>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold">
              Done
            </button>
          </div>
        </div>
      `;

      // Update fee status
      const updatedFees = fees.map(f =>
        f.id === selectedFee.id
          ? {
              ...f,
              paymentStatus:"paid",
              transactionId:transactionId,
              paidDate:today
            }
          : f
      );
      
      setFees(updatedFees);
      localStorage.setItem('student_fees', JSON.stringify(updatedFees));
      
      // Also update in admin fee assignments
      const feeAssignments = JSON.parse(localStorage.getItem('fee_assignments') || '[]');
      const updatedAssignments = feeAssignments.map(f => 
        f.id === selectedFee.id ? { ...f, paymentStatus: 'paid' } : f
      );
      localStorage.setItem('fee_assignments', JSON.stringify(updatedAssignments));
      
      // Check if invoice already exists for this fee
      const existingInvoices = JSON.parse(localStorage.getItem('admin_invoices') || '[]');
      const existingInvoice = existingInvoices.find(inv => inv.generatedFrom === selectedFee.id);
      
      if (!existingInvoice) {
        // Generate new invoice only if it doesn't exist
        const invoice = {
          id: `INV${Date.now()}`,
          billNo: `BILL${Date.now()}`,
          studentId: selectedFee.studentId,
          studentName: selectedFee.studentName,
          applicationId: selectedFee.applicationId,
          course: selectedFee.course,
          semester: selectedFee.semester,
          invoiceDate: today,
          feeType: 'Semester Fee',
          paymentMethod: paymentMethod === 'debit' ? 'Debit Card' : paymentMethod === 'upi' ? 'UPI' : 'Net Banking',
          transactionId: transactionId,
          paymentStatus: 'Paid',
          paymentDate: today,
          verifiedBy: 'Student Payment',
          items: [
            { description: 'Semester Fee', amount: selectedFee.semesterFee || 0 },
            { description: 'Book Fee', amount: selectedFee.bookFee || 0 },
            { description: 'Examination Fee', amount: selectedFee.examFee || 0 },
            ...(selectedFee.hostelFee > 0 ? [{ description: 'Hostel Fee', amount: selectedFee.hostelFee }] : []),
            ...(selectedFee.miscFee > 0 ? [{ description: 'Miscellaneous Fee', amount: selectedFee.miscFee }] : []),
          ],
          total: selectedFee.totalFee || selectedFee.amount || 0,
          generatedFrom: selectedFee.id
        };
        
        // Save new invoice to localStorage
        const updatedInvoices = [...existingInvoices, invoice];
        localStorage.setItem('admin_invoices', JSON.stringify(updatedInvoices));
        
        // Trigger storage event for cross-tab updates
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'admin_invoices',
          newValue: JSON.stringify(updatedInvoices)
        }));
      } else {
        // Update existing invoice status
        const updatedInvoices = existingInvoices.map(inv => {
          if (inv.generatedFrom === selectedFee.id) {
            return {
              ...inv,
              paymentStatus: 'Paid',
              paymentDate: today,
              transactionId: transactionId,
              verifiedBy: 'Student Payment'
            };
          }
          return inv;
        });
        localStorage.setItem('admin_invoices', JSON.stringify(updatedInvoices));
        
        // Trigger storage event for cross-tab updates
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'admin_invoices',
          newValue: JSON.stringify(updatedInvoices)
        }));
      }

      setSelectedFee(null);
    }, 2000); // 2 second delay for payment processing
  };

  return (
    <Layout title="Fees">
      <div className="px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Fee Management
          </h1>
          <p className="text-slate-500 mb-4">
            Track and pay semester fees
          </p>
          
          {/* Search functionality for all users */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Search by Student Name</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter student name..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Search by Department</label>
              <input
                type="text"
                value={searchDepartment}
                onChange={(e) => setSearchDepartment(e.target.value)}
                placeholder="Enter department/course..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchName("");
                  setSearchDepartment("");
                }}
                className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayFees.map(fee => (
            <div key={fee.id} className={`rounded-xl border p-6 shadow-sm ${
              fee.paymentStatus === "paid"
                ? "bg-green-50 border-green-300"
                : "bg-orange-50 border-orange-300"
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-blue-600">receipt</span>
                    <h3 className="text-lg font-semibold text-slate-900">{fee.studentName}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      fee.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {fee.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">Application ID:</span>
                      <p>{fee.applicationId || fee.studentId}</p>
                    </div>
                    <div>
                      <span className="font-medium">Semester:</span>
                      <p>{fee.semester}</p>
                    </div>
                    <div>
                      <span className="font-medium">Course:</span>
                      <p>{fee.course || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total Fee:</span>
                      <p className="font-semibold text-green-600">₹{(fee.totalFee || fee.amount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Assigned Date:</span>
                      <p>{fee.assignedDate || fee.dueDate}</p>
                    </div>
                    <div>
                      <span className="font-medium">Payment Status:</span>
                      <p className={`font-semibold ${
                        fee.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {fee.paymentStatus?.toUpperCase() || 'PENDING'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <h4 className="font-medium text-slate-700 mb-2">Fee Breakdown:</h4>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div className="flex justify-between">
                        <span>Semester Fee:</span>
                        <span>₹{(fee.semesterFee || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Book Fee:</span>
                        <span>₹{(fee.bookFee || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Exam Fee:</span>
                        <span>₹{(fee.examFee || 0).toLocaleString()}</span>
                      </div>
                      {fee.hostelFee > 0 && (
                        <div className="flex justify-between">
                          <span>Hostel Fee:</span>
                          <span>₹{fee.hostelFee.toLocaleString()}</span>
                        </div>
                      )}
                      {fee.miscFee > 0 && (
                        <div className="flex justify-between">
                          <span>Misc Fee:</span>
                          <span>₹{fee.miscFee.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {fee.paymentStatus === "pending" && (
                  <button
                    onClick={() => setSelectedFee(fee)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm"
                  >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    Pay
                  </button>
                )}
                {fee.paymentStatus === "paid" && (
                  <button
                    onClick={() => {
                      const invoices = JSON.parse(localStorage.getItem('admin_invoices') || '[]');
                      const invoice = invoices.find(inv => inv.generatedFrom === fee.id);
                      if (invoice) {
                        window.open(`/invoice-viewer?invoice=${invoice.id}`, '_blank');
                      } else {
                        alert('Invoice not found. Please try again.');
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-1 text-sm"
                  >
                    <span className="material-symbols-outlined text-sm">description</span>
                    View Invoice
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedFee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px] shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              Pay Semester {selectedFee.semester} Fee
            </h2>
            <p className="mb-4">
              Amount: <b>₹{selectedFee.totalFee || selectedFee.amount}</b>
            </p>
            <select
              className="w-full border p-2 rounded mb-4"
              value={paymentMethod}
              onChange={(e)=>setPaymentMethod(e.target.value)}
            >
              <option value="debit">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="netbanking">Net Banking</option>
            </select>
            <button
              onClick={processPayment}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold"
            >
              Process Payment
            </button>
            <button
              onClick={()=>setSelectedFee(null)}
              className="w-full mt-3 py-2 bg-gray-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}