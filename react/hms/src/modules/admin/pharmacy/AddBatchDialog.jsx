import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdInventory, MdAttachMoney, MdStore, MdCheck, MdDateRange } from 'react-icons/md';
import { FiX, FiArrowRight, FiArrowLeft, FiSave, FiInfo } from 'react-icons/fi';
import pharmacyService from '../../../services/pharmacyService';
import './AddBatchDialog.css';

const AddBatchDialog = ({ isOpen, onClose, batch, medicines, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    medicineId: '',
    batchNumber: '',
    quantity: 0,
    salePrice: 0,
    purchasePrice: 0,
    supplier: '',
    location: 'Main Store',
    expiryDate: '',
  });

  useEffect(() => {
    if (batch) {
      setFormData({
        medicineId: batch.medicineId || '',
        batchNumber: batch.batchNumber || '',
        quantity: batch.quantity || 0,
        salePrice: batch.salePrice || 0,
        purchasePrice: batch.purchasePrice || 0,
        supplier: batch.supplier || '',
        location: batch.location || 'Main Store',
        expiryDate: batch.expiryDate ? batch.expiryDate.split('T')[0] : '',
      });
    } else {
      // Default expiry date: 2 years from now
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const defaultExpiry = futureDate.toISOString().split('T')[0];

      setFormData({
        medicineId: '',
        batchNumber: '',
        quantity: 0,
        salePrice: 0,
        purchasePrice: 0,
        supplier: '',
        location: 'Main Store',
        expiryDate: defaultExpiry,
      });
    }
    setCurrentStep(1);
    setError('');
  }, [batch, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 :
        name === 'salePrice' || name === 'purchasePrice' ? parseFloat(value) || 0 :
          value
    }));
    setError('');
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.medicineId) { setError('Please select a medicine'); return false; }
      if (!formData.batchNumber.trim()) { setError('Batch number is required'); return false; }
      if (formData.quantity <= 0) { setError('Quantity must be greater than 0'); return false; }
      if (!formData.expiryDate) { setError('Expiry date is required'); return false; }
    }
    if (step === 2) {
      if (formData.salePrice <= 0) { setError('Sale price must be greater than 0'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (batch) {
        await pharmacyService.updateBatch(batch._id, formData);
      } else {
        await pharmacyService.createBatch(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const steps = [
    { id: 1, name: 'Batch Details', icon: MdInventory },
    { id: 2, name: 'Pricing', icon: MdAttachMoney },
    { id: 3, name: 'Supply Chain', icon: MdStore },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="w-[85%] max-w-[1100px] h-[80vh] bg-white rounded-[24px] shadow-2xl overflow-hidden flex border border-white/20"
      >
        {/* Sidebar - Premium Blue Gradient */}
        <div className="hidden md:flex flex-col w-[280px] bg-gradient-to-br from-[#207DC0] to-[#165a8a] relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 right-0 h-32 bg-white/10" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-black/10" />

          <div className="p-10 relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 shadow-2xl">
                <MdInventory className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase leading-none">Pharmacy</h2>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1">Batch Manager</p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-10 py-6 relative z-10 overflow-y-auto no-scrollbar">
            <div className="space-y-10 h-full">
              {steps.map((step, idx) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const isLast = idx === steps.length - 1;

                return (
                  <div key={step.id} className="relative group">
                    {!isLast && (
                      <div className={`absolute left-5 top-10 bottom-[-40px] w-0.5 transition-all duration-500 ${isCompleted ? 'bg-[#207DC0]' : 'bg-white/10'}`} />
                    )}
                    <div className="flex items-center gap-5 relative z-10">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-white text-[#207DC0] border-white shadow-xl scale-110' : isCompleted ? 'bg-[#207DC0] border-[#207DC0] text-white' : 'bg-white/5 border-white/10 text-white/30'}`}>
                        {isCompleted ? <MdCheck size={18} /> : <step.icon size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40'}`}>Step 0{step.id}</span>
                        <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-white/60'}`}>{step.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white min-w-0 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
          >
            <FiX size={24} />
          </button>

          {/* Header */}
          <div className="px-10 py-6 border-b border-slate-100 bg-white z-20">
            <div className="max-w-3xl mx-auto">
              <motion.div
                key={`header-${currentStep}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">
                  {batch ? 'Edit Batch' : 'Add New Batch'} <span className="text-[#207DC0]">Module</span>
                </h1>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  Step {currentStep} of 3: {steps[currentStep - 1].name}
                </p>
              </motion.div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
            <div className="max-w-3xl mx-auto pb-20">
              <AnimatePresence mode="wait">

                {/* Step 1: Batch Info */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="group md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block group-focus-within:text-[#207DC0] transition-colors">
                        Select Medicine <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="medicineId"
                        value={formData.medicineId}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                        autoFocus
                      >
                        <option value="">-- Choose from Inventory --</option>
                        {medicines.map(med => (
                          <option key={med._id} value={med._id}>
                            {med.name} {med.strength && `(${med.strength})`} - {med.sku}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="group">
                      <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block group-focus-within:text-[#207DC0] transition-colors">
                        Batch Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="batchNumber"
                        value={formData.batchNumber}
                        onChange={handleChange}
                        placeholder="e.g., BTH-2024-001"
                        className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm"
                      />
                    </div>

                    <div className="group">
                      <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block group-focus-within:text-[#207DC0] transition-colors">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm"
                        min="1"
                      />
                    </div>

                    <div className="group md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block group-focus-within:text-[#207DC0] transition-colors">
                        Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MdDateRange className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                          type="date"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleChange}
                          className="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Pricing */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="group">
                      <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block group-focus-within:text-[#207DC0] transition-colors">
                        Cost Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="purchasePrice"
                        value={formData.purchasePrice}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="group">
                      <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block group-focus-within:text-[#207DC0] transition-colors">
                        Sale Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="salePrice"
                        value={formData.salePrice}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-[#207DC0] shadow-sm text-lg"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="md:col-span-2 p-6 bg-green-50/50 rounded-2xl border border-green-100/50 flex gap-4 items-center">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-green-600">
                        <MdAttachMoney size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-1">Margin Calculator</h4>
                        <p className="text-xs text-slate-500">
                          Estimated Margin: <span className="font-bold text-green-600">
                            {formData.salePrice > 0 && formData.purchasePrice > 0
                              ? `${(((formData.salePrice - formData.purchasePrice) / formData.salePrice) * 100).toFixed(1)}%`
                              : '0%'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Supply Chain */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="group">
                      <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block group-focus-within:text-[#207DC0] transition-colors">
                        Supplier
                      </label>
                      <input
                        type="text"
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleChange}
                        placeholder="e.g., ABC Distributors"
                        className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm"
                      />
                    </div>
                    <div className="group">
                      <label className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest block group-focus-within:text-[#207DC0] transition-colors">
                        Storage Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Main Store - Shelf A"
                        className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-[#207DC0] outline-none transition-all font-bold text-slate-700 shadow-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2"
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center z-50 shrink-0">
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="px-8 py-4 rounded-[22px] font-black text-slate-400 hover:text-[#0f3e61] transition-all flex items-center gap-3 group"
              >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
              </button>
            ) : <div />}

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="px-8 py-4 rounded-[22px] font-black text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all font-primary uppercase tracking-widest text-[10px]"
              >
                Dismiss
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-12 py-4 rounded-[22px] font-black bg-gradient-to-r from-[#207DC0] to-[#165a8a] text-white shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all flex items-center gap-3 uppercase tracking-widest text-[10px]"
                >
                  Next Step <FiArrowRight />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-12 py-4 rounded-[22px] font-black bg-gradient-to-r from-[#207DC0] to-[#165a8a] text-white shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all flex items-center gap-3 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Entry'} <FiSave />
                </button>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default AddBatchDialog;
