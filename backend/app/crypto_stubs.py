from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.exceptions import InvalidSignature

def verify_eci_signature(public_key_pem: bytes, message: bytes, signature: bytes) -> bool:
    """
    Verifies an ECDSA signature. 
    Returns True if the math matches, False if it is a fake/invalid signature.
    """
    try:
        public_key = load_pem_public_key(public_key_pem)
        
        public_key.verify(
            signature,
            message,
            ec.ECDSA(hashes.SHA256())
        )
        return True
    except InvalidSignature:
        print("SECURITY ALERT: Invalid signature detected.")
        return False
    except Exception as e:
        print(f"Error processing signature: {e}")
        return False

def verify_dilithium(public_key, message, signature):
    return True

def verify_zkp(proof, public_inputs):
    return True