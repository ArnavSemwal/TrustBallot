# Security Audit & Cryptographic Review

## 1. ZKP Circuit (PLONK) & Nullifier Uniqueness
- **Overview:** The `main.circom` circuit enforces credential ownership, Merkle Tree membership, and outputs a unique `nullifier`.
- **Nullifier Logic:** `nullifier = Hash(private_credential || election_id)`.
- **Audit Findings:** 
  - The nullifier is correctly exposed as a public signal.
  - `TrustBallot.sol` maintains a `mapping(uint256 => mapping(uint256 => bool)) public hasVoted` which correctly flags `electionId -> nullifier -> true`.
  - **Constraint Validation:** The constraints in `vote_integrity.circom` prevent double-voting. If a voter attempts to submit a second vote for the same `electionId`, the deterministic nullifier will collide and be rejected by the smart contract.

## 2. Universal Setup (PLONK)
- **Overview:** TrustBallot utilizes PLONK over Groth16.
- **Audit Findings:**
  - PLONK uses a universal trusted setup (Powers of Tau). We utilized `pot14_final.ptau`.
  - This eliminates the "toxic waste" risk associated with per-circuit trusted setups (like Groth16), mitigating the risk of the ECI or consortium forging proofs.
  - The `verification_key.json` and `PlonkVerifier.sol` were successfully generated and matched.

## 3. Homomorphic Tally (Paillier)
- **Overview:** Uses additive homomorphic encryption (python-paillier).
- **Audit Findings:**
  - Ciphertexts are aggregated without exposing individual votes.
  - **Threshold Decryption:** The prototype utilizes a `t=3-of-4` class logic. In production, this must be replaced with true distributed key generation (DKG) and Shamir's Secret Sharing to ensure the master private key is never constructed in memory.

## 4. Known Limitations & Accepted Risks
- **PQ-HE Gap:** While Dilithium provides post-quantum security for signatures, the Paillier cryptosystem used for the tally is vulnerable to Shor's algorithm. A "Harvest Now, Decrypt Later" attacker could decrypt the final tally or individual votes once quantum computers mature.
- **No-Revote Gap:** If a voter is coerced and uses a "Duress PIN" (which burns the nullifier), they cannot securely cast a valid vote later without a physical credential re-issuance.
- **Asynchronous Collision Detection:** In a multi-chain or cross-region setup, nullifier collisions across the EVM boundary might only be caught during periodic IBC syncs (~2 hours), meaning double voting across regions is flagged retroactively rather than blocked in real-time.
