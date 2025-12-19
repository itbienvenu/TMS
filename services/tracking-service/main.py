from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import json
import redis.asyncio as redis
import os
import asyncio
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TrackingService")

app = FastAPI(title="Bus Tracking Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis Connection
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# --- Models ---
class LocationUpdate(BaseModel):
    latitude: float = Field(..., description="Current latitude")
    longitude: float = Field(..., description="Current longitude")
    speed: float = Field(0.0, description="Speed in m/s")
    heading: float = Field(0.0, description="Heading in degrees (0-360)")
    timestamp: float = Field(..., description="Unix timestamp of the fix")
    
    # Optional metadata that might be sent
    # In a real app, this should probably come from a separate 'Trip' service, 
    # but for real-time updates sending it here is robust for MVP
    next_stop_name: Optional[str] = None
    passenger_count: Optional[int] = None

class BusStatus(LocationUpdate):
    traffic_status: str = "green"  # green, orange, red
    eta_next_stop: Optional[str] = None # e.g. "5 mins"

class BatchRequest(BaseModel):
    bus_ids: List[str]

# ... (Previous imports and setup remain) ...

# --- Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.global_connections: list[WebSocket] = [] # For Super Admins

    async def connect(self, websocket: WebSocket, bus_id: str):
        await websocket.accept()
        if bus_id == "all":
            self.global_connections.append(websocket)
            logger.info("New GLOBAL client connected")
        else:
            if bus_id not in self.active_connections:
                self.active_connections[bus_id] = []
            self.active_connections[bus_id].append(websocket)
            logger.info(f"New client connected to bus {bus_id}")

    def disconnect(self, websocket: WebSocket, bus_id: str):
        if bus_id == "all":
            if websocket in self.global_connections:
                self.global_connections.remove(websocket)
        elif bus_id in self.active_connections:
            if websocket in self.active_connections[bus_id]:
                self.active_connections[bus_id].remove(websocket)
            if not self.active_connections[bus_id]:
                del self.active_connections[bus_id]

    async def broadcast(self, bus_id: str, message: dict):
        # 1. Notify specific bus subscribers
        if bus_id in self.active_connections:
            for connection in self.active_connections[bus_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass
        
        # 2. Notify global subscribers (Super Admins)
        # We inject the bus_id into the message so they know WHO moved
        message_with_id = {**message, "bus_id": bus_id}
        for connection in self.global_connections:
            try:
                await connection.send_json(message_with_id)
            except Exception:
                pass

manager = ConnectionManager()

# ... (Helpers remain) ...

# ... (Endpoints remain) ...

# Updated Endpoint to push including global broadcast
@app.post("/api/v1/tracking/{bus_id}")
async def update_location(
    bus_id: str, 
    update: LocationUpdate, 
    x_driver_token: Optional[str] = Header(None)
):
    """
    Endpoint for Driver App to push location.
    """
    enriched_data = update.dict()
    enriched_data["traffic_status"] = calculate_traffic_status(update.speed)
    
    await redis_client.set(f"bus_location:{bus_id}", json.dumps(enriched_data), ex=7200) 
    
    # Broadcast to specific AND global
    await manager.broadcast(bus_id, enriched_data)
    
    return {"status": "updated", "traffic": enriched_data["traffic_status"]}

# ... (Batch endpoint remains) ...

@app.websocket("/ws/tracking/{bus_id}")
async def websocket_endpoint(websocket: WebSocket, bus_id: str):
    await manager.connect(websocket, bus_id)
    try:
        # If specific bus, send last known location
        if bus_id != "all":
            last_loc = await redis_client.get(f"bus_location:{bus_id}")
            if last_loc:
                 await websocket.send_json(json.loads(last_loc))
        
        while True:
            await websocket.receive_text()
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, bus_id)
    except Exception as e:
        logger.error(f"WS Error: {e}")
        manager.disconnect(websocket, bus_id)


