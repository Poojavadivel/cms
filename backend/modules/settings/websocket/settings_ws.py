from backend.utils.websocket_manager import connection_manager


async def connect(user_id: str, ws):
    await connection_manager.connect(user_id, ws)


async def disconnect(user_id: str, ws):
    await connection_manager.disconnect(user_id, ws)


async def broadcast(message: dict):
    user_id = message.get("user_id")
    if user_id:
        await connection_manager.broadcast_to_user(user_id, message)
