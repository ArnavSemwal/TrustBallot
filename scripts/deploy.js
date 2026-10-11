import hre from "hardhat";

async function main() {
  console.log("Starting deployment for TrustBallot System...");
  const { ethers } = await hre.network.create();

  // 1. Deploy KioskRegistry
  const KioskRegistry = await ethers.getContractFactory("KioskRegistry");
  const kioskRegistry = await KioskRegistry.deploy();
  await kioskRegistry.waitForDeployment();
  const kioskRegistryAddress = await kioskRegistry.getAddress();
  console.log(`KioskRegistry deployed to: ${kioskRegistryAddress}`);

  // 2. Deploy PlonkVerifier
  const PlonkVerifier = await ethers.getContractFactory("PlonkVerifier");
  const plonkVerifier = await PlonkVerifier.deploy();
  await plonkVerifier.waitForDeployment();
  const plonkVerifierAddress = await plonkVerifier.getAddress();
  console.log(`PlonkVerifier deployed to: ${plonkVerifierAddress}`);

  // 3. Deploy TrustBallot
  const TrustBallot = await ethers.getContractFactory("TrustBallot");
  const trustBallot = await TrustBallot.deploy(kioskRegistryAddress, plonkVerifierAddress);
  await trustBallot.waitForDeployment();
  const trustBallotAddress = await trustBallot.getAddress();
  console.log(`TrustBallot deployed to: ${trustBallotAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
