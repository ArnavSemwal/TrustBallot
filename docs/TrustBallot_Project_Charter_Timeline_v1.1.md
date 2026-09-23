# TrustBallot — Project Charter & Timeline
**Version 1.1 | Duration: 3 Months | Team: Anushka (Blockchain & Crypto Lead), Shashwat (Backend/Infra Lead), Arnav (Frontend/UX & Middleware Lead)**

Revision note: fixes metadata-obfuscation owner mismatch (was still Shashwat in v1.0 Charter, now Arnav everywhere), rebalances Week 10–11 documentation/accessibility overload, adds Phase 0 kiosk registration to timeline, adds live-demo fallback plan, adds SPOF cross-training note.

## 1. Objective
Deliver a working prototype demonstrating secure, verifiable, double-vote-resistant remote voting via consortium blockchain, ZKPs, and homomorphic tallying — suitable for hackathon/academic demo and future pilot proposal.

## 2. Roles & Responsibilities
| Role | Owner | Core Deliverables |
|---|---|---|
| Blockchain & Crypto Lead | Anushka | ZKP circuit (PLONK), nullifier system, smart contract, homomorphic tally + threshold decryption, Dilithium signing, EPIC/QR signature verification, kiosk pubkey registration (crypto half) |
| Backend/Infra Lead | Shashwat | BFT consensus (4-node sim, **separate instances**), IBC/EVM sync, disputed-vote backend logic, kiosk registration (infra half), deployment |
| Frontend/UX & Middleware Lead | Arnav | Kiosk UI, accessibility, Duress PIN UX, error/retry states, face-match stub, **metadata obfuscation middleware (batching + 2-hr flush)**, admin dashboard |

All three co-own: integration testing, documentation, demo script, final presentation.

**Cross-training note (new):** Since Anushka is the sole owner of all cryptographic components (documented SPOF, PRD Risks §8.4), Shashwat shadows ZKP circuit design during Week 2–3 as a backup, without taking primary ownership.

## 3. Milestones & Timeline

### Month 1 — Foundations (Weeks 1–4)
- **W1:** Finalize PRD/TRD/Design Spec (this document set); set up repos, CI, dev environments; provision **4 separate node instances** (not one shared VM).
- **W2:** Anushka — ZKP circuit design (PLONK) for credential ownership + Merkle membership; begins EPIC/QR signature verification logic. Shashwat — set up 4-node permissioned chain skeleton across separate instances; shadows Anushka's circuit work. Arnav — wireframes finalized in Figma (2-language, not 8–10), component library started.
- **W3:** Anushka — one-hot selection + nullifier derivation circuits. Shashwat — BFT consensus wiring between nodes; Phase 0 kiosk registration infra. Arnav — kiosk welcome/scan/PIN screens built; face-match stub.
- **W4:** *Milestone 1:* Core crypto primitives + basic 4-node chain (separate instances) running; kiosk pubkey registration working end-to-end.

### Month 2 — Integration (Weeks 5–8)
- **W5:** Anushka — smart contract (Dilithium verify, ZKP verify, nullifier check, kiosk registry check) deployed to test chain. Shashwat — EVM booth signal simulation groundwork; disputed-vote backend logic. Arnav — **metadata obfuscation / batching+shuffle buffer (2-hr timeout flush)** — *ownership corrected from v1.0, now consistently Arnav's.* Candidate selection + review + cast-confirmation screens, including scroll/pagination for large candidate lists.
- **W6:** Anushka — homomorphic tally module (Paillier) + threshold decryption simulation (**t=3-of-4**). Shashwat — IBC-style batch sync (~2hr). Arnav — Duress PIN flow, rejection/retry UI, connect UI to backend API.
- **W7:** Full pipeline integration: kiosk → ZKP → chain → tally, first end-to-end test vote, including a forced-rejection test case (duplicate nullifier) to validate the retry UX.
- **W8:** *Milestone 2:* End-to-end simulated vote works (auth → cast → tally) for a single test election, including one successful dispute-flag and one successful error/retry.

### Month 3 — Hardening & Demo (Weeks 9–12)
- **W9:** Load test (100+ simulated voters), fix latency in ZKP gen / contract verification. **Begin documentation and accessibility pass in parallel** (moved earlier from W10–11 to prevent end-stack overload).
- **W10:** Admin/audit dashboard (Arnav), disputed-vote flagging logic hardening (Shashwat), security review of nullifier/HE logic incl. PLONK setup review (Anushka). Documentation and accessibility pass continues.
- **W11:** Full regression testing; finalize documentation (README, architecture diagrams, threat model writeup incl. acknowledged limitations — receipt-freeness tension, no-revote gap, PQ-HE gap). **Prepare a pre-recorded backup demo** of the live BFT node-failure test, in case live failure injection misbehaves on stage.
- **W12:** *Milestone 3:* Final demo — live simulated multi-kiosk election with BFT node failure test (live, with recorded fallback ready), submission/presentation prep.

## 4. Resource Allocation
- Compute: local dev machines + **4 separate cloud VM instances or containers** for consortium node simulation (free-tier/student credits, GCP/AWS/Azure education) — corrected from a single shared VM, which would have undermined the resilience demo.
- No hardware kiosk build in scope — software simulation only (documented as MVP boundary).

## 5. Budget (Prototype-Scale)
| Item | Est. Cost |
|---|---|
| Cloud VMs ×4 (student credits) | ₹0 (education tier) |
| Domain/demo hosting | ₹0–500 |
| Misc (design assets, fonts — open-source) | ₹0 |
| **Total** | **near-zero, academic/hackathon scale** |

## 6. Success Criteria for Final Delivery
- All P0 features from PRD v1.2 functional in demo, including kiosk registration and EPIC/QR signature verification.
- BFT consensus demonstrably survives 1-node outage live (nodes on separate instances), with recorded fallback available.
- Zero nullifier-check failures across 3 test elections, **within the documented sync-cycle window**.
- At least one demonstrated rejection/retry flow and one demonstrated Disputed Vote flag + procedural resolution.
- Documentation package (PRD v1.2, TRD v1.1, Design Spec v1.1, this Charter) complete and submitted, including an explicit Known Limitations section.

## 7. Acknowledged Dependencies/Risks (carried from PRD v1.2 §8)
- No real EPIC/DigiLocker integration — simulated identity layer only; face-match is a stubbed toggle, not a real model.
- Legal (RoPA amendment) and hardware supply-chain attestation are explicitly out of technical scope.
- Anushka is a documented single point of failure for all cryptography (mitigated, not eliminated, by Week 2–3 cross-training).
- Receipt-freeness/verifiability tension, no-revote-after-duress gap, and post-quantum HE gap are named as open/unsolved limitations, not defects to be fixed in this cycle.
