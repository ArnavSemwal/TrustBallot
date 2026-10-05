# Proof-to-Ciphertext Binding Design [C8]

## The Problem
Currently, the ZKP circuit (`vote_integrity.circom`) proves that the voter has a valid credential and that they selected a valid "one-hot" candidate. However, the ciphertext of the vote (encrypted via Paillier or a Lattice-based scheme) is transmitted alongside the proof, not *within* it. 
Because the encryption happens outside the circuit, a malicious voter could generate a valid ZKP for a valid candidate choice (e.g., Candidate A), but attach a ciphertext encrypting a completely different value (e.g., 100 votes for Candidate B). 

Since the tallying process homomorphically aggregates these ciphertexts without decrypting individual votes, the malicious ciphertext would poison the final tally without being detected. We must cryptographically bind the ZKP to the ciphertext.

## Evaluated Approaches

### 1. In-Circuit Encryption (Circom)
- **Mechanism:** The ZKP circuit itself takes the plaintext vote and the encryption randomness as private inputs, performs the homomorphic encryption inside the circuit, and outputs the ciphertext as a public signal.
- **Pros:** Conceptually simple; provides an absolute guarantee that the ciphertext matches the constrained plaintext.
- **Cons:** Extremely high constraint cost. Implementing Paillier modular exponentiation (with 2048-bit modulus) or Ring-LWE (Lattice) polynomial multiplication inside a SNARK circuit like Circom would require millions of constraints. This would make proving on a voter's Kiosk impossibly slow (taking minutes or hours) and verification on Ethereum extremely expensive (or impossible due to gas limits).

### 2. Hash Binding + Tally-Time Decryption (Naive)
- **Mechanism:** The circuit outputs a hash of the plaintext vote. The tally nodes decrypt individual votes and check if the decrypted vote matches the hash.
- **Pros:** Cheap in-circuit.
- **Cons:** Completely breaks the homomorphic tally property. Decrypting individual votes destroys ballot secrecy against the tally authorities.

### 3. Specialized Sigma Protocols (Proof of Plaintext Knowledge)
- **Mechanism:** Alongside the PLONK proof for credential/eligibility, the voter generates a specialized zero-knowledge proof for the encryption scheme. For Paillier, this is a standard Sigma protocol proving that a ciphertext encrypts a value in a certain range (e.g., 0 or 1). 
- **Pros:** Efficient off-chain generation and verification.
- **Cons:** Cannot easily be verified on-chain by the EVM due to high gas costs of Paillier math. The Kiosk/Frontend would need to implement complex Sigma protocols.

### 4. ElGamal over Elliptic Curves + In-Circuit Verification (Recommended)
- **Mechanism:** If we switch the tallying encryption scheme from Paillier/Lattice to Exponential ElGamal over the BabyJubJub elliptic curve, we can efficiently perform the encryption *inside* the Circom circuit.
- **Pros:** Elliptic curve operations on BabyJubJub are highly optimized in Circom (requiring very few constraints). The ciphertext can be directly output as a public signal of the SNARK.
- **Cons:** Exponential ElGamal requires computing a discrete logarithm to decrypt the final tally. This is only feasible for small vote counts (e.g., using Pollard's rho). However, for a single election with < 1,000,000 voters, the maximum vote count per candidate is small enough that a discrete log can be computed in seconds on a modern CPU. (Note: ElGamal is not post-quantum, so this trades off PQ compliance for verifiable binding. To maintain PQ compliance, a lattice-based zero-knowledge proof system would be required, which is an active area of research.)

## Proposed Decision
For the immediate prototype, we will implement **Approach 4 (ElGamal over BabyJubJub)** to demonstrate a fully functional, on-chain verifiable bound ciphertext. 

For the post-quantum roadmap (Phase 3), we will investigate adapting **Lattice-based ZKPs (e.g., BDKG or Lattice-based SNARKs)** that can natively prove statements about Ring-LWE ciphertexts, acknowledging this is currently bleeding-edge cryptography.
