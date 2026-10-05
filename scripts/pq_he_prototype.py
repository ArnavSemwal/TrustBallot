import tenseal as ts

def main():
    print("=== Post-Quantum Homomorphic Encryption Prototype (BFV) ===")
    
    # 1. Setup Context and Keys
    # BFV is used for integer arithmetic which fits our voting use case
    context = ts.context(
        ts.SCHEME_TYPE.BFV,
        poly_modulus_degree=4096,
        plain_modulus=1032193
    )
    context.generate_galois_keys()
    context.generate_relin_keys()
    
    print("Context generated.")
    
    # 2. Encrypt Individual Votes
    # Let's say we have 3 candidates and 2 voters
    # Voter 1 votes for Candidate 1 (index 0)
    voter1_plaintext = [1, 0, 0]
    voter1_ciphertext = ts.bfv_vector(context, voter1_plaintext)
    print(f"Voter 1 encrypted vote: {voter1_plaintext}")
    
    # Voter 2 votes for Candidate 1 (index 0)
    voter2_plaintext = [1, 0, 0]
    voter2_ciphertext = ts.bfv_vector(context, voter2_plaintext)
    print(f"Voter 2 encrypted vote: {voter2_plaintext}")
    
    # Voter 3 votes for Candidate 2 (index 1)
    voter3_plaintext = [0, 1, 0]
    voter3_ciphertext = ts.bfv_vector(context, voter3_plaintext)
    print(f"Voter 3 encrypted vote: {voter3_plaintext}")
    
    # 3. Homomorphic Addition (Tallying)
    # The tally node performs this without decrypting
    encrypted_tally = voter1_ciphertext + voter2_ciphertext + voter3_ciphertext
    print("\nHomomorphic tally computed.")
    
    # 4. Decrypt Final Tally
    # Only the threshold keyholders can perform this in production
    decrypted_tally = encrypted_tally.decrypt()
    print(f"\nFinal Decrypted Tally: {decrypted_tally}")
    print("Candidate 1:", decrypted_tally[0])
    print("Candidate 2:", decrypted_tally[1])
    print("Candidate 3:", decrypted_tally[2])

if __name__ == "__main__":
    main()
