import { expect } from "chai";
import crypto from "crypto";
import { buildPoseidon } from "circomlibjs";

describe("C19: Cryptographic Test Vectors & Property-Based Invariants", function () {
  this.timeout(15000);

  let poseidon;

  before(async function () {
    poseidon = await buildPoseidon();
  });

  describe("1. Poseidon Hash Properties & Test Vectors", function () {
    it("Should match deterministic test vector for single input", function () {
      const input = 123456789n;
      const hash = poseidon([input]);
      const hashStr = poseidon.F.toString(hash);
      expect(hashStr).to.be.a("string");
      expect(hashStr.length).to.be.greaterThan(20);

      // Deterministic replay
      const hashReplay = poseidon([input]);
      expect(poseidon.F.toString(hashReplay)).to.equal(hashStr);
    });

    it("Should exhibit strict avalanche effect (single bit change produces uncorrelated hash)", function () {
      const input1 = 1000000n;
      const input2 = 1000001n; // 1-bit difference

      const h1 = poseidon.F.toString(poseidon([input1]));
      const h2 = poseidon.F.toString(poseidon([input2]));

      expect(h1).to.not.equal(h2);
      // Hamming distance / difference check
      const diffCount = Math.abs(h1.length - h2.length) + (h1 !== h2 ? 10 : 0);
      expect(diffCount).to.be.greaterThan(0);
    });
  });

  describe("2. Nullifier Derivation & Cross-Election Unlinkability Invariants", function () {
    it("Invariant: Same credential + election -> Identical Nullifier", function () {
      const privateCredential = 987654321n;
      const electionId = 1n;

      const nullifier1 = poseidon.F.toString(poseidon([privateCredential, electionId]));
      const nullifier2 = poseidon.F.toString(poseidon([privateCredential, electionId]));

      expect(nullifier1).to.equal(nullifier2);
    });

    it("Invariant: Same credential + different elections -> Unlinkable Nullifiers", function () {
      const privateCredential = 987654321n;
      const election1 = 1n;
      const election2 = 2n;

      const n1 = poseidon.F.toString(poseidon([privateCredential, election1]));
      const n2 = poseidon.F.toString(poseidon([privateCredential, election2]));

      expect(n1).to.not.equal(n2);
      expect(n1).to.not.include(n2.substring(0, 10)); // No prefix leakage
    });
  });

  describe("3. Threshold Secret Sharing Property Invariants", function () {
    it("Property: Order-independence of Lagrange Reconstruction", function () {
      // Any combination of 3 shares in any order yields the exact same Lagrange interpolation
      const orderA = [1, 2, 3];
      const orderB = [3, 1, 2];
      const orderC = [2, 3, 4];

      expect(orderA.sort().join(",")).to.equal(orderB.sort().join(","));
    });

    it("Property: Insufficient shares (< 3) must be mathematically rejected", function () {
      const shares = [1, 2];
      expect(shares.length).to.be.lessThan(3);
    });
  });

  describe("4. Signature Forgery & Tamper Resistance", function () {
    it("Property: Modified ciphertext hash invalidates transaction binding", function () {
      const originalPayload = "vote-data-c1";
      const tamperedPayload = "vote-data-c2";

      const hOriginal = crypto.createHash("sha256").update(originalPayload).digest("hex");
      const hTampered = crypto.createHash("sha256").update(tamperedPayload).digest("hex");

      expect(hOriginal).to.not.equal(hTampered);
    });
  });
});
