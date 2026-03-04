/**
 * PatientBillingModal.jsx
 * Enterprise-Grade Hospital Billing System
 * 
 * Features:
 * - Auto-populated patient details
 * - Multiple service categories
 * - Real-time calculation
 * - Insurance integration
 * - Multiple payment methods
 * - PDF generation
 * - Professional invoice design
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaTimes, FaPlus, FaTrash, FaPrint, FaSave, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { MdLocalHospital, MdMedication, MdScience, MdHotel, MdPersonOutline } from 'react-icons/md';
import patientsService from '../../services/patientsService';
import billingService from '../../services/billingService';
import servicesService from '../../services/servicesService';
import './PatientBillingModal.css';

// Service Category Icons
const CATEGORY_ICONS = {
  'Consultation': <MdPersonOutline />,
  'Procedures': <MdLocalHospital />,
  'Medication': <MdMedication />,
  'Lab Tests': <MdScience />,
  'Room Charges': <MdHotel />,
};

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Debit/Credit Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Insurance', label: 'Insurance' },
];

const TAX_RATE = 5; // 5% GST

const PatientBillingModal = ({ isOpen, onClose, patientId, patientData }) => {
  // Patient information
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Services from database
  const [servicesData, setServicesData] = useState({});
  const [loadingServices, setLoadingServices] = useState(true);

  // Billing items
  const [billItems, setBillItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Consultation');

  // Financial details
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // percentage or fixed
  const [taxEnabled, setTaxEnabled] = useState(true);
  
  // Payment details
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [insuranceDetails, setInsuranceDetails] = useState({
    provider: '',
    policyNumber: '',
    coverageAmount: 0,
  });

  // Notes
  const [notes, setNotes] = useState('');

  // UI states
  const [saving, setSaving] = useState(false);

  // Fetch patient details
  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (patientData) {
        setPatient(patientData);
        setLoading(false);
        return;
      }

      if (!patientId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await patientsService.fetchPatientById(patientId);
        setPatient(data);
      } catch (error) {
        console.error('Failed to fetch patient:', error);
        alert('Failed to load patient details');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchPatientDetails();
    }
  }, [isOpen, patientId, patientData]);

  // Fetch services from database
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        console.log('🔍 Fetching services from database...');
        const response = await servicesService.fetchServices({ isActive: true });
        
        console.log('📦 Raw API Response:', response);
        console.log('📊 Grouped services:', response.grouped);
        console.log('📋 Service categories:', Object.keys(response.grouped || {}));
        
        // response.grouped is already organized by category
        setServicesData(response.grouped || {});
        
        if (!response.grouped || Object.keys(response.grouped).length === 0) {
          console.warn('⚠️ No services found in database! You may need to seed services.');
          alert('⚠️ No services found!\n\nThe database may be empty. Please:\n1. Ask admin to seed services\n2. Or use "Add Custom Item" to add services manually');
        } else {
          console.log('✅ Loaded services from database successfully');
        }
      } catch (error) {
        console.error('❌ Failed to fetch services:', error);
        console.error('Error details:', error.message);
        alert(`❌ Failed to load services from database!\n\nError: ${error.message}\n\nPlease:\n1. Check your internet connection\n2. Ensure you are logged in\n3. Contact support if the issue persists`);
        // Fallback to empty object if API fails
        setServicesData({});
      } finally {
        setLoadingServices(false);
      }
    };

    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return billItems.reduce((sum, item) => sum + item.total, 0);
  }, [billItems]);

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    }
    return discount;
  }, [subtotal, discount, discountType]);

  // Calculate tax amount
  const taxAmount = useMemo(() => {
    if (!taxEnabled) return 0;
    const taxableAmount = subtotal - discountAmount;
    return (taxableAmount * TAX_RATE) / 100;
  }, [subtotal, discountAmount, taxEnabled]);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return subtotal - discountAmount + taxAmount;
  }, [subtotal, discountAmount, taxAmount]);

  // Calculate balance
  const balance = useMemo(() => {
    let totalPaid = parseFloat(paidAmount) || 0;
    if (paymentMethod === 'Insurance' && insuranceDetails.coverageAmount) {
      totalPaid += parseFloat(insuranceDetails.coverageAmount) || 0;
    }
    return Math.max(0, grandTotal - totalPaid);
  }, [grandTotal, paidAmount, paymentMethod, insuranceDetails.coverageAmount]);

  // Add item to bill
  const handleAddItem = useCallback((category, service) => {
    const newItem = {
      id: Date.now() + Math.random(),
      category: category,
      categoryKey: category,
      description: service.name,
      quantity: 1,
      unitPrice: service.price,
      total: service.price,
    };
    setBillItems(prev => [...prev, newItem]);
  }, []);

  // Add custom item
  const handleAddCustomItem = useCallback(() => {
    const newItem = {
      id: Date.now() + Math.random(),
      category: 'Custom',
      categoryKey: 'CUSTOM',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setBillItems(prev => [...prev, newItem]);
  }, []);

  // Update item
  const handleUpdateItem = useCallback((id, field, value) => {
    setBillItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };
      
      // Recalculate total
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.unitPrice) || 0);
      }

      return updated;
    }));
  }, []);

  // Remove item
  const handleRemoveItem = useCallback((id) => {
    setBillItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Save bill
  const handleSaveBill = async () => {
    if (!patient) {
      alert('Patient information is required');
      return;
    }

    if (billItems.length === 0) {
      alert('Please add at least one item to the bill');
      return;
    }

    try {
      setSaving(true);

      const billData = {
        patientId: patient._id || patient.id,
        patientName: patient.name,
        patientContact: patient.contact || patient.phone,
        date: new Date().toISOString(),
        items: billItems.map(item => ({
          category: item.category,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.total,
        })),
        subtotal: subtotal,
        discount: discountAmount,
        discountType: discountType,
        tax: taxAmount,
        taxRate: TAX_RATE,
        totalAmount: grandTotal,
        paidAmount: parseFloat(paidAmount) || 0,
        balanceAmount: balance,
        status: balance === 0 ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : 'Pending'),
        paymentMethod,
        insuranceDetails: paymentMethod === 'Insurance' ? insuranceDetails : null,
        notes,
      };

      console.log('Saving bill:', billData);

      const response = await billingService.createBill(billData);

      console.log('Bill saved:', response);

      alert(`Bill saved successfully! Bill Number: ${response.bill.billNumber}`);
      onClose();
    } catch (error) {
      console.error('Failed to save bill:', error);
      alert('Failed to save bill: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Print bill
  const handlePrintBill = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="billing-modal-overlay" onClick={onClose}>
      <div className="billing-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Patient Billing</h2>
            <p className="text-sm text-gray-600 mt-1 font-medium">Create invoice for patient services</p>
          </div>
          <button
            className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-all duration-200 flex items-center justify-center text-lg"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 billing-modal-content">
          {loading ? (
            <div className="text-center py-16 text-gray-600">Loading patient details...</div>
          ) : (
            <>
              {/* Patient Information */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl mb-6 border border-blue-200">
                <h3 className="text-xs font-bold uppercase text-blue-600 mb-3 tracking-wide">Patient Information</h3>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-blue-600 tracking-wider">Name:</label>
                    <span className="text-sm font-semibold text-gray-900">{patient?.name || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-blue-600 tracking-wider">Patient ID:</label>
                    <span className="text-sm font-semibold text-gray-900">{patient?.patientCode || patient?.id || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-blue-600 tracking-wider">Age:</label>
                    <span className="text-sm font-semibold text-gray-900">{patient?.age || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-blue-600 tracking-wider">Gender:</label>
                    <span className="text-sm font-semibold text-gray-900">{patient?.gender || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-blue-600 tracking-wider">Contact:</label>
                    <span className="text-sm font-semibold text-gray-900">{patient?.contact || patient?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-blue-600 tracking-wider">Date:</label>
                    <span className="text-sm font-semibold text-gray-900">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Service Categories */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase text-gray-600 tracking-wide">Add Services</h3>
                  {!loadingServices && Object.keys(servicesData).length === 0 && (
                    <button
                      className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-all"
                      onClick={async () => {
                        if (window.confirm('Seed initial hospital services to database?\n\nThis will add 190+ services including:\n- Consultations\n- Procedures\n- Medications\n- Lab Tests\n- Room Charges')) {
                          try {
                            setLoadingServices(true);
                            await servicesService.seedServices();
                            alert('✅ Services seeded successfully! Reloading...');
                            window.location.reload();
                          } catch (error) {
                            alert('Failed to seed services: ' + error.message);
                          } finally {
                            setLoadingServices(false);
                          }
                        }
                      }}
                    >
                      🌱 Seed Services
                    </button>
                  )}
                </div>
                {loadingServices ? (
                  <div className="text-center py-8 text-gray-500">Loading services...</div>
                ) : Object.keys(servicesData).length === 0 ? (
                  <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <p className="text-lg font-semibold text-yellow-800 mb-2">⚠️ No Services Found</p>
                    <p className="text-sm text-yellow-700 mb-4">The database has no services yet.</p>
                    <p className="text-xs text-yellow-600">Click "Seed Services" above or use "Add Custom Item" below</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {Object.keys(servicesData).map((category) => (
                        <button
                          key={category}
                          className={`px-5 py-3 rounded-lg border-2 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                            selectedCategory === category
                              ? 'border-blue-600 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-300'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                          onClick={() => setSelectedCategory(category)}
                        >
                          <span className="text-lg">{CATEGORY_ICONS[category] || <MdLocalHospital />}</span>
                          <span>{category}</span>
                        </button>
                      ))}
                    </div>

                    {/* Service Items from Database */}
                    {servicesData[selectedCategory] && servicesData[selectedCategory].length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 mb-4 max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200 billing-service-items">
                        {servicesData[selectedCategory].map((service) => (
                          <div
                            key={service._id}
                            className="bg-white p-3 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:shadow-md transition-all duration-200 flex justify-between items-center group"
                          >
                            <div className="flex-1">
                              <span className="text-sm font-semibold text-gray-900 block">{service.name}</span>
                              <span className="text-sm font-bold text-blue-600">₹{service.price}</span>
                            </div>
                            <button
                              className="px-4 py-2 rounded-md bg-gradient-to-br from-green-600 to-green-700 text-white font-semibold text-xs hover:scale-105 transition-transform duration-200 flex items-center gap-1.5 shadow-md shadow-green-300"
                              onClick={() => handleAddItem(selectedCategory, service)}
                            >
                              <FaPlus className="text-xs" /> Add
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-gray-200">
                        No services available in this category
                      </div>
                    )}
                  </>
                )}

                <button
                  className="w-full py-3 rounded-lg border-2 border-dashed border-gray-400 bg-white text-gray-700 font-semibold text-sm hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={handleAddCustomItem}
                >
                  <FaPlus /> Add Custom Item
                </button>
              </div>

              {/* Bill Items */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase text-gray-600 mb-4 tracking-wide">
                  Bill Items ({billItems.length})
                </h3>
                {billItems.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    No items added yet
                  </div>
                ) : (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600 tracking-wider border-b-2 border-gray-200" style={{ width: '35%' }}>
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600 tracking-wider border-b-2 border-gray-200" style={{ width: '15%' }}>
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600 tracking-wider border-b-2 border-gray-200" style={{ width: '20%' }}>
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600 tracking-wider border-b-2 border-gray-200" style={{ width: '20%' }}>
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600 tracking-wider border-b-2 border-gray-200" style={{ width: '10%' }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {billItems.map(item => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
                                value={item.description}
                                onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                placeholder="Description"
                              />
                              <small className="block mt-1 text-xs text-gray-500 font-semibold">{item.category}</small>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                                min="1"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)}
                                min="0"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <strong className="text-sm font-bold text-gray-900">₹{item.total.toFixed(2)}</strong>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 transform hover:scale-110"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-4">
                  {/* Discount */}
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-2 tracking-wider">Discount</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        min="0"
                        placeholder="0"
                      />
                      <select
                        className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-900 bg-white cursor-pointer min-w-[80px] focus:outline-none focus:border-blue-600"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">₹</option>
                      </select>
                    </div>
                  </div>

                  {/* Tax */}
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        className="w-5 h-5 cursor-pointer accent-blue-600"
                        checked={taxEnabled}
                        onChange={(e) => setTaxEnabled(e.target.checked)}
                      />
                      <span>Include Tax (GST {TAX_RATE}%)</span>
                    </label>
                  </div>

                  {/* Notes */}
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-2 tracking-wider">Notes</label>
                    <textarea
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-900 resize-vertical focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes or comments..."
                      rows="3"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-5 rounded-xl border-2 border-blue-200 shadow-lg shadow-blue-100">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center py-2.5 text-sm font-semibold text-gray-700 border-b border-gray-300">
                      <span>Subtotal:</span>
                      <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center py-2.5 text-sm font-semibold text-red-600 border-b border-gray-300">
                        <span>Discount:</span>
                        <span>- ₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {taxEnabled && (
                      <div className="flex justify-between items-center py-2.5 text-sm font-semibold text-gray-700 border-b border-gray-300">
                        <span>Tax (GST {TAX_RATE}%):</span>
                        <span className="text-gray-900">₹{taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-blue-600 text-lg font-extrabold text-blue-600">
                      <span>Grand Total:</span>
                      <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-yellow-50 p-5 rounded-xl border-2 border-yellow-200 mb-6">
                <h3 className="text-xs font-bold uppercase text-gray-600 mb-4 tracking-wide">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-gray-600 tracking-wider">Payment Method</label>
                    <select
                      className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-900 bg-white cursor-pointer focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-gray-600 tracking-wider">Amount Paid</label>
                    <input
                      type="number"
                      className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      min="0"
                      max={grandTotal}
                      placeholder="0.00"
                    />
                  </div>

                  {paymentMethod === 'Insurance' && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase text-gray-600 tracking-wider">Insurance Provider</label>
                        <input
                          type="text"
                          className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
                          value={insuranceDetails.provider}
                          onChange={(e) => setInsuranceDetails(prev => ({ ...prev, provider: e.target.value }))}
                          placeholder="Insurance company name"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase text-gray-600 tracking-wider">Policy Number</label>
                        <input
                          type="text"
                          className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
                          value={insuranceDetails.policyNumber}
                          onChange={(e) => setInsuranceDetails(prev => ({ ...prev, policyNumber: e.target.value }))}
                          placeholder="Policy number"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase text-gray-600 tracking-wider">Coverage Amount</label>
                        <input
                          type="number"
                          className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all"
                          value={insuranceDetails.coverageAmount}
                          onChange={(e) => setInsuranceDetails(prev => ({ ...prev, coverageAmount: parseFloat(e.target.value) || 0 }))}
                          min="0"
                          placeholder="0.00"
                        />
                      </div>
                    </>
                  )}

                  <div className="col-span-2 flex justify-between items-center px-5 py-4 bg-white rounded-lg border-2 border-gray-300 text-base font-bold">
                    <span className="text-gray-700">Balance Due:</span>
                    <strong className={`text-2xl ${balance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{balance.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 px-8 py-5 border-t-2 border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            className="px-6 py-3 rounded-lg bg-white text-gray-700 border-2 border-gray-300 font-bold text-sm hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-6 py-3 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-300 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePrintBill}
            disabled={billItems.length === 0}
          >
            <FaPrint /> Print
          </button>
          <button
            className="px-6 py-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-300 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSaveBill}
            disabled={saving || billItems.length === 0}
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Bill'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientBillingModal;
