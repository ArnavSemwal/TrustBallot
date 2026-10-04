# Coercion Resistance & Duress Specification (Task R10)

**Owners:** Arnav (Frontend/Middleware), Anushka (Crypto/Blockchain)
**Reference:** Chaum et al. (2025), "Revisiting Silent Coercion"

## 1. The Problem (Gap 2)
Migrant workers may be forced to vote a certain way by an employer or local leader watching them at the kiosk. If a voter is under duress, they need a safe way to cast a "fake" vote that satisfies the coercer, without actually impacting the election, while preserving their right to cast a real vote safely later.

## 2. Kiosk UI & Timing Requirements (Arnav)
To ensure the coercer cannot distinguish a real session from a duress session:
- **Identical UI:** The screen must display the exact same "Success" animations, loading spinners, and text regardless of which PIN is entered.
- **Identical Timing:** The time taken to encrypt the vote and generate the Zero-Knowledge Proof (ZKP) must be padded to a constant time (e.g., exactly 2.5 seconds), so the coercer cannot use a stopwatch to detect a faster/slower decoy generation.

## 3. Network Traffic Requirements (Shashwat)
An observer analyzing the network packets leaving the kiosk must not be able to tell if a vote is real or a decoy.
- **Fixed-Size Payloads:** Decoy payloads must be padded to the exact byte size of a real encrypted vote + ZKP.
- **Dummy Traffic:** The kiosk must occasionally send randomized dummy traffic to the server so that the *frequency* of network requests does not reveal how many real votes were cast.

## 4. Cryptographic Nullification & Decoys (Anushka)
- **Zero-Vote Decoy:** A decoy vote must be a mathematically valid ciphertext that, when homomorphically added to the tally, adds `0` to all candidates.
- **Nullification Path (Stolen Credentials):** If the coercer steals the voter's EPIC card and votes on their behalf, the voter must be able to securely request a cryptographic nullification of that specific nullifier via an independent trusted channel (e.g., an Election Commission hotline) using a backup credential, allowing them to cast a new vote.

## 5. Phase 2 Implementation Checklist
- [ ] Implement constant-time execution for `submitVote`.
- [ ] Implement mathematical Zero-Vote Decoys (replaces the Phase 0 `isDecoy` flag).
- [ ] Generate constant-size dummy network packets to mask kiosk activity.
- [ ] Draft the API endpoint for credential nullification.
