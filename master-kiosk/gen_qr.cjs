const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { QRCodeSVG } = require('qrcode.react');
const fs = require('fs');
const path = require('path');

const VOTERS = [
  {
    name: 'Demo Voter',
    epic: '1234567890',
    sig: '0x2bf29af677289b93f0c3c9d3569979023df1e44d61db62130fbf20c130842104184759cb52e0803178d61ff6da36de82788f30c648e7549693d1e56ddba10aad1b'
  },
  {
    name: 'Arnav',
    epic: 'ARNAV00001',
    sig: '0x5ce47b6eae0c0dd2afc24a92a7727c974e54ce13b0612b9236fbbb856ffec8db19e1f2c01cd7709e408a5eed77ec5484ffb649da99ac76a63070e60b8a297e331b'
  },
  {
    name: 'Anushka',
    epic: 'ANUSHKA002',
    sig: '0x4cd76246b8e5c126f5fa2c241a095f2e594414b17fd72e3dad4a928db9a500ec07f239eb1d67852b56831f3aec8a6e5c4a5a448bc1322e8f41ba9b6612c365d91b'
  },
  {
    name: 'Shashwat',
    epic: 'SHASHWAT03',
    sig: '0x954ebcee38c733bd9d9f27006b21ab5563795f501d720a929677a396e4281d1e22b4009d2df10e572cb62ed15c9475b97fe0af79c2a7d230444a464d17b41d5d1c'
  }
];

let cardsHtml = '';

VOTERS.forEach((v, index) => {
  const jsonPayload = JSON.stringify({ epicHash: v.epic, sig: v.sig });

  // Fast QR: plain 10-char EPIC (viewBox 0 0 21 21) - huge blocks, instantly readable
  const fastSvg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(QRCodeSVG, { value: v.epic, size: 240, level: 'M' })
  );

  // Full cryptographic JSON QR
  const jsonSvg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(QRCodeSVG, { value: jsonPayload, size: 240, level: 'M' })
  );

  cardsHtml += `
    <div class="card">
      <h2>${v.name}</h2>
      <span class="epic-badge">EPIC: ${v.epic}</span>

      <div class="tab-bar">
        <button class="tab-btn active" id="tab-fast-${index}" onclick="switchMode(${index}, 'fast')">⚡ Fast Camera QR</button>
        <button class="tab-btn" id="tab-json-${index}" onclick="switchMode(${index}, 'json')">🔐 Signed JSON</button>
      </div>

      <div class="qr-container">
        <div id="qr-fast-${index}" class="qr-display" style="display: flex; justify-content: center; align-items: center;">
          ${fastSvg}
        </div>
        <div id="qr-json-${index}" class="qr-display" style="display: none; justify-content: center; align-items: center;">
          ${jsonSvg}
        </div>
      </div>

      <span class="status-tag">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ECI Digital Signature Verified
      </span>

      <div class="actions">
        <button class="btn" onclick="copyEpic('${v.epic}')">📋 Copy EPIC</button>
        <button class="btn" onclick="downloadSvg(${index}, '${v.epic}')">📥 Save SVG</button>
      </div>

      <details>
        <summary>View raw JSON payload</summary>
        <pre>${jsonPayload}</pre>
      </details>
    </div>
  `;
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>TrustBallot – Voter QR Codes</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #0D233A;
      color: #f0f4f8;
      min-height: 100vh;
      padding: 2rem 1rem;
    }
    header {
      text-align: center;
      max-width: 800px;
      margin: 0 auto 2.5rem;
    }
    h1 {
      font-size: 2.2rem;
      color: #028090;
      margin-bottom: 0.5rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 1rem;
      line-height: 1.5;
    }
    .scanner-tip-banner {
      background: rgba(2, 128, 144, 0.15);
      border: 1px solid #028090;
      border-radius: 12px;
      padding: 1rem 1.5rem;
      margin: 1.5rem auto 2rem;
      max-width: 850px;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .tip-icon { font-size: 1.8rem; }
    .tip-text { font-size: 0.9rem; color: #e2e8f0; line-height: 1.5; }
    .tip-text strong { color: #38bdf8; }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background: #142a45;
      border: 1px solid rgba(2, 128, 144, 0.4);
      border-radius: 20px;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      position: relative;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: #028090;
    }
    .card h2 { font-size: 1.4rem; color: #f8fafc; font-weight: 700; }
    .epic-badge {
      background: rgba(2, 128, 144, 0.2);
      color: #38bdf8;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .tab-bar {
      display: flex;
      background: #091726;
      border-radius: 10px;
      padding: 3px;
      width: 100%;
      margin-top: 0.25rem;
    }
    .tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 6px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn.active {
      background: #028090;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(2,128,144,0.4);
    }

    .qr-container {
      background: #ffffff;
      padding: 16px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      width: 272px;
      height: 272px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .qr-container svg {
      width: 240px;
      height: 240px;
      display: block;
    }

    .status-tag {
      font-size: 0.82rem;
      font-weight: 600;
      color: #4ade80;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      width: 100%;
    }
    .btn {
      flex: 1;
      padding: 8px 12px;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid rgba(2,128,144,0.5);
      background: rgba(2,128,144,0.15);
      color: #e2e8f0;
      cursor: pointer;
      transition: all 0.15s;
      text-align: center;
    }
    .btn:hover {
      background: #028090;
      color: white;
    }
    details { width: 100%; font-size: 0.75rem; }
    summary { cursor: pointer; color: #38bdf8; margin-bottom: 0.4rem; }
    pre {
      background: #081524;
      padding: 0.6rem;
      border-radius: 8px;
      color: #94a3b8;
      font-size: 0.65rem;
      white-space: pre-wrap;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <header>
    <h1>🗳️ TrustBallot Verified Voter QR Credentials</h1>
    <p class="subtitle">ECI Cryptographically-Signed Test Cards for Instant Kiosk Authentication</p>
    
    <div class="scanner-tip-banner">
      <div class="tip-icon">💡</div>
      <div class="tip-text">
        <strong>Best Camera Scanning Tip:</strong> Hold your phone or card about <strong>12 to 18 inches (30–45 cm)</strong> from the laptop camera so the lens can focus. If scanning off a phone, slightly <strong>lower your screen brightness</strong> to prevent glare!
      </div>
    </div>
  </header>

  <div class="grid">
    ${cardsHtml}
  </div>

  <script>
    function switchMode(index, mode) {
      const fastBtn = document.getElementById('tab-fast-' + index);
      const jsonBtn = document.getElementById('tab-json-' + index);
      const fastBox = document.getElementById('qr-fast-' + index);
      const jsonBox = document.getElementById('qr-json-' + index);

      if (mode === 'fast') {
        fastBtn.classList.add('active');
        jsonBtn.classList.remove('active');
        fastBox.style.display = 'flex';
        jsonBox.style.display = 'none';
      } else {
        jsonBtn.classList.add('active');
        fastBtn.classList.remove('active');
        jsonBox.style.display = 'flex';
        fastBox.style.display = 'none';
      }
    }

    function copyEpic(epic) {
      navigator.clipboard.writeText(epic);
      alert('Copied EPIC ' + epic + ' to clipboard!');
    }

    function downloadSvg(index, epic) {
      const fastBox = document.getElementById('qr-fast-' + index);
      const jsonBox = document.getElementById('qr-json-' + index);
      const activeSvg = (fastBox.style.display !== 'none' ? fastBox : jsonBox).querySelector('svg');
      if (activeSvg) {
        const svgData = new XMLSerializer().serializeToString(activeSvg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'TrustBallot_QR_' + epic + '.svg';
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  </script>
</body>
</html>`;

const outPath = path.resolve(__dirname, '../voter_qr_codes.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('SUCCESS: Generated', outPath, 'Length:', html.length);
