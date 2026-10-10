# TrustBallot Usability Test Plan (Phase 4)

**Owner:** Arnav (Frontend/UX & Middleware)
**Goal:** Verify that a low-literacy migrant worker can complete a secure vote using the kiosk in under 3 minutes, even with 15 to 30 candidates on the ballot.

## 1. Objectives

1. **Time-to-Vote:** Measure the average time from presenting the EPIC/QR code to receiving the final success screen and tracker ID. Target is < 3 minutes.
2. **Task Completion Rate:** Measure the percentage of users who successfully cast a vote without critical intervention.
3. **Error Rate:** Track the number of mis-taps, language toggles, or confusion points (e.g., struggling with the scanner, PIN entry, or review screen).
4. **Duress Comprehension:** For a subset of users, simulate a coercion scenario and evaluate if they understand how to use the 9999 Duress PIN and whether they felt their real vote was protected.

## 2. Participant Profile

* **Target Audience:** Migrant workers or individuals simulating low-literacy environments.
* **Sample Size:** 10-15 participants for qualitative feedback; 30+ for statistically significant timing.
* **Languages:** Hindi and English speakers.

## 3. Test Environment & Setup

* **Hardware:** A physical kiosk setup with a touch screen and a simulated webcam/QR scanner (tablet or laptop with a forward-facing camera).
* **Ballot Configuration:** A ballot populated with 15 to 30 candidates. We will use generic party symbols and dummy candidate names to prevent bias.
* **Network:** Standard 4G connection simulating field conditions, with potential throttling to test offline/retry UX states.

## 4. Test Scenarios

### Scenario A: Standard Vote
1. User approaches kiosk.
2. User selects preferred language (Hindi/English).
3. User scans a dummy EPIC QR code.
4. User enters their 4-digit PIN.
5. User navigates a ballot of 15-30 candidates and selects one.
6. User reviews the selection on the digital VVPAT screen.
7. User confirms the vote and receives the final success screen.

### Scenario B: Duress Vote
1. User is given a prompt: "Someone is watching you and forcing you to vote for Candidate X. You want to vote for Candidate Y. Use the Duress PIN (9999) to protect your real vote."
2. User proceeds through the flow.
3. User enters 9999 instead of their real PIN.
4. User selects Candidate X on the screen.
5. System processes the decoy, while the real vote for Candidate Y is queued silently.

## 5. Metrics to Capture

* **Time (Seconds):** Auth step, Ballot selection, Review step, Processing time.
* **System Usability Scale (SUS):** A simplified, 5-question oral survey post-test to gauge perceived ease of use.
* **Observation Notes:** Hesitations, confusion with UI elements (e.g., "Cancel" vs "Confirm" colors), and QR scanning difficulties.

## 6. Success Criteria

* 80%+ of participants complete the standard vote in under 3 minutes.
* 90%+ task completion rate without needing assistance.
* Positive feedback on the audio prompts and symbol visibility.
