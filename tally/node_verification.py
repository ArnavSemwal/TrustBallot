import oqs
import logging

# [B14/B15] Node Verification Snippets (For Shashwat)
# 
# These functions should be integrated into the BFT consensus nodes
# before they accept a vote payload or perform threshold decryption.

def verify_kiosk_signature(message: bytes, signature: bytes, kiosk_pub_key: bytes) -> bool:
    """
    Verify the post-quantum signature (Dilithium2) of the incoming vote package.
    """
    sigalg = "Dilithium2"
    try:
        with oqs.Signature(sigalg) as verifier:
            is_valid = verifier.verify(message, signature, kiosk_pub_key)
            if not is_valid:
                logging.error("Dilithium signature verification failed for kiosk payload.")
            return is_valid
    except Exception as e:
        logging.error(f"Error during signature verification: {e}")
        return False

def check_election_closed_gate(contract_caller, election_id: int) -> bool:
    """
    Check the smart contract to ensure the election is CLOSED 
    before participating in the MPC threshold decryption.
    
    contract_caller: A web3.py instance configured to call the TrustBallot contract.
    """
    # Enum ElectionState { None, Created, Open, Closed, Tallied }
    # Closed == 3
    state = contract_caller.functions.electionStates(electionId).call()
    if state == 3:
        logging.info(f"Election {election_id} is CLOSED. Decryption authorized.")
        return True
    else:
        logging.error(f"Election {election_id} is in state {state}. Decryption REJECTED.")
        return False
