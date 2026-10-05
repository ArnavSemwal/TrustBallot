# Credential Design & Issuance [C6]

## Overview
To vote in TrustBallot v3.0, a voter must prove they possess a valid, unspent credential included in the authorized voter Merkle tree for a specific election. This document outlines how the `privateCredential` is derived from the voter's real-world identity (the EPIC card) and how the Electoral Commission of India (ECI) acts as the issuing authority.

## Credential Derivation
The voter's identity in the physical world is represented by their EPIC (Electors Photo Identity Card) number, issued by the ECI. However, to maintain voter privacy and prevent the ECI from linking a cast vote back to a specific EPIC number, we do not use the EPIC number directly in the zero-knowledge proof. Instead, a `privateCredential` is cryptographically derived.

1. **Authentication:** The voter securely authenticates with the ECI portal (e.g., via OTP, Aadhaar linkage, or physical kiosk verification).
2. **Credential Generation (Client-Side):** The voter's client generates a high-entropy random scalar, `voterSecret`. 
3. **Public Commitment:** The client computes a public commitment to this secret: `publicCredential = PoseidonHash(voterSecret)`.
4. **Registration:** The client submits the `publicCredential` to the ECI portal alongside an authentication proof of their EPIC number. 
5. **Blinding (Optional but Recommended):** To ensure the ECI cannot link the IP address or session of the voter to the `publicCredential`, this submission should ideally happen over an anonymizing network (Tor) or using a blind signature scheme where the ECI blindly signs the `publicCredential` after verifying eligibility.

In the Circom circuit (`vote_integrity.circom`), the `privateCredential` passed as a private signal is exactly this `voterSecret`.

## The Issuing Authority & Merkle Tree
The Electoral Commission of India (ECI) serves as the sole issuing authority for an election.

1. **Voter Roll Compilation:** Once the registration phase closes, the ECI collects all valid `publicCredential` submissions.
2. **Merkle Tree Construction:** The ECI constructs a Poseidon Merkle Tree containing all registered `publicCredential`s as the leaf nodes.
3. **On-Chain Commitment:** The ECI publishes the Merkle Root of this tree to the `TrustBallot.sol` smart contract for the specific `electionId`.
4. **Proof of Inclusion:** During the election, the voter's client fetches the Merkle Tree, generates a Merkle inclusion proof for their `publicCredential`, and passes this proof to the ZKP circuit. The circuit verifies that `PoseidonHash(voterSecret)` is indeed a leaf in the tree corresponding to the published Merkle Root.

## Preventing Duplication
Because the `nullifier` is computed as `PoseidonHash(voterSecret || electionId)`, the voter can only generate one valid nullifier per election. Even if the ECI maliciously includes the same `publicCredential` in the Merkle tree multiple times (or if the voter manages to register it twice), the resulting nullifier remains identical, and the smart contract will reject the duplicate vote.
