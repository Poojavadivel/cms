import React, { useState } from 'react';
import { MdLock, MdSecurity, MdSave, MdCheckCircle, MdError } from 'react-icons/md';
import { authService } from '../../services';
import './Dashboard_Flutter.css'; // Reusing the premium styles

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
        <div className="flutter-pharmacist-dashboard">
            <div className="flutter-dashboard-scroll">
                <div className="flutter-header">
                    <div className="flutter-header-info">
                        <h1 className="flutter-header-title">Settings</h1>
                        <p className="flutter-header-date">Manage your account preferences</p>
                    </div>
                </div>

                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    {/* Security Section */}
                    <div className="flutter-card">
                        <div className="flutter-card-header">
                            <div className="flutter-card-header-left">
                                <MdSecurity className="flutter-card-icon flutter-danger-icon" size={24} />
                                <h3 className="flutter-card-title">Security</h3>
                            </div>
                        </div>

                        <div className="flutter-card-body">
                            <form onSubmit={handleSubmitPassword}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>
                                        Current Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <MdLock style={{ position: 'absolute', top: '12px', left: '12px', color: '#9CA3AF' }} />
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwordForm.currentPassword}
                                            onChange={handlePasswordChange}
                                            className="search-input-lg" // Reusing input style
                                            style={{ paddingLeft: '36px', width: '100%' }}
                                            placeholder="Enter current password"
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>
                                        New Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <MdLock style={{ position: 'absolute', top: '12px', left: '12px', color: '#9CA3AF' }} />
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordForm.newPassword}
                                            onChange={handlePasswordChange}
                                            className="search-input-lg"
                                            style={{ paddingLeft: '36px', width: '100%' }}
                                            placeholder="Enter new password"
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>
                                        Confirm New Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <MdCheckCircle style={{ position: 'absolute', top: '12px', left: '12px', color: '#9CA3AF' }} />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordForm.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="search-input-lg"
                                            style={{ paddingLeft: '36px', width: '100%' }}
                                            placeholder="Confirm new password"
                                            required
                                        />
                                    </div>
                                </div>

                                {msg.text && (
                                    <div className={`flutter-alert-item ${msg.type === 'error' ? 'flutter-alert-item-danger' : 'flutter-alert-item-warning'}`}
                                        style={{ marginBottom: '16px', background: msg.type === 'success' ? '#ECFDF5' : undefined, borderColor: msg.type === 'success' ? '#A7F3D0' : undefined }}>
                                        <div className="flutter-alert-icon" style={{
                                            background: msg.type === 'success' ? '#D1FAE5' : undefined,
                                            color: msg.type === 'success' ? '#207DC0' : undefined
                                        }}>
                                            {msg.type === 'error' ? <MdError /> : <MdCheckCircle />}
                                        </div>
                                        <div className="flutter-alert-content">
                                            <p className="flutter-alert-name" style={{ color: msg.type === 'success' ? '#065F46' : undefined }}>
                                                {msg.text}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="flutter-action-btn flutter-action-primary"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span>Updating...</span>
                                    ) : (
                                        <>
                                            <MdSave size={18} />
                                            <span>Reset Password</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacistSettings;
