from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Election(BaseModel):
    id: str
    title: str
    description: str
    status: str

class ElectionCreate(BaseModel):
    title: str
    description: str

class KioskRegistration(BaseModel):
    kiosk_id: str
    kiosk_pubkey: str
    eci_signature: str

class VotePayload(BaseModel):
    election_id: str
    encrypted_vote: str
    nullifier: str
    zkp_proof: str

class NodeStatus(BaseModel):
    id: str
    name: str
    status: str
    last_block: str
    last_heartbeat: str
