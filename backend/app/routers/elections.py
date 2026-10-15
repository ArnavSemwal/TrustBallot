from fastapi import APIRouter, HTTPException
import uuid
from typing import List
from ..models import Election, ElectionCreate
from ..store import create_election, get_election, update_election_status, elections_store
from ..logging_config import logger

router = APIRouter(prefix="/api/elections", tags=["elections"])

@router.post("", response_model=Election)
def api_create_election(election_input: ElectionCreate):
    new_id = f"e_{uuid.uuid4().hex[:8]}"
    election_data = {
        "id": new_id,
        "title": election_input.title,
        "description": election_input.description,
        "status": "created"
    }
    created = create_election(election_data)
    logger.log("info", "backend", "election_created", election_id=new_id)
    return Election(**created)

@router.get("", response_model=List[Election])
def api_get_elections():
    return [Election(**e) for e in elections_store.values()]

@router.get("/{election_id}", response_model=Election)
def api_get_election(election_id: str):
    e = get_election(election_id)
    if not e:
        raise HTTPException(status_code=404, detail="Election not found")
    return Election(**e)

@router.post("/{election_id}/open", response_model=Election)
def api_open_election(election_id: str):
    e = get_election(election_id)
    if not e:
        raise HTTPException(status_code=404, detail="Election not found")
    if e["status"] != "created":
        raise HTTPException(status_code=400, detail="Can only open an election in 'created' state")
    
    updated = update_election_status(election_id, "open")
    logger.log("info", "backend", "election_opened", election_id=election_id)
    return Election(**updated)

@router.post("/{election_id}/close", response_model=Election)
def api_close_election(election_id: str):
    e = get_election(election_id)
    if not e:
        raise HTTPException(status_code=404, detail="Election not found")
    if e["status"] != "open":
        raise HTTPException(status_code=400, detail="Can only close an election in 'open' state")
    
    updated = update_election_status(election_id, "closed")
    logger.log("info", "backend", "election_closed", election_id=election_id)
    return Election(**updated)
