# Quantum Vulnerability Note: Paillier & PLONK

## Overview
This document addresses the quantum vulnerabilities present in the current cryptographic primitives of TrustBallot v3.0, specifically relating to **Paillier Homomorphic Encryption** and **PLONK with KZG/Standard Commitments**. These vulnerabilities conflict with the system's core requirement of future-proof ballot secrecy (Gap 3 & 5).

## 1. Paillier Homomorphic Encryption
### The Vulnerability
Paillier encryption relies on the computational difficulty of the Decisional Composite Residuosity Assumption (DCRA), which is fundamentally linked to integer factorization.
Shor's Algorithm running on a sufficiently powerful quantum computer can factorize integers in polynomial time. Therefore, Paillier is **not quantum-safe**.

### The Threat Model (Harvest-Now, Decrypt-Later)
An adversary can record all encrypted vote payloads transmitted from kiosks today. Even if they cannot decrypt them currently, they can store this data and decrypt it once large-scale quantum computers become available, violating the long-term ballot confidentiality requirement.

### Proposed Fix
We propose migrating the homomorphic tallying system from Paillier to a **lattice-based homomorphic encryption scheme**, such as **BFV** or **BGV**, which rely on the Ring Learning With Errors (RLWE) problem. RLWE is currently considered quantum-resistant.
- **Implementation Path**: Integrate libraries like **OpenFHE** or **SEAL** which provide robust, quantum-resistant homomorphic encryption with support for distributed key generation and threshold decryption.

## 2. PLONK (with KZG Commitments)
### The Vulnerability
The current zero-knowledge proofs use PLONK, likely with the standard KZG polynomial commitment scheme. KZG commitments rely on elliptic curve pairings and the discrete logarithm problem.
Similar to integer factorization, the discrete logarithm problem is efficiently solvable by Shor's algorithm, rendering KZG-based PLONK vulnerable to quantum attacks. This means a quantum adversary could forge proofs or break soundness.

### The Threat Model
While forging proofs requires a quantum computer at the exact moment of voting (which is less immediately concerning than harvest-and-decrypt), true future-proofing requires a secure proof system. A compromised proof system could allow double voting or forged tally inclusion if the ledger is ever re-verified in the future.

### Proposed Fix
We propose investigating post-quantum alternatives for the Zero-Knowledge Proof component.
- **Short-term Action**: Update the Scope Statement and `security_audit.md` to explicitly acknowledge that the current ZKP system is not post-quantum, ensuring reviewers understand the honest baseline.
- **Long-term Action**: Migrate to a hash-based proof system (e.g., STARKs) or PLONK with a quantum-resistant commitment scheme (e.g., FRI commitments) which do not rely on elliptic curves or pairings.
