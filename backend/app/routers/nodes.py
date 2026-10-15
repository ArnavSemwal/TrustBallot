from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import PlainTextResponse
import asyncio
import json
import uuid
from typing import List
from datetime import datetime
from ..config import NODE_NAMES
from ..logging_config import logger
from ..store import vote_ledger

router = APIRouter(tags=["nodes"])

# Simulated node states
simulated_nodes = {
    nid: {
        "id": nid,
        "name": name,
        "status": "up",
        "last_block": "genesis",
        "last_heartbeat": datetime.utcnow().isoformat() + "Z"
    }
    for nid, name in NODE_NAMES.items()
}

metrics_data = {
    "votes_accepted": 0,
    "votes_rejected": 0
}

@router.get("/api/nodes/status")
def api_get_nodes_status():
    nodes_list = list(simulated_nodes.values())
    up_count = sum(1 for n in nodes_list if n["status"] == "up")
    quorum = up_count >= 3
    
    return {
        "quorum_reached": quorum,
        "nodes": nodes_list
    }

@router.get("/api/nodes/{node_id}/health")
def api_get_node_health(node_id: str):
    node = simulated_nodes.get(node_id)
    if not node:
        return {"status": "not_found"}
    return {"status": node["status"]}

@router.post("/api/nodes/{node_id}/toggle")
def api_toggle_node_status(node_id: str):
    node = simulated_nodes.get(node_id)
    if node:
        node["status"] = "down" if node["status"] == "up" else "up"
        logger.log("warn", node_id, "node_toggled", new_status=node["status"])
        return node
    return {"error": "not found"}

@router.get("/metrics", response_class=PlainTextResponse)
def api_get_metrics():
    up_count = sum(1 for n in simulated_nodes.values() if n["status"] == "up")
    lines = [
        "# HELP votes_accepted Total accepted votes",
        "# TYPE votes_accepted counter",
        f"votes_accepted {metrics_data['votes_accepted']}",
        "# HELP votes_rejected Total rejected votes",
        "# TYPE votes_rejected counter",
        f"votes_rejected {metrics_data['votes_rejected']}",
        "# HELP node_up_count Number of nodes currently up",
        "# TYPE node_up_count gauge",
        f"node_up_count {up_count}"
    ]
    return "\n".join(lines)

@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Send simulated heartbeat and random hash
            tx_hash = f"tx_{uuid.uuid4().hex}"
            update = {
                "type": "heartbeat",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "simulated_tx": tx_hash,
                "nodes": list(simulated_nodes.values())
            }
            await websocket.send_text(json.dumps(update))
            logger.log("debug", "backend", "ws_stream_tick", tx=tx_hash)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        logger.log("info", "backend", "ws_disconnect")
