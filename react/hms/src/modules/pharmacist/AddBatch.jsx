import React, { useState, useEffect } from 'react';
import { MdInventory, MdSave, MdArrowBack, MdAutoAwesome, MdAttachMoney, MdLocalShipping, MdBusiness } from 'react-icons/md';
import { authService } from '../../services';
import './Medicines.css'; // Reusing styles

const AddBatch = () => {
    const [medicines, setMedicines] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const [formData, setFormData] = useState({
        medicineId: '',
        batchNumber: '',
        expiryDate: '',
        quantity: 0,
        purchasePrice: 0,
        salePrice: 0,
        supplier: '',
        location: ''
    });

    useEffect(() => {
        loadMedicines();
    }, []);

    const loadMedicines = async () => {
        setIsLoading(true);
        try {
            const response = await authService.get('/pharmacy/medicines?limit=500');
            let medicinesList = [];
            if (Array.isArray(response)) {
                medicinesList = response;
            } else if (response && typeof response === 'object') {
                medicinesList = response.medicines || response.data || [];
            }
            setMedicines(medicinesList);
        } catch (error) {
            console.error('Error loading medicines:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateBatchNumber = () => {
        const selectedMed = medicines.find(m => m._id === formData.medicineId);
        const prefix = selectedMed?.sku?.split('-')[1] || 'BAT';
        const date = new Date();
        const timestamp = date.getFullYear().toString().substr(-2) + (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        const autoBatch = `${prefix}-${timestamp}-${random}`;

        setFormData(prev => ({ ...prev, batchNumber: autoBatch }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'quantity' || name === 'purchasePrice' || name === 'salePrice') ? Number(value) : value
        }));
    };

    const handleMedicineChange = (e) => {
        const medId = e.target.value;
        const selectedMed = medicines.find(m => m._id === medId);
        setFormData(prev => ({
            ...prev,
            medicineId: medId,
            salePrice: selectedMed?.price || 0,
            purchasePrice: selectedMed?.purchasePrice || 0
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.medicineId || !formData.batchNumber || formData.quantity <= 0) {
            setMessage({ type: 'error', text: 'Please fill all required fields.' });
            return;
        }

        setIsSaving(true);
        try {
            await authService.post('/pharmacy/batches', formData);
            setMessage({ type: 'success', text: 'Inventory updated successfully!' });
            setFormData({
                medicineId: '',
                batchNumber: '',
                expiryDate: '',
                quantity: 0,
                purchasePrice: 0,
                salePrice: 0,
                supplier: '',
                location: ''
            });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to update inventory' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="dashboard-container" style={{ overflowY: 'auto' }}>
            <div className="add-batch-wrapper">
                {/* Custom Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <button className="page-arrow-circle" onClick={() => window.history.back()}>
                        <MdArrowBack size={20} />
                    </button>
                    <div>
                        <h1 className="main-title">Stock Intake Management</h1>
                        <p className="main-subtitle">Add new batches and manage store inventory</p>
                    </div>
                </div>

                {message && (
                    <div className={`status-pill ${message.type}`} style={{
                        position: 'fixed', top: '30px', right: '30px', zIndex: 2000,
                        padding: '12px 28px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        animation: 'slideUp 0.3s ease', borderRadius: '12px'
                    }}>
                        {message.text}
                    </div>
                )}

                <div className="premium-card">
                    <div className="batch-header-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="batch-section-icon">
                                    <MdInventory size={20} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>New Batch Entry</h3>
                            </div>
                        </div>
                    </div>

                    <div className="batch-form-container">
                        <form onSubmit={handleSave}>
                            {/* Section 1: Medicine Selection */}
                            <div className="batch-section">
                                <div className="batch-section-title">
                                    <div className="batch-section-icon"><MdBusiness /></div>
                                    <span>MEDICINE INFORMATION</span>
                                </div>
                                <div className="detail-row batch-input-full">
                                    <label className="detail-label">Select Registered Medicine *</label>
                                    <select
                                        className="search-input-lg"
                                        style={{ height: '48px', fontSize: '15px' }}
                                        value={formData.medicineId}
                                        onChange={handleMedicineChange}
                                        required
                                    >
                                        <option value="">-- Click to select from list --</option>
                                        {medicines.map(med => (
                                            <option key={med._id} value={med._id}>
                                                {med.name} {med.strength ? `(${med.strength})` : ''} - {med.sku || 'N/A'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Section 2: Batch Details */}
                            <div className="batch-section">
                                <div className="batch-section-title">
                                    <div className="batch-section-icon"><MdInventory /></div>
                                    <span>BATCH & QUANTITY</span>
                                    <button
                                        type="button"
                                        className="auto-gen-btn"
                                        onClick={generateBatchNumber}
                                        disabled={!formData.medicineId}
                                        title="Automatically generate batch number"
                                    >
                                        <MdAutoAwesome style={{ marginRight: '6px' }} />
                                        Auto-Generate
                                    </button>
                                </div>
                                <div className="batch-input-group">
                                    <div className="detail-row">
                                        <label className="detail-label">Batch Number *</label>
                                        <input
                                            name="batchNumber"
                                            className="search-input-lg"
                                            placeholder="e.g. BTC-1002"
                                            style={{ height: '44px' }}
                                            value={formData.batchNumber}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <label className="detail-label">Quantity Received *</label>
                                        <input
                                            name="quantity"
                                            type="number"
                                            min="1"
                                            className="search-input-lg"
                                            placeholder="0"
                                            style={{ height: '44px' }}
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="detail-row batch-input-full">
                                        <label className="detail-label">Expiry Date *</label>
                                        <input
                                            name="expiryDate"
                                            type="date"
                                            className="search-input-lg"
                                            style={{ height: '44px' }}
                                            value={formData.expiryDate}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Pricing */}
                            <div className="batch-section pricing-section">
                                <div className="batch-section-title">
                                    <div className="batch-section-icon"><MdAttachMoney /></div>
                                    <span style={{ color: '#E11D48' }}>FINANCIALS & PRICING</span>
                                </div>
                                <div className="batch-input-group">
                                    <div className="detail-row">
                                        <label className="detail-label" style={{ color: '#E11D48' }}>Unit Purchase Price (₹) *</label>
                                        <input
                                            name="purchasePrice"
                                            type="number"
                                            step="0.01"
                                            className="search-input-lg"
                                            placeholder="0"
                                            style={{ height: '44px' }}
                                            value={formData.purchasePrice}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <label className="detail-label" style={{ color: '#E11D48' }}>Unit Selling Price (₹) *</label>
                                        <input
                                            name="salePrice"
                                            type="number"
                                            step="0.01"
                                            className="search-input-lg"
                                            placeholder="0"
                                            style={{ height: '44px' }}
                                            value={formData.salePrice}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Supply Chain */}
                            <div className="batch-section">
                                <div className="batch-section-title">
                                    <div className="batch-section-icon"><MdLocalShipping /></div>
                                    <span>LOGISTICS & SOURCE</span>
                                </div>
                                <div className="batch-input-group">
                                    <div className="detail-row">
                                        <label className="detail-label">Vendor / Supplier</label>
                                        <input
                                            name="supplier"
                                            className="search-input-lg"
                                            placeholder="N/A"
                                            style={{ height: '44px' }}
                                            value={formData.supplier}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <label className="detail-label">Storage Rack / Shelf</label>
                                        <input
                                            name="location"
                                            className="search-input-lg"
                                            placeholder="Main Store"
                                            style={{ height: '44px' }}
                                            value={formData.location}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    style={{ height: '48px', padding: '0 32px', borderRadius: '12px' }}
                                    onClick={() => window.history.back()}
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="primary-btn"
                                    style={{
                                        height: '48px', padding: '0 40px', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        background: 'linear-gradient(135deg, var(--primary) 0%, #4F46E5 100%)',
                                        boxShadow: '0 4px 14px 0 rgba(38, 99, 255, 0.39)'
                                    }}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Updating...' : (
                                        <>
                                            <MdSave size={20} />
                                            <span>Save & Release Stock</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddBatch;
