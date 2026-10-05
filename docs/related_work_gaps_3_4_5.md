# Related Work Write-up (Anushka) [X9]

## Gap 3: Long-term Ballot Secrecy & Verifiable Tallying
- **Paper 1 (Belenios/Helios):** Classical e-voting schemes like Helios and Belenios rely heavily on ElGamal encryption and homomorphic tallying to guarantee privacy. However, they place absolute trust in the decryption authorities; if the threshold of authorities is compromised, individual votes can be decrypted. TrustBallot v3.0 mitigates this by abstracting the identity completely via ZKPs before the encryption phase, meaning even if the tally authorities collude to decrypt a single payload, they only uncover a random nullifier, not the voter's identity.
- **Paper 2 (Civitas):** Civitas improves upon Helios by providing coercion resistance through credential revocation. Still, it relies on standard asymmetric cryptography that is vulnerable to future quantum attacks, whereas TrustBallot directly introduces post-quantum homomorphic encryption.

## Gap 4: Coercion Resistance & Duress Handling
- **Paper 1 (JCJ/Civitas Coercion Resistance):** The Juels-Catalano-Jakobsson (JCJ) scheme introduces the concept of fake credentials and voting multiple times to deceive a coercer. While theoretically sound, implementing JCJ requires immense computational overhead on the tallying authorities to weed out fake votes.
- **Paper 2 (Caveat Coercitor):** This work utilizes decoy keys and plausibly deniable encryption to allow voters to hand over fake keys to an attacker. TrustBallot adopts a similar philosophy through a "Duress PIN" that burns the credential nullifier and registers a zero-vote, ensuring the coercer sees a successful transaction without corrupting the final tally.

## Gap 5: Post-Quantum Resilience
- **Paper 1 (Post-Quantum Voting Schemes):** Recent proposals for post-quantum voting systems often utilize hash-based signatures or early lattice assumptions, but struggle with the size of the proofs and the lack of efficient on-chain verification.
- **Paper 2 (Lattice-based Homomorphic Encryption in Voting):** Research into using BGV/BFV for e-voting has shown promise for post-quantum security. TrustBallot v3.0 practicalizes this by replacing Paillier with a Ring-LWE scheme and securing the transport layer with Dilithium signatures, acknowledging that while the ZKP (PLONK) currently remains classical, the persistent data (the ballot itself) is secured against "Harvest Now, Decrypt Later" attacks.
