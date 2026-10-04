# TrustBallot Payload Specification

This document defines the exact JSON structure of the data the Kiosk sends to the Backend BFT nodes and the Smart Contract during a vote submission.

**Goal:** Ensure Frontend (Arnav), Backend (Shashwat), and Crypto (Anushka) are all aligned on the exact data format being transmitted.

## 1. Vote Payload Schema

When the kiosk submits a vote, the JSON payload MUST match this structure:

```json
{
  "electionId": "string",
  "kioskId": "string",
  "nullifier": "string",
  "ciphertext": "string",
  "proof": {
    "pi_a": ["string"],
    "pi_b": [["string"]],
    "pi_c": ["string"],
    "protocol": "string"
  },
  "kioskSignature": "string",
  "isDecoy": true
}
```

## 2. Field Definitions

| Field | Type | Description | Owner / Consumer |
|-------|------|-------------|------------------|
| `electionId` | `string` | Unique identifier for the current election. | Backend / Contract |
| `kioskId` | `string` | Unique identifier for the kiosk submitting the vote. | Backend |
| `nullifier` | `string` | Cryptographic hash proving the user voted without revealing identity. Prevents double voting (Gap 1). | Backend / Contract |
| `ciphertext` | `string` | The encrypted vote choice (e.g., candidate selection). | Contract / Tally |
| `proof` | `object` | Zero-Knowledge Proof (ZK-SNARK) validating the ciphertext and nullifier without revealing the vote. | Contract |
| `kioskSignature` | `string` | Post-quantum signature (Dilithium) proving the payload originated from a registered, trusted kiosk. | Backend |
| `isDecoy` | `boolean` | **Temporary Phase 0 Flag**. If `true`, the vote is a duress decoy. The backend will accept the network request but MUST NOT add it to the tally (Gap 2). *Note: This flag will be replaced by a cryptographically secure zero-vote decoy design in Phase 1 (Task X10).* | Backend |

## 3. Phase 0 Mocking
During Phase 0 (Review Week):
- `ciphertext` can be a mocked string or standard Paillier string.
- `proof` can be a mocked JSON object.
- `kioskSignature` can be a mocked string.
- Backend MUST respect the `isDecoy` flag and discard the vote from the tally if it is `true`.
