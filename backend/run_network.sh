#!/bin/bash
echo "Starting TrustBallot MVP Network..."

PORT=3001 DATA_FILE=votes_3001.json PEERS=http://localhost:3002,http://localhost:3003,http://localhost:3004 node bft_node.cjs &
PORT=3002 DATA_FILE=votes_3002.json PEERS=http://localhost:3001,http://localhost:3003,http://localhost:3004 node bft_node.cjs &
PORT=3003 DATA_FILE=votes_3003.json PEERS=http://localhost:3001,http://localhost:3002,http://localhost:3004 node bft_node.cjs &
PORT=3004 DATA_FILE=votes_3004.json PEERS=http://localhost:3001,http://localhost:3002,http://localhost:3003 node bft_node.cjs &
node sync_service.cjs &

echo "All services launched (running in background)!"
wait
