# Phase 0 Review: Real vs. Simulated Baseline

*Use this table directly in your presentation slides to show the reviewers exactly what is functional today vs what is a placeholder for future phases.*

| Component | Status | What exists right now (Phase 0) | Planned for Phase 1 & 2 |
| :--- | :--- | :--- | :--- |
| **Kiosk UI Flow** | 🟢 **Real** | Full screens, 2 languages, session timeout, symbol navigation. | Add accessibility features (audio prompts). |
| **Batch & Shuffle** | 🟢 **Real** | Votes are pooled, batch flushed, and shuffled using a cryptographically secure Fisher-Yates algorithm (`crypto.getRandomValues`). | Expand batch size to 50-100 votes with a 2-hour flush window. |
| **Duress PIN (Coercion)** | 🟡 **Partial** | PIN `9999` triggers silent duress. UI remains identical. Fake votes are safely flagged (`isDecoy`) so the Tally Server drops them. | Implement cryptographically secure zero-vote decoys (no flags). |
| **EPIC / Auth Check** | 🟡 **Partial** | Real PIN check is enforced. `verifyEpicSignature` cryptography logic is hooked up to dummy payloads to prove integration. | Real QR code scanning of EPIC cards. |
| **Vote Encryption** | 🔴 **Simulated** | Votes are currently sent as plaintext candidate IDs to the backend (or encrypted by the server, not the kiosk). | Kiosk-side post-quantum encryption before leaving the device. |
| **Zero-Knowledge Proofs**| 🔴 **Missing** | No ZKP generation exists on the kiosk. | Generate `snarkjs` proofs directly in the browser (Phase 3). |

### Speaking Notes for Arnav:
*   **"We fixed the Duress leak."** - Explain how previously, the duress PIN was accidentally corrupting the election by voting for candidate 1 and 5. We fixed this by flagging decoy traffic, ensuring the backend drops it without changing the tally.
*   **"We secured the shuffle."** - Explain how using `Math.random()` to shuffle votes allows hackers to de-anonymize the vote batch, so you upgraded the kiosk to use a true cryptographic Fisher-Yates shuffle.
*   **"We are ready for the backend."** - Explain how you built a strict JSON Payload Specification (Task R1) and made environment URLs dynamic, meaning the Kiosk is now 100% ready to plug into Shashwat's real nodes as soon as he deploys them.
