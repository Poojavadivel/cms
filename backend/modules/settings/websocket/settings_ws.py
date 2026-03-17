from fastapi import WebSocket

connections: list[WebSocket] = []


async def connect(ws: WebSocket):
    await ws.accept()
    connections.append(ws)


async def disconnect(ws: WebSocket):
    if ws in connections:
        connections.remove(ws)


async def broadcast(message: dict):
    stale_connections: list[WebSocket] = []
    for conn in connections:
        try:
            await conn.send_json(message)
        except Exception:
            stale_connections.append(conn)

    for conn in stale_connections:
        await disconnect(conn)
