#!/bin/bash
set -e

# Ensure we are in the project root
cd "$(dirname "$0")/.."

# 1. Compile Circom circuit
echo "Compiling main.circom..."
cd circuits
circom main.circom --r1cs --wasm --sym

# 2. PLONK Setup
echo "Running PLONK setup..."
# Use a public ceremony ptau file to prevent toxic waste risk
if [ ! -f "../pot14_final.ptau" ]; then
    echo "Downloading public ceremony ptau..."
    curl -o ../pot14_final.ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau
fi
npx snarkjs plonk setup main.r1cs ../pot14_final.ptau circuit_final.zkey

# 3. Export Verification Key
echo "Exporting verification key..."
npx snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

# 4. Generate Solidity Verifier
echo "Generating Solidity Verifier..."
npx snarkjs zkey export solidityverifier circuit_final.zkey ../contracts/PlonkVerifier.sol

echo "PLONK setup complete. Verifier contract generated at contracts/PlonkVerifier.sol"
