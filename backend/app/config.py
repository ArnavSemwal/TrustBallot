import os

PORT = int(os.getenv("PORT", "8000"))
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:8443",
]
SESSION_SECRET = os.getenv("SESSION_SECRET", "super-secret-dev-key")

NODE_NAMES = {
    "node_1": "ECI Primary",
    "node_2": "Supreme Court",
    "node_3": "State EC Node",
    "node_4": "Independent Auditor"
}
