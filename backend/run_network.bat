@echo off
echo Starting TrustBallot MVP Network...

echo Launching Node 1 (Port 3001)...
start "Node 1" cmd /k "set PORT=3001&& set DATA_FILE=votes_3001.json&& set PEERS=http://localhost:3002,http://localhost:3003,http://localhost:3004&& node bft_node.cjs"

echo Launching Node 2 (Port 3002)...
start "Node 2" cmd /k "set PORT=3002&& set DATA_FILE=votes_3002.json&& set PEERS=http://localhost:3001,http://localhost:3003,http://localhost:3004&& node bft_node.cjs"

echo Launching Node 3 (Port 3003)...
start "Node 3" cmd /k "set PORT=3003&& set DATA_FILE=votes_3003.json&& set PEERS=http://localhost:3001,http://localhost:3002,http://localhost:3004&& node bft_node.cjs"

echo Launching Node 4 (Port 3004)...
start "Node 4" cmd /k "set PORT=3004&& set DATA_FILE=votes_3004.json&& set PEERS=http://localhost:3001,http://localhost:3002,http://localhost:3003&& node bft_node.cjs"

echo Launching Admin Sync Service (Port 4000)...
start "Sync Service" cmd /k "node sync_service.cjs"

echo All services launched!
exit