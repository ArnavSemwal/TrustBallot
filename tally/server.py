import json
import logging
from http.server import BaseHTTPRequestHandler, HTTPServer
from tally import ThresholdTally, generate_keys, encrypt_vote, add_votes

logging.basicConfig(level=logging.INFO)
pub_key, priv_key = generate_keys()

# In a real system, this state is synchronized across the chain
running_tally = None
tally_module = ThresholdTally(pub_key, priv_key, num_nodes=4, threshold=3)
authorized_shares = []

class TallyServer(BaseHTTPRequestHandler):
    def _send_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        if self.path == '/status':
            self._send_response({"status": "running"})
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
