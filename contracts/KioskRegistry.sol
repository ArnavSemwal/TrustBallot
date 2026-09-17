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
        // NOTE: In MVP, we skip the on-chain signature verification of eciSignature for simplicity, 
        // as the onlyAdmin modifier already restricts access to the ECI admin.
        // A full implementation would use ECDSA.recover(pubKey, eciSignature) to ensure non-repudiation.
        
        kioskPubKeys[kioskId] = pubKey;
        isKioskRegistered[kioskId] = true;

        emit KioskRegistered(kioskId, pubKey);
    }
}
