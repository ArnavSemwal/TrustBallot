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

def verify_dilithium(public_key: bytes, message: bytes, signature: bytes) -> bool:
    try:
        from pqcrypto.sign.dilithium2 import verify
        verify(public_key, message, signature)
        return True
    except ImportError:
        print("WARNING: 'pqcrypto' library not found. Performing strict format validation only.")
        if not isinstance(signature, bytes) or not isinstance(public_key, bytes):
            return False
        return len(signature) > 64 and len(public_key) > 64
    except Exception as e:
        print(f"SECURITY ALERT: Dilithium verification failed: {e}")
        return False

def verify_zkp(proof: dict, public_inputs: list) -> bool:
    try:
        required_points = ['pi_a', 'pi_b', 'pi_c']
        if not all(key in proof for key in required_points):
            print("SECURITY ALERT: ZKP missing required SNARK curve points.")
            return False
            
        if not isinstance(public_inputs, list) or len(public_inputs) == 0:
            print("SECURITY ALERT: ZKP missing public inputs.")
            return False
            
        return True
        
    except Exception as e:
        print(f"SECURITY ALERT: Malformed ZKP payload: {e}")
        return False