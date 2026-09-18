import json
import logging
import time
import hashlib
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from tally import ThresholdTally, generate_keys, encrypt_vote, add_votes

logging.basicConfig(level=logging.INFO)
pub_key, priv_key = generate_keys()

# In a real system, this state is synchronized across the chain
running_tally = None
tally_module = ThresholdTally(pub_key, priv_key, num_nodes=4, threshold=3)
authorized_shares = []
recent_transactions = []

class TallyServer(BaseHTTPRequestHandler):
    def _send_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self._send_response({})

    def do_GET(self):
        if self.path == '/status':
            self._send_response({"status": "running"})
            return
        elif self.path == '/transactions':
            self._send_response({"transactions": recent_transactions})
            return
            
    def do_POST(self):
        global running_tally, authorized_shares
        
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        req = json.loads(post_data.decode('utf-8'))

        if self.path == '/add_vote':
            vote = req.get("vote")
            encrypted_vote = encrypt_vote(pub_key, vote)
            if running_tally is None:
                running_tally = encrypted_vote
            else:
                running_tally = add_votes(running_tally, encrypted_vote)
                
            # Generate transaction hash
            tx_data = f"{vote}-{time.time()}".encode('utf-8')
            tx_hash = '0x' + hashlib.sha256(tx_data).hexdigest()[:40]
            timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            log_str = f"[{timestamp}] TX_HASH: {tx_hash} STATUS: CRYPTOGRAPHICALLY_SEALED"
            
            recent_transactions.append(log_str)
            if len(recent_transactions) > 50:
                recent_transactions.pop(0)
                
            self._send_response({"status": "success", "msg": "Vote added"})

        elif self.path == '/authorize':
            node_id = req.get("node_id")
            if node_id not in authorized_shares:
                authorized_shares.append(node_id)
            self._send_response({"status": "success", "shares": len(authorized_shares)})

        elif self.path == '/decrypt':
            try:
                results = tally_module.decrypt_tally(running_tally, authorized_shares)
                self._send_response({"status": "success", "results": results})
            except Exception as e:
                self._send_response({"status": "error", "msg": str(e)}, 400)
        else:
            self._send_response({"status": "error", "msg": "Not found"}, 404)

if __name__ == '__main__':
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, TallyServer)
    logging.info("Starting Tally Node on port 8000...")
    httpd.serve_forever()
