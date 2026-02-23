import React, { useState } from 'react';
import { MdLock, MdSecurity, MdSave, MdCheckCircle, MdError, MdRefresh } from 'react-icons/md';
import { authService } from '../../services';
import './Dashboard.css'; // Consistent styling with dashboard

const PharmacistSettings = () => {
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMsg({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setMsg({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        try {
            const response = await authService.post('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            if (response && response.success) {
                setMsg({ type: 'success', text: 'Password updated successfully!' });
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                throw new Error(response?.message || 'Failed to update password');
            }
        } catch (error) {
            console.error('Password Change Error:', error);
            setMsg({ type: 'error', text: error.message || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pharmacist-dashboard">
            {/* Premium Header */}
            <div className="dashboard-header-premium">
                <div className="header-title-section">
                    <div className="header-icon-box">
                        <MdSecurity size={32} />
                    </div>
                    <div className="header-text">
                        <h1>Account <span>Settings</span></h1>
                        <p>MANAGE YOUR SECURITY AND PREFERENCES</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', height: 'auto' }}>
                <div style={{ width: '100%', maxWidth: '600px' }}>
                    <div className="premium-alert-card" style={{ padding: '40px' }}>
                        <div className="alert-card-header" style={{ marginBottom: '30px' }}>
                            <div className="header-icon danger"><MdLock /></div>
                            <h3>Security & Authentication</h3>
                        </div>

                        <form onSubmit={handleSubmitPassword} className="premium-form-settings">
                            <div className="form-group-premium" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Current Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordForm.currentPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter current password"
                                        style={{
                                            width: '100%',
                                            height: '54px',
                                            padding: '0 20px',
                                            background: '#F8FAFC',
                                            border: '1.5px solid #F1F5F9',
                                            borderRadius: '14px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            outline: 'none',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group-premium" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    New Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter new password"
                                        style={{
                                            width: '100%',
                                            height: '54px',
                                            padding: '0 20px',
                                            background: '#F8FAFC',
                                            border: '1.5px solid #F1F5F9',
                                            borderRadius: '14px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            outline: 'none',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group-premium" style={{ marginBottom: '30px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Confirm New Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Confirm new password"
                                        style={{
                                            width: '100%',
                                            height: '54px',
                                            padding: '0 20px',
                                            background: '#F8FAFC',
                                            border: '1.5px solid #F1F5F9',
                                            borderRadius: '14px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            outline: 'none',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            {msg.text && (
                                <div style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    marginBottom: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: msg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                                    color: msg.type === 'success' ? '#166534' : '#991B1B',
                                    fontSize: '14px',
                                    fontWeight: '700'
                                }}>
                                    {msg.type === 'success' ? <MdCheckCircle size={20} /> : <MdError size={20} />}
                                    <span>{msg.text}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn-refresh-premium"
                                style={{
                                    width: '100%',
                                    height: '54px',
                                    justifyContent: 'center',
                                    fontSize: '15px',
                                    letterSpacing: '1px'
                                }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <MdRefresh size={20} className="spinning" />
                                        <span>UPDATING HUB...</span>
                                    </>
                                ) : (
                                    <>
                                        <MdSave size={20} />
                                        <span>SAVE NEW PASSWORD</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacistSettings;
