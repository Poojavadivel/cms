import { useEffect, useRef, useState } from 'react'

/**
 * Hook for real-time WebSocket notifications
 * Connects to ws://localhost:5000/api/notifications/ws/{userId}
 * Receives notifications in real-time
 */
export function useRealtimeNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    if (!userId) return

    // Construct WebSocket URL from env-configured API base or current host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = import.meta.env.VITE_API_HOST || window.location.host
    const wsUrl = `${protocol}//${wsHost}/api/notifications/ws/${userId}`

    // Store the keep-alive interval ID so it can be cleared on cleanup
    let pingInterval = null

    // Connect to WebSocket
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('✓ Connected to notification WebSocket')
      setIsConnected(true)
      // Send keep-alive ping every 30 seconds
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, 30000)
    }

    ws.onmessage = (event) => {
      try {
        // Handle plain string messages (ping/pong)
        if (typeof event.data === 'string' && (event.data === 'pong' || event.data === 'ping')) {
          // Keep-alive response - ignore
          return
        }
        
        // Try parsing as JSON for notification messages
        const data = JSON.parse(event.data)
        
        if (data.type === 'pong' || data.type === 'ping') {
          // Keep-alive response (JSON format)
          return
        }
        
        if (data.type === 'notification') {
          console.log('📬 Received notification:', data.notification)
          setNotifications((prev) => [data.notification, ...prev])
          
          // Emit custom event for other components to listen
          window.dispatchEvent(
            new CustomEvent('notification-received', {
              detail: data.notification,
            })
          )
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      console.log('✗ Disconnected from notification WebSocket')
      setIsConnected(false)
      clearInterval(pingInterval)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    // Cleanup on unmount: clear interval and close socket
    return () => {
      clearInterval(pingInterval)
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }, [userId])

  // Function to send keep-alive ping
  const ping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send('ping')
    }
  }

  return {
    notifications,
    isConnected,
    ping,
  }
}
