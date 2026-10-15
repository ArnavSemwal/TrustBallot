from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import ALLOWED_ORIGINS
from .routers import elections, nodes, kiosks, votes

app = FastAPI(title="TrustBallot API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(elections.router)
app.include_router(nodes.router)
app.include_router(kiosks.router)
app.include_router(votes.router)

@app.get("/")
def api_root_health():
    return {"status": "ok", "app": "TrustBallot"}
