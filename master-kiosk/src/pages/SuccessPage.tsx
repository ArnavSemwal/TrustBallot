import { useEffect, useState } from 'react';
import { useKiosk } from '../context/KioskContext';
import { QRCodeSVG } from 'qrcode.react';

const t = {
  en: {
    successTitle: 'Vote Recorded Successfully',
    yourVoteFor: 'Your vote',
    hasBeenSealed: ' has been securely cast and cryptographically sealed.',
    receiptInfo:
      'Scan this QR code with your phone camera or click below to verify your ballot on the audit console.',
    trackerLabel: 'Receipt Tracker ID',
    copy: 'Copy',
    copied: '✓ Copied',
    verifyBtn: 'Verify on Audit Console',
    resettingIn: 'Resetting for next voter in',
    resetNow: 'Reset Kiosk Now',
  },
  hi: {
    successTitle: 'वोट सफलतापूर्वक दर्ज किया गया',
    yourVoteFor: 'आपका वोट',
    hasBeenSealed:
      ' सुरक्षित रूप से डाल दिया गया है और क्रिप्टोग्राफ़िक रूप से सील कर दिया गया है।',
    receiptInfo:
      'ऑडिट कंसोल पर अपना वोट सत्यापित करने के लिए अपने फ़ोन कैमरे से इस क्यूआर कोड को स्कैन करें।',
    trackerLabel: 'रसीद ट्रैकर आईडी',
    copy: 'कॉपी करें',
    copied: '✓ कॉपी हुआ',
    verifyBtn: 'ऑडिट कंसोल पर सत्यापित करें',
    resettingIn: 'अगले मतदाता के लिए रीसेट समय:',
    resetNow: 'कियोस्क अभी रीसेट करें',
  },
};

export default function SuccessPage() {
  const { selectedCandidate, resetSession, selectedLanguage, trackerId } = useKiosk();
  const currentLang = t[selectedLanguage] || t.en;
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const verificationUrl = trackerId
    ? typeof window !== 'undefined'
      ? `${window.location.origin}/audit?tracker=${encodeURIComponent(trackerId)}`
      : `https://trustballot.netlify.app/audit?tracker=${encodeURIComponent(trackerId)}`
    : '';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resetSession]);

  const handleCopy = () => {
    if (trackerId && navigator.clipboard) {
      navigator.clipboard.writeText(trackerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!selectedCandidate) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F9F9FB] text-[#0D233A] font-sans select-none px-6 py-4 text-center gap-3 overflow-y-auto">
      <div className="w-14 h-14 rounded-full bg-[#028090]/10 border-4 border-[#028090] flex items-center justify-center text-2xl text-[#028090]">
        ✓
      </div>
      <h1 className="text-2xl md:text-3xl font-bold">{currentLang.successTitle}</h1>
      <p className="text-[#0D233A]/70 max-w-md text-sm md:text-base">
        {currentLang.yourVoteFor}
        {currentLang.hasBeenSealed}
      </p>

      {/* R21: Receipt-Freeness QR Code block */}
      {trackerId && (
        <div className="mt-2 p-5 border-2 border-dashed border-[#028090] rounded-2xl flex flex-col items-center gap-3 bg-white shadow-sm max-w-sm w-full">
          <div className="p-3 bg-white border border-[#e2e8f0] rounded-xl shadow-inner">
            <QRCodeSVG value={verificationUrl} size={150} level="M" fgColor="#0D233A" />
          </div>

          <div className="flex flex-col items-center gap-1 w-full">
            <span className="text-[10px] font-bold text-[#0D233A]/50 uppercase tracking-widest">
              {currentLang.trackerLabel}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#028090] text-xl tracking-wider select-all">
                {trackerId}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-0.5 text-xs font-sans rounded bg-[#028090]/10 hover:bg-[#028090]/20 text-[#028090] border border-[#028090]/30 transition-colors"
                title="Copy Tracker ID"
              >
                {copied ? currentLang.copied : currentLang.copy}
              </button>
            </div>
          </div>

          <p className="text-xs text-[#0D233A]/70 max-w-[280px] leading-relaxed text-center">
            {currentLang.receiptInfo}
          </p>

          <a
            href={verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 px-4 py-2 bg-[#028090] hover:bg-[#026c7a] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>{currentLang.verifyBtn}</span>
            <span className="text-sm">↗</span>
          </a>
        </div>
      )}

      <div className="flex flex-col items-center gap-1 mt-2">
        <p className="text-xs font-mono uppercase tracking-widest text-[#0D233A]/40">
          {currentLang.resettingIn} {countdown}s
        </p>
        <button
          type="button"
          onClick={resetSession}
          className="text-xs text-[#0D233A]/60 hover:text-[#0D233A] underline underline-offset-2 transition-colors cursor-pointer"
        >
          {currentLang.resetNow}
        </button>
      </div>
    </div>
  );
}
