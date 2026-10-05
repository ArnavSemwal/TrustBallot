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
    
    enum ElectionState { None, Created, Open, Closed, Tallied }
    mapping(uint256 => ElectionState) public electionStates;
    
    // Mapping to track spent nullifiers per election
    mapping(uint256 => mapping(uint256 => bool)) public spentNullifiers;
    // Mapping to store ciphertext hashes
    mapping(uint256 => mapping(uint256 => bytes32)) public voteHashes;
    
    address public admin;

    event ElectionStateChanged(uint256 indexed electionId, ElectionState state);
    event VoteAccepted(uint256 indexed electionId, uint256 nullifier, bytes32 ciphertextHash);
    event VoteRejected(uint256 indexed electionId, string reason);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor(address _kioskRegistryAddress, address _plonkVerifierAddress) {
        kioskRegistry = KioskRegistry(_kioskRegistryAddress);
        plonkVerifier = PlonkVerifier(_plonkVerifierAddress);
        admin = msg.sender;
    }

    function setElectionState(uint256 electionId, ElectionState state) external onlyAdmin {
        electionStates[electionId] = state;
        emit ElectionStateChanged(electionId, state);
    }

    /**
     * @dev Submit a vote payload.
     */
    function submitVote(
        string memory kioskId,
        uint256 electionId,
        uint256 nullifier,
        bytes memory ciphertextVote,
        uint256[24] calldata zkpProof,
        bytes memory dilithiumSignature
    ) external {
        // 0. Check Election State
        if (electionStates[electionId] != ElectionState.Open) {
            emit VoteRejected(electionId, "election_not_open");
            return;
        }

        // 1. Verify Kiosk Registration and Caller Binding
        if (!kioskRegistry.isKioskRegistered(kioskId)) {
            emit VoteRejected(electionId, "unregistered_kiosk");
            return;
        }
        if (msg.sender != kioskRegistry.kioskAddresses(kioskId)) {
            emit VoteRejected(electionId, "unauthorized_caller");
            return;
        }

        // 2. Nullifier Check (Cheap check before ZKP)
        if (spentNullifiers[electionId][nullifier]) {
            emit VoteRejected(electionId, "duplicate_nullifier");
            return;
        }

        // 3. Verify Dilithium Signature
        if (!verifyDilithium(dilithiumSignature, kioskId)) {
            emit VoteRejected(electionId, "invalid_signature");
            return;
        }

        // 4. Verify ZKP (PLONK)
        uint256[3] memory pubSignals;
        pubSignals[0] = nullifier;
        pubSignals[1] = 0x0ca55fb6a1f41355504f9d81d976049f897794972591943d5408f3f60644f024; // root
        pubSignals[2] = electionId;
        
        if (!plonkVerifier.verifyProof(zkpProof, pubSignals)) {
            emit VoteRejected(electionId, "invalid_zkp");
            return;
        }

        // 5. Append to Ledger and mark nullifier as spent
        spentNullifiers[electionId][nullifier] = true;
        bytes32 ciphertextHash = keccak256(ciphertextVote);
        voteHashes[electionId][nullifier] = ciphertextHash;
        
        emit VoteAccepted(electionId, nullifier, ciphertextHash);
    }

    // --- Stubbed verification functions for MVP ---
    function verifyDilithium(bytes memory /* signature */, string memory /* kioskId */) internal pure returns (bool) {
        return true;
    }
}
