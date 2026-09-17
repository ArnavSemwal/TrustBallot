// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./KioskRegistry.sol";
import "./PlonkVerifier.sol";

/**
 * @title TrustBallot
 * @dev Main contract for handling votes, ZKP verification, and nullifiers.
 */
contract TrustBallot {
    KioskRegistry public kioskRegistry;
    PlonkVerifier public plonkVerifier;
    
    // Mapping to track spent nullifiers per election
    mapping(uint256 => mapping(uint256 => bool)) public spentNullifiers;
    
    event VoteAccepted(uint256 indexed electionId, uint256 nullifier);
    event VoteRejected(uint256 indexed electionId, string reason);

    constructor(address _kioskRegistryAddress, address _plonkVerifierAddress) {
        kioskRegistry = KioskRegistry(_kioskRegistryAddress);
        plonkVerifier = PlonkVerifier(_plonkVerifierAddress);
    }

    /**
     * @dev Submit a vote payload.
     * @param kioskId The ID of the kiosk submitting the vote.
     * @param electionId The ID of the election.
     * @param nullifier The ZKP-derived nullifier to prevent double voting.
     * @param ciphertextVote The homomorphically encrypted vote payload.
     * @param zkpProof The PLONK proof (mocked as bytes for MVP scaffold).
     * @param dilithiumSignature The post-quantum signature (mocked as bytes for MVP).
     */
    function submitVote(
        string memory kioskId,
        uint256 electionId,
        uint256 nullifier,
        bytes memory ciphertextVote,
        uint256[24] calldata zkpProof,
        bytes memory dilithiumSignature
    ) external {
        // 1. Verify Kiosk Registration
        if (!kioskRegistry.isKioskRegistered(kioskId)) {
            emit VoteRejected(electionId, "unregistered_kiosk");
            return;
        }

        // 2. Verify Dilithium Signature
        // NOTE: Stubbed for MVP. Would integrate with an oracle or custom precompile.
        if (!verifyDilithium(dilithiumSignature, kioskId)) {
            emit VoteRejected(electionId, "invalid_signature");
            return;
        }

        // 3. Verify ZKP (PLONK)
        uint256[3] memory pubSignals;
        pubSignals[0] = nullifier;
        pubSignals[1] = 0; // root (in a full implementation, retrieve from state)
        pubSignals[2] = electionId;
        
        if (!plonkVerifier.verifyProof(zkpProof, pubSignals)) {
            emit VoteRejected(electionId, "invalid_zkp");
            return;
        }

        // 4. Nullifier Check
        if (spentNullifiers[electionId][nullifier]) {
            emit VoteRejected(electionId, "duplicate_nullifier");
            return;
        }

        // 5. Append to Ledger and mark nullifier as spent
        spentNullifiers[electionId][nullifier] = true;
        // In a real implementation, ciphertextVote is appended to an event log or state array
        
        emit VoteAccepted(electionId, nullifier);
    }

    // --- Stubbed verification functions for MVP ---
    function verifyDilithium(bytes memory /* signature */, string memory /* kioskId */) internal pure returns (bool) {
        return true;
    }
}
