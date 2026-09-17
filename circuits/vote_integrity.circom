pragma circom 2.0.0;

// Verifies that the voter selected exactly one candidate (one-hot encoding)
template VoteIntegrity(numCandidates) {
    signal input candidateSelection[numCandidates];

    signal sum[numCandidates + 1];
    sum[0] <== 0;

    for (var i = 0; i < numCandidates; i++) {
        // Ensure each selection is 0 or 1
        candidateSelection[i] * (candidateSelection[i] - 1) === 0;
        sum[i + 1] <== sum[i] + candidateSelection[i];
    }

    // Ensure exactly 1 candidate was selected
    sum[numCandidates] === 1;
}
