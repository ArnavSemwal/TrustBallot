const crypto = require('crypto');

const TARGET_NODE = 'http://127.0.0.1:3000'; // Sending to Node 1

async function runDemo() {
    // Generate a secure vote payload
    const vote = {
        voter_id: 'test_user_1',
        nullifier: crypto.randomBytes(16).toString('hex'),
        kiosk_id: 'kiosk_alpha',
        encrypted_choice: 'candidate_B'
    };

    console.log(`Sending vote to ${TARGET_NODE}...`);
    
    try {
        const response = await fetch(`${TARGET_NODE}/add_vote`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(vote)
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log("SUCCESS:", data.message);
        } else {
            console.log("FAILED:", data.error);
        }
    } catch (error) {
        console.error("NETWORK ERROR:", error.message);
    }
}

runDemo();