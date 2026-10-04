const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

// Task B1: Use environment variables instead of hardcoded values
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || 'votes.json';
const PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];

// Task B3: Exact hash set to stop double voting
const seenNullifiers = new Set();

// Create the data file if it doesn't exist yet
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Endpoint for nodes to acknowledge a peer's vote
app.post('/consensus', (req, res) => {
    const vote = req.body;
    if (seenNullifiers.has(vote.nullifier)) {
        console.log(`[Node ${PORT}] Rejecting consensus: Nullifier ${vote.nullifier} already seen.`);
        return res.status(400).json({ error: "Nullifier already seen by this node." });
    }
    seenNullifiers.add(vote.nullifier);
    res.status(200).send("Acknowledged");
});

// Endpoint for the kiosk to submit a vote
app.post('/add_vote', async (req, res) => {
    const vote = req.body;

    // 1. Check for Double Voting
    if (seenNullifiers.has(vote.nullifier)) {
        console.log(`[Node ${PORT}] Rejected duplicate nullifier: ${vote.nullifier}`);
        return res.status(400).json({ error: "Double vote detected. Nullifier rejected." });
    }
    
    // Temporarily add it to the set while checking consensus
    seenNullifiers.add(vote.nullifier);

    // 2. Task B2: 3-of-4 Peer Consensus
    let acknowledgements = 1; // The node counts itself
    
    console.log(`[Node ${PORT}] Asking peers for consensus...`);
    const peerRequests = PEERS.map(peerUrl => 
        fetch(`${peerUrl}/consensus`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vote)
        })
        .then(response => response.ok ? 1 : 0)
        .catch(err => 0) // Treat unreachable nodes as 0
    );

    // Wait for all peers to reply
    const results = await Promise.all(peerRequests);
    acknowledgements += results.reduce((sum, count) => sum + count, 0);

    // 3. Finalize the vote only if 3 out of 4 agree
    if (acknowledgements >= 3) {
        console.log(`[Node ${PORT}] Consensus reached (${acknowledgements}/4). Saving vote.`);
        const currentVotes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        currentVotes.push(vote);
        fs.writeFileSync(DATA_FILE, JSON.stringify(currentVotes, null, 2));
        
        return res.status(200).json({ message: "Vote finalized with 3-of-4 consensus." });
    } else {
        console.log(`[Node ${PORT}] Consensus failed (${acknowledgements}/4).`);
        seenNullifiers.delete(vote.nullifier); // Rollback
        return res.status(500).json({ error: "Consensus failed. Vote not finalized." });
    }
});

app.listen(PORT, () => {
    console.log(`BFT Node running on port ${PORT}, writing to ${DATA_FILE}`);
});