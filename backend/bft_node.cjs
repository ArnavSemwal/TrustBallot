const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const lockfile = require('proper-lockfile');
const rateLimit = require('express-rate-limit');
const { MerkleTree } = require('merkletreejs'); // Task B17
const keccak256 = require('keccak256');         // Task B17
const app = express();

app.use(express.json({ limit: '50kb' }));

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || 'votes.json';
const PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];

// Task B16 & B17: Election Lifecycle State
let electionState = 'CREATED'; // States: CREATED, OPEN, CLOSED, TALLY
let currentMerkleRoot = null;

// Chaos Middleware
app.use((req, res, next) => {
    if (req.headers['x-simulate-drop']) {
        return res.status(500).json({ error: "Simulated network drop." });
    }
    if (req.headers['x-simulate-delay']) {
        const delay = parseInt(req.headers['x-simulate-delay'], 10) || 3000;
        return setTimeout(next, delay);
    }
    next();
});

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
console.log(`[Node ${PORT}] Security keys generated.`);

const seenNullifiers = new Set();

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

let isLeader = (PORT === '3000' || PORT === 3000);
let lastHeartbeat = Date.now();

app.post('/heartbeat', (req, res) => {
    lastHeartbeat = Date.now();
    isLeader = false;
    res.status(200).send("Alive");
});

setInterval(() => {
    if (isLeader) {
        PEERS.forEach(peerUrl => fetch(`${peerUrl}/heartbeat`, { method: 'POST' }).catch(() => {}));
    } else {
        if (Date.now() - lastHeartbeat > 5000) {
            isLeader = true;
            lastHeartbeat = Date.now();
        }
    }
}, 2000);

// Task B16 & B17: Election Lifecycle APIs
app.post('/api/election/open', (req, res) => {
    const { registered_voters } = req.body;
    if (!registered_voters || !Array.isArray(registered_voters)) {
        return res.status(400).json({ error: "Provide an array of registered_voters." });
    }
    
    // Build the Merkle Tree for the registered voters
    const leaves = registered_voters.map(voter => keccak256(voter));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    
    currentMerkleRoot = tree.getHexRoot();
    electionState = 'OPEN';
    
    res.json({ message: "Election opened.", merkleRoot: currentMerkleRoot, state: electionState });
});

app.post('/api/election/close', (req, res) => {
    electionState = 'CLOSED';
    res.json({ message: "Election closed.", state: electionState });
});

app.post('/api/election/tally', (req, res) => {
    electionState = 'TALLY';
    res.json({ message: "Election moved to tally phase.", state: electionState });
});

app.get('/api/election/status', (req, res) => {
    res.json({ state: electionState, merkleRoot: currentMerkleRoot });
});

app.post('/consensus', (req, res) => {
    const vote = req.body;
    
    const rawPubKey = req.headers['x-node-pubkey'];
    const peerPubKey = rawPubKey ? Buffer.from(rawPubKey, 'base64').toString('utf8') : null;
    const signature = req.headers['x-node-signature'];
    
    if (!peerPubKey || !signature) return res.status(401).json({ error: "Missing security headers." });
    
    try {
        const payloadStr = JSON.stringify(vote);
        const isValid = crypto.verify('sha256', Buffer.from(payloadStr), peerPubKey, Buffer.from(signature, 'hex'));
        if (!isValid) return res.status(401).json({ error: "Invalid signature." });
    } catch (e) {
        return res.status(401).json({ error: "Cryptographic error." });
    }

    if (seenNullifiers.has(vote.nullifier)) return res.status(400).json({ error: "Nullifier already seen." });
    seenNullifiers.add(vote.nullifier);
    res.status(200).send("Acknowledged");
});

const voteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests. Please try again later." }
});

app.post('/add_vote', voteLimiter, async (req, res) => {
    // Task B16: Reject votes if the election is not OPEN
    if (electionState !== 'OPEN') {
        return res.status(403).json({ error: `Election is currently ${electionState}. Votes are only accepted during the OPEN phase.` });
    }

    const vote = req.body;

    if (!vote.voter_id || !vote.nullifier || !vote.encrypted_choice) {
        return res.status(400).json({ error: "Invalid payload. Missing required fields." });
    }

    if (seenNullifiers.has(vote.nullifier)) return res.status(400).json({ error: "Double vote detected." });
    seenNullifiers.add(vote.nullifier);

    let acknowledgements = 1;
    const payloadStr = JSON.stringify(vote);
    const signature = crypto.sign('sha256', Buffer.from(payloadStr), privateKey).toString('hex');
    
    const peerRequests = PEERS.map(peerUrl => 
        fetch(`${peerUrl}/consensus`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-node-pubkey': Buffer.from(publicKey).toString('base64'),
                'x-node-signature': signature
            },
            body: payloadStr
        })
        .then(response => response.ok ? 1 : 0)
        .catch(err => 0) 
    );

    const results = await Promise.all(peerRequests);
    acknowledgements += results.reduce((sum, count) => sum + count, 0);

    if (acknowledgements >= 3) {
        let release;
        try {
            release = await lockfile.lock(DATA_FILE, { retries: 5 });
            const currentVotes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            const previousHash = currentVotes.length > 0 ? currentVotes[currentVotes.length - 1].hash : "0000000000000000000000000000000000000000000000000000000000000000";
            const currentHash = crypto.createHash('sha256').update(previousHash + JSON.stringify(vote)).digest('hex');
            
            currentVotes.push({ ...vote, hash: currentHash, previous_hash: previousHash });
            fs.writeFileSync(DATA_FILE, JSON.stringify(currentVotes, null, 2));
            
            await release(); 
            return res.status(200).json({ message: `Vote finalized with ${acknowledgements}-of-4 consensus.` });
        } catch (error) {
            if (release) await release();
            seenNullifiers.delete(vote.nullifier);
            return res.status(500).json({ error: "System busy." });
        }
    } else {
        seenNullifiers.delete(vote.nullifier);
        return res.status(500).json({ error: "Consensus failed. Vote not finalized." });
    }
});

app.listen(PORT, () => {
    console.log(`BFT Node running on port ${PORT}`);
});