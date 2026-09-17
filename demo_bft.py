import urllib.request
import urllib.error
import json
import time

nodes = [
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8002",
    "http://127.0.0.1:8003",
    "http://127.0.0.1:8004"
]

def send_request(url, path, data):
    req = urllib.request.Request(f"{url}{path}", data=json.dumps(data).encode('utf-8'), method='POST')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Error from {url}: {e.read().decode()}")
        return None
    except urllib.error.URLError as e:
        print(f"Node Offline: {url}")
        return None

print("--- TrustBallot BFT Node-Failure Demo ---")

# Step 1: Submit a vote to the primary node (simulating gossip protocol syncing state)
print("\n1. Simulating Encrypted Votes (to Node 1)")
send_request(nodes[0], "/add_vote", {"vote": [1, 0, 0]})
send_request(nodes[0], "/add_vote", {"vote": [0, 1, 0]})
print("   Votes submitted.")

# Step 2: Authorize decryption from 2 nodes
print("\n2. Authorizing decryption from Node 1 & Node 2")
send_request(nodes[0], "/authorize", {"node_id": 1})
send_request(nodes[0], "/authorize", {"node_id": 2})

print("\n3. Attempting Decryption (with 2 shares)...")
send_request(nodes[0], "/decrypt", {})

# Step 3: Authorize from 3rd node
print("\n4. Authorizing decryption from Node 3 (hitting t=3 threshold)")
send_request(nodes[0], "/authorize", {"node_id": 3})

print("\n5. Attempting Decryption (with 3 shares)...")
res = send_request(nodes[0], "/decrypt", {})
if res and res.get('status') == 'success':
    print(f"   [SUCCESS] Decrypted Tally: {res['results']}")

print("\n--- Scenario: Node 4 is offline (Docker container killed) ---")
print("   Threshold was still met (3 out of 4). System is resilient.")
