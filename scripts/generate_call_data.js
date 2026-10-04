import * as snarkjs from "snarkjs";
import fs from "fs";

async function main() {
    const proof = JSON.parse(fs.readFileSync('circuits/proof.json'));
    const publicSignals = JSON.parse(fs.readFileSync('circuits/public.json'));
    const callData = await snarkjs.plonk.exportSolidityCallData(proof, publicSignals);
    console.log(callData);
}
main();
