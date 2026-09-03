import { useEffect } from 'react';
import { useKiosk } from '../context/KioskContext';

const t = {
  en: {
    successTitle: "Vote Recorded Successfully",
    yourVoteFor: "Your vote for ",
    hasBeenSealed: " has been securely cast and cryptographically sealed.",
    resetting: "Resetting for next voter…"
  },
  hi: {
    successTitle: "वोट सफलतापूर्वक दर्ज किया गया",
    yourVoteFor: "आपका वोट ",
    hasBeenSealed: " के लिए सुरक्षित रूप से डाल दिया गया है और क्रिप्टोग्राफ़िक रूप से सील कर दिया गया है।",
    resetting: "अगले मतदाता के लिए रीसेट किया जा रहा है…"
  }
};

export default function SuccessPage() {
  const { selectedCandidate, resetSession, selectedLanguage } = useKiosk();
  const currentLang = t[selectedLanguage];

  useEffect(() => {
    const timeout = setTimeout(() => {
      resetSession();
    }, 3500);
    return () => clearTimeout(timeout);
  }, [resetSession]);

  if (!selectedCandidate) {
    return null;
  }

  const cName = selectedCandidate.name[selectedLanguage];
  const cParty = selectedCandidate.party[selectedLanguage];

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F9F9FB] text-[#0D233A] font-sans select-none px-8 text-center gap-4">
      <div className="w-24 h-24 rounded-full bg-[#028090]/10 border-4 border-[#028090] flex items-center justify-center text-5xl text-[#028090]">✓</div>
      <h1 className="text-3xl font-bold">{currentLang.successTitle}</h1>
      <p className="text-[#0D233A]/60 max-w-md">
        {currentLang.yourVoteFor}<span className="font-semibold text-[#0D233A]">{cName}</span> ({cParty}){currentLang.hasBeenSealed}
      </p>
      <p className="text-xs uppercase tracking-widest text-[#0D233A]/40 mt-4">{currentLang.resetting}</p>
    </div>
  );
}
