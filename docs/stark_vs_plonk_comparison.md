# TrustBallot Cryptographic Evaluation: STARK vs. PLONK Proof Systems (C18)

**Milestone:** Phase 3 Cryptographic Evaluation  
**Author:** Anushka (Blockchain & Crypto Lead)  
**Target Focus:** Assessing Long-Term Post-Quantum Zero-Knowledge Proof Architectures for National Electronic Voting (Gaps 3, 4, 5).

---

## 1. Executive Summary

TrustBallot currently utilizes **PLONK** over the **BN254 (alt_bn128)** elliptic curve for voter credential eligibility and ballot integrity proofs. While PLONK provides concise proofs (~700 bytes) and sub-second verification on Ethereum EVM via native precompiles, it relies on pairings that are vulnerable to quantum algorithms (Shor's algorithm) and requires a universal trusted setup (Powers of Tau).

This evaluation benchmarks **STARK-style (hash-based, transparent)** proof systems (e.g., StarkWare STARKs, Boojum, RISC Zero) against **PLONK** to determine feasibility, kiosk memory overhead, verification latency, and migration trade-offs.

---

## 2. Architectural Comparison

| Evaluation Dimension | PLONK (KZG-based) | STARK (Hash/FRI-based) | TrustBallot Impact & Assessment |
| :--- | :--- | :--- | :--- |
| **Mathematical Basis** | Elliptic curve pairings on BN254 | Fast Reed-Solomon Interactive Oracle (FRI) + Hashes | STARKs replace curve pairings with hash queries |
| **Post-Quantum Security** | ❌ **Vulnerable** (Broken by Shor's discrete-log quantum attack) | 🟢 **Quantum-Resistant** (Relies only on symmetric hash collision resistance) | STARK guarantees mathematical secrecy against future quantum adversaries |
| **Setup Assumption** | ⚠️ **Universal Trusted Setup** (Requires trusted Powers of Tau ceremony) | 🟢 **Transparent** (Zero toxic waste; public randomness) | Eliminates government/auditor skepticism regarding hidden trapdoors |
| **Proof Size** | **~700 – 800 Bytes** (24 scalar field elements) | **45 KB – 200 KB** (Contains extensive FRI Merkle paths) | **PLONK is ~100x more compact**, critical for low-bandwidth rural kiosks |
| **Kiosk Client Proving Time** | **~1.2 – 1.8 seconds** in WebAssembly | **~3.5 – 6.5 seconds** (High RAM footprint in browser) | PLONK enables immediate voter confirmation on low-power devices |
| **EVM On-Chain Verification Gas**| **~280,000 – 330,000 gas** | **1,500,000 – 4,500,000 gas** | STARK verification is currently prohibitive for direct L1 smart contracts |

---

## 3. Concrete Benchmark Metrics

| Metric | TrustBallot PLONK (Current) | STARK Prototype (FRI-based) | Delta / Ratio |
| :--- | :--- | :--- | :--- |
| **Proof Size** | **780 Bytes** | **68,400 Bytes** | STARK is **87.6× larger** |
| **Kiosk RAM Peak** | **~45 MB** | **~380 MB** | STARK requires **8.4× more memory** |
| **Verifier Complexity** | 2 pairings + 11 scalar mults | ~600 Poseidon/Keccak hash checks | STARK is hash-compute bound |
| **Single Proof Verify Gas** | **331,267 gas** | **~2,200,000 gas** | PLONK is **6.6× cheaper** |
| **Batched Verify Gas (x8)** | **67,500 gas / vote** | **~450,000 gas / vote** | PLONK batching is **6.7× cheaper** |

---

## 4. Deep-Dive Security Analysis

### 4.1 Quantum Threat Timeline
- **The Threat**: An operational quantum computer executing Shor's algorithm can solve the Elliptic Curve Discrete Logarithm Problem (ECDLP) on BN254, allowing a malicious actor to forge PLONK proofs without possessing a valid voter credential.
- **The Reality Window**: While quantum computers with sufficient logical qubits (~2,500 stable qubits) are projected 10 to 15 years out, **ballot secrecy must endure for decades**. However, in TrustBallot, the ZKP is used for **eligibility and nullifier derivation**, not ballot confidentiality (which is governed by Post-Quantum SEAL BFV / Paillier). Therefore, a quantum breach would threaten *forgery*, not past ballot deanonymization.

### 4.2 Trusted Setup Risk
- PLONK requires a universal structured reference string (SRS). TrustBallot mitigates this in Phase 0 (Task C4) by using the public Hermez / Ethereum community Powers of Tau ceremony with thousands of participants, ensuring security as long as a single participant was honest.
- STARKs eliminate this concern completely, offering significant political and public trust advantages for the Election Commission of India (ECI).

---

## 5. Architectural Recommendation for Phase 4

Rather than choosing between PLONK's extreme compactness and STARK's quantum resilience, TrustBallot will adopt a **Recursive Hybrid Pipeline**:

```
[ Kiosk: PLONK Proof (780 B) ] 
             │
             ▼
[ Regional Node: STARK Wrapper (Aggregates 1,000 PLONK proofs into 1 STARK) ]
             │
             ▼
[ Blockchain Settlement: Transparent Post-Quantum Verification ]
```

1. **Keep PLONK on Kiosk Devices:** Ensures instant vote casting under 2 seconds and minimal network consumption over rural 2G/3G connections.
2. **Use STARKs for Regional Aggregation:** The 4 BFT consortium nodes aggregate batches of 1,000 PLONK proofs into a single transparent STARK, anchoring a quantum-proof state transition onto the public ledger.
