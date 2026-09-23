# TrustBallot — Design Specification
**Version 1.1**

Revision note: fixes language-count mismatch (locked to 2, matching PRD scope), adds error/retry state, adds candidate-grid pagination for large constituencies, adds Phase 0 kiosk-trust indicator note.

## 1. Design Principles
- Zero-literacy-barrier: symbol-first, minimal text, large touch targets.
- Trust-signaling: visible (but non-compromising) progress indicators so voters feel the system "worked" without exposing choice.
- Speed: total kiosk interaction target under 3 minutes, **including constituencies with 15–30+ candidates**.
- Discreet coercion resistance: Duress PIN must look and feel identical to the standard flow.
- **Graceful failure:** every rejection state (bad scan, contract rejection, duplicate nullifier) must have a defined, calm UI response — never a silent hang or crash.

## 2. Brand Style Guide
- **Palette:** Deep navy (#0B2447), saffron accent (#F2A007), white (#FFFFFF), success green (#1E8E3E), alert red (#D93025) — evokes civic/institutional trust without using official ECI branding.
- **Typography:** Noto Sans (supports all major Indian scripts) for UI text; large 24–32px base size for kiosk readability.
- **Iconography:** Election Commission-style ballot/symbol icons, high-contrast, colorblind-safe.

## 3. User Flow (Kiosk Voting Journey)
1. **Welcome screen** — language selector (icon + text, **2 languages, fixed for MVP** — matches PRD scope; was previously mismatched at 8–10 in v1.0).
2. **Credential scan** — EPIC QR scan animation; live face-match overlay with camera guide frame. *(Face-match is a stubbed pass/fail toggle for MVP demo — see TRD §1.)*
3. **PIN entry** — standard PIN or Duress PIN (visually identical numeric keypad).
4. **Constituency confirmation** — auto-populated from EPIC; large confirm/edit buttons.
5. **Candidate selection** — symbol + photo + name grid, one-hot selection, single confirm step. **2-column grid with vertical scroll/pagination for constituencies exceeding ~10 candidates**, tested up to 30 candidates for the <3-min target.
6. **Review screen** — shows selected symbol only (no ballot ID/hash shown, to avoid coercion-proof issues). *Note: this is a deliberate tradeoff against full receipt-based verifiability — see PRD Risks §8.8.*
7. **Cast confirmation** — "Vote Cast" animation (identical for real and duress-flagged votes).
   **7a. Rejection state (new):** if the smart contract returns a rejection (duplicate nullifier, failed ZKP, network drop mid-submission), the kiosk shows a calm, symbol-based "Something went wrong — please try again" screen with a single retry CTA. Does not reveal the technical reason (avoids leaking state to a coercer watching over the voter's shoulder). Retry re-enters the flow at step 2.
8. **Exit / session wipe** — auto-clears local session data.

## 4. Wireframe Notes (text description — build in Figma)
- **Welcome:** centered logo, **2-language toggle** (not a 3x3 grid), "Start" CTA bottom-fixed.
- **Scan:** full-screen camera viewport, scan-line animation, cancel button top-left.
- **Candidate grid:** 2-column card grid, party symbol dominant (60% of card), name below in voter's selected language, **scroll indicator visible when candidate count exceeds one screen**.
- **Confirmation modal:** single candidate symbol, Yes/Back buttons, no countdown timer (avoid rushing voters).
- **Rejection modal (new):** single warning icon, one-line symbol-paired message, single "Try Again" button — styled distinctly from the Duress flow so it can't be mistaken for it, but still non-alarming.

## 5. Accessibility Requirements
- WCAG AA contrast minimum.
- Full symbol redundancy for every text label (no text-only screens).
- Adjustable font scaling (kiosk hardware permitting).
- Audio-assist toggle (future feature, not MVP).

## 6. Admin/Audit Dashboard (P2 feature)
- Node status panel (4 consortium nodes: up/down, last block signed) — reflects nodes running on **separate instances** (TRD §5), so this panel is meaningful during the live failure demo.
- Nullifier ledger explorer (hash-only view, no PII).
- Disputed Vote queue for manual ECI review — **procedural resolution only**; no biometric data available (purged post-scan by design, see TRD §6).

## 7. Design Ownership
- Arnav owns wireframes, UI component library, kiosk visual flow, and the new rejection/retry state.
- Anushka and Shashwat review flows where cryptographic/consensus states must be surfaced (e.g., "Vote Cast" only fires after contract confirmation, not optimistically; rejection state only fires after an actual contract-level rejection, not a client-side guess).
