from fastapi import APIRouter, HTTPException
import uuid
import hmac
import hashlib
from typing import List
from ..models import KioskRegistration
from ..crypto_stubs import verify_eci_signature
from ..config import SESSION_SECRET
from ..store import register_kiosk, get_kiosk, kiosk_registry
from ..logging_config import logger

router = APIRouter(prefix="/api/kiosks", tags=["kiosks"])

def sign_session_token(kiosk_id: str) -> str:
    msg = f"session:{kiosk_id}".encode('utf-8')
    sig = hmac.new(SESSION_SECRET.encode('utf-8'), msg, hashlib.sha256).hexdigest()
    return f"{kiosk_id}.{sig}"

def verify_session_token(token: str) -> str:
    try:
        kiosk_id, sig = token.split(".")
        if sign_session_token(kiosk_id) == token:
            return kiosk_id
    except Exception:
        pass
    return None

@router.post("/register")
def api_register_kiosk(kiosk: KioskRegistration):
    # Verify ECI signature
    if not verify_eci_signature(kiosk.kiosk_id, kiosk.kiosk_pubkey, kiosk.eci_signature):
        raise HTTPException(status_code=401, detail="Invalid ECI signature")
    
    register_kiosk(kiosk.kiosk_id, kiosk.model_dump())
    logger.log("info", "backend", "kiosk_registered", kiosk_id=kiosk.kiosk_id)
    
    token = sign_session_token(kiosk.kiosk_id)
    return {
        "status": "registered",
        "session_token": token
    }

@router.get("")
def api_get_kiosks():
    return list(kiosk_registry.values())

@router.get("/{kiosk_id}")
def api_get_kiosk(kiosk_id: str):
    k = get_kiosk(kiosk_id)
    if not k:
        raise HTTPException(status_code=404, detail="Kiosk not found")
    return k
