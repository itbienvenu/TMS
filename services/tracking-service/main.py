from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import redis.asyncio as redis
import os
import asyncio

app = FastAPI(title="Tracking Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis Connection (Pub/Sub)
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class ConnectionManager:
    def __init__(self):
        # Map: bus_id -> list of websocket connections
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, bus_id: str):
        await websocket.accept()
        if bus_id not in self.active_connections:
            self.active_connections[bus_id] = []
        self.active_connections[bus_id].append(websocket)

    def disconnect(self, websocket: WebSocket, bus_id: str):
        if bus_id in self.active_connections:
            if websocket in self.active_connections[bus_id]:
                self.active_connections[bus_id].remove(websocket)
            if not self.active_connections[bus_id]:
                del self.active_connections[bus_id]

    async def broadcast(self, bus_id: str, message: dict):
        if bus_id in self.active_connections:
            for connection in self.active_connections[bus_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Clean up dead connections lazily? Or just log
                    pass

manager = ConnectionManager()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "tracking-service"}

# Endpoint for Driver App to push location (HTTP)
# Ideally driver uses WebSocket too, but HTTP is easier to implement robustly for MVP offline/online sync
@app.post("/api/v1/tracking/{bus_id}")
async def update_location(bus_id: str, location: dict):
    # Expects: { "latitude": float, "longitude": float, "speed": float, ... }
    
    # 1. Store in Redis (Last Known Location)
    await redis_client.set(f"bus_location:{bus_id}", json.dumps(location), ex=3600) # Expire in 1 hr
    
    # 2. Broadcast to subscribers
    await manager.broadcast(bus_id, location)
    
    
    return {"status": "updated"}

class BatchRequest(BaseModel):
    bus_ids: list[str]

@app.post("/api/v1/tracking/batch")
async def get_batch_locations(req: BatchRequest):
    """
    Get last known locations for a list of bus IDs.
    Returns: {bus_id: location_data_dict}
    """
    pipe = redis_client.pipeline()
    for bid in req.bus_ids:
        pipe.get(f"bus_location:{bid}")
    
    results = await pipe.execute()
    
    response = {}
    for i, bid in enumerate(req.bus_ids):
        if results[i]:
            try:
                response[bid] = json.loads(results[i])
            except:
                response[bid] = None
        else:
            response[bid] = None
            
    return response

# WebSocket endpoint for Consumers (Customers/Dashboards)
@app.websocket("/ws/tracking/{bus_id}")
async def websocket_endpoint(websocket: WebSocket, bus_id: str):
    await manager.connect(websocket, bus_id)
    try:
        # Send last known location immediately
        last_loc = await redis_client.get(f"bus_location:{bus_id}")
        if last_loc:
             await websocket.send_json(json.loads(last_loc))
             
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # If client sends data, ignore or handle ping
    except WebSocketDisconnect:
        manager.disconnect(websocket, bus_id)
    except Exception as e:
        manager.disconnect(websocket, bus_id)
        print(f"WS Error: {e}")
