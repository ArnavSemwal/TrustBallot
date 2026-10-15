pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "merkle_membership.circom";
include "nullifier.circom";

/**
 * TrustBallot Credential Nullification & Revocation Circuit (C16)
 * Proves that a voter possesses the private credential in the voter roll
 * and derives the target election nullifier for emergency revocation/quarantine
 * without revealing the voter's identity or ballot.
 */
template CredentialNullification(levels) {
    // Public Inputs
    signal input root;
    signal input electionId;
    signal input revocationNonce; // Prevents replay of revocation request

    // Private Inputs
    signal input privateCredential;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // Public Outputs
    signal output nullifier;
    signal output revocationTag;

    // 1. Verify Voter Roll Merkle Membership
    component credHasher = Poseidon(1);
    credHasher.inputs[0] <== privateCredential;

    component merkle = MerkleMembership(levels);
    merkle.leaf <== credHasher.out;
    merkle.root <== root;
    for (var i = 0; i < levels; i++) {
        merkle.pathElements[i] <== pathElements[i];
        merkle.pathIndices[i] <== pathIndices[i];
    }

    // 2. Derive Standard Ballot Nullifier (to block/quarantine it on contract)
    component nullifierGen = NullifierDerivation();
    nullifierGen.privateCredential <== privateCredential;
    nullifierGen.electionId <== electionId;
    nullifier <== nullifierGen.nullifier;

    // 3. Derive Revocation Tag (binding to nonce)
    component tagHasher = Poseidon(2);
    tagHasher.inputs[0] <== privateCredential;
    tagHasher.inputs[1] <== revocationNonce;
    revocationTag <== tagHasher.out;
}

component main {public [root, electionId, revocationNonce]} = CredentialNullification(20);
