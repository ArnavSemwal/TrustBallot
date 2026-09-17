import { ethers } from "ethers";
import fs from "fs";

async function main() {
  console.log("--- Starting E2E Integration Test (Native Ethers) ---");
  
  // Connect to local Hardhat node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner(0);
  const eciAdmin = await provider.getSigner(1);

  // Load Artifacts
  const KioskRegistryArt = JSON.parse(fs.readFileSync("./artifacts/contracts/KioskRegistry.sol/KioskRegistry.json"));
  const PlonkVerifierArt = JSON.parse(fs.readFileSync("./artifacts/contracts/PlonkVerifier.sol/PlonkVerifier.json"));
  const TrustBallotArt = JSON.parse(fs.readFileSync("./artifacts/contracts/TrustBallot.sol/TrustBallot.json"));

  // 1. Deploy KioskRegistry
  const KioskRegistryFactory = new ethers.ContractFactory(KioskRegistryArt.abi, KioskRegistryArt.bytecode, eciAdmin);
  const kioskRegistry = await KioskRegistryFactory.deploy();
  await kioskRegistry.waitForDeployment();
  const kioskRegistryAddr = await kioskRegistry.getAddress();
  console.log("KioskRegistry deployed:", kioskRegistryAddr);

  // 2. Deploy PlonkVerifier
  const PlonkVerifierFactory = new ethers.ContractFactory(PlonkVerifierArt.abi, PlonkVerifierArt.bytecode, signer);
  const plonkVerifier = await PlonkVerifierFactory.deploy();
  await plonkVerifier.waitForDeployment();
  const plonkVerifierAddr = await plonkVerifier.getAddress();
  console.log("PlonkVerifier deployed:", plonkVerifierAddr);

  // 3. Deploy TrustBallot
  const TrustBallotFactory = new ethers.ContractFactory(TrustBallotArt.abi, TrustBallotArt.bytecode, signer);
  const trustBallot = await TrustBallotFactory.deploy(kioskRegistryAddr, plonkVerifierAddr);
  await trustBallot.waitForDeployment();
  console.log("TrustBallot deployed:", await trustBallot.getAddress());

  console.log("\n--- Testing Kiosk Registration ---");
  const kioskId = "kiosk-001";
  const pubKey = "pub-key-001";
  const messageHash = ethers.solidityPackedKeccak256(["string", "string"], [kioskId, pubKey]);
  // Hardhat node signs messages correctly
  const signature = await eciAdmin.signMessage(ethers.getBytes(messageHash));
  
  await kioskRegistry.connect(eciAdmin).registerKiosk(kioskId, pubKey, signature);
  const isReg = await kioskRegistry.isKioskRegistered(kioskId);
  if (!isReg) throw new Error("Kiosk should be registered");
  console.log("Kiosk registered successfully by ECI Admin.");

  console.log("\n--- Testing Vote Submission & ZKP Validation ---");
  const electionId = 1;
  const nullifier = 12345;
  const ciphertextVote = ethers.hexlify(ethers.randomBytes(32));
  const dilithiumSig = ethers.hexlify(ethers.randomBytes(64));
  const zkpProof = new Array(24).fill(0n); 

  const tx = await trustBallot.connect(eciAdmin).submitVote(
    kioskId,
    electionId,
    nullifier,
    ciphertextVote,
    zkpProof,
    dilithiumSig
  );
  const receipt = await tx.wait();
  
  // Find VoteRejected event
  const voteRejectedEvent = receipt.logs.find(log => {
      try {
          const parsed = trustBallot.interface.parseLog(log);
          return parsed && parsed.name === "VoteRejected";
      } catch (e) { return false; }
  });
  
  if (voteRejectedEvent) {
      console.log("PlonkVerifier successfully rejected the mock zero-proof via event. (Expected Behavior)");
  } else {
      throw new Error("Vote should have emitted VoteRejected event but didn't!");
  }

  console.log("\n--- E2E Test Suite Passed ---");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
