from fastapi.testclient import TestClient
from backend.app.main import app
import pytest

client = TestClient(app)

def test_election_lifecycle():
    # Create
    r = client.post("/api/elections", json={"title": "Test", "description": "Test"})
    assert r.status_code == 200
    e_id = r.json()["id"]

    # Open
    r_open = client.post(f"/api/elections/{e_id}/open")
    assert r_open.status_code == 200
    assert r_open.json()["status"] == "open"

    # Close
    r_close = client.post(f"/api/elections/{e_id}/close")
    assert r_close.status_code == 200
    assert r_close.json()["status"] == "closed"

def test_kiosk_register_and_vote():
    # 1. Open an election
    r_e = client.post("/api/elections", json={"title": "Vote", "description": "Vote"})
    e_id = r_e.json()["id"]
    client.post(f"/api/elections/{e_id}/open")

    # 2. Register Kiosk
    r_reg = client.post("/api/kiosks/register", json={
        "kiosk_id": "test_kiosk",
        "kiosk_pubkey": "pub",
        "eci_signature": "sig"
    })
    assert r_reg.status_code == 200
    token = r_reg.json()["session_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Vote accepted
    vote_data = {
        "election_id": e_id,
        "encrypted_vote": "enc",
        "nullifier": "null1",
        "zkp_proof": "proof"
    }
    r_vote = client.post("/api/votes", json=vote_data, headers=headers)
    assert r_vote.status_code == 200

    # 4. Duplicate nullifier rejected
    r_dup = client.post("/api/votes", json=vote_data, headers=headers)
    assert r_dup.status_code == 409
    assert r_dup.json()["detail"] == "duplicate_nullifier"

def test_unregistered_kiosk_rejected():
    headers = {"Authorization": "Bearer bad_token"}
    r = client.post("/api/votes", json={
        "election_id": "none",
        "encrypted_vote": "enc",
        "nullifier": "null2",
        "zkp_proof": "proof"
    }, headers=headers)
    assert r.status_code == 403

def test_quorum_drops():
    # Initially up
    r = client.get("/api/nodes/status")
    assert r.json()["quorum_reached"] == True

    # Toggle two nodes down
    client.post("/api/nodes/node_1/toggle")
    client.post("/api/nodes/node_2/toggle")

    # Now down
    r = client.get("/api/nodes/status")
    assert r.json()["quorum_reached"] == False

    # Restore one
    client.post("/api/nodes/node_1/toggle")
    r = client.get("/api/nodes/status")
    assert r.json()["quorum_reached"] == True
