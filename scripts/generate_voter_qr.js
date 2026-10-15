/**
 * generate_voter_qr.js
 *
 * Generates a signed EPIC voter QR code payload using the hardhat ECI private key.
 * The ECI_PUBLIC_KEY in epicAuth.ts is: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
 * That is hardhat account #1, private key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
 *
 * Usage: node scripts/generate_voter_qr.js
 * Then open the generated voter_qr.html in a browser and screenshot/print the QR.
 */

import { ethers } from 'ethers';
import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Hardhat account #1 (ECI signer) ──
const ECI_PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const ECI_PUBLIC_KEY  = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

// ── Demo voters ──
const voters = [
  { epicHash: '1234567890', constituencyId: 'C001', name: 'Demo Voter' },
  { epicHash: 'ARNAV00001', constituencyId: 'C001', name: 'Arnav' },
  { epicHash: 'ANUSHKA002', constituencyId: 'C001', name: 'Anushka' },
  { epicHash: 'SHASHWAT03', constituencyId: 'C001', name: 'Shashwat' },
];

async function generatePayloads() {
  const wallet = new ethers.Wallet(ECI_PRIVATE_KEY);
  console.log(`Signer address: ${wallet.address}`);
  console.log(`Expected ECI:   ${ECI_PUBLIC_KEY}`);
  console.log(`Match: ${wallet.address.toLowerCase() === ECI_PUBLIC_KEY.toLowerCase()}\n`);

  const results = [];

  for (const voter of voters) {
    const message = JSON.stringify({
      epicHash: voter.epicHash,
      constituencyId: voter.constituencyId,
    });

    // Sign the raw keccak256 hash (same as ethers.id used in epicAuth.ts)
    const messageHash = ethers.id(message);
    // signMessage with ethers v6 signs with Ethereum prefix (hashMessage → personal_sign)
    // BUT epicAuth.ts uses recoverAddress(ethers.id(message), sig) — no prefix
    // So we need to sign the raw hash bytes directly
    const signingKey = new ethers.SigningKey(ECI_PRIVATE_KEY);
    const sig = signingKey.sign(messageHash);
    const signature = ethers.Signature.from(sig).serialized;

    const qrPayload = JSON.stringify({
      epicHash: voter.epicHash,
      sig: signature,
    });

    // Verify locally
    const recovered = ethers.recoverAddress(messageHash, signature);
    const valid = recovered.toLowerCase() === ECI_PUBLIC_KEY.toLowerCase();

    results.push({
      name: voter.name,
      epicHash: voter.epicHash,
      signature,
      qrPayload,
      valid,
    });

    console.log(`Voter: ${voter.name} (${voter.epicHash})`);
    console.log(`  Signature: ${signature.slice(0, 30)}...`);
    console.log(`  Locally valid: ${valid}`);
    console.log(`  QR Payload: ${qrPayload.slice(0, 60)}...`);
    console.log();
  }

  // ── Generate HTML file with QR codes ──
  const qrcodeScript = `<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>`;

  const cards = results.map((r, i) => `
    <div class="card">
      <h2>${r.name}</h2>
      <p class="epic">EPIC: <strong>${r.epicHash}</strong></p>
      <div id="qr${i}" class="qr-wrap"></div>
      <p class="status ${r.valid ? 'ok' : 'err'}">${r.valid ? '✅ Cryptographically signed by ECI' : '❌ Verification failed'}</p>
      <details>
        <summary>Raw payload (for debugging)</summary>
        <pre>${r.qrPayload}</pre>
      </details>
      <script>
        new QRCode(document.getElementById('qr${i}'), {
          text: ${JSON.stringify(r.qrPayload)},
          width: 256,
          height: 256,
          correctLevel: QRCode.CorrectLevel.M
        });
      </script>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>TrustBallot – Dummy Voter QR Codes</title>
  ${qrcodeScript}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0D233A;
      color: #f0f4f8;
      min-height: 100vh;
      padding: 2rem;
    }
    h1 {
      text-align: center;
      font-size: 2rem;
      color: #028090;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      text-align: center;
      color: #94a3b8;
      margin-bottom: 2.5rem;
      font-size: 0.95rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    .card {
      background: #1e3a5f;
      border: 1px solid #028090;
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 4px 24px rgba(2,128,144,0.2);
    }
    .card h2 { font-size: 1.3rem; color: #e2e8f0; }
    .epic { font-size: 0.85rem; color: #94a3b8; }
    .qr-wrap {
      background: white;
      padding: 12px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .status { font-size: 0.85rem; font-weight: 600; }
    .ok  { color: #4ade80; }
    .err { color: #f87171; }
    details { width: 100%; font-size: 0.75rem; }
    summary { cursor: pointer; color: #028090; margin-bottom: 0.5rem; }
    pre {
      background: #0d233a;
      padding: 0.75rem;
      border-radius: 8px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: #94a3b8;
      font-size: 0.65rem;
      line-height: 1.4;
    }
    .instructions {
      max-width: 700px;
      margin: 2rem auto 0;
      background: #1e3a5f;
      border: 1px solid #028090;
      border-radius: 12px;
      padding: 1.5rem;
    }
    .instructions h3 { color: #028090; margin-bottom: 1rem; }
    .instructions ol { padding-left: 1.25rem; line-height: 2; color: #cbd5e1; }
    .instructions code {
      background: #0d233a;
      padding: 2px 6px;
      border-radius: 4px;
      color: #38bdf8;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <h1>🗳️ TrustBallot Voter QR Codes</h1>
  <p class="subtitle">Dummy EPIC credentials signed with the ECI test key · Scan with the kiosk camera</p>
  <div class="grid">
    ${cards}
  </div>

  <div class="instructions">
    <h3>📋 How to use</h3>
    <ol>
      <li>Start the kiosk: <code>cd master-kiosk &amp;&amp; npm run dev</code></li>
      <li>Open the kiosk in your browser and reach the <strong>QR scan step</strong></li>
      <li>Open this HTML file on a <strong>second screen or phone</strong></li>
      <li>Hold a QR code up to the kiosk camera — it will scan automatically</li>
      <li>After QR scan, continue to face-match (click <strong>Demo: Force Pass</strong>)</li>
      <li>Enter PIN <code>1234</code> (or duress PIN <code>9999</code>) to complete voting</li>
    </ol>
  </div>
</body>
</html>`;

  const outPath = path.join(__dirname, '..', 'voter_qr_codes.html');
  const stream = createWriteStream(outPath);
  stream.write(html);
  stream.end();
  stream.on('finish', () => {
    console.log(`\n✅ Generated: ${outPath}`);
    console.log('Open voter_qr_codes.html in your browser to see the QR codes.');
  });
}

generatePayloads().catch(console.error);
