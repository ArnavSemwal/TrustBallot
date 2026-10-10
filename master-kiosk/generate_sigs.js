import { ethers } from 'ethers';

const pk = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const wallet = new ethers.Wallet(pk);
console.log('Wallet address:', wallet.address);

async function signPayload(epicHash) {
    const message = JSON.stringify({
      epicHash: epicHash,
      constituencyId: "C001"
    });
    const messageHash = ethers.id(message);
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));
    console.log(epicHash, signature);
}

signPayload('ARNAV00001');
signPayload('ANUSHKA002');
signPayload('SHASHWAT03');
