import { useEffect } from 'react';
import { useKiosk } from '../context/KioskContext';
import { QRCodeSVG } from 'qrcode.react';

const t = {
  en: {
    successTitle: 'Vote Recorded Successfully',
    yourVoteFor: 'Your vote',
    hasBeenSealed: ' has been securely cast and cryptographically sealed.',
    receiptInfo: 'Take a photo of this code to verify your vote on the audit dashboard.',
    resetting: 'Resetting for next voter…',
  },
  hi: {
    successTitle: 'वोट सफलतापूर्वक दर्ज किया गया',
    yourVoteFor: 'आपका वोट',
    hasBeenSealed:
      ' सुरक्षित रूप से डाल दिया गया है और क्रिप्टोग्राफ़िक रूप से सील कर दिया गया है।',
    receiptInfo: 'ऑडिट डैशबोर्ड पर अपना वोट सत्यापित करने के लिए इस कोड की एक तस्वीर लें।',
    resetting: 'अगले मतदाता के लिए रीसेट किया जा रहा है…',
  },
};

export default function SuccessPage() {
  const { selectedCandidate, resetSession, selectedLanguage, trackerId } = useKiosk();
  const currentLang = t[selectedLanguage];

  useEffect(() => {
    // Extending timeout slightly so they have time to scan the QR
    const timeout = setTimeout(() => {
      resetSession();
    }, 15000);
    return () => clearTimeout(timeout);
  }, [resetSession]);

  if (!selectedCandidate) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F9F9FB] text-[#0D233A] font-sans select-none px-8 text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-[#028090]/10 border-4 border-[#028090] flex items-center justify-center text-3xl text-[#028090]">
        ✓
      </div>
      <h1 className="text-3xl font-bold">{currentLang.successTitle}</h1>
      <p className="text-[#0D233A]/60 max-w-md text-lg">
        {currentLang.yourVoteFor}
        {currentLang.hasBeenSealed}
      </p>

      {/* R21: Receipt-Freeness QR Code block */}
      {trackerId && (
        <div className="mt-4 p-4 border-2 border-dashed border-[#028090] rounded-xl flex flex-col items-center gap-3 bg-white shadow-sm">
          <QRCodeSVG value={trackerId} size={140} level="H" fgColor="#0D233A" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-[#0D233A]/50 uppercase tracking-widest">
              Tracker ID
            </span>
            <span className="font-mono font-bold text-[#028090] text-xl tracking-wider">
              {trackerId}
            </span>
          </div>
          <p className="text-xs text-[#0D233A]/70 max-w-[200px] leading-tight">
            {currentLang.receiptInfo}
          </p>
        </div>
      )}

      <p className="text-xs uppercase tracking-widest text-[#0D233A]/40 mt-4">
        {currentLang.resetting}
      </p>
    </div>
  );
}
