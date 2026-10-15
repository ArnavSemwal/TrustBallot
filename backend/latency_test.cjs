const crypto = require('crypto');

// Configuration
const TARGET_NODE = 'http://localhost:3000';
const TOTAL_VOTES = 100; // Simulating 100 simultaneous voters

async function runBenchmark() {
    console.log(`Starting latency benchmark: Sending ${TOTAL_VOTES} votes to ${TARGET_NODE}...`);
    
    const votes = [];
    // Generate fake votes
    for (let i = 0; i < TOTAL_VOTES; i++) {
        votes.push({
            voter_id: `voter_${i}`,
            nullifier: crypto.randomBytes(16).toString('hex'),
            kiosk_id: 'benchmark_kiosk_1',
            encrypted_choice: 'candidate_A'
        });
    }

    // Start the stopwatch
    const startTime = Date.now();

    // Send all votes at the exact same time
    const requests = votes.map(vote => 
        fetch(`${TARGET_NODE}/add_vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vote)
        })
        .then(res => res.status)
        .catch(err => 500)
    );

    // Wait for all requests to finish processing
    const results = await Promise.all(requests);
    
    // Stop the stopwatch
    const endTime = Date.now();
    const totalTimeMs = endTime - startTime;
    
    // Calculate successes and failures
    const successfulVotes = results.filter(status => status === 200).length;
    const failedVotes = results.length - successfulVotes;

    console.log(`\n--- BENCHMARK RESULTS ---`);
    console.log(`Total Time Taken : ${totalTimeMs} ms`);
    console.log(`Average Latency  : ${(totalTimeMs / TOTAL_VOTES).toFixed(2)} ms per vote`);
    console.log(`Successful Votes : ${successfulVotes}`);
    console.log(`Failed Votes     : ${failedVotes}`);
}

runBenchmark();