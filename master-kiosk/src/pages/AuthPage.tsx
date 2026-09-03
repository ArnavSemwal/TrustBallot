import { useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import logo from '../imports/ymmetry.png';
import { useKiosk } from '../context/KioskContext';

function QRCodeSVG() {
  return (
    <svg viewBox="0 0 80 80" className="w-28 h-28 text-[#028090]" fill="currentColor" aria-hidden="true">
      <rect x="4" y="4" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="10" y="10" width="12" height="12" rx="1" />
      <rect x="52" y="4" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="58" y="10" width="12" height="12" rx="1" />
      <rect x="4" y="52" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="10" y="58" width="12" height="12" rx="1" />
      <rect x="34" y="4" width="12" height="4" rx="1" />
      <rect x="34" y="12" width="8" height="4" rx="1" />
      <rect x="34" y="20" width="12" height="4" rx="1" />
      <rect x="34" y="34" width="4" height="4" rx="1" />
      <rect x="42" y="34" width="4" height="4" rx="1" />
      <rect x="52" y="34" width="4" height="4" rx="1" />
      <rect x="60" y="34" width="4" height="4" rx="1" />
      <rect x="68" y="34" width="8" height="4" rx="1" />
      <rect x="34" y="42" width="8" height="4" rx="1" />
      <rect x="52" y="42" width="4" height="4" rx="1" />
      <rect x="60" y="42" width="12" height="4" rx="1" />
      <rect x="34" y="52" width="4" height="4" rx="1" />
      <rect x="42" y="52" width="12" height="4" rx="1" />
      <rect x="34" y="60" width="8" height="4" rx="1" />
      <rect x="52" y="60" width="4" height="4" rx="1" />
      <rect x="60" y="52" width="4" height="4" rx="1" />
      <rect x="68" y="52" width="8" height="4" rx="1" />
      <rect x="52" y="68" width="12" height="8" rx="1" />
      <rect x="68" y="60" width="8" height="4" rx="1" />
    </svg>
  );
}

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

type AuthStep = 'qr' | 'webcam';
type ScanPhase = 'scanning' | 'success';

const t = {
  en: {
    step1: "Step 1 of 2: Voter Verification",
    scanQr: "Scan Your Voter ID / EPIC QR Code",
    awaitingQr: "Awaiting QR Code",
    holdQr: "Hold your QR code inside the frame",
    enterEpic: "Enter EPIC Number Manually",
    verifyProceed: "Verify & Proceed",
    step2: "Step 2 of 2: Biometric Verification",
    verifying: "Verifying Biometrics…",
    verified: "Identity Verified",
    holdStill: "Hold still — matching against EPIC record",
    proceeding: "Proceeding to secure ballot…",
    consortium: "Consortium Secured Session",
    placeholder: "e.g. 1234567890",
    langToggle: "English ⇄ हिंदी"
  },
  hi: {
    step1: "चरण 1: मतदाता सत्यापन",
    scanQr: "अपना वोटर आईडी / एपिक क्यूआर कोड स्कैन करें",
    awaitingQr: "क्यूआर कोड की प्रतीक्षा है",
    holdQr: "अपना क्यूआर कोड फ्रेम के अंदर रखें",
    enterEpic: "एपिक नंबर मैन्युअल रूप से दर्ज करें",
    verifyProceed: "सत्यापित करें और आगे बढ़ें",
    step2: "चरण 2: बायोमेट्रिक सत्यापन",
    verifying: "बायोमेट्रिक्स सत्यापित हो रहा है…",
    verified: "पहचान सत्यापित",
    holdStill: "स्थिर रहें — एपिक रिकॉर्ड से मिलान किया जा रहा है",
    proceeding: "सुरक्षित बैलेट की ओर बढ़ रहे हैं…",
    consortium: "कंसोर्टियम सुरक्षित सत्र",
    placeholder: "उदा. 1234567890",
    langToggle: "हिंदी ⇄ English"
  }
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { setVoterVerified, selectedLanguage, setSelectedLanguage } = useKiosk();
  const currentLang = t[selectedLanguage];

  const [authStep, setAuthStep] = useState<AuthStep>('qr');

  // ── Step 1: EPIC/QR entry state ──
  const [epicNumber, setEpicNumber] = useState('');
  function pressKey(val: string) {
    setEpicNumber(prev => (prev.length < 10 ? prev + val : prev));
  }
  function clearAll() { setEpicNumber(''); }
  function deleteLast() { setEpicNumber(prev => prev.slice(0, -1)); }

  function handleVerifyEpic() {
    if (epicNumber.length !== 10) return;
    setAuthStep('webcam');
  }

  // ── Step 2: Face-match stub ──
  const [scanPhase, setScanPhase] = useState<ScanPhase>('scanning');

  useEffect(() => {
    if (authStep !== 'webcam') return;
    setScanPhase('scanning');

    // Mock biometric pass — per PRD, real ML match is Post-MVP.
    const verifyTimer = setTimeout(() => setScanPhase('success'), 3000);
    const advanceTimer = setTimeout(() => {
      setVoterVerified(epicNumber);
      navigate('/ballot', { replace: true });
    }, 4000); // 3s scan + 1s success flash then jump to ballot

    return () => {
      clearTimeout(verifyTimer);
      clearTimeout(advanceTimer);
    };
  }, [authStep, epicNumber, navigate, setVoterVerified]);

  // ═══════════════════════════════════════════════════════════
  // STEP 2 UI — Face-match stub (Light Theme Consistent)
  // ═══════════════════════════════════════════════════════════
  if (authStep === 'webcam') {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F9F9FB] text-[#0D233A] font-sans select-none">
        <style>{`
          @keyframes scan-laser {
            0%   { top: 4%; }
            50%  { top: 92%; }
            100% { top: 4%; }
          }
          .animate-scan-laser {
            animation: scan-laser 2.2s ease-in-out infinite;
          }
        `}</style>

        {/* ── HEADER 15vh ── */}
        <header className="h-[15vh] shrink-0 flex flex-col relative justify-center">
          <div className="w-full flex items-center justify-between px-6">
            <img
              src={logo}
              alt="TrustBallot"
              className="h-[130px] w-[183px] object-contain mix-blend-multiply relative z-10"
            />

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-0 w-full pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#028090]/10 text-[#028090] text-xs font-semibold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-[#028090] animate-pulse"></span>
                {currentLang.step2}
              </div>
              <h1 className="text-2xl font-bold text-[#0D233A] text-center tracking-tight" style={{ lineHeight: '32px' }}>
                {scanPhase === 'scanning' ? currentLang.verifying : currentLang.verified}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setSelectedLanguage(selectedLanguage === 'en' ? 'hi' : 'en')}
              className="rounded-full border-2 border-[#028090] px-5 py-1.5 text-sm font-semibold text-[#028090] hover:bg-[#028090] hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#F4A261] focus:ring-offset-2 relative z-10"
            >
              {currentLang.langToggle}
            </button>
          </div>
          <div className="absolute bottom-0 left-8 right-8 h-px bg-[#0D233A]/10" />
        </header>

        {/* ── MAIN BODY 70vh (Webcam View) ── */}
        <main className="h-[70vh] shrink-0 flex flex-col items-center justify-center gap-4 px-8 overflow-hidden">
          <div className="relative w-[380px] h-[380px] rounded-3xl overflow-hidden border-4 border-[#028090] shadow-[0_12px_40px_rgba(2,128,144,0.2)] bg-white">
            <Webcam
              audio={false}
              mirrored
              videoConstraints={{ facingMode: 'user' }}
              className="w-full h-full object-cover"
            />

            {/* Corner brackets */}
            <span className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#028090] rounded-tl-lg pointer-events-none" />
            <span className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#028090] rounded-tr-lg pointer-events-none" />
            <span className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#028090] rounded-bl-lg pointer-events-none" />
            <span className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#028090] rounded-br-lg pointer-events-none" />

            {scanPhase === 'scanning' ? (
              <div className="animate-scan-laser pointer-events-none absolute left-4 right-4 h-[3px] rounded-full bg-[#028090] shadow-[0_0_10px_2px_rgba(2,128,144,0.8)]" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#028090]/20 backdrop-blur-xs">
                <div className="w-24 h-24 rounded-full bg-[#028090]/20 border-4 border-[#028090] flex items-center justify-center text-5xl text-[#028090] font-bold shadow-lg">
                  ✓
                </div>
              </div>
            )}
          </div>

          <p className="text-xs uppercase tracking-widest text-[#0D233A]/60 font-semibold text-center">
            {scanPhase === 'scanning' ? currentLang.holdStill : currentLang.proceeding}
          </p>
        </main>

        {/* ── FOOTER 15vh ── */}
        <footer className="h-[15vh] shrink-0 flex flex-col items-center justify-center gap-1 px-8">
          <div className="w-full mx-auto mb-3 h-px bg-[#0D233A]/10 max-w-4xl" />
          <p className="text-xs font-semibold text-[#028090] uppercase tracking-wider">
            {currentLang.consortium}
          </p>
        </footer>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 1 UI — QR/EPIC entry (Original Light Theme)
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F9F9FB] text-[#0D233A] font-sans select-none">

      {/* ── HEADER 15vh ── */}
      <header className="h-[15vh] shrink-0 flex flex-col relative justify-center">
        <div className="w-full flex items-center justify-between px-6">
          <img
            src={logo}
            alt="TrustBallot"
            className="h-[130px] w-[183px] object-contain mix-blend-multiply relative z-10"
          />

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-0 w-full pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#028090]/10 text-[#028090] text-xs font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#028090] animate-pulse"></span>
              {currentLang.step1}
            </div>
            <h1 className="text-2xl font-bold text-[#0D233A] text-center tracking-tight" style={{ lineHeight: '32px' }}>
              {currentLang.scanQr}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setSelectedLanguage(selectedLanguage === 'en' ? 'hi' : 'en')}
            className="rounded-full border-2 border-[#028090] px-5 py-1.5 text-sm font-semibold text-[#028090] hover:bg-[#028090] hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#F4A261] focus:ring-offset-2 relative z-10"
          >
            {currentLang.langToggle}
          </button>
        </div>

        <div className="absolute bottom-0 left-8 right-8 h-px bg-[#0D233A]/10" />
      </header>

      {/* ── MAIN BODY 70vh ── */}
      <main className="h-[70vh] shrink-0 grid grid-cols-2 gap-0 px-8 py-4 overflow-hidden">

        {/* LEFT: Scanner */}
        <div className="flex flex-col items-center justify-center gap-3 pr-6 border-r border-[#0D233A]/10">
          <div
            className="relative aspect-square border-4 border-dashed border-[#028090] rounded-2xl flex flex-col items-center justify-center bg-white/70 overflow-hidden"
            style={{ height: 'min(42vw, 54vh)' }}
            aria-label="QR code scanner area"
          >
            <span className="absolute top-2.5 left-2.5 w-7 h-7 border-t-[3px] border-l-[3px] border-[#028090] rounded-tl-lg" />
            <span className="absolute top-2.5 right-2.5 w-7 h-7 border-t-[3px] border-r-[3px] border-[#028090] rounded-tr-lg" />
            <span className="absolute bottom-2.5 left-2.5 w-7 h-7 border-b-[3px] border-l-[3px] border-[#028090] rounded-bl-lg" />
            <span className="absolute bottom-2.5 right-2.5 w-7 h-7 border-b-[3px] border-r-[3px] border-[#028090] rounded-br-lg" />

            <QRCodeSVG />

            <p className="mt-3 text-xs font-medium uppercase tracking-widest text-[#028090] opacity-60">
              {currentLang.awaitingQr}
            </p>

            <div className="scanner-laser absolute left-4 right-4 h-[3px] rounded-full bg-[#028090] opacity-75 shadow-[0_0_8px_2px_#028090]" />
          </div>

          <p className="text-sm font-medium text-[#0D233A] opacity-65 text-center">
            {currentLang.holdQr}
          </p>
        </div>

        {/* RIGHT: Manual Entry */}
        <div className="flex flex-col justify-center gap-3 pl-6 overflow-hidden">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#0D233A] opacity-60">
              {currentLang.enterEpic}
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={epicNumber}
                placeholder={currentLang.placeholder}
                aria-label="EPIC number input"
                className="w-full rounded-xl border-2 border-[#028090]/40 bg-white px-5 py-4 text-3xl font-bold tracking-[0.25em] text-[#0D233A] placeholder:text-[#0D233A]/20 placeholder:text-lg placeholder:tracking-normal focus:outline-none focus:border-[#028090] transition-colors"
              />
              {epicNumber.length > 0 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#028090]">
                  {epicNumber.length}/10
                </span>
              )}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5">
            {PAD_KEYS.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => pressKey(n)}
                className="rounded-xl bg-[#0D233A] text-white text-2xl font-bold py-3.5 hover:bg-[#028090] active:scale-95 active:bg-[#026d7d] transition-all duration-100 focus:outline-none focus:ring-4 focus:ring-[#F4A261] focus:ring-offset-1 shadow-md"
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl bg-[#E2E8F0] text-[#0D233A] text-base font-bold py-3.5 hover:bg-[#cbd5e1] active:scale-95 transition-all duration-100 focus:outline-none focus:ring-4 focus:ring-[#F4A261] focus:ring-offset-1 shadow-md"
            >
              CLR
            </button>
            <button
              type="button"
              onClick={() => pressKey('0')}
              className="rounded-xl bg-[#0D233A] text-white text-2xl font-bold py-3.5 hover:bg-[#028090] active:scale-95 transition-all duration-100 focus:outline-none focus:ring-4 focus:ring-[#F4A261] focus:ring-offset-1 shadow-md"
            >
              0
            </button>
            <button
              type="button"
              onClick={deleteLast}
              className="rounded-xl bg-[#0D233A]/50 text-white text-xl font-bold py-3.5 hover:bg-[#0D233A] active:scale-95 transition-all duration-100 focus:outline-none focus:ring-4 focus:ring-[#F4A261] focus:ring-offset-1 shadow-md"
              aria-label="Delete last digit"
            >
              ⌫
            </button>
          </div>
        </div>
      </main>

      {/* ── FOOTER 15vh ── */}
      <footer className="h-[15vh] shrink-0 flex flex-col items-center justify-center gap-1 px-8">
        <div className="w-full mx-auto mb-3 h-px bg-[#0D233A]/10 max-w-4xl" />
        <button
          type="button"
          onClick={handleVerifyEpic}
          disabled={epicNumber.length !== 10}
          className="rounded-2xl bg-[#028090] px-20 py-4 text-white text-xl font-bold shadow-[0_8px_32px_rgba(2,128,144,0.35)] hover:bg-[#026d7d] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F4A261] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {currentLang.verifyProceed}
        </button>
      </footer>
    </div>
  );
}