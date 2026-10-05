import oqs

def main():
    print("=== Post-Quantum Signature Prototype (Dilithium) ===")
    
    # We will use Dilithium2, a NIST standard for PQ signatures
    sigalg = "Dilithium2"
    print(f"Initializing {sigalg} signer...")
    
    with oqs.Signature(sigalg) as signer:
        # 1. Generate Keypair
        signer_public_key = signer.generate_keypair()
        print("Keypair generated successfully.")
        
        # 2. Define the payload (e.g. hash of the vote and ZKP)
        message = b"TrustBallot_VotePayload_Hash_12345"
        print(f"\nMessage to sign: {message}")
        
        # 3. Sign the message
        signature = signer.sign(message)
        print(f"Signature generated (Length: {len(signature)} bytes)")
        
        # 4. Verify the signature
        # In a real system, the Kiosk public key is registered in KioskRegistry.sol 
        # (Though smart contract verification of Dilithium is hard, this is for off-chain tally node verification)
        is_valid = signer.verify(message, signature, signer_public_key)
        print(f"\nSignature Valid? {is_valid}")
        
        # 5. Test invalid verification (tampered message)
        tampered_message = b"TrustBallot_VotePayload_Hash_99999"
        is_valid_tampered = signer.verify(tampered_message, signature, signer_public_key)
        print(f"Signature Valid on tampered message? {is_valid_tampered}")

if __name__ == "__main__":
    main()
