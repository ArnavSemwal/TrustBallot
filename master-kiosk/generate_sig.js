import { ethers } from 'ethers';

async function main() {
  const wallet = new ethers.Wallet('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
  
  const payload = { epicHash: "1234567890", constituencyId: "C001" };
  const message = JSON.stringify(payload);
  const messageHash = ethers.id(message);
  
  const signingKey = new ethers.SigningKey(wallet.privateKey);
  const signature = signingKey.sign(messageHash);
  
  console.log("Signature:", signature.serialized);
}
main();
