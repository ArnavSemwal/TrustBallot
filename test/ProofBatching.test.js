import { expect } from "chai";
import fs from "fs";
import { ProofBatchingEngine } from "../scripts/proof_aggregation.js";

describe("C15: Proof Batching and Aggregation", function () {
  this.timeout(20000);

  let engine;
  let sampleProof;
  let samplePublic;

  before(function () {
    const vKeyPath = "circuits/verification_key.json";
    const proofPath = "circuits/proof.json";
    const publicPath = "circuits/public.json";

    engine = ProofBatchingEngine.fromFile(vKeyPath);
    sampleProof = JSON.parse(fs.readFileSync(proofPath, "utf-8"));
    samplePublic = JSON.parse(fs.readFileSync(publicPath, "utf-8"));
  });

  it("Should verify individual proofs sequentially", async function () {
    const res = await engine.verifySequential([sampleProof, sampleProof], [samplePublic, samplePublic]);
    expect(res.allValid).to.be.true;
    expect(res.individualResults).to.deep.equal([true, true]);
  });

  it("Should batch-verify proofs and achieve speedup with random challenge combination", async function () {
    const batchSize = 4;
    const batchProofs = Array(batchSize).fill(sampleProof);
    const batchSignals = Array(batchSize).fill(samplePublic);

    const batchRes = await engine.verifyBatch(batchProofs, batchSignals);
    expect(batchRes.allValid).to.be.true;
    expect(batchRes.proofCount).to.equal(batchSize);
    expect(batchRes.gasComparison.gasSaved).to.be.greaterThan(0);
  });
});
