import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";

describe("TrustBallot End-to-End Integration", function () {
  let TrustBallot, KioskRegistry, PlonkVerifier;
  let trustBallot, kioskRegistry, plonkVerifier;
  let owner, eciAdmin, kioskNode;

  before(async function () {
    [owner, eciAdmin, kioskNode] = await ethers.getSigners();

    // 1. Deploy KioskRegistry
    KioskRegistry = await ethers.getContractFactory("KioskRegistry");
    kioskRegistry = await KioskRegistry.deploy();
    await kioskRegistry.waitForDeployment();

    // 2. Deploy PlonkVerifier
    PlonkVerifier = await ethers.getContractFactory("PlonkVerifier");
    plonkVerifier = await PlonkVerifier.deploy();
    await plonkVerifier.waitForDeployment();

    // 3. Deploy TrustBallot
    TrustBallot = await ethers.getContractFactory("TrustBallot");
    trustBallot = await TrustBallot.deploy(
      await kioskRegistry.getAddress(),
      await plonkVerifier.getAddress()
    );
    await trustBallot.waitForDeployment();
  });

  describe("1. Kiosk Registration", function () {
    it("Should allow ECI admin to register a kiosk", async function () {
      const kioskId = "kiosk-001";
      const pubKey = "pub-key-001";
      const messageHash = ethers.solidityPackedKeccak256(["string", "string"], [kioskId, pubKey]);
      const signature = await eciAdmin.signMessage(ethers.getBytes(messageHash));

      await kioskRegistry.connect(eciAdmin).registerKiosk(kioskId, pubKey, signature);
      const isReg = await kioskRegistry.isKioskRegistered(kioskId);
      expect(isReg).to.be.true;
    });
  });

  describe("2. Vote Submission and ZKP", function () {
    const electionId = 1;
    const nullifier = "0x0950acb7e532ebb21176a28dee52617a5a37ce9294aab1cf603024e5b9063f9a";
    const ciphertextVote = ethers.hexlify(ethers.randomBytes(32));
    const dilithiumSig = ethers.hexlify(ethers.randomBytes(64));
    
    const zkpProof = [
      "0x1a248f6fb603c7b3da64e76ecbd986fe9fcaa6dae3e7625abd52183d3df417c2", "0x2ff8f4837b41da2958b48c59a80d6bd8a3499d29286d117091d0d9ad1225731e","0x16ff51cab4b63b4fa29b5a27d227c934cd0e335be2bcc8961b81b730e1f1e12d","0x2c2cb2afcda2c2bd1c19cc700d6278d45ed7cdf987caa4bd212c2d7aa66c321d","0x2c23186a8422a11a5ed2ae0554bfceabed25c2d5048413b5e4bf6820b7a524e2","0x005eeabd2bf7ba43054ee0cf131242501712eacb0b3afa7a3a29c0516b0635eb","0x0521126076fa9e2e3b98466a66608315469aa5e01a586f909386f94cad297a6e","0x1ae3befcde55b8698030fe1ed04c0cb56af2586b6f1c925e5a85ba64e775df63","0x030a7eb93bf277f06932eecbf02a0d9aef4e4ced971edbcf364deed8b3d8a261","0x1ec780ee40f89e8f5e3212f40ab91706826bbebfb0e4a70d128fe012443cee3c","0x08076c2a0d659440815f375c29b5684d6e9a81b85778e43bf91f3f9d204162c1","0x2655d0c509d7e93801e6f79db5672e4e093abc2857e7d1b8223d957e896d5a33","0x2643ec347b326ce6bce8c73bd90f9550572cc843bab2e9d2d4acd2dd2b0df81e","0x11028a81470377064b343244f7a185d4c323b835a499375af53754a5f6c92b1e","0x023b31cb6a57934a2a52980e13a365f709f3519495571bcd42bd263b188611c6","0x2481419ccb0a4cbee28ce065f7b0be8de1b395afeab0a117cd87e8eb182edf3c","0x0c8d09e764636233f24dbb141843f3c39a92b5eb236469fe12b893cab0a10d62","0x2d900dbbdc8b98a0eb9f9d7c3a97db7c9cfc07833195cb96a3262733fa3e9337","0x029f8df9944986ac0a8fb66287628e4ec1f4956bdfa650d58bf9fad1a6097944","0x2a4d079a0c22ad3e6e81c5c5146b0c65e7bef9311a296c3fbf0a00de1840b0bb","0x270be6fc40ef82cf3654044a3a8da4ea6411b285ee61669fb190e1614808e1d3","0x05d86e0a89e11f56e3fe5448bbc9493401c8a57495ce1c1bc7152d790d4bb1d5","0x302d6e1e3f19b464f967c04f6d107bdbdc9f02acf433bde72dfdeef2863651d8","0x10b8cb8c0a50d16c221aec84b6d5c9b9f83121337f2f654dce3cb276f2a5fef5"
    ];

    it("Should accept a valid ZKP proof", async function () {
      const tx = await trustBallot.submitVote(
        "kiosk-001",
        electionId,
        nullifier,
        ciphertextVote,
        zkpProof,
        dilithiumSig
      );
      const receipt = await tx.wait();
      
      const voteAcceptedEvent = receipt.logs.find(log => {
          try {
              const parsed = trustBallot.interface.parseLog(log);
              return parsed && parsed.name === "VoteAccepted";
          } catch (e) { return false; }
      });
      expect(voteAcceptedEvent).to.not.be.undefined;
    });

    it("Should reject a duplicate nullifier with VoteRejected event", async function () {
      const tx = await trustBallot.submitVote(
        "kiosk-001",
        electionId,
        nullifier,
        ciphertextVote,
        zkpProof,
        dilithiumSig
      );
      const receipt = await tx.wait();
      
      const voteRejectedEvent = receipt.logs.find(log => {
          try {
              const parsed = trustBallot.interface.parseLog(log);
              return parsed && parsed.name === "VoteRejected" && parsed.args.reason === "duplicate_nullifier";
          } catch (e) { return false; }
      });
      expect(voteRejectedEvent).to.not.be.undefined;
    });
  });
});
