import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getUserSession } from '../auth/sessionController';
import jsPDF from 'jspdf';

export default function InvoiceViewerPage() {
  const session = getUserSession();
  const isStudent = session?.role === 'student';
  const currentUserId = session?.userId;

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const storedInvoices = localStorage.getItem('admin_invoices');
    if (storedInvoices) {
      const invoicesData = JSON.parse(storedInvoices);
      
      const urlParams = new URLSearchParams(window.location.search);
      const invoiceId = urlParams.get('invoice');
      
      if (invoiceId) {
        const specificInvoice = invoicesData.find(inv => inv.id === invoiceId);
        if (specificInvoice) {
          setSelectedInvoice(specificInvoice);
          const studentInvoices = invoicesData.filter(inv => inv.studentId === specificInvoice.studentId);
          setInvoices(studentInvoices);
        }
      } else {
        setInvoices(invoicesData);
      }
    }
  }, []);

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

  const displayInvoices = selectedInvoice 
    ? invoices 
    : invoices.filter(invoice => 
        isStudent ? invoice.studentId === currentUserId : true
      );

  const downloadInvoicePDF = async (invoice) => {
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(20);
      pdf.text('INVOICE / BILL', 105, 20, { align: 'center' });
      pdf.setLineWidth(0.5);
      pdf.line(20, 30, 190, 30);
      
      pdf.setFontSize(12);
      let yPosition = 45;
      
      pdf.text(`Invoice No: ${invoice.id}`, 20, yPosition);
      pdf.text(`Bill No: ${invoice.billNo}`, 120, yPosition);
      yPosition += 10;
      pdf.text(`Date: ${invoice.invoiceDate}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Student: ${invoice.studentName}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Student ID: ${invoice.studentId}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Course: ${invoice.course}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Semester: ${invoice.semester}`, 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(14);
      pdf.text('Bill Details:', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      invoice.items.forEach((item, index) => {
        const description = `${index + 1}. ${item.description}`;
        const amount = `₹${item.amount.toLocaleString()}`;
        
        pdf.text(description, 25, yPosition);
        pdf.text(amount, 160, yPosition);
        yPosition += 8;
      });
      
      yPosition += 5;
      pdf.setFontSize(14);
      pdf.text('Total Amount:', 20, yPosition);
      pdf.setFontSize(16);
      pdf.text(`₹${invoice.total.toLocaleString()}`, 160, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.text(`Payment Status: ${invoice.paymentStatus}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Payment Method: ${invoice.paymentMethod}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Transaction ID: ${invoice.transactionId}`, 20, yPosition);
      yPosition += 8;
      
      if (invoice.paymentDate) {
        pdf.text(`Payment Date: ${invoice.paymentDate}`, 20, yPosition);
        yPosition += 8;
        pdf.text(`Verified By: ${invoice.verifiedBy}`, 20, yPosition);
      }
      
      pdf.line(20, 270, 190, 270);
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
      
      pdf.save(`invoice_bill_${invoice.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
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

  return (
    <Layout title="Invoice Viewer">
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">Invoice Bills</h1>
            <p className="text-gray-600">View and download your payment bills</p>
          </div>

          <div className="p-6">
            {displayInvoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.707.293H19a2 2 0 012-2z"></path>
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No invoice bills found</p>
                <p className="text-gray-400 text-sm mt-2">Your invoice bills will appear here after payment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className={`rounded-xl border p-6 shadow-sm ${getContainerColor(invoice.paymentStatus)}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="material-symbols-outlined text-blue-600">receipt</span>
                          <h3 className="text-lg font-semibold text-slate-900">{invoice.studentName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.paymentStatus)}`}>
                            {invoice.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Application ID:</span>
                            <p>{invoice.applicationId || invoice.studentId}</p>
                          </div>
                          <div>
                            <span className="font-medium">Semester:</span>
                            <p>{invoice.semester}</p>
                          </div>
                          <div>
                            <span className="font-medium">Course:</span>
                            <p>{invoice.course || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Total Amount:</span>
                            <p className="font-semibold text-green-600">₹{invoice.total.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium">Invoice Date:</span>
                            <p>{invoice.invoiceDate}</p>
                          </div>
                          <div>
                            <span className="font-medium">Payment Status:</span>
                            <p className={`font-semibold ${
                              invoice.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {invoice.paymentStatus?.toUpperCase() || 'PENDING'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadInvoicePDF(invoice)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Download Bill
                      </button>
                      {invoice.paymentStatus === 'paid' && (
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
