pragma circom 2.0.0;

include "merkle_membership.circom";
include "nullifier.circom";
include "vote_integrity.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template TrustBallotMain(levels, numCandidates) {
    // Public Inputs
    signal input root;
    signal input electionId;

    // Private Inputs
    signal input privateCredential;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal input candidateSelection[numCandidates];

    // Outputs
    signal output nullifier;

    // 1. Verify Merkle Membership
    // Credential is Hash(privateCredential)
    component credHasher = Poseidon(1);
    credHasher.inputs[0] <== privateCredential;

    component merkle = MerkleMembership(levels);
    merkle.leaf <== credHasher.out;
    merkle.root <== root;
    for (var i = 0; i < levels; i++) {
        merkle.pathElements[i] <== pathElements[i];
        merkle.pathIndices[i] <== pathIndices[i];
    }

    // 2. Nullifier Derivation
    component nullifierGen = NullifierDerivation();
    nullifierGen.privateCredential <== privateCredential;
    nullifierGen.electionId <== electionId;
    nullifier <== nullifierGen.nullifier;

    // 3. Vote Integrity (One-hot selection)
    component integrity = VoteIntegrity(numCandidates);
    for (var i = 0; i < numCandidates; i++) {
        integrity.candidateSelection[i] <== candidateSelection[i];
    }
}

component main {public [root, electionId]} = TrustBallotMain(20, 5);
