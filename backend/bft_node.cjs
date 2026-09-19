const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

// List of all node ports in our simulated BFT network
const ALL_NODES = [3001, 3002, 3003, 3004];

app.post('/receive-vote', async (req, res) => {
    const voteData = req.body;
    const currentPort = process.env.PORT || 3001;

    console.log(`[Node ${currentPort}] Received vote:`, voteData);

    // Simple BFT Simulation: Count this node's vote + simulate peer validation
    let acknowledgements = 1; 

    // In a full loop, it would ping peers; for our quick demo, we simulate 
    // that if at least 3 out of 4 nodes are alive, consensus is reached.
    if (acknowledgements >= 1) {
        // Read existing votes
        const fileData = fs.readFileSync('votes.json', 'utf8');
        const votes = JSON.parse(fileData);

        // Save vote with consensus status
        votes.push({ ...voteData, status: "Consensus Reached", verified_by_node: currentPort });
        fs.writeFileSync('votes.json', JSON.stringify(votes, null, 2));

        console.log(`[Node ${currentPort}] Consensus achieved! Vote stored.`);
        return res.send({ status: "Success", message: "Consensus reached and vote recorded." });
    } else {
        return res.status(500).send({ status: "Error", message: "Consensus failed." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`BFT Node running on http://localhost:${PORT}`);
});