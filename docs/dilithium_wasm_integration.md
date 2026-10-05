# Dilithium WASM Integration Guide (For Arnav) [C12]

To enable the Kiosk frontend (React) to sign vote payloads post-quantumly before sending them to the blockchain or tally nodes, we need to use a WASM-compiled version of `liboqs`.

## 1. Building liboqs for WASM
Use Emscripten (`emcc`) to compile the C library. 
```bash
git clone https://github.com/open-quantum-safe/liboqs.git
cd liboqs
mkdir build && cd build
emcmake cmake -DOQS_USE_OPENSSL=OFF -DBUILD_SHARED_LIBS=OFF -DCMAKE_INSTALL_PREFIX=../emscripten-out ..
emmake make -j
```

## 2. Using it in the Frontend
We will wrap the WASM module into an NPM package or serve it statically.
Arnav, you will load the WASM module during the Kiosk initialization:

```javascript
import OQSModule from './liboqs.js';

let oqs;
OQSModule().then(module => {
    oqs = module;
    console.log("Post-Quantum signer initialized.");
});

// During vote submission:
function signVotePayload(payload) {
    const signer = new oqs.Dilithium2();
    const signature = signer.sign(payload);
    return signature;
}
```

## 3. Integration with ZKP
The signature should cover:
`Hash(electionId || nullifier || ciphertextHash)`
This ensures the Kiosk signed the exact vote package that is being submitted.
