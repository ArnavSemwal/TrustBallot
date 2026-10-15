# TrustBallot — Combined Progress Report (Review 3)

| | |
|---|---|
| **Project** | Networked, cryptographically secure kiosk voting system for India's internal migrant workers |
| **Team** | Anushka Srivastava (Blockchain & Crypto) · Shashwat Siddhant (Backend / Infra) · Arnav Semwal (Frontend / UX & Middleware) |
| **Guide** | Dr. Amrit Pal |
| **Repository** | https://github.com/ArnavSemwal/TrustBallot |
| **Report date** | 14 October 2026 |
| **Period covered** | Last review (≤ 18 Sept 2026) → 14 Oct 2026 |
| **Baseline commit** | `8a4287a` (23 Sept 2026, repo restructure) |
| **Current HEAD** | `8a95256` (10 Oct 2026, merge of PR #1) |
| **Method** | Review of PRD v3.0, the earlier progress report, and a read of the repository code and git history (79 commits; 64 after the baseline). Code was **read, not executed** for this report. Items marked ▶ must be run live before the panel. |

---

## 1. Summary

At the last review the system was a set of **disconnected demos**. A static review (Sept 18 – Oct 3) compared every README claim with the code and recorded an honest Real / Partial / Simulated / Missing table, **31 specific problems**, **7 design decisions**, **5 research gaps** and a plan to May 2027 (PRD v3.0, milestones M0–M5).

Between **4 Oct and 10 Oct** the team implemented the first wave of fixes — **64 commits** (Arnav 27, Shashwat 22, Anushka 15). All seven items promised for **M0** are in the repository, and about half of **M1** has been delivered early.

| | At last review | Today |
|---|---|---|
| BFT nodes | Never contacted each other; ack count hard-coded to 1 | 3-of-4 signed peer consensus, nullifier set, hash-chained log, file locks, heartbeat failover |
| Double voting | Contract check only | Node-level nullifier rejection **and** contract check (cheap check before proof) |
| ZKP | Merkle root hard-coded to 0, no real proof possible | Real per-election root; one real PLONK proof generated and verified in tests |
| Decoys | Counted by the server (every voter added votes to candidates 1 and 5) | Decoys no longer change the tally |
| Duress | Real vote dropped, `9999` hint on screen | Real vote queued, hint removed, constant-time pad, fixed-size payloads |
| Shuffle | `sort(() => Math.random() - 0.5)` (biased) | Fisher-Yates with `crypto.getRandomValues` |
| Vote persistence | In memory, cleared before send, 20% fake errors | IndexedDB, retry with backoff, cleared only after confirmed send, fake errors removed |
| Backend | Node.js stubs | FastAPI: election lifecycle, kiosk registration with ECDSA check, session tokens, vote endpoint, tests |
| Post-quantum | Dilithium stub; Paillier only | Working Dilithium (liboqs) and BFV/SEAL prototypes — **standalone**, not yet integrated |
| Tests | None on frontend | 3 kiosk test files, 4 backend tests, 3 contract tests |

**What is still not done (stated up front):** the kiosk-to-nodes-to-tally pipeline is not yet one connected path, the ciphertext and proof computed on the kiosk are not yet in the payload that is sent, threshold decryption is still simulated, and Dilithium is still a stub inside the contract. See §7.

---

## 2. Timeline

| Phase | Dates | What happened |
|---|---|---|
| Cycle 1 (MVP) | to 17 Sept | Problem definition, kiosk screens, ZK circuits and keys, contracts, 4 node processes, Paillier tally, PRD v1.2 |
| Primitives and restructure | 18–23 Sept | PLONK setup, Paillier fixes, repo restructured (`8a4287a`) — **this is the baseline, not new work** |
| Review and planning | 23 Sept – 3 Oct | Static code review, 14-component status table, 31 problems, 7 decisions, 5 gaps, 44-reference research base, PRD v3.0 |
| Implementation wave 1 | 4–10 Oct | Fixes R1–R21 (kiosk), B1–B5, B14/B15, B17 (nodes), B16/B25 (API), C1–C13 (crypto) |

> Anticipated question: *"There are no commits between 23 Sept and 4 Oct."* Answer: that period was the code review, PRD v3.0, research and task breakdown (§4).

---

## 3. Where we were at the last review

### 3.1 Cycle-1 deliverables
- Problem defined: ~300 million internal migrants; the proposed RVM is not networked.
- Kiosk screens: language, authentication, ballot, review, success; 2 languages, symbol navigation, session timeout.
- ZK circuits (Merkle membership, nullifier, one-hot check) and keys; contracts (registry, verifier, nullifier map).
- 4 backend node processes, Paillier tally service, sync service.
- 8 known limitations written down rather than hidden.

### 3.2 Honest baseline (static review, commit `8a4287a`)

| Status | Count | Components |
|---|---|---|
| Real (prototype) | 1 | Kiosk UI flow |
| Partial | 4 | |
| Simulated | 6 | |
| Missing | 3 | |

Key findings that drove the plan:
- Three disconnected demos: kiosk → tally server, nodes with nothing attached, a contract nothing calls.
- README / audit claims that did not match code (Paillier "constraints" that do not exist, PLONK said to remove trusted-setup risk, wrong mapping name).
- Nodes never agreed; ack count hard-coded to 1; no node-level nullifier check.
- Server saw every vote in plaintext; no encryption, proof, nullifier or signing in the kiosk.
- Duress: real vote discarded, `9999` printed on screen, any 4-digit PIN accepted.
- Decoys counted by the server; biased shuffle; votes lost on reload.
- Dilithium returned `true`; "threshold decryption" was a counter check on one private key.
- Contract tests never used a valid proof; one had no assertions; candidate count was 5 / 12 / up to 12 in circuit / tally / UI.

---

## 4. What changed — by member

Hashes can be shown with `git show <hash>` during the demo.

### 4.1 Arnav Semwal — Kiosk, UX, middleware (27 commits, 4–10 Oct)

| Task | Commit | Change |
|---|---|---|
| R1 | `06289f0` | Payload specification (`docs/payload_spec.md`) |
| R2 | `473fd40` | Decoy votes excluded from the tally |
| R3 | `6e17be2`, `f3d1fdd` | `verifyEpicSignature()` now called; PIN checked; `9999` hint removed from the screen |
| R4 | `979f2af` | Fisher-Yates with `crypto.getRandomValues`; backend URLs configurable |
| R5 | `631215a` | Real-vs-simulated baseline table |
| R6, R7 | `9eecb75` | Fake 20% rejection removed; `legacy/` folder removed; ESLint + Prettier |
| R8 | `f1cff43` | IndexedDB persistence; retry with backoff; pool cleared only after confirmed send |
| R9 | `ca580f3`, `f3d1fdd` | Vitest + React Testing Library; `AuthPage`, `BallotPage`, `ReviewPage` tests |
| R10 | `84bf6d9` | Duress specification (`docs/duress_spec.md`) |
| R11 | `bb7fedf`, `d991ab5`, `98f2d50` | Benchmark harness + on-screen benchmark overlay |
| R13 | `8fbc8d9`, `3eee512` | Constant-time duress pad; real vote queued during duress |
| R15 | `ec80038` | Fixed-size payloads |
| R14, R16 | `396ddc9` | Kiosk-side BFV (SEAL/WASM) encryption and in-browser `snarkjs` PLONK proof generation — **see caveat in §7** |
| R17 | `d991ab5`, `07a11d2` | Admin dashboard login gate; node-health and dispute endpoints called |
| R18 | `5b9d7e6` | Scope statement and threat model |
| R20 | `df53dfc`, `3eee512` | Network-down, node-reject and timeout states |
| R21 | `f93fa4a` | Receipt-free Tracker ID + QR code |
| — | `f8160b5` | `docs/API_CONTRACT.md` — single contract the three components code to |
| — | `0eb07e4` | Signed QR codes for team-member demo identities |

### 4.2 Shashwat Siddhant — Backend and infrastructure (22 commits after the baseline; 1 earlier on 20 Sept)

| Task | Commit | Change |
|---|---|---|
| B1 | `760ed2e` | Per-node ports and data files via environment variables |
| B2 | `760ed2e` | 3-of-4 peer agreement before a vote is final (`/consensus`) |
| B3 | `760ed2e` | Exact-set nullifier rejection on every node |
| B4 | `d14c04b` | Node-to-node ECDSA signing and verification of consensus messages |
| B5 | `d14c04b` | Append-only hash chain (`previous_hash`, `hash`) |
| B17 | `d14c04b` | File locks (`proper-lockfile`); heartbeat and leader failover |
| B14/B15 | `e635e95` | Dilithium / proof / nullifier verification helpers (`crypto_stubs.py`) |
| — | `e635e95` | `backend/latency_test.cjs` consensus-latency script |
| B16 | `6fad78c`…`ed75c30` | FastAPI backend: election create/open/close, kiosk registration (ECDSA verification of ECI signature), session tokens, `/api/votes` with nullifier check, node status / health / metrics / WebSocket |
| — | `365efae`, `35782d2`, `04992ee` | Pinned requirements, 4 backend tests, accurate backend README |
| — | `760ed2e` | `run_network.sh` (cross-platform start alongside `run_network.bat`) |

### 4.3 Anushka Srivastava — Blockchain and cryptography (15 commits after baseline)

| Task | Commit | Change |
|---|---|---|
| C1 | `3d978ae` | Hard-coded Merkle root replaced by a real root; one real PLONK proof generated and verified |
| C2 | `a1ae5d9` | Contract tests fixed: valid proof, correct signer, real duplicate-nullifier assertion |
| C3 | `d268ea3` | Note on the Paillier / PLONK quantum problem (`docs/quantum_issue_note.md`) |
| C4 | `53679cd` | `setup_plonk.sh` no longer uses a local path; public ceremony file; large keys removed from git |
| C5 | `73e8c8c` | `security_audit.md` corrected (`spentNullifiers`, trusted-setup claim) |
| C6 | `fb12367` | Credential design note |
| C7 | `d34c3c8` | Contract hardening: cheap nullifier check before proof check, kiosk caller binding, `revokeKiosk` |
| C8 | `eb3041e` | Proof-to-ciphertext binding **design** |
| C9 | `1780d15` | Post-quantum HE prototype (BFV via SEAL) — `scripts/pq_he_prototype.py` |
| C10 | `1fc1a02` | Post-quantum signature prototype (Dilithium via liboqs) — `scripts/pq_sig_prototype.py` |
| C11 | `98a20ee` | Circuit takes `ciphertextHash` as a public input (binding is a **mock** value for now) |
| C12 | `607d3bf` | Dilithium WASM integration guide for the kiosk |
| C13 | `0b9bd22` | Tally: configurable candidates, rejects out-of-range votes |
| X9 | `e9a26c6` | Related-work write-up for Gaps 3, 4, 5 |
| B14/B15 | `7eed20b` | Verification snippets handed to Shashwat |

> Anushka's commits of 18 Sept (`93624b1`, `c7f8862`, `94bd0f4`, `50a23da`) and 23 Sept (`8a4287a`, `bb1365a`) are the **baseline**, not new work.

---

## 5. Gap by gap — earlier → at review → today

### Gap 1 — Double voting and consensus
| Earlier | At review | Today (verified in code) |
|---|---|---|
| ~2-hour sync gap accepted | Nodes never communicate; ack hard-coded to 1; no node nullifier check | `bft_node.cjs`: signed `/consensus` calls, vote finalised at ≥ 3 of 4 acks, duplicate nullifier rejected with rollback, hash chain, file lock, heartbeat failover |
| Still planned | Offline path (local lock then reconcile), tally-time mixnet clean-up, partition benchmarks | Not done. Failover is simple "claim leadership on timeout" and can split-brain; it is a prototype |

### Gap 2 — Coercion and the Duress PIN
| Earlier | At review | Today |
|---|---|---|
| Duress PIN existed | Real vote dropped; `9999` printed; decoys corrupted tally; biased shuffle | Real vote queued; hint removed; constant-time pad; fixed-size payloads; decoys excluded from tally; Fisher-Yates shuffle |
| Still planned | Zero-vote cryptographic decoys, dummy traffic, nullification API for stolen credentials | Unchecked items in `docs/duress_spec.md`. Today a decoy is marked `isDecoy` in the payload, so the server can tell it apart — acceptable as an interim fix, not as the final design |

### Gaps 3 and 5 — Quantum safety
| Earlier | At review | Today |
|---|---|---|
| Paillier listed as a documented limitation; Dilithium listed as a feature | Dilithium stub returns `true`; threshold decryption is a counter check on one key | Working standalone prototypes: Dilithium (liboqs) and BFV (SEAL). Scope and threat-model docs separate quantum-safe from non-safe parts |
| Still planned | Integrate PQ HE into tally; real Dilithium in contract / nodes / kiosk; real threshold decryption | Contract `verifyDilithium` is still a stub returning `true`; `tally.py` still Paillier with a simulated threshold |

### Gap 4 — Cost of privacy proofs
| Earlier | At review | Today |
|---|---|---|
| Proof latency a risk; gas as cost | Merkle root 0; proof not tied to ciphertext; load test only sleeps 100 ms; trusted setup from a local path | Real root; one real proof verified; public-ceremony setup; ~47 MB of keys out of git; benchmark harness and overlay on the kiosk |
| Still planned | Proof batching, cost per vote with/without batching, real ciphertext binding | `load-test/mock-voter.js` still sleeps 100 ms. Binding is a mock hash |

### Kiosk, backend and contracts
| Area | At review | Today |
|---|---|---|
| EPIC / auth | Any 10-digit number accepted; signature function never called | QR scanner (`html5-qrcode`); signature verified on the scanned payload; PIN checked (**demo PINs are hard-coded**) |
| Server sees plaintext | Yes | Kiosk generates BFV ciphertext and proof, but the submitted payload still contains the plain vote (see §7) |
| Contract tests | No valid proof; wrong arguments; no assertions | 3 tests incl. valid proof accepted and duplicate nullifier rejected |
| Candidate count | 5 / 12 / 12 mismatch | Parameterised in circuit and tally (circuit still instantiated with 5) |

---

## 6. Milestone scorecard (PRD v3.0)

### M0 — "next review" — **7 / 7 delivered**
| M0 item | Status | Evidence |
|---|---|---|
| Honest real-vs-simulated baseline | ✅ | `docs/baseline_review.md` (needs the corrections in §9), `631215a` |
| One-command 4-node start | ✅ | `backend/run_network.sh` / `.bat` |
| 3-of-4 agreement with one node down | ✅ ▶ | `bft_node.cjs`, `scripts/demo_bft.py` |
| Repeated nullifier rejected | ✅ ▶ | B3 in node; contract test; `/api/votes` returns 409 |
| One real proof verified | ✅ ▶ | `3d978ae`, `test/TrustBallot.test.js` |
| Decoys no longer change the tally | ✅ ▶ | `473fd40` |
| Forged EPIC signature rejected | ✅ ▶ | `6e17be2`, `AuthPage.test.tsx` |

### M1 — "end of week 4" — **6 of 8 delivered, 2 partly (≈ 3 weeks early)**
| M1 item | Status |
|---|---|
| Authenticated endpoints | 🟡 kiosk session tokens, admin login gate; node `/consensus` signed |
| Signed node messages | ✅ B4 (`d14c04b`) |
| Fault-injection tools | 🟡 `/api/nodes/{id}/toggle`, `test_sync_gap.cjs`, `demo_bft.py`; no partition tooling |
| Automated tests | ✅ kiosk, backend, contract |
| Standalone Dilithium | ✅ C10 |
| Post-quantum encryption prototype | ✅ C9 |
| Duress specification | ✅ R10 |
| Benchmark harness | ✅ R11 (kiosk) + `latency_test.cjs` (nodes) |

### M2–M5 (upcoming)
| Review | When | Target |
|---|---|---|
| M2 | End of week 12 | End-to-end pipeline with real signatures, proofs and encrypted ballots; kiosk duress; ciphertext-only tally |
| M3 | End of Feb 2027 | Offline path; real threshold decryption; proof batching and cost per vote; nullification; partition results; real dashboard; scope statement and threat model |
| M4 | End of Apr 2027 | Usability study; final benchmarks; cross security review; draft report |
| M5 | May 2027 | Final report, final demo, polished repository |

Planned effort: about 250 hours of Core work per person (~8.5 h/week to May 2027), each task with one owner and one reviewer.

---

## 7. Real vs simulated — status today (from the code)

| Component | Status | What is true now |
|---|---|---|
| Kiosk UI flow | 🟢 Real | 2 languages, symbol navigation, timeout, error / offline states |
| Shuffle and offline pool | 🟢 Real | Fisher-Yates with CSPRNG; IndexedDB; retry; clear after confirmed send |
| EPIC / QR authentication | 🟡 Partial | QR scan + signature verification on demo identities; ECI key stubbed; PINs `1234` / `9999` hard-coded |
| Face match | 🔴 Simulated | Stub in `AuthPage.tsx` |
| Duress flow | 🟡 Partial | Queued real vote, constant-time pad, fixed-size payloads. Decoy flag visible to server; zero-vote decoys, dummy traffic, nullification not built |
| Kiosk vote encryption | 🟡 Partial | BFV via node-seal runs in the browser and is benchmarked. Falls back to `"MOCK_ENCRYPTED_VOTE"` on error; key generated locally; **ciphertext is not in the payload sent** (`{vote, isDecoy}`) |
| Kiosk ZK proof | 🟡 Partial | `snarkjs.plonk.fullProve` wired; falls back to a mock proof when circuit files are absent; mock `ciphertextHash` and credential; **not in the payload sent** |
| Kiosk Dilithium signing | 🔴 Simulated | 10 ms sleep and a formatted string |
| ZK circuits and proof | 🟡 Partial | Real root, one real verified proof; ciphertext binding is a mock input |
| Smart contracts | 🟡 Partial | Check order, caller binding, revoke, valid-proof tests. Root is a constant in `TrustBallot.sol`; `verifyDilithium` returns `true` |
| BFT nodes | 🟢 Real (prototype) | 3-of-4 signed consensus, nullifier set, hash chain, file lock, failover (simple) |
| FastAPI backend | 🟡 Partial | Lifecycle, kiosk registration (real ECDSA), tokens, vote endpoint, health. In-memory store. `verify_zkp` only checks the proof's structure, not the pairing; Dilithium check falls back to length check if `pqcrypto` is absent |
| Tally and threshold decryption | 🔴 Simulated | Paillier (not quantum-safe); "threshold" checks share count, then uses the single master key |
| Post-quantum primitives | 🟡 Prototype | Dilithium and BFV scripts run standalone; not integrated |
| Admin dashboard | 🟡 Partial | Login gate; node-health and dispute calls to real endpoints |
| End-to-end pipeline | 🔴 Missing | Kiosk default target is `localhost:8001` (tally service in `docker-compose.yml`), not the BFT nodes or the FastAPI `/api/votes` |
| Load test | 🔴 Simulated | `load-test/mock-voter.js` sleeps 100 ms; real node latency in `backend/latency_test.cjs` |

Counts: **3 Real, 9 Partial / prototype, 5 Simulated or Missing** (17 rows) — versus 1 / 4 / 9 at the last review (14 components; this table splits a few of them, so compare the trend, not the totals).

---

## 8. PRD v1.2 → v3.0

| Dimension | v1.2 | v3.0 |
|---|---|---|
| Scope | 3-month MVP | Extends to May 2027 (Phase 0–4, milestones M0–M5) |
| Research gaps | Named | 5 gaps with owners, success measures, requirements |
| Tasks | Feature list | Sized backlog (S/M/L), Core vs Extra, owner and reviewer per task |
| Baseline | In / out of scope | Real / Partial / Simulated / Missing per component |
| BFT | "4 nodes, physically separated" | Acknowledges nodes never agreed; Gap 1 with fix plan |
| Quantum | "Dilithium = quantum-safe" | States Paillier is not; decisions D1/D2 |
| Duress and decoys | Described as working | Documented as broken; Gap 2 and decoy decision |
| Research | None | 44 references (10 verified online; 3 not yet located: Alsuwat 2026, Kagai 2025, Tejedor-Romero 2021) |
| Planning | Month 1/2/3 | Week-by-week plan, demo plan, workload ≈ 250 h/person |
| Risks | Mostly accepted | Mitigations plus new risks (library setup, unverified findings, no secure hardware, scope creep, unverifiable citations) |

---

## 9. Corrections to make before the review

1. **`docs/baseline_review.md`** marks Vote Encryption, ZKP and EPIC as "🟢 Real". Change to 🟡 Partial using the wording in §7. Remove "Full Local Cryptography".
2. **Baseline date**: baseline is `8a4287a` of 23 Sept; do not count 18 Sept commits as new.
3. **Do not say "~80% was simulated"**; the review table gives 6 simulated + 3 missing of 14 components.
4. **Do not say** the proof is bound to the ciphertext, that Dilithium is integrated, that the server verifies proofs, or that the server no longer sees votes.
5. **Best upgrade if time allows:** put `ciphertext`, `proof` and `signature` into the payload sent to the backend and send it to the node / FastAPI path. This makes the "kiosk encrypts, server never sees the vote" claim true.
6. Resolve or drop the 3 unlocated papers; give a source for the "~1.6 M gas" figure.
7. Make one clean clone and run every command below at least a day before.

---

## 10. Demo plan (≈ 2–3 minutes each)

**Opening (1 min).** Show §1 table and the M0 scorecard: *"Seven things promised for this review — seven delivered."* Then §7 to show what is not real.

### Arnav
| # | Show | How |
|---|---|---|
| 1 | Honest table | Open corrected `docs/baseline_review.md` |
| 2 | Shuffle | `git show 979f2af` — old biased sort vs Fisher-Yates |
| 3 | Decoy fix | Cast a vote; candidates 1 and 5 do not increase (`473fd40`) |
| 4 | Duress vs real | Two sessions side by side: same screens, same timing, same payload size in the Network tab |
| 5 | Offline | DevTools → Offline, vote stays in IndexedDB, restore, it sends |
| 6 | EPIC tamper | Valid QR accepted; edited QR rejected |
| 7 | Benchmark overlay | Latency, payload size, proof time |

Say plainly: *"Encryption and proof generation run in the browser and are benchmarked; wiring them into the sent payload is the next step (M2)."*

### Shashwat
| # | Show | How |
|---|---|---|
| 1 | Network start | `backend/run_network.sh` (4 nodes + sync) |
| 2 | 3-of-4 agreement | Send a vote; all nodes log consensus; hash chain visible in `votes_300x.json` |
| 3 | Kill one node | `kill` one process, send another vote: still finalised with 3 |
| 4 | Duplicate nullifier | Same nullifier twice: second rejected |
| 5 | Signed messages | Request without `x-node-signature` returns 401 |
| 6 | FastAPI | `uvicorn app.main:app --port 8000` → `/docs`: elections, kiosk register, votes, nodes |
| 7 | Tests | `pytest -v` in `backend/` |

Draw the node-communication diagram: before (4 isolated processes) vs now (peer mesh with 3-of-4 quorum).

### Anushka
| # | Show | How |
|---|---|---|
| 1 | Real proof | `npx hardhat test` — valid proof accepted, duplicate nullifier rejected |
| 2 | Tamper | Alter one proof element: verification fails |
| 3 | Contract diff | `git show d34c3c8` — nullifier check before proof, caller binding, revoke |
| 4 | Dilithium | `python scripts/pq_sig_prototype.py` — sign, verify, tamper, fail |
| 5 | Post-quantum HE | `python scripts/pq_he_prototype.py` — encrypt, add, decrypt |
| 6 | Open problem | `docs/quantum_issue_note.md` — Paillier is not quantum-safe; replacement prototyped |

**Backups:** Arnav — `BallotPage.test.tsx` passing; Shashwat — Swagger `/docs` and `pytest`; Anushka — Dilithium script. Keep commit hashes visible.

---

## 11. Likely panel questions

| Question | Answer |
|---|---|
| What did you do between 23 Sept and 4 Oct? | Code review, 31 findings, PRD v3.0, 44-reference research base, task plan (§4, §8). |
| Is the whole pipeline connected? | Not yet. Nodes, API, kiosk and contract each work; the single connected path is the M2 target. |
| Does the server still see votes? | The kiosk now generates a BFV ciphertext, but the payload sent today still carries the plain vote. Switching the payload is the next task. |
| Is Dilithium real? | The prototype with liboqs is real and standalone. The contract stub and the kiosk signer are still placeholders. |
| Is the ZKP verified on-chain? | Yes in tests with one real proof. The FastAPI endpoint only checks structure. |
| Is Paillier quantum-safe? | No; documented in `quantum_issue_note.md`, BFV prototype built, decision D1 pending approval. |
| Can the server tell decoys apart? | Currently yes, through the `isDecoy` flag. Zero-vote cryptographic decoys are specified in `duress_spec.md` and not yet built. |
| What if the leader node dies? | Followers time out after 5 s and one takes over; this is a simple prototype and does not handle split-brain yet. |
| Is threshold decryption real? | No. Simulated; real Shamir shares / DKG are M3. |
| Is the load test real? | Node latency: `latency_test.cjs`. The Artillery load test is still a mock. |

---

## 12. Remaining work

- Connect the pipeline: kiosk → nodes → verification → tally; send ciphertext, proof and signature.
- Real ciphertext binding in circuit and contract (C8 design → implementation).
- Replace stubs: contract Dilithium, kiosk Dilithium (WASM), real proof verification in FastAPI, PQ HE in tally, real threshold decryption.
- Zero-vote decoys, dummy traffic and the nullification endpoint.
- Offline reconcile path, partition tests, consensus latency under faults.
- Proof batching and cost per vote; usability study (`docs/usability_test_plan.md`); final report.
- Open questions: paper verification, trusted-setup origin, approval to replace Paillier, final candidate count.

---

### Sources
- `docs/TrustBallot_PRD_v3.md`, `docs/baseline_review.md`, `docs/duress_spec.md`, `docs/API_CONTRACT.md`, `docs/quantum_issue_note.md`
- Earlier progress report (Review 2) and the team review report
- Repository code and git history at https://github.com/ArnavSemwal/TrustBallot (HEAD `8a95256`)
