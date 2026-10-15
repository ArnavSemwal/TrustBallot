from fastapi import APIRouter, HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..models import VotePayload
from ..crypto_stubs import verify_dilithium, verify_zkp
from ..store import has_nullifier, add_vote, get_election
from ..routers.kiosks import verify_session_token
from ..routers.nodes import metrics_data
from ..logging_config import logger

router = APIRouter(prefix="/api/votes", tags=["votes"])
security = HTTPBearer()

def get_kiosk_id(credentials: HTTPAuthorizationCredentials = Security(security)):
    kiosk_id = verify_session_token(credentials.credentials)
    if not kiosk_id:
        raise HTTPException(status_code=403, detail="Invalid or missing session token")
    return kiosk_id

@router.post("")
def api_add_vote(vote: VotePayload, kiosk_id: str = Security(get_kiosk_id)):
    # Check election
    election = get_election(vote.election_id)
    if not election or election["status"] != "open":
        metrics_data["votes_rejected"] += 1
        raise HTTPException(status_code=400, detail="Election is not open")

    # Check nullifier first
    if has_nullifier(vote.nullifier):
        metrics_data["votes_rejected"] += 1
        logger.log("warn", "backend", "duplicate_vote_rejected", nullifier=vote.nullifier)
        raise HTTPException(status_code=409, detail="duplicate_nullifier")

    # Run crypto verification
    if not verify_dilithium(vote.model_dump_json(), "dummy_sig") or not verify_zkp(vote.zkp_proof):
        metrics_data["votes_rejected"] += 1
        raise HTTPException(status_code=400, detail="Invalid cryptographic proof or signature")

    # Accept vote
    add_vote(vote.model_dump())
    metrics_data["votes_accepted"] += 1
    logger.log("info", "backend", "vote_accepted", election_id=vote.election_id)
    
    return {"status": "accepted"}
