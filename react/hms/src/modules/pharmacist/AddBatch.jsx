import React, { useState, useEffect } from 'react';
import { MdInventory, MdSave, MdArrowBack, MdAutoAwesome, MdAttachMoney, MdLocalShipping, MdBusiness, MdRefresh } from 'react-icons/md';
import { authService } from '../../services';
import './Dashboard.css'; // Using consistent dashboard styles

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
        setMsg(null);
        if (!formData.medicineId || !formData.batchNumber || formData.quantity <= 0) {
            setMessage({ type: 'error', text: 'Required fields missing.' });
            return;
        }

        setIsSaving(true);
        try {
            await authService.post('/pharmacy/batches', formData);
            setMessage({ type: 'success', text: 'Batch recorded successfully!' });
            setFormData({
                medicineId: '', batchNumber: '', expiryDate: '',
                quantity: 0, purchasePrice: 0, salePrice: 0,
                supplier: '', location: ''
            });
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Transmission failed.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const setMsg = (val) => setMessage(val);

    return (
        <div className="pharmacist-dashboard" style={{ overflowY: 'auto', height: '100%' }}>
            {/* Premium Header */}
            <div className="dashboard-header-premium">
                <div className="header-title-section">
                    <button className="header-icon-box" onClick={() => window.history.back()} style={{ border: 'none', cursor: 'pointer' }}>
                        <MdArrowBack size={24} />
                    </button>
                    <div className="header-text">
                        <h1>Stock <span>Intake</span></h1>
                        <p>REGISTER NEW CLINICAL BATCHES TO HUB</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button onClick={loadMedicines} className="btn-refresh-premium" disabled={isLoading}>
                        <MdRefresh size={20} className={isLoading ? 'spinning' : ''} />
                        <span>Refresh List</span>
                    </button>
                </div>
            </div>

            <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', height: 'auto', paddingBottom: '40px' }}>
                {message && (
                    <div style={{
                        position: 'fixed', top: '24px', right: '24px', zIndex: 1000,
                        padding: '16px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px',
                        background: message.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                        color: message.type === 'success' ? '#166534' : '#991B1B',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: '700'
                    }}>
                        {message.type === 'success' ? <MdCheckCircle size={20} /> : <MdError size={20} />}
                        <span>{message.text}</span>
                    </div>
                )}

                <div className="premium-alert-card" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                    <form onSubmit={handleSave}>
                        {/* Section 1: Medicine Identification */}
                        <div style={{ marginBottom: '40px' }}>
                            <div className="alert-card-header">
                                <div className="header-icon warning"><MdBusiness /></div>
                                <h3>Product Identification</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                <div className="form-group-premium">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Select Medicine Hub Record *</label>
                                    <select
                                        style={{ width: '100%', height: '54px', padding: '0 20px', background: '#F8FAFC', border: '1.5px solid #F1F5F9', borderRadius: '14px', fontSize: '15px', fontWeight: '600', outline: 'none' }}
                                        value={formData.medicineId}
                                        onChange={handleMedicineChange}
                                        required
                                    >
                                        <option value="">-- Choose from global inventory --</option>
                                        {medicines.map(med => (
                                            <option key={med._id} value={med._id}>
                                                {med.name} {med.strength ? `(${med.strength})` : ''} — SKU: {med.sku || 'N/A'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Batch Logistics */}
                        <div style={{ marginBottom: '40px' }}>
                            <div className="alert-card-header">
                                <div className="header-icon danger" style={{ background: '#F0F9FF', color: '#0EA5E9' }}><MdInventory /></div>
                                <h3>Batch Logistics</h3>
                                <button
                                    type="button"
                                    onClick={generateBatchNumber}
                                    disabled={!formData.medicineId}
                                    style={{
                                        background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '8px 16px',
                                        fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#475569'
                                    }}
                                >
                                    <MdAutoAwesome /> AUTO-GENERATE ID
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group-premium">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Batch Reference ID *</label>
                                    <input
                                        name="batchNumber"
                                        placeholder="e.g. HUB-24-X102"
                                        style={{ width: '100%', height: '54px', padding: '0 20px', background: '#F8FAFC', border: '1.5px solid #F1F5F9', borderRadius: '14px', fontSize: '15px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }}
                                        value={formData.batchNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group-premium">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Units Received *</label>
                                    <input
                                        name="quantity"
                                        type="number"
                                        placeholder="0"
                                        style={{ width: '100%', height: '54px', padding: '0 20px', background: '#F8FAFC', border: '1.5px solid #F1F5F9', borderRadius: '14px', fontSize: '15px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }}
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group-premium" style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Expiry Date *</label>
                                    <input
                                        name="expiryDate"
                                        type="date"
                                        style={{ width: '100%', height: '54px', padding: '0 20px', background: '#F8FAFC', border: '1.5px solid #F1F5F9', borderRadius: '14px', fontSize: '15px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }}
                                        value={formData.expiryDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Financials */}
                        <div style={{ marginBottom: '40px' }}>
                            <div className="alert-card-header">
                                <div className="header-icon warning" style={{ background: '#FEE2E2', color: '#EF4444' }}><MdAttachMoney /></div>
                                <h3>Commercial Pricing</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group-premium">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#EF4444', marginBottom: '8px', textTransform: 'uppercase' }}>Unit Cost (₹) *</label>
                                    <input
                                        name="purchasePrice"
                                        type="number"
                                        step="0.01"
                                        style={{ width: '100%', height: '54px', padding: '0 20px', background: '#FFF1F2', border: '1.5px solid #FECDD3', borderRadius: '14px', fontSize: '15px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', color: '#991B1B' }}
                                        value={formData.purchasePrice}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group-premium">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#166534', marginBottom: '8px', textTransform: 'uppercase' }}>Unit MRP (₹) *</label>
                                    <input
                                        name="salePrice"
                                        type="number"
                                        step="0.01"
                                        style={{ width: '100%', height: '54px', padding: '0 20px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '14px', fontSize: '15px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', color: '#166534' }}
                                        value={formData.salePrice}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Supply Chain */}
                        <div style={{ marginBottom: '40px' }}>
                            <div className="alert-card-header">
                                <div className="header-icon danger" style={{ background: '#F8FAFC', color: '#64748B' }}><MdLocalShipping /></div>
                                <h3>Vendor & Location</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group-premium">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Vendor Name</label>
                                    <input
                                        name="supplier"
                                        placeholder="Global Medical Supplies"
                                        style={{ width: '100%', height: '54px', padding: '0 20px', background: '#F8FAFC', border: '1.5px solid #F1F5F9', borderRadius: '14px', fontSize: '15px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }}
                                        value={formData.supplier}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group-premium">
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Storage Shelf ID</label>
                                    <input
                                        name="location"
                                        placeholder="Block-A, Row-12"
                                        style={{ width: '100%', height: '54px', padding: '0 20px', background: '#F8FAFC', border: '1.5px solid #F1F5F9', borderRadius: '14px', fontSize: '15px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }}
                                        value={formData.location}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '2px dashed #F1F5F9' }}>
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                style={{ height: '54px', padding: '0 32px', borderRadius: '14px', border: 'none', background: '#F1F5F9', color: '#64748B', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}
                            >
                                DISCARD
                            </button>
                            <button
                                type="submit"
                                className="btn-refresh-premium"
                                style={{ height: '54px', padding: '0 40px', fontSize: '15px' }}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <MdRefresh size={20} className="spinning" />
                                        <span>COMMITTING TO HUB...</span>
                                    </>
                                ) : (
                                    <>
                                        <MdSave size={20} />
                                        <span>RELEASE STOCK BATCH</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddBatch;
