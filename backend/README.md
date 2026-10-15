# TrustBallot Backend

## Setup & Run (Windows PowerShell)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Running Tests

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```

## cURL Examples (PowerShell)

### Create Election
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/elections" -Method Post -ContentType "application/json" -Body '{"title":"Test","description":"desc"}'
```

### Open Election
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/elections/e_12345/open" -Method Post
```

### List Nodes Status
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/nodes/status" -Method Get
```

### Register Kiosk
```powershell
$resp = Invoke-RestMethod -Uri "http://localhost:8000/api/kiosks/register" -Method Post -ContentType "application/json" -Body '{"kiosk_id":"k_7","kiosk_pubkey":"pub","eci_signature":"sig"}'
$token = $resp.session_token
```

### Add Vote
```powershell
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:8000/api/votes" -Method Post -ContentType "application/json" -Headers $headers -Body '{"election_id":"e_12345","encrypted_vote":"enc","nullifier":"n1","zkp_proof":"proof"}'
```
