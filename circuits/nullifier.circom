pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

// Derives a nullifier from the voter's private credential and the election_id
// nullifier = Hash(private_credential || election_id)
template NullifierDerivation() {
    signal input privateCredential;
    signal input electionId;
    signal output nullifier;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== privateCredential;
    hasher.inputs[1] <== electionId;

    nullifier <== hasher.out;
}
