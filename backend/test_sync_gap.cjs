async function runTest() {
  const payload = {
    electionId: "election-2026",
    nullifier: "secret-nullifier-alpha",
    ciphertext: "encrypted-ballot-choice-1"
  };

  console.log("\n[TEST 1] Submitting first vote...");
  const res1 = await fetch("http://localhost:3001/add_vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data1 = await res1.json();
  console.log("Status:", res1.status, "| Response:", data1);

  console.log("\n[TEST 2] Submitting exact same vote (Sync-Gap Replay Attack)...");
  const res2 = await fetch("http://localhost:3001/add_vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data2 = await res2.json();
  console.log("Status:", res2.status, "| Response:", data2);
}

runTest();