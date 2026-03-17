import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import jsPDF from 'jspdf';

export default function AdminInvoicePage() {
  const [invoices, setInvoices] = useState(() => {
    const stored = localStorage.getItem('admin_invoices');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    // Update invoices from localStorage when component mounts
    const storedInvoices = localStorage.getItem('admin_invoices');
    if (storedInvoices) {
      setInvoices(JSON.parse(storedInvoices));
    }
  }, []);

  // Listen for storage changes to auto-update when students pay
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

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  // Calculate summary statistics
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.paymentStatus === "Paid").length;
  const pendingInvoices = invoices.filter(inv => inv.paymentStatus === "Pending").length;
  const totalRevenue = invoices.filter(inv => inv.paymentStatus === "Paid").reduce((sum, inv) => sum + inv.total, 0);

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.paymentStatus.toLowerCase() === statusFilter.toLowerCase();
    const matchesCourse = courseFilter === "all" || invoice.course === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handlePrint = (invoice) => {
    const printWindow = window.open('', '_blank');
    const invoiceHTML = generateInvoiceHTML(invoice);
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const pdf = new jsPDF();
      
      // Set font
      pdf.setFont('helvetica');
      
      // Title
      pdf.setFontSize(20);
      pdf.text('INVOICE', 105, 20, { align: 'center' });
      
      // Line separator
      pdf.setLineWidth(0.5);
      pdf.line(20, 30, 190, 30);
      
      // Invoice details
      pdf.setFontSize(12);
      let yPosition = 40;
      
      pdf.text(`Invoice ID: ${invoice.id}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Date: ${invoice.invoiceDate}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Student: ${invoice.studentName}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Student ID: ${invoice.studentId}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Course: ${invoice.course}`, 20, yPosition);
      yPosition += 15;
      
      // Fee details
      pdf.setFontSize(14);
      pdf.text('Fee Details:', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      invoice.items.forEach((item, index) => {
        pdf.text(`${item.description}: ₹${item.amount.toLocaleString()}`, 25, yPosition);
        yPosition += 8;
      });
      
      // Total
      yPosition += 5;
      pdf.setFontSize(14);
      pdf.text(`Total: ₹${invoice.total.toLocaleString()}`, 20, yPosition);
      yPosition += 15;
      
      // Payment status
      pdf.setFontSize(12);
      pdf.text(`Payment Status: ${invoice.paymentStatus}`, 20, yPosition);
      yPosition += 8;
      
      if (invoice.paymentDate) {
        pdf.text(`Payment Date: ${invoice.paymentDate}`, 20, yPosition);
        yPosition += 8;
        pdf.text(`Verified By: ${invoice.verifiedBy}`, 20, yPosition);
      }
      
      // Save PDF
      pdf.save(`invoice_${invoice.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text download
      const content = generateInvoiceText(invoice);
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
      element.setAttribute("download", `invoice_${invoice.id}.pdf`);
      element.click();
    }
  };

  const handleSendEmail = (invoice) => {
    const subject = `Invoice ${invoice.id} - Payment Receipt`;
    const body = `Dear ${invoice.studentName},\n\nPlease find attached your payment invoice ${invoice.id}.\n\nTotal Amount: ₹${invoice.total.toLocaleString()}\nStatus: ${invoice.paymentStatus}\n\nThank you for your payment.`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleSendReminder = (invoiceId) => {
    alert(`Reminder sent for invoice ${invoiceId}`);
  };

  const handleMarkPaid = (invoiceId) => {
    const updatedInvoices = invoices.map(inv =>
      inv.id === invoiceId
        ? { ...inv, paymentStatus: "Paid", paymentDate: new Date().toISOString().split('T')[0], verifiedBy: "Admin User" }
        : inv
    );
    setInvoices(updatedInvoices);
    localStorage.setItem('admin_invoices', JSON.stringify(updatedInvoices));
  };

  const handleDeleteInvoice = (invoiceId) => {
    const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
    setInvoices(updatedInvoices);
    localStorage.setItem('admin_invoices', JSON.stringify(updatedInvoices));
  };

  const generateInvoiceHTML = (invoice) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Invoice ${invoice.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .student-info, .invoice-info { flex: 1; }
        .fee-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .fee-table th, .fee-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .fee-table th { background-color: #f2f2f2; }
        .total { font-weight: bold; font-size: 18px; }
        .payment-confirmation { margin-top: 30px; padding: 20px; background-color: #f9f9f9; }
    </style>
</head>
<body>
    <div class="header">
        <h1>College Management System</h1>
        <p>123 University Road, Education City</p>
        <p>Phone: +91-9876543210 | Email: info@cms.edu</p>
    </div>

    <div class="invoice-details">
        <div class="student-info">
            <h3>Student Information</h3>
            <p><strong>Student ID:</strong> ${invoice.studentId}</p>
            <p><strong>Student Name:</strong> ${invoice.studentName}</p>
            <p><strong>Course:</strong> ${invoice.course}</p>
            <p><strong>Admission Year:</strong> ${invoice.admissionYear}</p>
        </div>
        <div class="invoice-info">
            <h3>Invoice Details</h3>
            <p><strong>Invoice Number:</strong> ${invoice.id}</p>
            <p><strong>Invoice Date:</strong> ${invoice.invoiceDate}</p>
            <p><strong>Fee Type:</strong> ${invoice.feeType}</p>
            <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
            <p><strong>Transaction ID:</strong> ${invoice.transactionId}</p>
            <p><strong>Payment Status:</strong> ${invoice.paymentStatus}</p>
        </div>
    </div>

    <h3>Fee Breakdown</h3>
    <table class="fee-table">
        <thead>
            <tr>
                <th>Fee Type</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            ${invoice.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td>₹${item.amount.toLocaleString()}</td>
                </tr>
            `).join('')}
            <tr class="total">
                <td><strong>Total</strong></td>
                <td><strong>₹${invoice.total.toLocaleString()}</strong></td>
            </tr>
        </tbody>
    </table>

    ${invoice.paymentDate ? `
    <div class="payment-confirmation">
        <h3>Payment Confirmation</h3>
        <p><strong>Payment Date:</strong> ${invoice.paymentDate}</p>
        <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
        <p><strong>Transaction ID:</strong> ${invoice.transactionId}</p>
        <p><strong>Verified By:</strong> ${invoice.verifiedBy}</p>
    </div>
    ` : ''}

    <div style="margin-top: 50px; text-align: center; font-style: italic;">
        <p>Thank you for your payment!</p>
    </div>
</body>
</html>`;
  };

  const generateInvoiceText = (invoice) => {
    return `
COLLEGE MANAGEMENT SYSTEM
INVOICE
========================

Institute Details:
College Management System
123 University Road, Education City
Phone: +91-9876543210
Email: info@cms.edu

Student Information:
Student ID: ${invoice.studentId}
Student Name: ${invoice.studentName}
Course: ${invoice.course}
Admission Year: ${invoice.admissionYear}

Invoice Details:
Invoice Number: ${invoice.id}
Invoice Date: ${invoice.invoiceDate}
Fee Type: ${invoice.feeType}
Payment Method: ${invoice.paymentMethod}
Transaction ID: ${invoice.transactionId}
Payment Status: ${invoice.paymentStatus}

Fee Breakdown:
${invoice.items.map(item => `${item.description}: ₹${item.amount.toLocaleString()}`).join('\n')}

Total Amount: ₹${invoice.total.toLocaleString()}

${invoice.paymentDate ? `
Payment Confirmation:
Payment Date: ${invoice.paymentDate}
Payment Method: ${invoice.paymentMethod}
Transaction ID: ${invoice.transactionId}
Verified By: ${invoice.verifiedBy}
` : ''}

Thank you for your payment!
`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'Pending':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  const getContainerColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-50 border-green-300';
      case 'Pending':
        return 'bg-orange-50 border-orange-300';
      default:
        return 'bg-slate-50 border-slate-300';
    }
  };

  const uniqueCourses = [...new Set(invoices.map(inv => inv.course))];

  return (
    <Layout title="Admin Invoice Management">
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Invoice Management
        </h1>
        <p className="text-slate-500 mb-6">
          Generate and manage student payment receipts
        </p>

        {/* Invoice Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total Invoices</h3>
            <p className="text-3xl font-bold text-blue-600">{totalInvoices}</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Paid Invoices</h3>
            <p className="text-3xl font-bold text-green-600">{paidInvoices}</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Pending Invoices</h3>
            <p className="text-3xl font-bold text-orange-600">{pendingInvoices}</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search by Student or Invoice ID</label>
              <input
                type="text"
                placeholder="Student name, ID, or invoice ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Course</label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Records Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className={`rounded-xl border p-5 shadow-sm ${
                getContainerColor(invoice.paymentStatus)
              }`}
            >
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {invoice.feeType}
                  </h3>
                  <p className="text-sm text-slate-500">
                    ID: {invoice.id}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white border ${getStatusColor(invoice.paymentStatus)}`}>
                  {invoice.paymentStatus.toUpperCase()}
                </span>
              </div>

              <div className="bg-white rounded-lg p-3 mb-4 border">
                <p className="text-sm text-slate-500">Total Amount</p>
                <p className="text-2xl font-bold">
                  ₹{invoice.total.toLocaleString()}
                </p>
              </div>

              <div className="space-y-1 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student</span>
                  <span>{invoice.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Course</span>
                  <span>{invoice.course}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Date</span>
                  <span>{invoice.invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method</span>
                  <span>{invoice.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID</span>
                  <span>{invoice.transactionId}</span>
                </div>
                {invoice.verifiedBy && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified By</span>
                    <span className="text-green-600">{invoice.verifiedBy}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => handleDownloadPDF(invoice)}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download
                </button>
                <button
                  onClick={() => handleDeleteInvoice(invoice.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-[600px] shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">
                  Invoice Details
                </h2>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Invoice Header */}
              <div className="text-center border-b-2 border-slate-300 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">College Management System</h1>
                <p className="text-slate-600">123 University Road, Education City</p>
                <p className="text-slate-600">Phone: +91-9876543210 | Email: info@cms.edu</p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Student Information Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-slate-900">Student Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student ID:</span>
                      <span className="font-semibold">{selectedInvoice.studentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Name:</span>
                      <span className="font-semibold">{selectedInvoice.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Course:</span>
                      <span className="font-semibold">{selectedInvoice.course}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Admission Year:</span>
                      <span className="font-semibold">{selectedInvoice.admissionYear}</span>
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-slate-900">Invoice Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice Number:</span>
                      <span className="font-semibold">{selectedInvoice.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice Date:</span>
                      <span className="font-semibold">{selectedInvoice.invoiceDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fee Type:</span>
                      <span className="font-semibold">{selectedInvoice.feeType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Method:</span>
                      <span className="font-semibold">{selectedInvoice.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction ID:</span>
                      <span className="font-semibold">{selectedInvoice.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedInvoice.paymentStatus)}`}>
                        {selectedInvoice.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-slate-900">Fee Breakdown</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.description}</span>
                        <span className="font-semibold">₹{item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>₹{selectedInvoice.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Confirmation Section */}
              {selectedInvoice.paymentDate && (
                <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
                  <h3 className="text-lg font-semibold mb-3 text-green-800">Payment Confirmation</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Payment Date:</span>
                      <span className="font-semibold">{selectedInvoice.paymentDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Payment Method:</span>
                      <span className="font-semibold">{selectedInvoice.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Transaction ID:</span>
                      <span className="font-semibold">{selectedInvoice.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Verified By:</span>
                      <span className="font-semibold">{selectedInvoice.verifiedBy}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handlePrint(selectedInvoice)}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                >
                  Print
                </button>
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => handleSendEmail(selectedInvoice)}
                  className="flex-1 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600"
                >
                  Send Email
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600"
                >
                  Close
                </button>
              </div>

              <div className="text-center mt-6 text-slate-500 italic">
                <p>Thank you for your payment!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}