from typing import Dict, List, Set

# In-memory storage for MVP
elections_store = {}  # type: Dict[str, dict]
kiosk_registry = {}   # type: Dict[str, dict]
nullifier_set = set() # type: Set[str]
vote_ledger = []      # type: List[dict]

def get_election(election_id: str):
    return elections_store.get(election_id)

def create_election(election_data: dict):
    elections_store[election_data["id"]] = election_data
    return election_data

def update_election_status(election_id: str, status: str):
    if election_id in elections_store:
        elections_store[election_id]["status"] = status
        return elections_store[election_id]
    return None

def register_kiosk(kiosk_id: str, kiosk_data: dict):
    kiosk_registry[kiosk_id] = kiosk_data

def get_kiosk(kiosk_id: str):
    return kiosk_registry.get(kiosk_id)

def add_vote(vote_data: dict):
    vote_ledger.append(vote_data)
    nullifier_set.add(vote_data["nullifier"])

def has_nullifier(nullifier: str) -> bool:
    return nullifier in nullifier_set
