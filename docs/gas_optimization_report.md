# TrustBallot: Smart Contract Gas Optimization & Profiling Report (C21)

**Milestone:** Phase 3 Optimization (Task C21)  
**Author:** Anushka (Blockchain & Crypto Lead)  
**Smart Contracts Profiled:** `TrustBallot.sol`, `KioskRegistry.sol`, `PlonkVerifier.sol`  
**EVM Target:** Shanghai (Solidity `0.8.24`)

---

## 1. Summary of Optimizations Implemented
1. **Calldata Dynamic Array Parameters:** Replaced `memory` with `calldata` in `submitVote()` for `kioskId`, `ciphertextVote`, and `dilithiumSignature`, eliminating duplicate memory copies and gas overhead.
2. **Pre-ZKP Nullifier & Revocation Ordering:** Cheap mapping lookups for revoked credentials (`revokedNullifiers`) and spent nullifiers (`spentNullifiers`) execute before cryptographic ZKP verification, preventing wasted gas on adversarial re-submissions.
3. **Storage Read Elimination:** Cached election state and Merkle root reads locally in method execution frames.

---

## 2. Gas Consumption Breakdown

| Operation / Transaction | Function Signature | Gas Used | Status |
| :--- | :--- | :--- | :--- |
| **Deploy KioskRegistry** | `constructor()` | `8,31,111` gas | Baseline |
| **Deploy PlonkVerifier** | `constructor()` | `18,74,855` gas | Baseline |
| **Deploy TrustBallot** | `constructor(address, address)` | `15,67,812` gas | Baseline |
| **Register Kiosk** | `registerKiosk(string, address, bytes)` | `80,585` gas | Optimized |
| **Set Merkle Root** | `setElectionRoot(uint256, uint256)` | `48,280` gas | Optimized (SSTORE) |
| **Update Election State** | `setElectionState(uint256, uint8)` | `48,009` gas | Optimized |
| **Revoke Stolen Credential** | `revokeCredential(uint256, uint256, string)` | `72,786` gas | Optimized |
| **Submit Vote (Full ZKP)** | `submitVote(string, uint256, ...)` | **`3,30,073` gas** | **Optimized Calldata** |

---

## 3. Gas Comparison vs. Unoptimized Baseline

| Metric | Unoptimized Baseline | C21 Calldata Optimized | Savings |
| :--- | :--- | :--- | :--- |
| **Memory Allocation Overhead** | 24,500 gas | 0 gas (direct calldata slicing) | **-24,500 gas** |
| **Single Vote Verification** | ~355,000 gas | **3,30,073 gas** | **~24,000 gas saved** |
| **Batched Aggregation (C15)** | 331,000 gas / vote | **~67,500 gas / vote** | **79.6% reduction** |
