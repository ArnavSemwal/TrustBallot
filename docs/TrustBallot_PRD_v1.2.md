# TrustBallot — Product Requirements Document (PRD)
**Version 1.2 | 3-Month Delivery Cycle**

Revision note: v1.2 closes the voter-auth ownership gap, fixes cross-document inconsistencies (owner of metadata obfuscation, language count), reframes over-claimed metrics, and adds newly acknowledged risks/limitations. See changelog at end.

## 1. Problem Statement
India has ~300M internal migrants unable to vote in home constituencies due to cost/distance of return travel. Existing ECI RVM prototype (2022) is non-networked and doesn't solve double-voting or verifiability. TrustBallot delivers a networked, cryptographically-secure kiosk voting system.

## 2. Goals & Success Metrics
| Goal | Metric |
|---|---|
| Prevent double voting | 100% nullifier-check accuracy **within one IBC sync cycle (~2 hrs)** — *not* real-time across kiosk/EVM boundary (see Risks §8.6) |
| Preserve ballot secrecy | Zero vote-to-voter linkage in audit, under a **classical (non-quantum) adversary model** for the HE layer (see §8.7) |
| Kiosk usability for low-literacy users | <3 min average voting time, symbol-based nav tested with 20+ users, **including constituencies with 15–30+ candidates (scroll-tested)** |
| System resilience | BFT consensus survives 1-node failure without halting, **demonstrated across physically/virtually separate node instances** (not one shared VM) |
| Demo-readiness | End-to-end simulated election (auth → ZKP → tally) functional by Month 3 |

## 3. Users & Personas
- **Migrant Voter:** low/no technical literacy, regional language speaker, time-constrained.
- **Polling/ECI Officer:** manual-override authority, kiosk on-site supervisor.
- **Auditor/Judiciary/Civil-society Node Operator:** verifies consensus, runs BFT node.

## 4. Scope (3-Month MVP)
**In scope:** Kiosk auth simulation (QR + signature + stubbed face-match), ZKP-based vote proof, nullifier system, consortium blockchain (4-node, physically separated), homomorphic tally, basic UI (**2 languages, fixed**), Duress PIN, kiosk pubkey registration (Phase 0), voter-facing error/retry states.

**Out of scope (Future/Post-MVP):** Real EPIC/DigiLocker integration, real face-match ML model (stubbed for demo — see §5 note), real hardware attestation supply chain, legal/RoPA amendment work, nationwide EVM interoperability, production HSM key management, nullifier ledger pruning at scale, post-quantum homomorphic encryption.

## 5. Feature List & Priority
All cryptography consolidated under **Anushka**, per team decision. Auth is split: signature verification (crypto) vs. scan/UI/biometric-stub (kiosk client).

| Priority | Feature | Owner | Area |
|---|---|---|---|
| P0 | Kiosk pubkey registration (Phase 0, pre-election) | Anushka (crypto) + Shashwat (infra) | Blockchain/Infra |
| P0 | EPIC QR scan + camera UI | Arnav | Frontend/Kiosk |
| P0 | ECI public-key signature verification of EPIC/QR | **Anushka** | Blockchain (crypto) |
| P0 | Face-match — **stubbed pass/fail toggle for MVP demo** | Arnav | Frontend/Kiosk |
| P0 | ZKP circuit (ownership, membership, one-hot, nullifier) | Anushka | Blockchain |
| P0 | Consortium chain + smart contract nullifier check | Anushka | Blockchain |
| P0 | Homomorphic tally + threshold decryption (t=3-of-4) | Anushka | Blockchain |
| P1 | Kiosk UI (regional lang ×2, symbols, Duress PIN) | Arnav | Frontend |
| P1 | Voter-facing error/retry flow on contract rejection | Arnav | Frontend |
| P1 | BFT consensus simulation (4 nodes, separate instances) | Shashwat | Backend/Infra |
| P1 | Dilithium post-quantum signing | Anushka | Blockchain |
| P1 | Metadata obfuscation (batched shuffle, 50–100 votes, 2-hr timeout flush) | **Arnav** | Frontend/Middleware |
| P2 | EVM signaling / IBC sync simulation | Shashwat | Backend |
| P2 | Disputed Vote flagging (procedural — no biometric retained) | Shashwat (backend) + Arnav (dashboard UI) | Backend/Frontend |
| P2 | Admin/audit dashboard | Arnav | Frontend |

**Note on face-match:** This is a computer-vision task, not cryptography, and has no assigned owner or stack entry beyond this line. It is explicitly stubbed (mock pass/fail) for the Month-3 demo. Building a real on-device face-match model is out of scope for this cycle.

## 6. Future Features (Post-3-Month Roadmap)
- Real DigiLocker e-EPIC + ECI public key integration
- Real face-match ML model (replacing MVP stub)
- Hardware attestation & remote firmware verification pipeline
- Multi-state pilot with live ECI electoral roll sync (dynamic Merkle tree updates — MVP uses a frozen snapshot)
- Formal legal/policy toolkit for RoPA amendment advocacy
- Full accessibility audit (screen readers, motor-impairment kiosk modes)
- Mobile companion app for voter status tracking (non-voting, informational only)
- Nullifier ledger pruning/archival strategy for national scale
- Post-quantum homomorphic encryption research track

## 7. Team Roles
**Anushka — Blockchain & Crypto lead (all cryptography):**
ZKP circuits, nullifier design, smart contract logic, homomorphic tallying, Dilithium signing, EPIC/QR signature verification, kiosk pubkey registration crypto, PLONK setup (see TRD §4 — avoids trusted-setup ceremony risk of Groth16).

**Shashwat — Backend/Infra lead:**
BFT consensus simulation (on separate node instances), node networking, EVM/IBC sync logic, disputed-vote backend logic, kiosk registration infra, DevOps.

**Arnav — Frontend/UX & Middleware lead:**
Kiosk UI (scan, PIN, candidate grid w/ pagination, error states), face-match stub, metadata obfuscation middleware (moved from Shashwat in v1.1, **now consistent across all docs**), Duress PIN flow, admin/audit dashboard.

**Cross-training mitigation (new in v1.2):** Given Anushka is sole owner of all cryptographic components (single point of failure — see Risks §8.4), Shashwat shadows ZKP circuit work during Month 1 Week 2–3 as a documented backup, without taking primary ownership.

## 8. Risks
1. ZKP proof generation latency on low-end kiosk hardware.
2. Scope creep from legal/policy dependencies outside technical control.
3. Team bandwidth given 3-month academic timeline.
4. **Anushka is a single point of failure** for all cryptographic components (ZKP, nullifier, contract, HE, Dilithium, signature verification). Mitigated by Month-1 cross-training shadow (§7), not eliminated.
5. Cross-domain handoff risk — Arnav's middleware (metadata obfuscation) interacts closely with Shashwat's networking layer; requires clear interface contracts.
6. **Sync-window double-vote gap:** kiosk↔EVM nullifier collisions are only caught every ~2 hrs (IBC batch sync), not in real time. Success metric reframed accordingly (§2) rather than overclaiming real-time prevention.
7. **Ballot secrecy is not post-quantum secure** — Paillier HE can be harvested now and decrypted later by a future quantum computer, even though Dilithium signatures remain quantum-safe. Documented as an explicit MVP scoping limitation, not a full quantum-resistance claim.
8. **Verifiability vs. receipt-freeness tension (unsolved):** withholding ballot receipts (Design Spec) to prevent coercion inherently limits the "end-to-end verifiability" claim. This is an open problem in e-voting generally (unresolved in Estonia/Switzerland's systems too) — acknowledged, not solved, in this MVP.
9. **No revote mechanism after Duress PIN use (unsolved):** once a nullifier is spent on a spoiled ballot, the voter has no path to cast a real vote later. Structurally difficult to fix without reopening double-vote or coercion-linkage risk. Named as an open limitation.
10. **ECI centralization of gas/relay infra** creates a practical (non-cryptographic) chokepoint in an otherwise "trustless" consortium model. No fix within 3-month academic scope — named as a known centralization risk.
11. **Vote-buying via self-recorded screen capture:** Duress PIN protects against a coercer physically present, not a voter who records their own session to prove a vote remotely. Known unsolved weakness of remote voting generally.
12. Kiosk hardware supply-chain attestation is a documented dependency, not built in MVP (unchanged from v1.0/v1.1).

## Changelog (v1.1 → v1.2)
- Assigned owner for EPIC QR/signature verification (Anushka) and scan/UI/biometric stub (Arnav) — previously unowned.
- Fixed metadata obfuscation owner inconsistency across PRD/TRD/Charter (now Arnav everywhere).
- Fixed language count inconsistency (locked to 2, Design Spec updated to match).
- Reframed double-voting and ballot-secrecy metrics to match what the architecture actually guarantees.
- Added kiosk pubkey registration (Phase 0), threshold decryption parameter (t=3-of-4), 2-hr batch timeout flush, voter-facing error/retry flow, candidate-grid pagination.
- Added Risks §8.4–8.11 (SPOF, sync-window gap, PQ-HE gap, receipt-freeness tension, no-revote gap, centralization, vote-buying).
