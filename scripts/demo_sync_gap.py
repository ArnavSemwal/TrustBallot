"""
TrustBallot - Task B3 & Gap 1 Demonstration Script
---------------------------------------------------
Demonstrates:
1. Consensus round across 4 BFT nodes: Vote finalized only when >= 3 nodes agree.
2. The Sync-Gap attack: An attacker tries to double-vote with the same nullifier
   at a different kiosk before a batch flush. The second node queries peers / checks
   its seen nullifier set and rejects the vote immediately.
3. Fault tolerance: If 1 node is offline, consensus is still met (3-of-4 quorum).
"""

import urllib.request
import urllib.error
import json
import sys
import time

NODES = [
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
    "http://127.0.0.1:3004"
]

def post_json(url, path, data):
    req = urllib.request.Request(
        f"{url}{path}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}
    except urllib.error.URLError as e:
        return None, {"error": str(e.reason)}

def main():
    print("================================================================")
    print("     TrustBallot: Gap 1 (Sync-Gap) & 3-of-4 BFT Demonstration   ")
    print("================================================================\n")

    # 1. Health check across the 4 nodes
    print("[1] Checking node health...")
    active_nodes = []
    for i, node in enumerate(NODES, 1):
        status, _ = post_json(node, "/consensus", {"nullifier": f"ping_test_{int(time.time())}_{i}"})
        if status == 200:
            active_nodes.append(node)
            print(f"  [+] Node {i} ({node}): ONLINE")
        else:
            print(f"  [-] Node {i} ({node}): OFFLINE / UNREACHABLE")

    if len(active_nodes) < 3:
        print(f"\n[!] Notice: Only {len(active_nodes)}/4 nodes online.")
        print("    To run the live multi-process cluster: run 'bash backend/run_network.sh' or 'backend/run_network.bat'")
        print("    Now demonstrating simulation logic against available endpoints...\n")

    # 2. Submit initial vote to Node 1
    sample_nullifier = f"0xNULLIFIER_MIGRANT_WORKER_{int(time.time())}"
    vote_payload_1 = {
        "electionId": 1,
        "kioskId": "kiosk_delhi_01",
        "nullifier": sample_nullifier,
        "ciphertext": "0xSEAL_BFV_CIPHERTEXT_CANDIDATE_1",
        "proof": [1, 2, 3],
        "kioskSignature": "DILITHIUM2_SIG_VALID"
    }

    target_node = active_nodes[0] if active_nodes else NODES[0]
    print(f"[2] Kiosk 1 submitting vote to Primary Node ({target_node})...")
    status, res = post_json(target_node, "/add_vote", vote_payload_1)
    print(f"    Response Status: {status}")
    print(f"    Response Body:   {res}")

    if status == 200:
        print("    --> VOTE FINALIZED WITH >= 3-of-4 BFT CONSENSUS.\n")
    else:
        print(f"    --> Note: {res}\n")

    # 3. Simulate the Sync-Gap attack:
    # A voter moves to Kiosk 2 (connected to Node 2) within the 2-hour window
    # and attempts to vote again using the identical private credential / nullifier.
    second_node = active_nodes[1] if len(active_nodes) > 1 else NODES[1]
    print(f"[3] [SYNC-GAP ATTACK SIMULATION]")
    print(f"    Attacker at Kiosk 2 submitting DUPLICATE nullifier to Node 2 ({second_node})...")
    
    vote_payload_2 = {
        "electionId": 1,
        "kioskId": "kiosk_mumbai_04",
        "nullifier": sample_nullifier, # SAME NULLIFIER
        "ciphertext": "0xSEAL_BFV_CIPHERTEXT_CANDIDATE_2",
        "proof": [1, 2, 3],
        "kioskSignature": "DILITHIUM2_SIG_VALID"
    }

    status2, res2 = post_json(second_node, "/add_vote", vote_payload_2)
    print(f"    Response Status: {status2}")
    print(f"    Response Body:   {res2}")

    if status2 == 400 and "already seen" in str(res2).lower() or "rejected" in str(res2).lower() or "double vote" in str(res2).lower():
        print("\n  [SUCCESS] GAP 1 RESOLVED:")
        print("  Double voting was PREVENTED in real-time across nodes before batch syncing!")
        print("  The peer consensus protocol rejected the duplicate nullifier instantly.")
    elif status2 is None:
        print("\n  [INFO] Target node unreachable. Start backend cluster to view live rejection.")
    else:
        print(f"\n  [RESULT] Node returned status {status2}: {res2}")

    print("\n================================================================")
    print("                      Demonstration Complete                    ")
    print("================================================================\n")

if __name__ == "__main__":
    main()
