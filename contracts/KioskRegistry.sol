// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title KioskRegistry
 * @dev Phase 0: ECI signs/whitelists each kiosk before the election opens.
 */
contract KioskRegistry {
    address public eciAdmin;
    
    // Mapping from kiosk ID to its authorized public key
    mapping(string => string) public kioskPubKeys;
    mapping(string => bool) public isKioskRegistered;

    event KioskRegistered(string kioskId, string pubKey);

    modifier onlyAdmin() {
        require(msg.sender == eciAdmin, "Only ECI Admin can perform this action");
        _;
    }

    constructor() {
        eciAdmin = msg.sender;
    }

    /**
     * @dev Register a kiosk. In production, this would verify an ECI signature.
     * @param kioskId Unique identifier for the kiosk.
     * @param pubKey The public key (or address) of the kiosk.
     * @param eciSignature The signature from the ECI authorizing this kiosk.
     */
    function registerKiosk(string memory kioskId, string memory pubKey, bytes memory eciSignature) external onlyAdmin {
        bytes32 messageHash = keccak256(abi.encodePacked(kioskId, pubKey));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        require(recoverSigner(ethSignedMessageHash, eciSignature) == eciAdmin, "Invalid ECI signature");
        
        kioskPubKeys[kioskId] = pubKey;
        isKioskRegistered[kioskId] = true;

        emit KioskRegistered(kioskId, pubKey);
    }

    function splitSignature(bytes memory sig) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65, "invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }
}
