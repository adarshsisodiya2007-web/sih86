import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.services.simulation import sim_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("varshanet")

# Active WebSocket connections registry
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

# Background simulation runner
async def simulation_loop():
    logger.info("Starting VARSHANET Real-time Simulation Engine loop (5s interval)...")
    while True:
        try:
            if sim_engine.simulation_mode:
                sim_engine.tick()
                # Prepare payload
                payload = {
                    "event": "SIMULATION_TICK",
                    "tick_count": sim_engine.tick_count,
                    "active_cells": [c.model_dump() for c in sim_engine.active_cells.values()],
                    "lightning_flashes": [f.model_dump() for f in sim_engine.lightning_flashes[:35]],
                    "alerts_count": len([a for a in sim_engine.alerts if a.status == "active"]),
                    "system_health": sim_engine.get_system_health().model_dump()
                }
                await manager.broadcast(payload)
        except Exception as e:
            logger.error(f"Error in simulation loop: {e}")
        await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background simulation task
    task = asyncio.create_task(simulation_loop())
    yield
    # Shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="VARSHANET API",
    description="Convective Weather Intelligence & 0–6 Hour Nowcasting System API (SIH26084)",
    version="2.4.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial world state immediately
        initial_state = {
            "event": "INITIAL_STATE",
            "tick_count": sim_engine.tick_count,
            "active_cells": [c.model_dump() for c in sim_engine.active_cells.values()],
            "lightning_flashes": [f.model_dump() for f in sim_engine.lightning_flashes[:35]],
            "alerts": [a.model_dump() for a in sim_engine.alerts],
            "system_health": sim_engine.get_system_health().model_dump()
        }
        await websocket.send_text(json.dumps(initial_state))

        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("action") == "PING":
                    await websocket.send_text(json.dumps({"event": "PONG"}))
                elif msg.get("action") == "FORCE_TICK":
                    sim_engine.tick()
                    payload = {
                        "event": "SIMULATION_TICK",
                        "tick_count": sim_engine.tick_count,
                        "active_cells": [c.model_dump() for c in sim_engine.active_cells.values()],
                        "lightning_flashes": [f.model_dump() for f in sim_engine.lightning_flashes[:35]],
                        "system_health": sim_engine.get_system_health().model_dump()
                    }
                    await manager.broadcast(payload)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection exception: {e}")
        manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "system": "VARSHANET Convective Weather Intelligence System",
        "description": "0-6 Hour Hyper-Local Nowcasting Prototype (SIH26084)",
        "docs_url": "/docs",
        "websocket_url": "/ws/live",
        "status": "OPERATIONAL (SIMULATION MODE)"
    }
