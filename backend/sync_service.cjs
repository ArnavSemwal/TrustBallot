const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

// 1. P2 Feature: Disputed Vote Flagging
app.post('/dispute-vote', (req, res) => {
    const { voter_id } = req.body;
    const fileData = fs.readFileSync('votes.json', 'utf8');
    let votes = JSON.parse(fileData);

    let found = false;
    votes = votes.map(vote => {
        if (vote.voter_id === voter_id) {
            vote.status = "Disputed";
            found = true;
        }
        return vote;
    });

    fs.writeFileSync('votes.json', JSON.stringify(votes, null, 2));
    
    if (found) {
        res.send({ message: `Vote for ${voter_id} has been flagged as Disputed.` });
    } else {
        res.status(404).send({ error: "Vote not found." });
    }
});

// 2. P2 Feature: EVM / IBC Sync Simulation
// In production this is 2 hours. For this demo, we run it every 2 minutes (120,000 ms).
setInterval(() => {
    const fileData = fs.readFileSync('votes.json', 'utf8');
    let votes = JSON.parse(fileData);
    
    if (votes.length > 0) {
        console.log(`\n--- [EVM SYNC EVENT] ---`);
        console.log(`Flushing ${votes.length} votes to the EVM simulator...`);
        
        // Empty the file to simulate transferring the data out of the kiosk
        fs.writeFileSync('votes.json', JSON.stringify([], null, 2));
        
        console.log(`Sync complete. 'votes.json' has been cleared.`);
        console.log(`------------------------\n`);
    }
}, 120000); // 120,000 milliseconds = 2 minutes

// Start this service on port 4000 so it doesn't conflict with your BFT nodes
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Admin Sync Service running on http://localhost:${PORT}`);
    console.log(`EVM Batch Sync timer started (Checking every 2 minutes)...`);
});