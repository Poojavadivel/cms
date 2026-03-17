import { useState, useMemo, useEffect } from 'react';
import { getUserSession } from '../auth/sessionController';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoicePage() {
  const session = getUserSession();
  const isStudent = session?.role === 'student';
  const currentUserId = session?.userId;

  // Get invoices from localStorage or use sample data
  const [invoices, setInvoices] = useState(() => {
    const storedInvoices = localStorage.getItem('admin_invoices');
    if (storedInvoices) {
      return JSON.parse(storedInvoices);
    }
    // Fallback to empty array - no sample data
    return [];
  });

  const [searchName, setSearchName] = useState("");
  const [searchDepartment, setSearchDepartment] = useState("");

  useEffect(() => {
    // Update invoices from localStorage when component mounts
    const storedInvoices = localStorage.getItem('admin_invoices');
    if (storedInvoices) {
      setInvoices(JSON.parse(storedInvoices));
    }
  }, []);

  // Listen for storage changes to auto-update
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'admin_invoices') {
        const updatedInvoices = localStorage.getItem('admin_invoices');
        if (updatedInvoices) {
          setInvoices(JSON.parse(updatedInvoices));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter invoices based on user role and search
  const displayInvoices = useMemo(() => {
    let filteredInvoices = invoices;
    
    // Apply search filters
    if (searchName) {
      filteredInvoices = filteredInvoices.filter(i => 
        i.studentName && i.studentName.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    if (searchDepartment) {
      filteredInvoices = filteredInvoices.filter(i => 
        i.course && i.course.toLowerCase().includes(searchDepartment.toLowerCase())
      );
    }
    
    // If student, only show their invoices
    if (isStudent && currentUserId) {
      filteredInvoices = filteredInvoices.filter(i => i.studentId === currentUserId);
    }
    
    return filteredInvoices;
  }, [invoices, isStudent, currentUserId, searchName, searchDepartment]);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredInvoices = filterStatus === 'all' ? displayInvoices : displayInvoices.filter(i => i.paymentStatus === filterStatus);

  const handleDeleteInvoice = (invoiceId) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(invoices.filter(i => i.id !== invoiceId));
      setSelectedInvoice(null);
    }
  };

  const downloadInvoicePDF = async (invoice) => {
    try {
      const pdf = new jsPDF();
      
      // Set font
      pdf.setFont('helvetica');
      
      // Title
      pdf.setFontSize(24);
      pdf.text('INVOICE / BILL', 105, 25, { align: 'center' });
      
      // Line separator
      pdf.setLineWidth(0.5);
      pdf.line(20, 35, 190, 35);
      pdf.line(20, 37, 190, 37);
      
      // Bill Info
      pdf.setFontSize(12);
      let yPosition = 50;
      
      pdf.text(`Bill No: ${invoice.billNo}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Date: ${invoice.generatedDate}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Due Date: ${invoice.dueDate}`, 20, yPosition);
      yPosition += 15;
      
      // Student Details
      pdf.setFontSize(14);
      pdf.text('STUDENT DETAILS:', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.text(`Student ID: ${invoice.studentId}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Student Name: ${invoice.studentName}`, 20, yPosition);
      yPosition += 15;
      
      // Billing Period
      pdf.setFontSize(14);
      pdf.text(`BILLING PERIOD: ${invoice.month}`, 20, yPosition);
      yPosition += 15;
      
      // Fee Details Header
      pdf.setFontSize(14);
      pdf.text('FEE DETAILS:', 20, yPosition);
      yPosition += 10;
      
      // Line separator
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 8;
      
      // Fee Details
      pdf.setFontSize(12);
      invoice.feeDetails.forEach((fee, index) => {
        const itemNumber = (index + 1).toString().padStart(2, '0');
        const description = `${itemNumber}. ${fee.type}`;
        const amount = `₹${fee.amount}`;
        
        pdf.text(description, 25, yPosition);
        pdf.text(amount, 160, yPosition);
        yPosition += 8;
      });
      
      // Line separator
      yPosition += 5;
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      
      // Total Amount
      pdf.setFontSize(14);
      pdf.text('TOTAL AMOUNT DUE:', 20, yPosition);
      pdf.setFontSize(16);
      pdf.text(`₹${invoice.totalAmount}`, 160, yPosition);
      yPosition += 10;
      
      // Payment Status
      pdf.setFontSize(12);
      pdf.text(`PAYMENT STATUS: ${invoice.paymentStatus.toUpperCase()}`, 20, yPosition);
      yPosition += 15;
      
      // Line separator
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      
      // Footer
      pdf.setFontSize(10);
      pdf.text(`Generated Date: ${new Date().toLocaleString()}`, 20, yPosition);
      yPosition += 8;
      pdf.text('Payment Methods Accepted:', 20, yPosition);
      yPosition += 6;
      pdf.text('✓ Debit Card', 25, yPosition);
      yPosition += 6;
      pdf.text('✓ Online Banking', 25, yPosition);
      yPosition += 6;
      pdf.text('✓ UPI', 25, yPosition);
      yPosition += 10;
      pdf.text('Note: Please pay before the due date to avoid late fees.', 20, yPosition);
      yPosition += 8;
      pdf.text('Thank you for your payment!', 20, yPosition);
      
      // Save the PDF
      pdf.save(`invoice_${invoice.billNo}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text download
      const content = `
════════════════════════════════════════════════════
                     INVOICE / BILL
════════════════════════════════════════════════════

Bill No: ${invoice.billNo}
Date: ${invoice.generatedDate}
Due Date: ${invoice.dueDate}

STUDENT DETAILS:
Student ID: ${invoice.studentId}
Student Name: ${invoice.studentName}

BILLING PERIOD: ${invoice.month}

════════════════════════════════════════════════════
FEE DETAILS:
════════════════════════════════════════════════════

${invoice.feeDetails.map((fee, i) => `${(i + 1).toString().padStart(2, '0')}. ${fee.type.padEnd(30)} ₹${fee.amount.toString().padStart(8)}`).join('\n')}

════════════════════════════════════════════════════
TOTAL AMOUNT DUE:                        ₹${invoice.totalAmount.toString().padStart(10)}
PAYMENT STATUS:                          ${invoice.paymentStatus.toUpperCase().padStart(10)}
════════════════════════════════════════════════════

Generated Date: ${new Date().toLocaleString()}

Payment Methods Accepted:
✓ Debit Card
✓ Online Banking
✓ UPI

Note: Please pay before the due date to avoid late fees.

Thank you for your payment!
    `.trim();

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
      element.setAttribute('download', `invoice_${invoice.billNo}.txt`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const getPaidStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'pending':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'failed':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Invoices & Bills</h1>
        <p className="text-slate-600">
          {isStudent ? `Your invoices and payment details` : 'View, manage and download student fee invoices and bills'}
        </p>
        
        {/* Search functionality for all users */}
        <div className="flex gap-4 mt-6 mb-6">
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
        
        {isStudent && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-slate-700">
            <p className="font-semibold">Page overview for students:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>See all your generated invoices arranged by month or bill number.</li>
              <li>Review fee breakdowns and total amounts due.</li>
              <li>Filter invoices by payment status (Paid/Pending/Failed).</li>
              <li>Download each invoice as a text/PDF file.</li>
              <li>Click on any invoice to view full details.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {['all', 'paid', 'pending', 'failed'].map(status => {
          const statusCount = displayInvoices.filter(i => i.paymentStatus === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-[#1162d4] text-white shadow-md'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-[#1162d4]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} {status !== 'all' && `(${statusCount})`}
            </button>
          );
        })}
      </div>

      {/* Invoices Grid (3 per row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!displayInvoices || displayInvoices.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <span className="material-symbols-outlined text-6xl text-slate-300 block mb-4">receipt_long</span>
            <p className="text-slate-500 text-lg font-semibold">No invoices found</p>
            {isStudent && (
              <p className="text-slate-400 text-sm mt-2">Your invoices will appear here once generated</p>
            )}
          </div>
        ) : (
          filteredInvoices.map(invoice => (
            <div
              key={invoice.id}
              className={`rounded-2xl p-6 border-2 transition-all hover:shadow-2xl cursor-pointer transform hover:scale-105 ${
                invoice.paymentStatus === 'paid'
                  ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300'
                  : invoice.paymentStatus === 'pending'
                  ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
              }`}
              onClick={() => setSelectedInvoice(invoice)}
            >
              {/* Bill Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{invoice.billNo}</h3>
                  <p className="text-sm text-slate-600">{invoice.month}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getPaidStatusColor(invoice.paymentStatus)}`}>
                  {invoice.paymentStatus.toUpperCase()}
                </div>
              </div>

              {/* Student Info */}
              <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
                <p className="text-xs text-slate-600 font-medium">Student</p>
                <p className="text-sm font-bold text-slate-900">{invoice.studentName}</p>
                <p className="text-xs text-slate-500 mt-1">ID: {invoice.studentId}</p>
              </div>

              {/* Fees Preview */}
              <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4 space-y-1">
                {invoice.feeDetails.slice(0, 2).map((fee, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-slate-700">{fee.type}</span>
                    <span className="font-semibold text-slate-900">₹{fee.amount}</span>
                  </div>
                ))}
                {invoice.feeDetails.length > 2 && (
                  <p className="text-xs text-slate-600 italic pt-2">+{invoice.feeDetails.length - 2} more items</p>
                )}
              </div>

              {/* Total Amount */}
              <div className={`rounded-lg p-3 mb-4 ${
                invoice.paymentStatus === 'paid'
                  ? 'bg-green-200 border border-green-400'
                  : invoice.paymentStatus === 'pending'
                  ? 'bg-orange-200 border border-orange-400'
                  : 'bg-red-200 border border-red-400'
              }`}>
                <p className="text-xs text-slate-600 font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-slate-900">₹{invoice.totalAmount.toLocaleString()}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="bg-white bg-opacity-60 rounded p-2">
                  <p className="text-slate-600">Generated</p>
                  <p className="font-semibold text-slate-900">{invoice.generatedDate}</p>
                </div>
                <div className="bg-white bg-opacity-60 rounded p-2">
                  <p className="text-slate-600">Due</p>
                  <p className="font-semibold text-slate-900">{invoice.dueDate}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-opacity-30 border-slate-400" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => downloadInvoicePDF(invoice)}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all text-sm flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">file_download</span>
                  Download
                </button>
                <button
                  onClick={() => handleDeleteInvoice(invoice.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all text-sm flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Invoice</h2>
                <p className="text-lg font-semibold text-blue-700 mt-1">{selectedInvoice.billNo}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Bill Content */}
            <div className="bg-white rounded-xl p-6 mb-6 border border-blue-200">
              {/* Student Details */}
              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
                <div>
                  <p className="text-xs uppercase font-bold text-slate-600 mb-1">Student Name</p>
                  <p className="text-lg font-bold text-slate-900">{selectedInvoice.studentName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-slate-600 mb-1">Student ID</p>
                  <p className="text-lg font-mono text-blue-600 font-bold">{selectedInvoice.studentId}</p>
                </div>
              </div>

              {/* Billing Period */}
              <div className="mb-6">
                <p className="text-xs uppercase font-bold text-slate-600 mb-1">Billing Period</p>
                <p className="text-lg font-bold text-slate-900">{selectedInvoice.month}</p>
              </div>

              {/* Fee Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Fee Breakdown</h3>
                <div className="space-y-2">
                  {selectedInvoice.feeDetails.map((fee, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200">
                      <span className="text-slate-700">{fee.type}</span>
                      <span className="font-bold text-slate-900">₹{fee.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-slate-300">
                  <span className="text-lg font-bold text-slate-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">₹{selectedInvoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mb-6">
                <p className="text-xs uppercase font-bold text-slate-600 mb-1">Payment Status</p>
                <div className={`inline-block px-4 py-2 rounded-lg font-bold text-sm ${getPaidStatusColor(selectedInvoice.paymentStatus)} border-2`}>
                  {selectedInvoice.paymentStatus.toUpperCase()}
                </div>
              </div>

              {/* Important Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs uppercase font-bold text-slate-600 mb-1">Generated Date</p>
                  <p className="font-semibold text-slate-900">{selectedInvoice.generatedDate}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs uppercase font-bold text-slate-600 mb-1">Due Date</p>
                  <p className="font-semibold text-slate-900">{selectedInvoice.dueDate}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => downloadInvoicePDF(selectedInvoice)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined">file_download</span>
                Download Invoice
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-6 py-3 bg-slate-500 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
