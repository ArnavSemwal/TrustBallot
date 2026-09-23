import { useState, useEffect, useRef, useCallback } from 'react';
import logo from './imports/ymmetry.png';
import flowerImg from './imports/flower.png';
import hillImg from './imports/hill.jpeg';
import wheelImg from './imports/wheel.jpeg';
import doveImg from './imports/dove.png';

type Candidate = {
  id: string;
  name: string;
  party: string;
  color: string;
  image?: string;
};

const CANDIDATES: Candidate[] = [
  { id: 'c1', name: 'Rakesh Bahuguna', party: 'Jan Vikas Party', color: '#028090', image: flowerImg },
  { id: 'c2', name: 'Sunita Rawat',    party: 'Uttarakhand Ekta Dal', color: '#F4A261', image: hillImg },
  { id: 'c3', name: 'Vinod Thapliyal', party: 'Rashtriya Nirman Morcha', color: '#0D233A', image: wheelImg },
  { id: 'c4', name: 'Meena Semwal',    party: 'Swatantra Prajatantra', color: '#7B2D8B', image: doveImg },
  { id: 'c5', name: 'NOTA',            party: 'None of the Above', color: '#94A3B8', image: undefined },
];

const SESSION_TIMEOUT_SECONDS = 60;
const WARNING_AT_SECONDS = 15;
const SUCCESS_RESET_DELAY_MS = 3500;

function PartySymbol({ color, image }: { color: string; image?: string }) {
  return (
    <div
      className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 bg-white p-1 shadow-sm"
      style={{ border: `3px solid ${color}` }}
      aria-hidden="true"
    >
      {image ? (
        <img src={image} alt="party logo" className="w-full h-full object-contain mix-blend-multiply" />
      ) : (
        <span className="text-4xl font-bold" style={{ color: color }}>✕</span>
      )}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [pendingCandidate, setPendingCandidate] = useState<Candidate | null>(null);
  const [votedCandidateId, setVotedCandidateId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_TIMEOUT_SECONDS);
  const [sessionDestroyed, setSessionDestroyed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (votedCandidateId || sessionDestroyed || pendingCandidate) return;
    setSecondsLeft(SESSION_TIMEOUT_SECONDS);
  }, [votedCandidateId, sessionDestroyed, pendingCandidate]);

  useEffect(() => {
    if (votedCandidateId || sessionDestroyed || pendingCandidate) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setSessionDestroyed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [votedCandidateId, sessionDestroyed, pendingCandidate]);

  useEffect(() => {
    if (!votedCandidateId) return;
    const timeout = setTimeout(() => {
      window.location.reload();
    }, SUCCESS_RESET_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [votedCandidateId]);

  function handleVotePress(candidate: Candidate) {
    setPendingCandidate(candidate);
  }

  function handleConfirmVote() {
    if (!pendingCandidate) return;
    setVotedCandidateId(pendingCandidate.id);
    setPendingCandidate(null);
  }

  function handleCancelConfirm() {
    setPendingCandidate(null);
    resetTimer();
  }

  if (sessionDestroyed) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0D233A] text-white font-sans select-none px-8 text-center gap-4">
        <div className="w-20 h-20 rounded-full border-4 border-red-400 flex items-center justify-center text-4xl">⏱</div>
        <h1 className="text-3xl font-bold">Session Timed Out</h1>
        <p className="text-white/70 max-w-md">
          No vote was recorded. For security, this session has been destroyed.
          Please contact the polling officer to restart the process.
        </p>
      </div>
    );
  }

  if (votedCandidateId) {
    const voted = CANDIDATES.find(c => c.id === votedCandidateId)!;
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F9F9FB] text-[#0D233A] font-sans select-none px-8 text-center gap-4">
        <div className="w-24 h-24 rounded-full bg-[#028090]/10 border-4 border-[#028090] flex items-center justify-center text-5xl text-[#028090]">✓</div>
        <h1 className="text-3xl font-bold">Vote Recorded Successfully</h1>
        <p className="text-[#0D233A]/60 max-w-md">
          Your vote for <span className="font-semibold text-[#0D233A]">{voted.name}</span> ({voted.party}) has been securely cast and cryptographically sealed.
        </p>
        <p className="text-xs uppercase tracking-widest text-[#0D233A]/40 mt-4">Resetting for next voter…</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col bg-[#F9F9FB] text-[#0D233A] font-sans select-none"
      onClick={resetTimer}
      onTouchStart={resetTimer}
    >
      {/* ── HEADER 12vh ── */}
      <header className="h-[12vh] shrink-0 flex flex-col relative justify-center">
        <div className="w-full flex items-center justify-between px-6">
          <img
            src={logo}
            alt="TrustBallot"
            className="h-[130px] w-[183px] object-contain mix-blend-multiply relative z-10"
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-0 w-full pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#028090]/10 text-[#028090] text-xs font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#028090] animate-pulse"></span>
              Step 3 of 3: Cast Your Vote
            </div>
            <h1 className="text-2xl font-bold text-[#0D233A] text-center tracking-tight" style={{ lineHeight: '32px' }}>
              Select Your Candidate
            </h1>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLang(l => l === 'en' ? 'hi' : 'en'); }}
            className="rounded-full border-2 border-[#028090] px-5 py-1.5 text-sm font-semibold text-[#028090] hover:bg-[#028090] hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#F4A261] focus:ring-offset-2 relative z-10"
          >
            {lang === 'en' ? 'English ⇄ हिंदी' : 'हिंदी ⇄ English'}
          </button>
        </div>
        <div className="absolute bottom-0 left-8 right-8 h-px bg-[#0D233A]/10" />
      </header>

      {/* ── SESSION TIMER STRIP 3vh ── */}
      <div className={`h-[3vh] shrink-0 flex items-center justify-center text-xs font-semibold tracking-wider uppercase ${secondsLeft <= WARNING_AT_SECONDS ? 'bg-red-500 text-white animate-pulse' : 'bg-[#0D233A]/5 text-[#0D233A]/50'}`}>
        {secondsLeft <= WARNING_AT_SECONDS
          ? `⚠ Session expiring in ${secondsLeft}s — cast your vote now`
          : `Session active — auto-expires in ${secondsLeft}s of inactivity`}
      </div>

      {/* ── MAIN CONTENT: EVM Grid — 85vh flex-1, evenly distributed, footer removed ── */}
      <main className="flex-1 overflow-hidden px-8 py-6 flex flex-col">
        <div className="w-full max-w-4xl mx-auto h-full flex flex-col justify-between">
          {CANDIDATES.map((candidate) => (
            <div
              key={candidate.id}
              className="w-full bg-white rounded-2xl shadow-md border border-gray-100 py-4 px-6 flex items-center gap-6 hover:shadow-lg transition-shadow"
            >
              <PartySymbol color={candidate.color} image={candidate.image} />
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-[#0D233A] leading-tight truncate">{candidate.name}</p>
                <p className="text-base font-semibold text-[#0D233A]/80 mt-0.5 truncate">{candidate.party}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleVotePress(candidate); }}
                className="shrink-0 rounded-2xl bg-[#028090] text-white text-lg font-bold px-8 py-4 min-w-[160px] shadow-[0_6px_20px_rgba(2,128,144,0.3)] hover:bg-[#026d7a] active:scale-95 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F4A261] focus:ring-offset-2"
              >
                VOTE
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* ── ANTI-FAT-FINGER CONFIRMATION MODAL ── */}
      {pendingCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D233A]/60 backdrop-blur-sm px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 flex flex-col items-center gap-6 animate-[fadeIn_0.15s_ease-out]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#028090]">Confirm Your Vote</span>
            <PartySymbol color={pendingCandidate.color} image={pendingCandidate.image} />
            <div className="text-center">
              <p className="text-sm text-[#0D233A]/50 font-medium">Confirm your vote for</p>
              <p className="text-2xl font-bold text-[#0D233A] mt-1">{pendingCandidate.name}</p>
              <p className="text-base font-semibold text-[#0D233A]/50">{pendingCandidate.party}</p>
            </div>
            <p className="text-xs text-red-500 font-semibold text-center">
              This action cannot be undone once confirmed.
            </p>
            <div className="w-full grid grid-cols-2 gap-4 mt-2">
              <button
                type="button"
                onClick={handleCancelConfirm}
                className="rounded-2xl border-2 border-[#0D233A]/20 text-[#0D233A] text-xl font-bold py-5 hover:bg-gray-50 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F4A261] focus:ring-offset-2"
              >
                NO
              </button>
              <button
                type="button"
                onClick={handleConfirmVote}
                className="rounded-2xl bg-[#028090] text-white text-xl font-bold py-5 shadow-[0_6px_20px_rgba(2,128,144,0.35)] hover:bg-[#026d7a] active:scale-95 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F4A261] focus:ring-offset-2"
              >
                YES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}