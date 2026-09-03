import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import logo from '../imports/ymmetry.png';

const t = {
  en: {
    step3: "Step 3 of 3: Digital VVPAT Review",
    reviewTitle: "Review Your Digital Slip",
    voterId: "Voter EPIC ID",
    slipStatus: "Slip Status",
    pending: "Pending Seal",
    votedFor: "Voted For",
    cancel: "Cancel & Return",
    submitting: "Encrypting & Submitting...",
    confirmVote: "Yes, Confirm & Cast Vote →",
    langToggle: "English ⇌ हिंदी",
    txFailed: "Transaction Failed",
    txErrorBody: "Network rejected the vote or a collision was detected. Please try again.",
    retryVote: "Retry Vote",
    cancelModal: "Cancel"
  },
  hi: {
    step3: "चरण 3: डिजिटल वीवीपीएटी (VVPAT) समीक्षा",
    reviewTitle: "अपनी डिजिटल पर्ची की समीक्षा करें",
    voterId: "मतदाता एपिक आईडी",
    slipStatus: "पर्ची की स्थिति",
    pending: "सील लंबित",
    votedFor: "के लिए वोट किया",
    cancel: "रद्द करें और वापस जाएं",
    submitting: "एन्क्रिप्ट और जमा किया जा रहा है...",
    confirmVote: "सील करें और वोट जमा करें",
    langToggle: "हिंदी ⇌ English",
    txFailed: "लेनदेन विफल",
    txErrorBody: "नेटवर्क ने वोट अस्वीकार कर दिया है। कृपया पुनः प्रयास करें।",
    retryVote: "पुनः प्रयास करें",
    cancelModal: "रद्द करें"
  }
};

export default function ReviewPage() {
  const navigate = useNavigate();
  const { selectedLanguage, setSelectedLanguage, selectedCandidate, submitVote, secondsLeft, voterId } = useKiosk();
  const currentLang = t[selectedLanguage];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteError, setVoteError] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setVoteError(false);
    try {
      await submitVote();
      navigate('/success');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setVoteError(true);
    }
  };

  if (!selectedCandidate) {
    navigate('/');
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F9F9FB] font-sans text-[#0D233A] select-none">
      <header className="h-[15vh] shrink-0 w-full flex items-center justify-between px-8 border-b border-gray-200 bg-white relative">
        <div className="flex items-center">
          <img src={logo} alt="TrustBallot Logo" className="h-16 w-auto object-contain" />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center gap-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#028090]/10 text-[#028090] text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#028090] animate-pulse"></span>
            {currentLang.step3}
          </div>
          <h1 className="text-xl font-bold text-[#0D233A] mt-1">{currentLang.reviewTitle}</h1>
        </div>
        <div>
          <button onClick={() => setSelectedLanguage(selectedLanguage === 'en' ? 'hi' : 'en')} className="px-5 py-2.5 rounded-full border-2 border-[#028090] text-[#028090] font-semibold text-sm hover:bg-[#028090]/5 transition-colors">
            {currentLang.langToggle}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 p-8 flex flex-col gap-8 relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-dashed border-gray-300 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{currentLang.voterId}</span>
              <h2 className="text-lg font-bold text-[#0D233A]">{voterId || 'N/A'}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{currentLang.slipStatus}</span>
              <p className="font-mono text-base font-bold text-green-600">{currentLang.pending}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 bg-gray-50 py-8 rounded-xl border border-gray-200">
            <div className="w-24 h-24 rounded-xl flex items-center justify-center bg-white p-2 shadow-sm" style={{ border: `3px solid ${selectedCandidate.color}` }}>
              {selectedCandidate.image ? <img src={selectedCandidate.image} alt="party logo" className="w-full h-full object-contain mix-blend-multiply" /> : <span className="text-5xl font-bold" style={{ color: selectedCandidate.color }}>✕</span>}
            </div>
            <div className="text-center">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{currentLang.votedFor}</span>
              <h2 className="text-3xl font-bold text-[#0D233A] mt-1">{selectedCandidate.name[selectedLanguage]}</h2>
              <p className="text-lg font-semibold text-[#0D233A]/70">{selectedCandidate.party[selectedLanguage]}</p>
            </div>
          </div>

        </div>
      </main>

      <footer className="h-[12vh] shrink-0 w-full bg-white border-t border-gray-200 px-8 flex items-center justify-between">
        <button 
          onClick={() => navigate('/ballot')}
          disabled={isSubmitting}
          className="px-8 py-4 rounded-xl border-2 border-red-500 text-red-600 font-bold text-base hover:bg-red-50 transition-colors active:scale-95 disabled:opacity-50"
        >
          {currentLang.cancel}
        </button>

        <button 
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="px-10 py-4 rounded-xl bg-[#028090] text-white font-bold text-base shadow-lg hover:bg-[#026d7a] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? currentLang.submitting : currentLang.confirmVote}
        </button>
      </footer>

      {voteError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D233A]/60 backdrop-blur-sm px-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 flex flex-col items-center gap-6 animate-[fadeIn_0.15s_ease-out]">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-3xl font-bold border-4 border-red-200">
              !
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#0D233A]">{currentLang.txFailed}</h2>
              <p className="text-sm font-medium text-[#0D233A]/60 mt-2 max-w-[280px] mx-auto">{currentLang.txErrorBody}</p>
            </div>
            <div className="w-full grid grid-cols-2 gap-4 mt-2">
              <button 
                onClick={() => navigate('/ballot')} 
                className="rounded-2xl border-2 border-[#0D233A]/20 text-[#0D233A] text-lg font-bold py-4 hover:bg-gray-50 active:scale-95 transition-all"
              >
                {currentLang.cancelModal}
              </button>
              <button 
                onClick={handleConfirm} 
                className="rounded-2xl bg-[#028090] text-white text-lg font-bold py-4 shadow-[0_6px_20px_rgba(2,128,144,0.35)] hover:bg-[#026d7a] active:scale-95 transition-all"
              >
                {currentLang.retryVote}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
