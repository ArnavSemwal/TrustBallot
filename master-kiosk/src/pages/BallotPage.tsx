import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk, Candidate } from '../context/KioskContext';
import logo from '../imports/ymmetry.png';
import flowerImg from '../imports/flower.png';
import hillImg from '../imports/hill.jpeg';
import wheelImg from '../imports/wheel.jpeg';
import doveImg from '../imports/dove.png';

const CANDIDATES: Candidate[] = [
  { id: 'c1', name: { en: 'Rakesh Bahuguna', hi: 'राकेश बहुगुणा' }, party: { en: 'Jan Vikas Party', hi: 'जन विकास पार्टी' }, color: '#028090', image: flowerImg },
  { id: 'c2', name: { en: 'Sunita Rawat', hi: 'सुनीता रावत' }, party: { en: 'Uttarakhand Ekta Dal', hi: 'उत्तराखंड एकता दल' }, color: '#F4A261', image: hillImg },
  { id: 'c3', name: { en: 'Vinod Thapliyal', hi: 'विनोद थपलियाल' }, party: { en: 'Rashtriya Nirman Morcha', hi: 'राष्ट्रीय निर्माण मोर्चा' }, color: '#0D233A', image: wheelImg },
  { id: 'c4', name: { en: 'Meena Semwal', hi: 'मीना सेमवाल' }, party: { en: 'Swatantra Prajatantra', hi: 'स्वतंत्र प्रजातंत्र' }, color: '#7B2D8B', image: doveImg },
  { id: 'c5', name: { en: 'Rajesh Kumar', hi: 'राजेश कुमार' }, party: { en: 'Nav Bharat Dal', hi: 'नव भारत दल' }, color: '#E76F51', image: undefined },
  { id: 'c6', name: { en: 'Anita Sharma', hi: 'अनीता शर्मा' }, party: { en: 'Pragati Morcha', hi: 'प्रगति मोर्चा' }, color: '#2A9D8F', image: undefined },
  { id: 'c7', name: { en: 'Vijay Singh', hi: 'विजय सिंह' }, party: { en: 'Kisan Ekta Party', hi: 'किसान एकता पार्टी' }, color: '#E9C46A', image: undefined },
  { id: 'c8', name: { en: 'Pooja Devi', hi: 'पूजा देवी' }, party: { en: 'Mahila Vikas Dal', hi: 'महिला विकास दल' }, color: '#F4A261', image: undefined },
  { id: 'c9', name: { en: 'Amit Negi', hi: 'अमित नेगी' }, party: { en: 'Yuva Shakti Morcha', hi: 'युवा शक्ति मोर्चा' }, color: '#264653', image: undefined },
  { id: 'c10', name: { en: 'Sita Ram', hi: 'सीता राम' }, party: { en: 'Loktantra Raksha Dal', hi: 'लोकतंत्र रक्षा दल' }, color: '#D62828', image: undefined },
  { id: 'c11', name: { en: 'Mohan Lal', hi: 'मोहन लाल' }, party: { en: 'Garib Kalyan Party', hi: 'गरीब कल्याण पार्टी' }, color: '#023047', image: undefined },
  { id: 'c12', name: { en: 'NOTA', hi: 'नोटा' }, party: { en: 'None of the Above', hi: 'इनमें से कोई नहीं' }, color: '#94A3B8', image: undefined },
];

function PartySymbol({ color, image }: { color: string; image?: string }) {
  return (
    <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 bg-white p-1 shadow-sm" style={{ border: `3px solid ${color}` }} aria-hidden="true">
      {image ? <img src={image} alt="party logo" className="w-full h-full object-contain mix-blend-multiply" /> : <span className="text-4xl font-bold" style={{ color: color }}>✕</span>}
    </div>
  );
}

const t = {
  en: {
    step2: "Step 2 of 3: Cast Your Vote",
    selectCandidate: "Select Your Candidate",
    vote: "VOTE",
    confirmTitle: "CONFIRM YOUR VOTE",
    confirmFor: "Confirm your vote for",
    cannotUndo: "This action cannot be undone once confirmed.",
    no: "NO",
    yes: "YES",
    langToggle: "English ⇄ हिंदी",
    next: "Next Page",
    prev: "Previous Page"
  },
  hi: {
    step2: "चरण 2: अपना वोट डालें",
    selectCandidate: "अपना उम्मीदवार चुनें",
    vote: "वोट दें",
    confirmTitle: "अपने वोट की पुष्टि करें",
    confirmFor: "इसके लिए अपने वोट की पुष्टि करें:",
    cannotUndo: "पुष्टि होने के बाद इसे बदला नहीं जा सकता।",
    no: "नहीं",
    yes: "हाँ",
    langToggle: "हिंदी ⇄ English",
    next: "अगला पृष्ठ",
    prev: "पिछला पृष्ठ"
  }
};

export default function BallotPage() {
  const navigate = useNavigate();
  const { selectedLanguage, setSelectedLanguage, secondsLeft, setSelectedCandidate, resetActivity } = useKiosk();
  const currentLang = t[selectedLanguage];
  const [pendingCandidate, setPendingCandidate] = useState<Candidate | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const candidatesPerPage = 4;
  const totalPages = Math.ceil(CANDIDATES.length / candidatesPerPage);
  const paginatedCandidates = CANDIDATES.slice((currentPage - 1) * candidatesPerPage, currentPage * candidatesPerPage);

  function handleVotePress(candidate: Candidate) {
    resetActivity();
    setPendingCandidate(candidate);
  }

  function handleConfirmVote() {
    resetActivity();
    if (!pendingCandidate) return;
    setSelectedCandidate(pendingCandidate);
    navigate('/review'); // Go to VVPAT / Confirmation
  }

  function handleCancelConfirm() {
    resetActivity();
    setPendingCandidate(null);
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F9F9FB] text-[#0D233A] font-sans select-none">
      <header className="h-[12vh] shrink-0 flex flex-col relative justify-center">
        <div className="w-full flex items-center justify-between px-6">
          <img src={logo} alt="TrustBallot" className="h-[130px] w-[183px] object-contain mix-blend-multiply relative z-10" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-0 w-full pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#028090]/10 text-[#028090] text-xs font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#028090] animate-pulse"></span>
              {currentLang.step2}
            </div>
            <h1 className="text-2xl font-bold text-[#0D233A] text-center tracking-tight" style={{ lineHeight: '32px' }}>
              {currentLang.selectCandidate}
            </h1>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSelectedLanguage(selectedLanguage === 'en' ? 'hi' : 'en'); }}
            className="rounded-full border-2 border-[#028090] px-5 py-1.5 text-sm font-semibold text-[#028090] hover:bg-[#028090] hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#F4A261] focus:ring-offset-2 relative z-10"
          >
            {currentLang.langToggle}
          </button>
        </div>
        <div className="absolute bottom-0 left-8 right-8 h-px bg-[#0D233A]/10" />
      </header>

      <main className="flex-1 overflow-hidden px-8 py-4 flex flex-col">
        <div className="w-full max-w-4xl mx-auto h-full flex flex-col min-h-0">
          <div className="flex-1 flex flex-col gap-3 min-h-0 justify-evenly">
            {paginatedCandidates.map((candidate) => (
              <div key={candidate.id} className="w-full bg-white rounded-2xl shadow-md border border-gray-100 py-3 px-6 flex items-center gap-6 hover:shadow-lg transition-shadow">
                <PartySymbol color={candidate.color} image={candidate.image} />
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold text-[#0D233A] leading-tight truncate">{candidate.name[selectedLanguage]}</p>
                  <p className="text-base font-semibold text-[#0D233A]/80 mt-0.5 truncate">{candidate.party[selectedLanguage]}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleVotePress(candidate); }}
                  className="shrink-0 rounded-2xl bg-[#028090] text-white text-lg font-bold px-8 py-4 min-w-[160px] shadow-[0_6px_20px_rgba(2,128,144,0.3)] hover:bg-[#026d7a] active:scale-95 transition-all duration-150"
                >
                  {currentLang.vote}
                </button>
              </div>
            ))}
          </div>

          <div className="shrink-0 flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => { resetActivity(); setCurrentPage(p => Math.max(1, p - 1)); }}
              disabled={currentPage === 1}
              className="px-6 py-3 rounded-xl border-2 border-[#0D233A]/20 text-[#0D233A] font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all"
            >
              {currentLang.prev}
            </button>
            <span className="text-sm font-semibold text-[#0D233A]/60">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => { resetActivity(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
              disabled={currentPage === totalPages}
              className="px-6 py-3 rounded-xl border-2 border-[#028090] text-[#028090] font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#028090]/5 active:scale-95 transition-all"
            >
              {currentLang.next}
            </button>
          </div>
        </div>
      </main>

      {pendingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D233A]/60 backdrop-blur-sm px-6" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 flex flex-col items-center gap-6 animate-[fadeIn_0.15s_ease-out]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#028090]">{currentLang.confirmTitle}</span>
            <PartySymbol color={pendingCandidate.color} image={pendingCandidate.image} />
            <div className="text-center">
              <p className="text-sm text-[#0D233A]/50 font-medium">{currentLang.confirmFor}</p>
              <p className="text-2xl font-bold text-[#0D233A] mt-1">{pendingCandidate.name[selectedLanguage]}</p>
              <p className="text-base font-semibold text-[#0D233A]/50">{pendingCandidate.party[selectedLanguage]}</p>
            </div>
            <p className="text-xs text-red-500 font-semibold text-center">{currentLang.cannotUndo}</p>
            <div className="w-full grid grid-cols-2 gap-4 mt-2">
              <button onClick={handleCancelConfirm} className="rounded-2xl border-2 border-[#0D233A]/20 text-[#0D233A] text-xl font-bold py-5 hover:bg-gray-50 active:scale-95 transition-all">{currentLang.no}</button>
              <button onClick={handleConfirmVote} className="rounded-2xl bg-[#028090] text-white text-xl font-bold py-5 shadow-[0_6px_20px_rgba(2,128,144,0.35)] hover:bg-[#026d7a] active:scale-95 transition-all">{currentLang.yes}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
