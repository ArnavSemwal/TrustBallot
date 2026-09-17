#!/bin/bash
set -e

# Ensure we are in the project root
cd d:/Dev/trustballot

# 1. Compile Circom circuit
echo "Compiling main.circom..."
cd circuits
circom main.circom --r1cs --wasm --sym

# 2. PLONK Setup
echo "Running PLONK setup..."
# Use the pot14_final.ptau from root
npx snarkjs plonk setup main.r1cs ../pot14_final.ptau circuit_final.zkey

# 3. Export Verification Key
echo "Exporting verification key..."
npx snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

# 4. Generate Solidity Verifier
echo "Generating Solidity Verifier..."
npx snarkjs zkey export solidityverifier circuit_final.zkey ../contracts/PlonkVerifier.sol

echo "PLONK setup complete. Verifier contract generated at contracts/PlonkVerifier.sol"
