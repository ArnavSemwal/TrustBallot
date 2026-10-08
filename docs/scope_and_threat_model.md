# TrustBallot: Scope Statement and Threat Model [R18]

## 1. Threat Model & Adversary Capabilities

### 1.1 In-Scope Threats (What We Defend Against)
- **Quantum "Harvest-Now, Decrypt-Later":** Adversaries intercepting and storing encrypted election traffic today with the intention of decrypting it years later using a sufficiently powerful quantum computer.
- **Sync-Gap Double Voting:** Malicious or opportunistic voters exploiting intermittent internet connectivity (typical for migrant voting) to cast votes at multiple offline kiosks before the network syncs.
- **Voter Coercion:** A bad actor physically standing near the voter or forcing them to vote a certain way at the kiosk.
- **Node Compromise (Byzantine Faults):** Up to 1 of the 4 consortium nodes acting maliciously, altering records, or experiencing a crash failure.

### 1.2 Out-of-Scope (What We Do NOT Defend Against)
- **Real-Time Physical Duress:** We do not attempt to prevent someone from physically forcing a voter's hand or preventing them from using the kiosk entirely. Coercion is mitigated *post-hoc* via the Duress PIN and plausible deniability.
- **Hardware/Kiosk Tampering:** We assume the physical kiosk hardware (touchscreen, webcam) is trusted and has not been compromised with hardware keyloggers.
- **Identity Issuance Fraud:** We assume the initial EPIC registration database and QR codes are legitimate. Real facial matching and hardware attestation are simulated for this MVP.

---

## 2. Quantum Safety Scope Statement

TrustBallot aims for a **multi-decade confidentiality horizon** (50+ years) for the contents of the ballot itself, ensuring that how a migrant worker voted remains completely secret even after large-scale quantum computers become available.

To achieve this, we explicitly define the cryptographic boundaries of our quantum resistance:

### 2.1 Quantum-Safe Components (Secure against Shor's Algorithm)
1. **Authentication (Sign-in):** We use **CRYSTALS-Dilithium** (via `liboqs`) for all Kiosk-to-Node payload signatures. This ensures a quantum adversary cannot forge a session or submit fake votes on behalf of a kiosk.
2. **Ballot Encryption:** The actual vote payload is encrypted on the kiosk using **SEAL (BFV Scheme)**, a lattice-based homomorphic encryption standard. This guarantees the multi-decade confidentiality horizon for the ballot contents.

### 2.2 Classical Components (Not Quantum-Safe)
1. **Zero-Knowledge Proofs (ZKP):** Our current proof circuits use **PLONK** with standard polynomial commitments (e.g., BN254 pairings). While a quantum computer could theoretically forge a proof to submit an invalid vote, *they cannot use this to decrypt existing votes*.
   - *Future Work:* Migrating from PLONK to a hash-based proof system (like STARKs) to achieve full quantum resistance across all components.

## 3. Coercion Resistance Limits
Our Duress PIN (9999) triggers identical UI animations, identical payload sizes (via padding), and identical network delays (constant-time execution). The attacker cannot mathematically or visually distinguish a real vote session from a duress session.
