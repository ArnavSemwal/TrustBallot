import * as snarkjs from 'snarkjs';

export const generateZKP = async (
  electionId: number,
  candidateId: string,
  numCandidates: number
) => {
  // Inputs required by main.circom:
  // public: root, electionId, ciphertextHash
  // private: privateCredential, pathElements, pathIndices, candidateSelection

  const candidateIndex = parseInt(candidateId.replace(/[^0-9]/g, '')) || 0;
  
  // Create one-hot array for candidateSelection
  const candidateSelection = Array(numCandidates).fill(0);
  if (candidateIndex < numCandidates) {
    candidateSelection[candidateIndex] = 1;
  }

  const inputs = {
    root: "0", // Will be replaced by real root from contract
    electionId: electionId,
    ciphertextHash: "123456789", // Mock hash for now
    privateCredential: "123", // Mock credential
    pathElements: Array(20).fill("0"),
    pathIndices: Array(20).fill(0),
    candidateSelection
  };

  try {
    // R16: In-browser proof generation with snarkjs
    // We assume the wasm and zkey files are available in the public folder.
    // Since this is a measurement test on weak hardware, we'll measure the actual call.
    const { proof, publicSignals } = await snarkjs.plonk.fullProve(
      inputs,
      "/main.wasm",
      "/main.zkey"
    );
    return { proof, publicSignals };
  } catch (error) {
    console.warn("ZKP files not found. Returning mock proof for measurement.", error);
    // Return mock if files are not served (e.g., in dev without compiled circuits)
    // To properly test R16, the files must be placed in public/
    return {
      proof: { mock: true, pi_a: [], pi_b: [], pi_c: [] },
      publicSignals: [inputs.root, inputs.electionId, inputs.ciphertextHash]
    };
  }
};
