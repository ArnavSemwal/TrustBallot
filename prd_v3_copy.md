**TrustBallot**

Product Requirements Document v3.0

| **Item**       | **Detail**                                                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project        | Networked, cryptographically secure kiosk voting system for India's internal migrant workers                                                                                                 |
| Team           | Anushka (Blockchain & Crypto), Shashwat (Backend/Infra), Arnav (Frontend/UX & Middleware)                                                                                                    |
| Guide          | Dr. Amrit Pal                                                                                                                                                                                |
| Version        | v3.0, October 2026. Extends PRD v1.2 in the repo docs/ folder (the 3-month MVP cycle) with the research-gap phase through May 2027 and a full Core/Extra backlog                             |
| Final deadline | End of May 2027                                                                                                                                                                              |
| Basis          | Static review of the repository (single commit 8a4287a), the project PPT, and the five-gap reference document. Nothing was executed, so each finding should be confirmed by running the code |

## How to use this document

- Sections 1 to 3: what we are building and where the code really stands.
- Sections 4 to 6: what is missing in each person's work, what must be decided first, and the five research gaps.
- Sections 7 to 9: research each person must do, the milestones and roadmap, and the full task list (Core and Extra) with owners.
- Section 10: the plan for this week and the review.
- Sections 11 to 14: workload and capacity, risks, open questions and references.

# 1\. Overview

## 1.1 Problem

- About 300 million Indians move to other states for work and often cannot afford to travel home just to vote.
- India's proposed Remote Voting Machine (RVM) is not networked, so it cannot stop double voting or let anyone verify the final count.

## 1.2 Product vision

A migrant worker votes from a kiosk wherever they work. Nobody can vote twice, nobody can see how anyone voted, a coerced voter has a safe way out, and anyone can verify the final tally.

## 1.3 Goals

- Stop double voting: nullifier checks accepted only after real agreement between nodes (Gap 1).
- Future-proof ballot secrecy: post-quantum signatures for sign-in and a quantum-resistant scheme for the ballot itself (Gaps 3 and 5).
- Coercion-resistant kiosks with a Duress PIN that real and fake sessions cannot be told apart by an observer (Gap 2).
- Decentralised trust: 4 independent BFT nodes that survive one failed or compromised node, with 3-of-4 threshold decryption.
- Affordable privacy proofs: measured proving and verification cost per vote (Gap 4).
- Low-literacy usability: symbol-based UI, 15 to 30+ candidates, a vote in under 3 minutes (tested, not assumed).

## 1.4 Non-goals

- Preventing full physical duress in real time. We handle it by post-hoc nullification only.
- Real face matching, real DigiLocker/EPIC integration, and real hardware attestation.
- Deployment to real elections or at national scale.

# 2\. Users

| **User**                          | **What they need**                                                    |
| --------------------------------- | --------------------------------------------------------------------- |
| Migrant worker (voter)            | A simple symbol-based kiosk; fast; safe if someone is pressuring them |
| Election official / node operator | Nodes that stay consistent and recover from faults; a clear tally     |
| Auditor / observer                | A way to verify the result without learning who voted for whom        |
| Reviewer / guide                  | Clear evidence of progress, measured results, honest limits           |

# 3\. Current state (from the repository)

Status key: Real = does what it claims; Partial = works but with major gaps; Simulated = looks right but does not do the real thing; Missing = not in the code.

| **Component**                                           | **Status**       | **What exists**                                                                             | **Owner**            |
| ------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------- | -------------------- |
| Kiosk UI flow (language, auth, ballot, review, success) | Real (prototype) | Full screens, 2 languages, session timeout, symbol navigation                               | Arnav                |
| EPIC/QR check                                           | Simulated        | Any 10-digit number accepted; signature function exists but is never called; no QR scanning | Arnav                |
| Face match                                              | Simulated        | A "Demo: Force Pass" button (allowed by scope)                                              | Arnav                |
| PIN and Duress PIN                                      | Simulated        | Any 4 digits accepted; 9999 triggers duress and is printed on screen                        | Arnav                |
| Metadata obfuscation (batch and shuffle)                | Partial          | Pool plus decoys; biased shuffle; demo batch of 3 and 5-second flush                        | Arnav                |
| Kiosk-side ZKP, nullifier, encryption, signing          | Missing          | No such code in the kiosk source                                                            | Arnav and Anushka    |
| BFT nodes (Node.js)                                     | Simulated        | Accept a vote and write a file; no peer agreement                                           | Shashwat             |
| Nullifier check in nodes                                | Missing          | Only exists in the smart contract, which the kiosk never calls                              | Shashwat and Anushka |
| EVM/IBC sync                                            | Simulated        | A timer that clears votes.json every 2 minutes                                              | Shashwat             |
| ZKP circuits (Circom, PLONK)                            | Partial          | Merkle membership, nullifier, one-hot check; keys generated; not tied to the ciphertext     | Anushka              |
| Smart contracts                                         | Partial          | Registry, verifier and nullifier map; Dilithium stubbed; root hard-coded to 0               | Anushka              |
| Homomorphic tally (Paillier)                            | Simulated        | Works for sums; threshold decryption is a counter check on one private key                  | Anushka              |
| Dilithium signatures                                    | Missing          | Stub that returns true                                                                      | Anushka              |
| Tests and load test                                     | Partial          | Contract tests never use a valid proof; load test sleeps instead of proving                 | Anushka and Arnav    |

# 4\. What is missing or wrong, by person

Each table lists what was found and where. Fix order matches the task list in section 9.

## 4.1 Shashwat: Backend / Infra

| **#** | **Finding**                                                                                                                                                                                    | **Where**                         | **Fix direction**                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| S1    | No consensus. Acknowledgement count is hard-coded to 1 and every vote always "reaches consensus". Nodes never contact each other.                                                              | backend/bft_node.cjs              | Peer messaging; finalise only on 3 of 4 agreement; test with one node killed          |
| S2    | No double-vote check in the node.                                                                                                                                                              | backend/bft_node.cjs              | Store seen nullifiers per election; reject repeats; agree on them across nodes        |
| S3    | No identity, signature or proof checks. Anyone can register a kiosk or submit a vote.                                                                                                          | node_server.cjs, tally/server.py  | Verify kiosk signature and proof before accepting                                     |
| S4    | The kiosk never calls the BFT nodes. It posts to the tally server on :8001.                                                                                                                    | KioskContext.tsx, bft_node.cjs    | Wire kiosk to nodes with an agreed payload format                                     |
| S5    | The vote travels as a plain candidate number and the server encrypts it, so the server sees every vote.                                                                                        | KioskContext.tsx, tally/server.py | Encrypt on the kiosk; server only adds ciphertexts                                    |
| S6    | Threshold decryption is simulated. /authorize accepts any node_id from anyone, one process holds the whole key, and decrypt works mid-election.                                                | tally/server.py, tally/tally.py   | Authenticate nodes; real key shares; election-closed gate                             |
| S7    | The four containers in docker-compose are independent tally servers with their own keys and in-memory state.                                                                                   | docker-compose.yml                | Run BFT nodes in compose with shared election parameters                              |
| S8    | All four nodes share one votes.json with no locking; the sync service deletes votes and sends them nowhere; dispute is by voter_id (conflicts with anonymity); startup script is Windows-only. | run_network.bat, sync_service.cjs | Per-node data; real hand-off; dispute by receipt-free reference; cross-platform start |
| S9    | No backend tests; \__pycache__ and empty data files are committed; the README repo link and run steps do not match the code.                                                                   | repo root                         | Add tests, .gitignore, correct README                                                 |

## 4.2 Anushka: Blockchain & Crypto

| **#** | **Finding**                                                                                                                                                                                                                                                                               | **Where**                                             | **Fix direction**                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| A1    | The proof is not tied to the encrypted vote. The circuit only proves a hidden selection is one-hot. A voter could attach a ciphertext worth many votes. The README claims Paillier constraints that do not exist, and a proof could be reused with another ciphertext.                    | circuits/vote_integrity.circom                        | Bind proof to the ciphertext (commitment or hash binding, or a circuit-friendly scheme) |
| A2    | Merkle root hard-coded to 0, so a real proof would fail. Anyone can call submitVote with a registered kiosk ID. The ciphertext is not stored. Dilithium check always true. The costly proof check runs before the cheap nullifier check. No election lifecycle. No way to revoke a kiosk. | contracts/TrustBallot.sol, KioskRegistry.sol          | Per-election root; caller binding; store ciphertext; reorder checks; add revoke         |
| A3    | Tests never use a valid proof. registerKiosk is called with 2 arguments but takes 3, from the wrong account. The duplicate test has no assertions. The unit test expects a revert while the integration test expects an event.                                                            | test/TrustBallot.test.js, scripts/integration_test.js | Generate one valid proof; test accept, duplicate and tamper cases                       |
| A4    | Candidate count mismatch: circuit 5, tally 12, UI up to 12.                                                                                                                                                                                                                               | main.circom, tally/server.py                          | Choose one value and parameterise                                                       |
| A5    | setup_plonk.sh has a hard-coded d:/Dev path and looks for the ptau in the wrong folder. The ptau appears to be locally generated by one contributor (to confirm), which would mean toxic-waste risk and makes the audit note wrong. About 47 MB of keys are committed.                    | scripts/setup_plonk.sh, circuits/                     | Use a public ceremony ptau; fix script; move keys out of git                            |
| A6    | Tally: one process holds the private key; each container makes its own key; an out-of-range vote becomes an all-zero vote and still returns success; no checks on /add_vote.                                                                                                              | tally/server.py                                       | Reject invalid votes; shared keys; threshold decryption                                 |
| A7    | No Dilithium implementation anywhere.                                                                                                                                                                                                                                                     | contracts, kiosk                                      | Integrate liboqs signing and verification                                               |
| A8    | Load test sleeps 100 ms to "simulate" proving and sends zero proofs to a placeholder address.                                                                                                                                                                                             | load-test/                                            | Measure real proof time and verification                                                |
| A9    | security_audit.md mentions a hasVoted mapping (code uses spentNullifiers) and says PLONK removes trusted-setup risk, which overstates it.                                                                                                                                                 | docs/security_audit.md                                | Correct the document                                                                    |

## 4.3 Arnav: Frontend / Middleware

| **#** | **Finding**                                                                                                                                                                                                                        | **Where**                         | **Fix direction**                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| R1    | Decoys corrupt the tally. Each normal vote sends the real vote plus two fixed decoys (candidates 1 and 5), all counted by the server. Duress sends candidates 12, 1 and 5. Every voter therefore adds votes to candidates 1 and 5. | KioskContext.tsx, tally/server.py | Decoys must not change the count (agreed design with Anushka)                          |
| R2    | Duress throws the real vote away, but the Gap 2 design says it should be queued and confirmed later. 9999 is hard-coded and printed on screen. Any 4-digit PIN is accepted.                                                        | KioskContext.tsx, AuthPage.tsx    | Real PIN check; remove hint; queue the real vote                                       |
| R3    | Real and duress sessions are distinguishable: fixed decoys, plain HTTP candidate numbers, biased shuffle (sort with Math.random), payloads sent one by one in order.                                                               | KioskContext.tsx                  | Fisher-Yates with crypto.getRandomValues; fixed-size encrypted payloads; random decoys |
| R4    | The kiosk has no cryptography: no ZKP, nullifier, encryption or signing. "Encrypting & Submitting" is a label.                                                                                                                     | master-kiosk/src                  | Add proof generation, encryption and signing (with Anushka)                            |
| R5    | verifyEpicSignature exists but nothing calls it. There is no QR scanning code; the webcam step is a button.                                                                                                                        | crypto/epicAuth.ts, AuthPage.tsx  | Call it on a signed test payload; add QR scanning                                      |
| R6    | Rejection/retry is faked: 20% of votes randomly fail with NULLIFIER_COLLISION.                                                                                                                                                     | KioskContext.tsx                  | Drive the retry state from real backend responses                                      |
| R7    | Votes can be lost: the pool lives in React state, is cleared before sending, and failed sends are only logged. Batch size and flush time are demo values (3 and 5 s) instead of 50 to 100 and 2 hours.                             | KioskContext.tsx                  | Persist the pool; retry; restore PRD values behind a config                            |
| R8    | Dashboard shows hard-coded "Online / Synced" and "System Secure". The dispute form does not call the backend. /audit has no login. URLs are hard-coded to localhost.                                                               | AdminDashboard.tsx                | Real node status; real dispute call; auth; environment config                          |
| R9    | No frontend tests; legacy/ holds five old app copies and .figma files; the under-3-minute usability goal is unmeasured.                                                                                                            | master-kiosk/, legacy/            | Add tests; remove legacy; run a usability test                                         |

## 4.4 Problems that cut across everyone

| **#** | **Finding**                                                                                                     | **Fix direction**                                     |
| ----- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| X1    | Three disconnected demos: kiosk to tally server, BFT nodes with nothing attached, and a contract nothing calls. | One pipeline: kiosk to nodes to verification to tally |
| X2    | No shared payload specification (electionId, nullifier, ciphertext, proof, signature, decoy handling).          | One-page spec all three code to (task T1)             |
| X3    | Decoy design is undecided, and the current one breaks the count.                                                | Joint decision by Anushka and Arnav (task T16)        |
| X4    | Some documents claim more than the code does.                                                                   | Correct README and audit; keep a real/simulated table |

# 5\. Design decisions to settle first

| **#** | **Issue**                                                                                                          | **Proposed resolution**                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1    | Paillier relies on factoring and is broken by a quantum computer. This conflicts with future-proof ballot secrecy. | Move the tally to a lattice-based homomorphic scheme (BFV/BGV in OpenFHE or SEAL), or label Paillier a placeholder in the scope statement.       |
| D2    | PLONK with standard commitments is not post-quantum.                                                               | State this in the scope statement; evaluate a hash-based proof system as a comparison.                                                           |
| D3    | Objective 1 says a 2-hour sync window, but the Gap 1 fix says real consensus before finalising.                    | Two paths: online means consensus before finalising; offline means local lock then reconcile within the window.                                  |
| D4    | Gap 4 measures gas, but we run a permissioned 4-node network.                                                      | Measure proving time, verification time and proof size per vote; report a gas-equivalent for comparison with published figures (about 1.6M gas). |
| D5    | Decoys must not change the tally yet must look identical to real votes.                                            | Evaluate zero-vote decoys that the system accepts as valid but that add nothing; short-term flag to exclude decoys is a known leak.              |
| D6    | Duress currently drops the real vote.                                                                              | Specify a queued real vote with private confirmation, and a nullification path for stolen credentials.                                           |
| D7    | Candidate count: 5, 12 or configurable.                                                                            | Make it a parameter of circuit, tally and UI.                                                                                                    |

# 6\. Requirements by research gap

## Gap 1: The Sync-Gap Issue

**Where the repo stands:** No peer consensus and no nullifier check in the nodes; the sync service only clears a file.

**Problem:** Kiosks sync in batches, so a voter who votes at two kiosks inside one sync window can double-vote before it is noticed. Migrant voting makes this worse because connectivity is unreliable.

**Requirements:**

- A consensus round across the 4 nodes before a vote is finalised; nodes agree only on "seen or not seen" for a nullifier.
- For genuine connection failure, lock the vote locally with secure hardware (simulated if unavailable) and reconcile when connected.
- A mixnet-based cleanup pass at tally time as an independent second check.
- Benchmark consensus latency under normal and simulated network-partition conditions.

**Success measure:** No duplicate nullifier accepted in tests; consensus latency reported for normal and partitioned runs.

**Owner / reviewer:** Shashwat / Anushka

## Gap 2: Safe Recovery from Coercion

**Where the repo stands:** Duress PIN exists but spoils the vote and is visible; decoys are fixed and break the tally.

**Problem:** A coerced voter needs a way to recast their real vote without the coercer finding out. A second vote can leave a detectable timing or pattern signal.

**Requirements:**

- Duress PIN entered at voting time triggers a decoy vote; the real vote is queued and confirmed privately later.
- Identical on-screen behaviour for duress and real PIN (message, animation, timing).
- Identical network traffic (size, timing, format) for real and decoy votes.
- Batch and shuffle all votes with a proper random shuffle.
- A cryptographic nullification path for stolen credentials.

**Success measure:** An observer comparing screen recordings and traffic captures of duress and real sessions cannot tell them apart in our tests.

**Owner / reviewer:** Arnav / Shashwat

## Gaps 3 and 5: Quantum Harvest-and-Decrypt, and Quantum-Proofing on Sign-In Only

**Where the repo stands:** No Dilithium; ballot encryption is Paillier; threshold decryption is simulated.

**Problem:** Adversaries can copy encrypted votes now and decrypt later. Systems also call themselves quantum-safe because login is protected while ballot content is not. The closest related work, Alsuwat (2026), demonstrates quantum-safe authentication and consensus but makes no equally explicit claim about long-term ballot confidentiality.

**Requirements:**

- Two separate checks: post-quantum signatures for authentication and a post-quantum scheme for vote content.
- State a multi-decade confidentiality horizon and choose parameters to match.
- Split the decryption key across the 4 institutions (real threshold or distributed key generation).
- Publish a scope statement listing which components (signatures, ballot encryption, key storage, ZK proofs) are quantum-safe and which are not.

**Success measure:** A written scope statement plus a working post-quantum ballot encryption and threshold decryption demo.

**Owner / reviewer:** Anushka / Arnav (Shashwat deploys key shares)

## Gap 4: High Costs of Privacy Proofs

**Where the repo stands:** One circuit and a verifier contract exist; no real proof has been generated or timed in the tests or the load test.

**Problem:** Verifying ZK proofs is expensive and scales poorly. Recent systems report over a million gas units per vote.

**Requirements:**

- Heavy computation off-chain with a compact proof verified on-chain or at the nodes.
- Batch many votes into one proof so cost per vote stays close to constant.
- Verify correctness by construction, avoiding a dispute phase.
- Set a cost target after a baseline measurement and report real numbers.

**Success measure:** Per-vote proving time, verification time, proof size and gas-equivalent reported, with and without batching.

**Owner / reviewer:** Anushka and Shashwat / Arnav

# 7\. Research plan

Research comes first because several tasks depend on a decision, such as which post-quantum scheme to use or how decoys work. Each item below ends in a short written output, so research counts as visible progress.

## 7.1 Team research

| **Question**                                                                                 | **Output**                                                   | **When**        |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------- |
| What exactly is in a vote payload?                                                           | One-page payload spec all three code to (task R1)            | This week       |
| How can decoys avoid changing the tally yet look identical to real votes?                    | Decision note (task X10)                                     | Phase 1         |
| What do we claim as quantum-safe and what do we not?                                         | Draft scope statement, final version in Phase 3 (task R23)   | Draft this week |
| How does a voter credential (privateCredential) get derived from the EPIC and who issues it? | Credential design note (task C6)                             | Phase 1         |
| What is the related work for each of the five gaps?                                          | Related-work table with 2 to 3 sentences per paper (task X9) | Phase 1         |
| What does the review reward?                                                                 | Answer from the guide or seniors                             | Day 1           |

## 7.2 Individual research

| **Person** | **Research topics**                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | **Output**                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Shashwat   | Consensus options (PBFT, two-phase quorum, CometBFT) and leader/view change; agreeing on a nullifier set and handling partitions; hash-chained append-only logs; node-to-node authentication and mTLS; simulating a hardware-backed local lock (TPM emulation or signed counter); fault-injection tools (tc/netem, container kill); anchoring a batch hash on a chain; k6 or Artillery for node load tests                                                                           | Comparison table, chosen design and failure cases (task B7)                           |
| Anushka    | Binding a proof to a ciphertext (commitment or hash binding versus in-circuit encryption cost); validity or range proofs for ciphertexts; post-quantum homomorphic encryption (BFV/BGV in OpenFHE or SEAL) and its threshold decryption or distributed key generation; Dilithium with liboqs in Node and in the browser (WASM); public-ceremony ptau files; proof aggregation and recursion; STARK or hash-based proof systems; verifiable shuffles; Merkle-tree credential issuance | Technical note on each chosen scheme plus a small working example (tasks C8, C9, C10) |
| Arnav      | Coercion resistance and receipt-freeness (start with Chaum et al. 2025 and a JCJ/Civitas overview); proper shuffling, padding and dummy traffic; QR scanning and ECI signature verification in the browser; snarkjs in the browser and proof time on weak hardware; IndexedDB persistence and retry patterns; accessibility for low-literacy users (audio prompts, regional languages); usability testing (task timing, SUS questionnaire)                                           | Duress specification and usability test plan (tasks R10, R24)                         |

# 8\. Milestones and roadmap

The plan is built so there is something new to show at every review, not only at the end. Weeks are counted from the end of next week's review. If your semester ends earlier than week 12, move the Phase 2 tail into Phase 3.

| **Phase** | **When**                 | **Goal**                                                                                                   |
| --------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 0         | This week                | Honest baseline plus a few real fixes (Must), with extras if ahead (Stretch)                               |
| 1         | Weeks 1 to 4             | Foundations: decisions, secure endpoints, test and CI setup, tooling, standalone crypto prototypes         |
| 2         | Weeks 5 to 12            | First real pipeline: kiosk to nodes to verification to tally with real signatures, proofs and encryption   |
| 3         | January to February 2027 | Advanced features and measurement: offline path, threshold decryption, batching, nullification, benchmarks |
| 4         | March to May 2027        | Evaluate, write, demonstrate: usability study, final benchmarks, report or paper, final demo               |

## 8.1 What each review can show

| **Milestone** | **Roughly when**     | **What you can demonstrate**                                                                                                                                                                                                               |
| ------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0            | Next week            | Honest real vs simulated baseline; one-command 4-node start; 3-of-4 agreement with one node down; repeated nullifier rejected; one real proof verified; decoys no longer change the tally; EPIC signature rejected when forged             |
| M1            | End of week 4        | Authenticated endpoints; node-to-node signed messages; fault-injection tools; CI running tests; standalone Dilithium sign/verify; post-quantum encryption prototype; duress specification; benchmark harness; hardened contract with tests |
| M2            | End of week 12       | End-to-end pipeline with real signatures, real proofs, encrypted ballots from the kiosk and a verifier service; kiosk duress working; QR scanning; ciphertext-only tally; E2E tests passing in CI                                          |
| M3            | End of February 2027 | Offline path; real threshold decryption; proof batching with cost per vote; nullification proof; partition and latency results; real dashboard; scope statement and threat model                                                           |
| M4            | End of April 2027    | Usability study results; final benchmarks; cross-checked security review; draft of the report or paper                                                                                                                                     |
| M5            | May 2027             | Final report, final demo, polished repository and documentation                                                                                                                                                                            |

# 9\. Task backlog

Everything we could usefully do is listed here, grouped by owner. Two filters keep it manageable:

- **Priority.** Core means the project needs it to meet its goals and answer the five gaps. Extra means it improves the project but can be dropped if time runs short. Do all Core tasks first.
- **Phase.** 0 Must is this week and required for the review; 0 Stretch is extra work that makes the review stronger if you are ahead; 1 to 4 follow section 8.

Sizes: S about 4 hours, M about 12 hours, L about 30 hours. Effort points: S = 1, M = 3, L = 6 (one point is roughly 4 hours). Co-owned tasks split evenly between owners.

## 9.1 Shashwat (Backend / Infra)

| **ID** | **Task**                                                                                                   | **Gap** | **Size** | **Phase** | **Priority** | **Reviewer** |
| ------ | ---------------------------------------------------------------------------------------------------------- | ------- | -------- | --------- | ------------ | ------------ |
| B1     | Per-node data files and ports; compose or script starts all 4 BFT nodes in one command on any OS           | Infra   | S        | 0 Must    | Core         | Anushka      |
| B2     | Peer-to-peer agreement: a vote is finalised only when 3 of 4 nodes agree; demonstrate with one node killed | 1       | M        | 0 Must    | Core         | Anushka      |
| B3     | Nullifier check in nodes; reject repeats; script that shows the sync-gap problem and its rejection         | 1       | M        | 0 Must    | Core         | Anushka      |
| B9     | Input validation, body-size limits, rate limiting and proper error responses on all endpoints              | Infra   | S        | 0 Stretch | Core         | Arnav        |
| B12    | CI pipeline (GitHub Actions): lint, build and run tests for backend, contracts and kiosk                   | Infra   | S        | 0 Stretch | Core         | Arnav        |
| B6     | Fault-injection tools: kill a node, delay or drop messages, simulate a partition                           | 1       | M        | 1         | Core         | Arnav        |
| B7     | Consensus design document with failure cases and the chosen approach                                       | 1       | S        | 1         | Core         | Anushka      |
| B8     | Kiosk registration with signed-credential verification; reject unauthenticated /add_vote                   | 1/2     | M        | 1         | Core         | Anushka      |
| B10    | Compose health checks, environment config and secrets handling                                             | Infra   | M        | 1         | Core         | Arnav        |
| B4     | Node-to-node authentication: signed and verified consensus messages                                        | 1       | M        | 2         | Core         | Anushka      |
| B5     | Append-only hash-chained log per node so votes survive restarts and tampering is detectable                | 1       | M        | 2         | Core         | Anushka      |
| B11    | Backend unit and integration tests, including consensus and nullifier tests                                | Infra   | M        | 2         | Core         | Arnav        |
| B13    | Verifier service on each node: verify proof, nullifier and signature before accepting a vote               | 4       | M        | 2         | Core         | Anushka      |
| B14    | Authenticated /authorize and /decrypt and an election-closed gate before decryption                        | 3/5     | M        | 2         | Core         | Anushka      |
| B15    | Dilithium signature verification inside the node pipeline                                                  | 3/5     | M        | 2         | Core         | Anushka      |
| B20    | Leader failover (view change) so the network survives the primary node failing                             | 1       | L        | 2         | Extra        | Anushka      |
| B16    | Election lifecycle API: create, open, close, tally                                                         | Infra   | M        | 3         | Core         | Arnav        |
| B17    | Voter Merkle-tree builder and per-election root publisher                                                  | 4       | M        | 3         | Core         | Anushka      |
| B18    | Offline path: secure local lock (simulated if no hardware) and reconcile on reconnect                      | 1       | L        | 3         | Core         | Anushka      |
| B19    | Partition and latency benchmarks for consensus under normal and faulty conditions                          | 1       | M        | 3         | Core         | Arnav        |
| B21    | Node recovery: a restarted node catches up from peers                                                      | 1       | M        | 3         | Extra        | Anushka      |
| B22    | TLS or mutual TLS between kiosk and nodes                                                                  | Infra   | M        | 3         | Extra        | Arnav        |
| B23    | Dispute and audit endpoint by receipt reference instead of voter_id                                        | 2       | M        | 3         | Extra        | Arnav        |
| B24    | Anchor each batch hash on chain as the real sync hand-off                                                  | 1       | M        | 3         | Extra        | Anushka      |
| B25    | Structured logging and metrics (latency, queue length) per node                                            | Infra   | S        | 3         | Extra        | Arnav        |
| B26    | Stress test of the nodes with real traffic (k6 or Artillery)                                               | 1/4     | M        | 3         | Extra        | Arnav        |
| B27    | Backup, restore and data-retention notes                                                                   | Infra   | S        | 4         | Extra        | Arnav        |

## 9.2 Anushka (Blockchain & Crypto)

| **ID** | **Task**                                                                                                                    | **Gap** | **Size** | **Phase** | **Priority** | **Reviewer** |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ------- | -------- | --------- | ------------ | ------------ |
| C1     | Generate and verify one real proof; replace the hard-coded Merkle root                                                      | 4       | M        | 0 Must    | Core         | Shashwat     |
| C2     | Fix contract tests: argument count, signer, real duplicate-nullifier assertion                                              | 1/4     | S        | 0 Must    | Core         | Shashwat     |
| C3     | One-page note on the Paillier and PLONK quantum issue and the proposed fix                                                  | 3/5     | S        | 0 Must    | Core         | Arnav        |
| C4     | Fix setup_plonk.sh paths; use a public ceremony ptau; move large keys out of git                                            | 4       | S        | 0 Stretch | Core         | Shashwat     |
| C5     | Correct security_audit.md (hasVoted name, trusted-setup claim)                                                              | All     | S        | 0 Stretch | Core         | Arnav        |
| C6     | Credential design: how privateCredential is derived from the EPIC and who issues it                                         | 4       | M        | 1         | Core         | Shashwat     |
| C8     | Design proof-to-ciphertext binding                                                                                          | 4       | M        | 1         | Core         | Shashwat     |
| C9     | Choose a post-quantum homomorphic scheme; prototype encrypt, add, decrypt                                                   | 3/5     | M        | 1         | Core         | Arnav        |
| C10    | Real Dilithium signing and verification with liboqs                                                                         | 3/5     | M        | 1         | Core         | Shashwat     |
| C7     | Contract hardening: check order, store ciphertext hash, caller binding, kiosk revoke, election lifecycle, per-election root | 1/4     | M        | 2         | Core         | Shashwat     |
| C11    | Update circuit: candidate-count parameter and binding to the ciphertext                                                     | 4       | L        | 2         | Core         | Shashwat     |
| C12    | Dilithium in the browser (WASM) for kiosk-side signing                                                                      | 3/5     | M        | 2         | Core         | Arnav        |
| C13    | Tally service refactor: ciphertext-only, validity checks, real per-election keys                                            | 3/5     | L        | 2         | Core         | Shashwat     |
| C14    | Real threshold decryption or distributed key generation across the 4 nodes                                                  | 3/5     | L        | 3         | Core         | Shashwat     |
| C15    | Proof batching or aggregation prototype                                                                                     | 4       | L        | 3         | Core         | Arnav        |
| C16    | Nullification proof for stolen credentials                                                                                  | 2       | L        | 3         | Core         | Arnav        |
| C18    | Compare a hash-based (STARK-style) proof system against PLONK                                                               | 3/5     | M        | 3         | Extra        | Shashwat     |
| C19    | Cryptographic test vectors and property-based tests                                                                         | 3/5     | M        | 3         | Extra        | Shashwat     |
| C20    | Verifiable shuffle for the tally-time duplicate cleanup pass                                                                | 1       | L        | 3         | Extra        | Shashwat     |
| C21    | Contract gas report and optimisation                                                                                        | 4       | M        | 3         | Extra        | Shashwat     |

## 9.3 Arnav (Frontend / Middleware)

| **ID** | **Task**                                                                                                 | **Gap** | **Size** | **Phase** | **Priority** | **Reviewer** |
| ------ | -------------------------------------------------------------------------------------------------------- | ------- | -------- | --------- | ------------ | ------------ |
| R1     | Payload specification (electionId, nullifier, ciphertext, proof, signature, decoy handling)              | All     | S        | 0 Must    | Core         | Anushka      |
| R2     | Decoys no longer change the tally (temporary flag, documented as a leak)                                 | 2       | S        | 0 Must    | Core         | Anushka      |
| R3     | Wire in verifyEpicSignature on a signed test payload; real PIN check; remove the 9999 hint               | 2       | S        | 0 Must    | Core         | Shashwat     |
| R4     | Fisher-Yates shuffle with crypto.getRandomValues; configurable backend URLs                              | 2       | S        | 0 Must    | Core         | Shashwat     |
| R5     | Real vs simulated baseline table and review slides                                                       | All     | S        | 0 Must    | Core         | All          |
| R6     | Remove the random fake rejection; drive retry state from real backend responses                          | 2       | S        | 0 Stretch | Core         | Shashwat     |
| R7     | Repository cleanup: remove legacy/ and .figma; add ESLint and Prettier                                   | Infra   | S        | 0 Stretch | Core         | Shashwat     |
| R8     | Persist the vote pool (IndexedDB); retry with backoff; never clear before a confirmed send               | 2       | M        | 1         | Core         | Shashwat     |
| R9     | Frontend test setup (Vitest and React Testing Library) with tests for the main flows                     | Infra   | M        | 1         | Core         | Shashwat     |
| R10    | Duress specification: queued real vote, identical UI and timing, nullification path                      | 2       | M        | 1         | Core         | Shashwat     |
| R11    | Benchmark harness: latency, proof time, payload size                                                     | 1/4     | M        | 1         | Core         | Shashwat     |
| R12    | QR scanning of the EPIC in the browser                                                                   | 2       | M        | 2         | Core         | Anushka      |
| R13    | Kiosk duress implementation: queued real vote, uniform behaviour                                         | 2       | L        | 2         | Core         | Shashwat     |
| R14    | Kiosk-side encryption of the vote using the chosen post-quantum scheme                                   | 3/5     | M        | 2         | Core         | Anushka      |
| R15    | Fixed-size encrypted payloads, constant timing and dummy-traffic scheduling                              | 2       | M        | 2         | Core         | Shashwat     |
| R23    | Kiosk device identity and registration flow                                                              | 2       | M        | 2         | Extra        | Shashwat     |
| R16    | In-browser proof generation with snarkjs; measure time on weak hardware                                  | 4       | L        | 3         | Core         | Anushka      |
| R17    | Dashboard wired to real node status and the real dispute call, with login; separate admin from voter app | 2       | M        | 3         | Core         | Shashwat     |
| R18    | Scope statement and threat model                                                                         | 2/3/5   | M        | 3         | Core         | Anushka      |
| R20    | Error and offline UX states (network down, node reject, timeouts)                                        | 1/2     | M        | 3         | Extra        | Shashwat     |
| R21    | Voter receipt design: confirm inclusion without proving how they voted                                   | 2       | M        | 3         | Extra        | Anushka      |
| R22    | Accessibility: audio prompts, larger symbols, more regional languages                                    | Obj 5   | M        | 3         | Extra        | Shashwat     |
| R19    | Usability test: low literacy, under 3 minutes, 15 to 30 candidates                                       | Obj 5   | L        | 4         | Core         | Shashwat     |

## 9.4 Shared and co-owned tasks

| **ID** | **Task**                                                                                    | **Gap** | **Size** | **Phase** | **Priority** | **Owners / reviewer**                      |
| ------ | ------------------------------------------------------------------------------------------- | ------- | -------- | --------- | ------------ | ------------------------------------------ |
| X1     | Set up the task board and weekly 30-minute sync                                             | All     | S        | 0 Must    | Core         | All                                        |
| X2     | Record a backup demo video                                                                  | All     | S        | 0 Must    | Core         | All                                        |
| X9     | Related-work table: each person writes up the papers for their own gaps                     | All     | M        | 1         | Core         | All / review: Guide                        |
| X10    | Decoy design decision: zero-vote decoys or another approach that leaves the tally unchanged | 2       | M        | 1         | Core         | Anushka + Arnav / review: Shashwat         |
| X3     | End-to-end integration: kiosk to nodes to verification to tally                             | All     | L        | 2         | Core         | Shashwat + Anushka + Arnav / review: Guide |
| C17    | Cost-per-vote measurement: proving time, verification time, proof size, gas-equivalent      | 4       | M        | 3         | Core         | Anushka + Arnav / review: Shashwat         |
| X4     | End-to-end test suite running in CI                                                         | All     | M        | 3         | Core         | Shashwat + Arnav / review: Anushka         |
| X11    | Architecture diagrams, user guide and README polish                                         | All     | M        | 3         | Extra        | All / review: Guide                        |
| X5     | Final benchmark report                                                                      | All     | L        | 4         | Core         | All / review: Guide                        |
| X6     | Final report or paper                                                                       | All     | L        | 4         | Core         | All / review: Guide                        |
| X7     | Cross security review: each person tests another person's module                            | All     | M        | 4         | Core         | All / review: Guide                        |
| X8     | Final demo preparation                                                                      | All     | M        | 4         | Core         | All / review: Guide                        |

# 10\. This week: work for the review

The goal is not a finished system. It is an honest baseline plus real, demonstrable fixes. A reviewer will trust "here is what is real, here is what is simulated, here is the plan" more than a polished demo that hides the gaps.

## 10.1 Must do

| **Owner** | **Task**                                                                                                                          | **Rough time** |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Everyone  | Day 1 meeting: agree payload spec, real/simulated status and owners; ask the guide what the review rewards; set up the board (X1) | 1.5 hours      |
| Shashwat  | Per-node data files and ports; one-command cross-platform start (B1)                                                              | 3 to 4 hours   |
| Shashwat  | Peer agreement so a vote is finalised on 3 of 4 nodes; show it with one node killed (B2)                                          | about 1 day    |
| Shashwat  | Nullifier rejection in the node plus a script showing the sync-gap problem and its rejection (B3)                                 | 3 to 4 hours   |
| Anushka   | One real proof generated with snarkjs and verified, with the hard-coded root replaced (C1)                                        | 1 to 1.5 days  |
| Anushka   | Fix the contract tests (C2)                                                                                                       | 3 to 4 hours   |
| Anushka   | One-page note on the Paillier and PLONK quantum issue (C3)                                                                        | 2 to 3 hours   |
| Arnav     | Payload spec (R1) and decoys no longer changing the tally (R2)                                                                    | 4 to 6 hours   |
| Arnav     | EPIC signature check wired in, real PIN check, remove the 9999 hint (R3)                                                          | 3 to 4 hours   |
| Arnav     | Fisher-Yates shuffle and configurable URLs (R4)                                                                                   | 1 to 2 hours   |
| Arnav     | Real vs simulated baseline table and review slides (R5)                                                                           | 3 hours        |
| Everyone  | Backup demo video (X2)                                                                                                            | 1 hour         |

## 10.2 Stretch: do these if you are ahead

- Shashwat: input validation and rate limiting (B9) and the CI pipeline (B12). CI alone shows the reviewer automated tests running.
- Anushka: fix the ptau and setup script and move keys out of git (C4); correct security_audit.md (C5).
- Arnav: remove the fake rejection (R6) and clean the repository (R7).
- Optional extra for the demo: a curl script that posts a vote straight to the BFT nodes, so the path can be shown even if the kiosk is not yet connected.

## 10.3 Do not attempt before the review

- Real Dilithium integration, post-quantum homomorphic encryption, the offline hardware lock, and the full kiosk to nodes to contract pipeline.
- Real QR camera scanning, real face matching and the full usability study.

## 10.4 Suggested week

| **Day** | **Focus**                                                                         |
| ------- | --------------------------------------------------------------------------------- |
| 1       | Team meeting, payload spec, ask the guide what the review expects, start research |
| 2 to 3  | First Must item for each person                                                   |
| 4       | Second Must item for each person                                                  |
| 5       | Third Must items, tests, record a backup demo video                               |
| 6       | Practice the demo once from a clean clone; finish slides; Stretch items if ahead  |
| 7       | Buffer for fixes                                                                  |

## 10.5 What to show at the review (5 to 7 minutes)

- **The problem and what is built.** The MVP and the 20% implementation.
- **The honest baseline table.** Real vs simulated, from section 3.
- **Three short demos.** Shashwat: one node killed and votes still finalise, and a repeated nullifier rejected. Anushka: a real proof verified and a repeat vote rejected. Arnav: a signed EPIC accepted and a forged one rejected, and duress that no longer changes the tally.
- **The roadmap.** Show the milestones table (section 8.1) so the reviewer sees what will be shown at each future review.
- **Known limits.** Say the Paillier issue out loud. Raising it yourselves looks better than being asked.

# 11\. Workload and capacity

## 11.1 Effort by person

| **Person** | **Core points** | **Extra points** | **Core hours (4 per point)** | **Core hours per week to May 2027 (30 weeks)** |
| ---------- | --------------- | ---------------- | ---------------------------- | ---------------------------------------------- |
| Shashwat   | 55.5            | 23               | 222                          | 7.4                                            |
| Anushka    | 60              | 15               | 240                          | 8                                              |
| Arnav      | 58.5            | 12               | 234                          | 7.8                                            |

_Shared tasks marked All (final report, demo preparation, cross security review and so on) are not included above and add roughly 3 to 4 points per person. Hours per point are an assumption; adjust them after your first two weeks of real data._

## 11.2 Core effort by phase

| **Person** | **Phase 0** | **Phase 1** | **Phase 2** | **Phase 3** | **Phase 4** |
| ---------- | ----------- | ----------- | ----------- | ----------- | ----------- |
| Shashwat   | 9           | 10          | 20          | 16.5        | 0           |
| Anushka    | 7           | 13.5        | 20          | 19.5        | 0           |
| Arnav      | 7           | 13.5        | 17          | 15          | 6           |

Phase 0 is one week, Phase 1 is 4 weeks, Phase 2 is 8 weeks, Phase 3 and Phase 4 are about 8 and 13 weeks. Peaks (Phase 0 and Phase 2) are where the extra Stretch and Extra tasks should not be added.

## 11.3 How to use this much work

- Core is the commitment. If each person gives about 8 hours a week, Core fits with little spare room, so protect that time.
- Extra tasks are for when you are ahead or someone has a free week. Drop them first if exams or delays hit. Never drop a Core task to make room for an Extra one.
- Each person picks at most one Extra task at a time and only after their current phase's Core tasks are done.
- Every task has one owner and one reviewer, so nobody carries a gap alone; crypto tasks always get a second reader.
- Use a shared task board with owner, size, phase and priority on every card, and one 30-minute sync a week.
- Every task has a "done" definition, such as "benchmark number reported" or "demo runs from a clean clone".
- Re-check the sizes and phase dates at the end of Phase 1, when you will know how fast you really work.

# 12\. Risks

| **Risk**                                                                   | **Impact**                | **Mitigation**                                                                          |
| -------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------- |
| The Core backlog uses most of the available hours; Extra tasks may not fit | Core tasks slip           | Do Core first; re-estimate at the end of Phase 1; drop Extra tasks before Core ones     |
| Library setup (liboqs, OpenFHE/SEAL, snarkjs) takes longer than expected   | Delays Gaps 3, 4, 5       | Spike each library in week 1; fall back to a smaller parameter set or a documented mock |
| Findings in this document are from reading code, not running it            | Wrong baseline            | Each owner confirms their rows by running the code on Day 1                             |
| Secure hardware unavailable for the offline lock                           | Gap 1 offline path weaker | Simulate with a software or TPM emulator and state the limitation                       |
| Crypto work concentrated on one person                                     | Bottleneck                | Reviewer on every crypto task; Shashwat handles deployment and verification services    |
| Scope creep across five gaps                                               | Nothing finished          | Finish one measurable result per gap before extras; keep non-goals fixed                |
| Exams and other coursework                                                 | Missed deadlines          | 20% buffer; sizes reviewed at the weekly sync                                           |
| Reviewers challenge "quantum-safe" or "BFT" claims                         | Credibility               | Publish the scope statement early; do not call the simulated parts real                 |
| Temporary decoy flag leaks which votes are decoys                          | Weakens Gap 2 until T16   | Label as temporary; replace once the decoy design is decided                            |

# 13\. Open questions

- Date and format of the review, and what the rubric rewards.
- When the semester ends, so phase weeks can become calendar dates.
- How the pot14_final.ptau was generated (single contributor or a public ceremony file)?
- Does the guide approve replacing Paillier with a lattice-based scheme?
- Is any secure hardware (TPM or similar) available for the offline path?
- Which candidate count should the circuit, tally and UI standardise on?

# 14\. References (from the gap analysis)

- Kimura et al. (2025), "Anywhere Voting: A Case Study of Brazil" (Gap 1)
- Chaum et al. (2025), "Revisiting Silent Coercion" (Gap 2)
- Kagai et al. (2025), "Harvest-Now, Decrypt-Later: A Temporal Cybersecurity Risk" (Gap 3)
- Tejedor-Romero et al. (2021), "Distributed Remote E-Voting via Shamir's Secret Sharing" (Gap 3)
- ElSheikh and Youssef (2022), "Dispute-free Scalable Open Vote Network using zk-SNARKs" (Gap 4)
- Sangraula et al. (2025), "Zero Knowledge Proof on Top of Blockchain for E-Voting" (Gap 4)
- Alsuwat (2026), "Secure E-Voting with Dilithium Authentication and ZKP Verification" (Gap 5, closest related work)