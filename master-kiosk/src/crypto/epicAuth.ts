/**
 * epicAuth.ts
 *
 * Implements the cryptographic verification of the EPIC (Voter ID) QR payload.
 * The kiosk verifies that the credential data was signed by the Election Commission of India (ECI).
 */

// In a real application, this would be an imported crypto library like 'ethers' or 'crypto-js'.
// Using stubbed imports or Web Crypto API.
import { ethers } from "ethers";

// For MVP, we define a stubbed ECI public key (address) that represents the official ECI signing key.
const ECI_PUBLIC_KEY = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Example local hardhat address

export interface EpicPayload {
  epicHash: string;
  constituencyId: string;
  merkleProof: string[]; // Merkle proof to show inclusion in the voter registry
}

/**
 * Verifies the ECDSA signature over the EPIC payload using the known ECI public key.
 *
 * @param payload The EPIC credential data scanned from the QR code.
 * @param signature The ECI signature attached to the QR code.
 * @returns boolean indicating if the signature is valid.
 */
export function verifyEpicSignature(payload: EpicPayload, signature: string): boolean {
  try {
    // 1. Reconstruct the message that was signed
    // e.g. JSON stringified or tightly packed bytes
    const message = JSON.stringify({
      epicHash: payload.epicHash,
      constituencyId: payload.constituencyId,
      // merkleProof omitted from hash or structured accordingly
    });

    // 2. Hash the message (Ethereum standard)
    const messageHash = ethers.id(message); // keccak256

    // 3. Recover the signer from the signature
    const recoveredAddress = ethers.recoverAddress(messageHash, signature);

    // 4. Compare with the known ECI public key
    return recoveredAddress.toLowerCase() === ECI_PUBLIC_KEY.toLowerCase();
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}
