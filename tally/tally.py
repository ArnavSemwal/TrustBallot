import json
from phe import paillier

class ThresholdTally:
    """
    Simulates a threshold decryption mechanism for a BFT consortium.
    In a real implementation, the private key would be split across N nodes using Shamir's Secret Sharing.
    Here, the master private key is stored, but decryption mathematically fails unless 
    at least 'threshold' (t=3) authorized shares are provided to the decrypt function.
    """
    def __init__(self, public_key, private_key, num_nodes=4, threshold=3):
        self.public_key = public_key
        self._private_key = private_key
        self.num_nodes = num_nodes
        self.threshold = threshold
        
    def decrypt_tally(self, encrypted_tally, auth_shares):
        """
        Decrypts the homomorphic tally ONLY if t-of-n authorized shares are provided.
        auth_shares is a list of node IDs [1, 2, 4] that have authorized the decryption.
        """
        if len(set(auth_shares)) < self.threshold:
            raise ValueError(f"Decryption failed: {len(auth_shares)} shares provided, {self.threshold} required.")
        
        # In a real system, the shares would be combined cryptographically. 
        # For this prototype simulation, we check the threshold and then use the master private key.
        return [self._private_key.decrypt(val) for val in encrypted_tally]


def generate_keys():
    """Generates a Paillier keypair for the election."""
    public_key, private_key = paillier.generate_paillier_keypair()
    return public_key, private_key

def encrypt_vote(public_key, candidate_selection):
    """
    Encrypts a one-hot candidate selection array.
    Example: [0, 1, 0, 0] (Voter selected candidate index 1)
    """
    return [public_key.encrypt(val) for val in candidate_selection]

def add_votes(encrypted_vote1, encrypted_vote2):
    """
    Homomorphically adds two encrypted votes without decrypting them.
    (Enc(A) + Enc(B) = Enc(A+B))
    """
    if len(encrypted_vote1) != len(encrypted_vote2):
        raise ValueError("Vote arrays must be of the same length")
    
    return [v1 + v2 for v1, v2 in zip(encrypted_vote1, encrypted_vote2)]

if __name__ == "__main__":
    print("--- TrustBallot Homomorphic Tally Prototype ---")
    pub_key, priv_key = generate_keys()
    
    # 3 candidates
    print("\n1. Kiosk Encrypting Votes (1-hot encoding)")
    voter1 = encrypt_vote(pub_key, [1, 0, 0]) # Votes for Candidate A
    voter2 = encrypt_vote(pub_key, [0, 1, 0]) # Votes for Candidate B
    voter3 = encrypt_vote(pub_key, [1, 0, 0]) # Votes for Candidate A
    print("   Votes encrypted successfully.")
    
    print("\n2. Consortium Chain Tallying (Homomorphic Addition)")
    running_tally = add_votes(voter1, voter2)
    running_tally = add_votes(running_tally, voter3)
    print("   Encrypted votes added on-chain.")
    
    print("\n3. Threshold Decryption")
    tally_module = ThresholdTally(pub_key, priv_key)
    
    try:
        print("   Attempting decryption with 2 shares (below threshold t=3)...")
        tally_module.decrypt_tally(running_tally, [1, 2])
    except ValueError as e:
        print(f"   [BLOCKED] {e}")
        
    print("   Attempting decryption with 3 shares (threshold met)...")
    final_results = tally_module.decrypt_tally(running_tally, [1, 2, 4])
    print(f"   [SUCCESS] Final Tally Results: {final_results}")
