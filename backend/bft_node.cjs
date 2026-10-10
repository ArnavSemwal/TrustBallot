const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const lockfile = require('proper-lockfile'); // Task B17: Imported the lockfile library
const app = express();

app.use(express.json());

// Task B1: Use environment variables instead of hardcoded values
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || 'votes.json';
const PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];

// Task B4: Generate ECDSA keypair for node-to-node authentication
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
console.log(`[Node ${PORT}] Security keys generated.`);

// Task B3: Exact hash set to stop double voting
const seenNullifiers = new Set();

// Create the data file if it doesn't exist yet
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// --- Task B17-B27: Leader Failover & Heartbeat Logic ---
let isLeader = (PORT === '3000' || PORT === 3000); // Default to port 3000 as initial leader
let lastHeartbeat = Date.now();

// Endpoint for followers to receive heartbeats from the leader
app.post('/heartbeat', (req, res) => {
    lastHeartbeat = Date.now();
    isLeader = false; // We received a ping, meaning someone else is the active leader
    res.status(200).send("Alive");
});

// Background process running every 2 seconds to manage network health
setInterval(() => {
    if (isLeader) {
        // If this node is the leader, broadcast heartbeats to all peers
        PEERS.forEach(peerUrl => {
            fetch(`${peerUrl}/heartbeat`, { method: 'POST' }).catch(() => {});
        });
    } else {
        // If this node is a follower, check if the leader went offline (5 second timeout)
        if (Date.now() - lastHeartbeat > 5000) {
            console.log(`[Node ${PORT}] WARNING: Leader timed out! Taking over as new leader...`);
            isLeader = true; // Claim leadership to keep the network alive
            lastHeartbeat = Date.now();
        }
    }
}, 2000);
// -------------------------------------------------------

// Endpoint for nodes to acknowledge a peer's vote
app.post('/consensus', (req, res) => {
    const vote = req.body;
    
    // Task B4: Verify the cryptograpic signature of the incoming node message
    const peerPubKey = req.headers['x-node-pubkey'];
    const signature = req.headers['x-node-signature'];
    
    if (!peerPubKey || !signature) {
        console.log(`[Node ${PORT}] Rejecting consensus: Missing security headers.`);
        return res.status(401).json({ error: "Unauthorized. Missing signature." });
    }
    
    try {
        const payloadStr = JSON.stringify(vote);
        const isValid = crypto.verify(
            'sha256', 
            Buffer.from(payloadStr), 
            peerPubKey, 
            Buffer.from(signature, 'hex')
        );
        
        if (!isValid) {
            console.log(`[Node ${PORT}] Rejecting consensus: Invalid cryptographic signature.`);
            return res.status(401).json({ error: "Unauthorized. Invalid signature." });
        }
    } catch (e) {
        return res.status(401).json({ error: "Cryptographic error processing signature." });
    }

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
    
    // Task B4: Cryptographically sign the message payload before sending it to peers
    const payloadStr = JSON.stringify(vote);
    const signature = crypto.sign('sha256', Buffer.from(payloadStr), privateKey).toString('hex');
    
    const peerRequests = PEERS.map(peerUrl => 
        fetch(`${peerUrl}/consensus`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-node-pubkey': publicKey,
                'x-node-signature': signature
            },
            body: payloadStr
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
        
        // Task B17: Offline Local Locks
        let release;
        try {
            release = await lockfile.lock(DATA_FILE, { retries: 5 });
            
            const currentVotes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            
            // Task B5: Append-only hash chain implementation
            const previousHash = currentVotes.length > 0 ? currentVotes[currentVotes.length - 1].hash : "0000000000000000000000000000000000000000000000000000000000000000";
            const currentHash = crypto.createHash('sha256').update(previousHash + JSON.stringify(vote)).digest('hex');
            
            const securedVote = { ...vote, hash: currentHash, previous_hash: previousHash };
            currentVotes.push(securedVote);
            
            fs.writeFileSync(DATA_FILE, JSON.stringify(currentVotes, null, 2));
            
            await release(); // Unlock
            return res.status(200).json({ message: "Vote finalized with 3-of-4 consensus." });
            
        } catch (error) {
            console.error(`[Node ${PORT}] File system busy. Could not save vote safely.`, error);
            if (release) await release();
            seenNullifiers.delete(vote.nullifier);
            return res.status(500).json({ error: "System busy. Could not acquire local lock." });
        }
        
    } else {
        console.log(`[Node ${PORT}] Consensus failed (${acknowledgements}/4).`);
        seenNullifiers.delete(vote.nullifier); // Rollback
        return res.status(500).json({ error: "Consensus failed. Vote not finalized." });
    }
});

app.listen(PORT, () => {
    console.log(`BFT Node running on port ${PORT}, writing to ${DATA_FILE}`);
});