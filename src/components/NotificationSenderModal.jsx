import { useState } from 'react'

export default function NotificationSenderModal({ isOpen, onClose, role }) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'announcement',
    priority: 'medium',
    receiverRole: 'student',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Only admin and faculty can send notifications
  const canSend = role && ['admin', 'faculty', 'finance'].includes(role)

  if (!canSend) return null

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Title and message are required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          senderRole: role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Failed to send notification')
        return
      }

      setSuccess('Notification sent successfully!')
      setFormData({
        title: '',
        message: '',
        category: 'announcement',
        priority: 'medium',
        receiverRole: 'student',
      })

      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError('Failed to send notification: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 32,
          maxWidth: 500,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: 20, fontWeight: 700 }}>
            Send Notification
          </h2>
          <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 13 }}>
            Broadcast a message to users
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#b91c1c',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              color: '#16a34a',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., System Maintenance"
              style={{
                height: 40,
                borderRadius: 8,
                border: '1.5px solid #d1d5db',
                padding: '0 12px',
                fontSize: 13,
                outline: 'none',
                transition: 'border 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          {/* Message */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Write the notification message..."
              rows={4}
              style={{
                borderRadius: 8,
                border: '1.5px solid #d1d5db',
                padding: '10px 12px',
                fontSize: 13,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          {/* Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              style={{
                height: 40,
                borderRadius: 8,
                border: '1.5px solid #d1d5db',
                padding: '0 10px',
                fontSize: 13,
                outline: 'none',
                background: '#fff',
                cursor: 'pointer',
                transition: 'border 0.15s',
              }}
            >
              <option value="announcement">📢 Announcement</option>
              <option value="alert">🚨 Alert</option>
              <option value="exam">📝 Exam</option>
              <option value="fee">💰 Fee</option>
              <option value="system">🔧 System</option>
            </select>
          </div>

          {/* Priority */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              style={{
                height: 40,
                borderRadius: 8,
                border: '1.5px solid #d1d5db',
                padding: '0 10px',
                fontSize: 13,
                outline: 'none',
                background: '#fff',
                cursor: 'pointer',
                transition: 'border 0.15s',
              }}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🟠 High</option>
              <option value="critical">🔴 Critical</option>
            </select>
          </div>

          {/* Receiver Role */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
              Send To
            </label>
            <select
              value={formData.receiverRole}
              onChange={(e) => handleChange('receiverRole', e.target.value)}
              style={{
                height: 40,
                borderRadius: 8,
                border: '1.5px solid #d1d5db',
                padding: '0 10px',
                fontSize: 13,
                outline: 'none',
                background: '#fff',
                cursor: 'pointer',
                transition: 'border 0.15s',
              }}
            >
              <option value="student">🎓 Students</option>
              <option value="faculty">👨‍🏫 Faculty</option>
              <option value="admin">🛡️ Admin</option>
              <option value="finance">💼 Finance</option>
              <option value="ALL">🌍 Everyone</option>
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 8,
                border: '1.5px solid #e5e7eb',
                background: '#fff',
                color: '#6b7280',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 8,
                border: 'none',
                background: loading ? '#93c5fd' : '#2563eb',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              }}
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
