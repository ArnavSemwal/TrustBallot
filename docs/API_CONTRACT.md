# TrustBallot Backend API Contract

This document outlines the API endpoints for the TrustBallot backend.

## Elections (B16)

### Create Election
- **Method**: `POST`
- **URL**: `/api/elections`
- **Request (Example)**:
  ```json
  {
    "title": "General Election 2026",
    "description": "National general election"
  }
  ```
- **Response (Example)**:
  ```json
  {
    "id": "e_12345",
    "title": "General Election 2026",
    "description": "National general election",
    "status": "created"
  }
  ```

### Get Elections
- **Method**: `GET`
- **URL**: `/api/elections`
- **Response**: Array of election objects.

### Get Election by ID
- **Method**: `GET`
- **URL**: `/api/elections/{id}`
- **Response**: Election object.

### Open Election
- **Method**: `POST`
- **URL**: `/api/elections/{id}/open`
- **Response**: Election object with status "open".

### Close Election
- **Method**: `POST`
- **URL**: `/api/elections/{id}/close`
- **Response**: Election object with status "closed".

## Nodes (B25)

### Get Nodes Status
- **Method**: `GET`
- **URL**: `/api/nodes/status`
- **Response (Example)**:
  ```json
  {
    "quorum_reached": true,
    "nodes": [
      {
        "id": "node_eci",
        "name": "ECI Primary",
        "status": "up",
        "last_block": "abc123def",
        "last_heartbeat": "2026-10-09T22:00:00Z"
      }
    ]
  }
  ```
*Note: Currently simulated nodes for demo purposes.*

### Get Node Health
- **Method**: `GET`
- **URL**: `/api/nodes/{id}/health`
- **Response**: Health status.

### Get Metrics
- **Method**: `GET`
- **URL**: `/metrics`
- **Response**: Prometheus style text format.

### Toggle Node Status (Demo Helper)
- **Method**: `POST`
- **URL**: `/api/nodes/{id}/toggle`
- **Response**: Updated NodeStatus object.

### WebSocket Node Stream
- **URL**: `/stream`
- **Description**: Pushes node status updates and simulated transaction hashes.

## Kiosks (B8)

### Register Kiosk
- **Method**: `POST`
- **URL**: `/api/kiosks/register`
- **Request**:
  ```json
  {
    "kiosk_id": "k_987",
    "kiosk_pubkey": "pub_xyz",
    "eci_signature": "sig_abcd"
  }
  ```
- **Response**:
  ```json
  {
    "status": "registered",
    "session_token": "token_123"
  }
  ```
*Note: `verify_eci_signature` is currently stubbed.*

### Get Kiosks
- **Method**: `GET`
- **URL**: `/api/kiosks`
- **Response**: Array of registration objects.

### Get Kiosk by ID
- **Method**: `GET`
- **URL**: `/api/kiosks/{id}`
- **Response**: Kiosk registration object.

## Votes (B8)

### Add Vote
- **Method**: `POST`
- **URL**: `/api/votes`
- **Headers**: `Authorization: Bearer {session_token}`
- **Request**:
  ```json
  {
    "election_id": "e_12345",
    "encrypted_vote": "enc_v_123",
    "nullifier": "null_abc",
    "zkp_proof": "proof_xyz"
  }
  ```
- **Response (Success)**: `200 OK`, `{"status": "accepted"}`
- **Response (Duplicate)**: `409 Conflict`, `{"detail": "duplicate_nullifier"}`
*Note: `verify_dilithium` and `verify_zkp` are currently stubbed.*
