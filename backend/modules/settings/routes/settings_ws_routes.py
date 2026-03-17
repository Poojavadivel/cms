from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.modules.settings.websocket.settings_ws import connect, disconnect

router = APIRouter(tags=["Settings WebSocket"])


@router.websocket("/ws/settings")
async def settings_websocket_endpoint(websocket: WebSocket):
    await connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await disconnect(websocket)
    except Exception:
        await disconnect(websocket)
