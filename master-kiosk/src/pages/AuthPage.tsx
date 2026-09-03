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

type AuthStep = 'qr' | 'webcam' | 'pin';
type ScanPhase = 'scanning' | 'success' | 'fail';

const t = {
  en: {
    step1: "Step 1 of 3: Voter Verification",
    scanQr: "Scan Your Voter ID / EPIC QR Code",
    awaitingQr: "Awaiting QR Code",
    holdQr: "Hold your QR code inside the frame",
    enterEpic: "Enter EPIC Number Manually",
    verifyProceed: "Verify & Proceed",
    step2: "Step 2 of 3: Biometric Verification",
    verifying: "Verifying Biometrics…",
    verified: "Identity Verified",
    verifyFailed: "Verification Failed",
    holdStill: "Hold still — matching against EPIC record",
    tryAgain: "Try Again",
    proceeding: "Proceeding to secure ballot…",
    demoForcePass: "Demo: Force Pass",
    demoForceFail: "Demo: Force Fail",
    step3: "Step 3 of 3: Secure Voting PIN",
    enterPin: "Enter your 4-digit voting PIN",
    pinPlaceholder: "XXXX",
    submitPin: "Confirm Identity",
    consortium: "Consortium Secured Session",
    placeholder: "e.g. 1234567890",
    langToggle: "English ⇄ हिंदी"
  },
  hi: {
    step1: "चरण 1 (3 में से): मतदाता सत्यापन",
    scanQr: "अपना वोटर आईडी / एपिक क्यूआर कोड स्कैन करें",
    awaitingQr: "क्यूआर कोड की प्रतीक्षा है",
    holdQr: "अपना क्यूआर कोड फ्रेम के अंदर रखें",
    enterEpic: "एपिक नंबर मैन्युअल रूप से दर्ज करें",
    verifyProceed: "सत्यापित करें और आगे बढ़ें",
    step2: "चरण 2 (3 में से): बायोमेट्रिक सत्यापन",
    verifying: "बायोमेट्रिक्स सत्यापित हो रहा है…",
    verified: "पहचान सत्यापित",
    verifyFailed: "सत्यापन विफल रहा",
    holdStill: "स्थिर रहें — एपिक रिकॉर्ड से मिलान किया जा रहा है",
    tryAgain: "पुनः प्रयास करें",
    proceeding: "सुरक्षित बैलेट की ओर बढ़ रहे हैं…",
    demoForcePass: "डेमो: फोर्स पास (सफल)",
    demoForceFail: "डेमो: फोर्स फेल (असफल)",
    step3: "चरण 3 (3 में से): सुरक्षित वोटिंग पिन",
    enterPin: "अपना 4 अंकों का वोटिंग पिन दर्ज करें",
    pinPlaceholder: "XXXX",
    submitPin: "पहचान की पुष्टि करें",
    consortium: "कंसोर्टियम सुरक्षित सत्र",
    placeholder: "उदा. 1234567890",
    langToggle: "हिंदी ⇄ English"
  }
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { setVoterVerified, selectedLanguage, setSelectedLanguage, setDuressMode } = useKiosk();
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
  }, [authStep]);

  const handleDemoFacePass = () => {
    setScanPhase('success');
    setTimeout(() => {
      setAuthStep('pin');
    }, 1500);
  };

  const handleDemoFaceFail = () => {
    setScanPhase('fail');
  };

  // ── Step 3: PIN ──
  const [pinNumber, setPinNumber] = useState('');
  function pressPinKey(val: string) {
    setPinNumber(prev => (prev.length < 4 ? prev + val : prev));
  }
  function clearPin() { setPinNumber(''); }
  function deleteLastPin() { setPinNumber(prev => prev.slice(0, -1)); }

  function handleSubmitPin() {
    if (pinNumber.length !== 4) return;
    
    // Check for Duress PIN (e.g. 9999)
    if (pinNumber === '9999') {
      setDuressMode(true);
    } else {
      setDuressMode(false);
    }
    
    setVoterVerified(epicNumber);
    navigate('/ballot', { replace: true });
  }

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
                <span className={`w-2 h-2 rounded-full ${scanPhase === 'fail' ? 'bg-red-500' : 'bg-[#028090] animate-pulse'}`}></span>
                {currentLang.step2}
              </div>
              <h1 className="text-2xl font-bold text-[#0D233A] text-center tracking-tight" style={{ lineHeight: '32px' }}>
                {scanPhase === 'scanning' ? currentLang.verifying : scanPhase === 'fail' ? currentLang.verifyFailed : currentLang.verified}
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
          <div className={`relative w-[380px] h-[380px] rounded-3xl overflow-hidden border-4 shadow-xl bg-white ${scanPhase === 'fail' ? 'border-red-500' : scanPhase === 'success' ? 'border-green-500' : 'border-[#028090]'}`}>
            <Webcam
              audio={false}
              mirrored
              videoConstraints={{ facingMode: 'user' }}
              className="w-full h-full object-cover"
            />

            {/* Corner brackets */}
            <span className={`absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg pointer-events-none ${scanPhase === 'fail' ? 'border-red-500' : scanPhase === 'success' ? 'border-green-500' : 'border-[#028090]'}`} />
            <span className={`absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 rounded-tr-lg pointer-events-none ${scanPhase === 'fail' ? 'border-red-500' : scanPhase === 'success' ? 'border-green-500' : 'border-[#028090]'}`} />
            <span className={`absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 rounded-bl-lg pointer-events-none ${scanPhase === 'fail' ? 'border-red-500' : scanPhase === 'success' ? 'border-green-500' : 'border-[#028090]'}`} />
            <span className={`absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 rounded-br-lg pointer-events-none ${scanPhase === 'fail' ? 'border-red-500' : scanPhase === 'success' ? 'border-green-500' : 'border-[#028090]'}`} />

            {/* Laser Line */}
            {scanPhase === 'scanning' && (
              <div className="absolute left-0 w-full h-[2px] bg-[#F4A261] shadow-[0_0_15px_#F4A261] animate-scan-laser pointer-events-none z-10" />
            )}
            
            {/* Fail Overlay */}
            {scanPhase === 'fail' && (
              <div className="absolute inset-0 bg-red-900/30 flex items-center justify-center z-10 backdrop-blur-sm">
                <div className="bg-white px-6 py-3 rounded-xl shadow-lg border-2 border-red-500 text-center">
                  <p className="text-red-600 font-bold mb-2">{currentLang.verifyFailed}</p>
                  <button 
                    onClick={() => setScanPhase('scanning')}
                    className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600"
                  >
                    {currentLang.tryAgain}
                  </button>
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {scanPhase === 'success' && (
              <div className="absolute inset-0 bg-[#028090]/20 flex items-center justify-center z-10 backdrop-blur-sm">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(2,128,144,0.6)]">
                  <svg className="w-10 h-10 text-[#028090]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center w-full max-w-sm mt-2 min-h-[24px]">
            {scanPhase === 'scanning' && (
              <p className="text-[#0D233A]/60 font-medium tracking-wide text-[15px] animate-pulse">
                {currentLang.holdStill}
              </p>
            )}
            {scanPhase === 'success' && (
              <p className="text-[#028090] font-bold tracking-wide text-lg animate-pulse">
                {currentLang.proceeding}
              </p>
            )}
          </div>
          
          {/* ── Demo Toggle Buttons ── */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleDemoFacePass}
              className="px-4 py-2 border-2 border-green-500 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              {currentLang.demoForcePass}
            </button>
            <button
              onClick={handleDemoFaceFail}
              className="px-4 py-2 border-2 border-red-500 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              {currentLang.demoForceFail}
            </button>
          </div>
        </main>

        {/* ── FOOTER 15vh ── */}
        <footer className="h-[15vh] shrink-0 flex items-center justify-center">
          <div className="inline-flex items-center justify-center rounded-2xl border-2 border-[#0D233A]/10 bg-white/50 px-8 py-4 backdrop-blur-sm">
            <svg className="mr-3 h-5 w-5 text-[#028090]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-semibold tracking-widest text-[#0D233A]/60 uppercase">
              {currentLang.consortium}
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 3 UI — PIN Entry
  // ═══════════════════════════════════════════════════════════
  if (authStep === 'pin') {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F9F9FB] text-[#0D233A] font-sans select-none">
        {/* ── HEADER 15vh ── */}
        <header className="h-[15vh] shrink-0 flex flex-col relative justify-center">
          <div className="w-full flex items-center justify-between px-6">
            <img src={logo} alt="TrustBallot" className="h-[130px] w-[183px] object-contain mix-blend-multiply relative z-10" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-0 w-full pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#028090]/10 text-[#028090] text-xs font-semibold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-[#028090] animate-pulse"></span>
                {currentLang.step3}
              </div>
              <h1 className="text-2xl font-bold text-[#0D233A] text-center tracking-tight" style={{ lineHeight: '32px' }}>
                {currentLang.enterPin}
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
        <main className="h-[70vh] shrink-0 flex flex-col items-center justify-center gap-8 px-8">
          <div className="flex flex-col items-center max-w-sm w-full gap-8">
            
            {/* PIN Display */}
            <div className="w-full relative">
              <input
                type="text"
                readOnly
                value={pinNumber}
                placeholder={currentLang.pinPlaceholder}
                className="w-full text-center text-4xl font-mono tracking-[0.5em] font-bold text-[#0D233A] bg-white border-2 border-gray-200 rounded-2xl py-6 shadow-inner focus:outline-none placeholder:text-gray-300"
              />
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {PAD_KEYS.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => pressPinKey(n)}
                  className="rounded-xl bg-[#0D233A] text-white text-2xl font-bold py-4 hover:bg-[#028090] active:scale-95 transition-all duration-100 shadow-md"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={clearPin}
                className="rounded-xl bg-[#E2E8F0] text-[#0D233A] text-base font-bold py-4 hover:bg-[#cbd5e1] active:scale-95 transition-all duration-100 shadow-md"
              >
                CLR
              </button>
              <button
                type="button"
                onClick={() => pressPinKey('0')}
                className="rounded-xl bg-[#0D233A] text-white text-2xl font-bold py-4 hover:bg-[#028090] active:scale-95 transition-all duration-100 shadow-md"
              >
                0
              </button>
              <button
                type="button"
                onClick={deleteLastPin}
                className="rounded-xl bg-[#0D233A]/50 text-white text-xl font-bold py-4 hover:bg-[#0D233A] active:scale-95 transition-all duration-100 shadow-md"
              >
                ⌫
              </button>
            </div>
            
            <p className="text-xs text-center text-gray-400 max-w-[300px]">
              {selectedLanguage === 'hi' ? (
                <>डेमो टिप: डुरेस पिन (Duress PIN) ट्रिगर करने के लिए <span className="font-mono bg-gray-100 px-1 rounded text-gray-500">9999</span> दर्ज करें।</>
              ) : (
                <>Tip for Demo: Enter <span className="font-mono bg-gray-100 px-1 rounded text-gray-500">9999</span> to trigger Duress PIN silent spoof.</>
              )}
            </p>
          </div>
        </main>

        {/* ── FOOTER 15vh ── */}
        <footer className="h-[15vh] shrink-0 flex flex-col items-center justify-center gap-1 px-8">
          <div className="w-full mx-auto mb-3 h-px bg-[#0D233A]/10 max-w-4xl" />
          <button
            type="button"
            onClick={handleSubmitPin}
            disabled={pinNumber.length !== 4}
            className="rounded-2xl bg-[#028090] px-20 py-4 text-white text-xl font-bold shadow-[0_8px_32px_rgba(2,128,144,0.35)] hover:bg-[#026d7d] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F4A261] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentLang.submitPin}
          </button>
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