"""WebSocket connection manager for real-time notifications"""
from typing import dict, set
from fastapi import WebSocket


class ConnectionManager:
    """Manage WebSocket connections for real-time notification delivery"""
    
    def __init__(self):
        # Map: user_id -> set of WebSocket connections
        self.active_connections: dict[str, set[WebSocket]] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        """Register a new WebSocket connection for a user"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    async def disconnect(self, user_id: str, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def broadcast_to_user(self, user_id: str, message: dict):
        """Send message to all browser tabs/windows of a specific user"""
        if user_id in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.add(websocket)
            
            # Clean up disconnected connections
            for ws in disconnected:
                await self.disconnect(user_id, ws)
    
    async def broadcast_to_many(self, user_ids: list[str], message: dict):
        """Send message to multiple users"""
        for user_id in user_ids:
            await self.broadcast_to_user(user_id, message)
    
    async def broadcast_to_role(self, role: str, message: dict, user_ids: list[str] | None = None):
        """
        Broadcast to all users of a role.
        If user_ids is provided, only send to those specific users of that role.
        """
        if user_ids:
            await self.broadcast_to_many(user_ids, message)
        else:
            # This would need the db to get all users of a role
            # For now, we'll handle this in the route handler
            pass


# Global connection manager instance
connection_manager = ConnectionManager()
