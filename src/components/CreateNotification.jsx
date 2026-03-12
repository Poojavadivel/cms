import { useState } from 'react';
import './CreateNotification.css';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'finance', label: 'Finance Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'ALL', label: 'All Roles (Broadcast)' }
];

const MODULES = [
  { value: 'Academic', label: 'Academic' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Administrative', label: 'Administrative' },
  { value: 'System', label: 'System' },
  { value: 'Alerts', label: 'Alerts' }
];

const PRIORITIES = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' }
];

export default function CreateNotification({ senderRole, onNotificationCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    receiverRole: 'student',
    module: 'Academic',
    priority: 'Medium',
    actionId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          senderRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create notification');
      }

      setSuccess('Notification created successfully!');
      setFormData({
        title: '',
        message: '',
        receiverRole: 'student',
        module: 'Academic',
        priority: 'Medium',
        actionId: '',
      });

      if (onNotificationCreated) {
        onNotificationCreated(data.data);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-notification-form" onSubmit={handleSubmit}>
      <div className="create-notification-header">
        <h2>Create New Notification</h2>
      </div>

      {error && <div className="form-alert error">{error}</div>}
      {success && <div className="form-alert success">{success}</div>}

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Notification title"
          required
          maxLength="100"
        />
      </div>

      <div className="form-group">
        <label htmlFor="message">Message *</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          placeholder="Notification message"
          required
          rows="4"
          maxLength="500"
        />
        <small>{formData.message.length}/500 characters</small>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="receiverRole">Recipient *</label>
          <select
            id="receiverRole"
            name="receiverRole"
            value={formData.receiverRole}
            onChange={handleInputChange}
            required
          >
            <option value="">Select recipient</option>
            {ROLES.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="module">Category *</label>
          <select
            id="module"
            name="module"
            value={formData.module}
            onChange={handleInputChange}
            required
          >
            {MODULES.map(mod => (
              <option key={mod.value} value={mod.value}>{mod.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority *</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            required
          >
            {PRIORITIES.map(pri => (
              <option key={pri.value} value={pri.value}>{pri.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="actionId">Action ID (Optional)</label>
        <input
          type="text"
          id="actionId"
          name="actionId"
          value={formData.actionId}
          onChange={handleInputChange}
          placeholder="e.g., assignment_posted_1"
          maxLength="50"
        />
        <small>Used to track notification triggers and follow-ups</small>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Notification'}
        </button>
      </div>
    </form>
  );
}
