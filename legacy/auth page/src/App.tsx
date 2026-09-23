import { useState } from 'react';
import logo from './imports/ymmetry.png';

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

export default function App() {
  const [epicNumber, setEpicNumber] = useState('');
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  function pressKey(val: string) {
    setEpicNumber(prev => (prev.length < 10 ? prev + val : prev));
  }
  function clearAll() { setEpicNumber(''); }
  function deleteLast() { setEpicNumber(prev => prev.slice(0, -1)); }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F9F9FB] text-[#0D233A] font-sans select-none">

      {/* ── HEADER 15vh ── */}
      <header className="h-[15vh] shrink-0 flex flex-col relative justify-center">
        {/* Navbar row */}
        <div className="w-full flex items-center justify-between px-6">
          <img
            src={logo}
            alt="TrustBallot"
            className="h-[130px] w-[183px] object-contain mix-blend-multiply relative z-10"
          />

          {/* Centered Headers */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-0 w-full pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#028090]/10 text-[#028090] text-xs font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#028090] animate-pulse"></span>
              Step 1 of 3: Voter Verification
            </div>
            <h1 className="text-2xl font-bold text-[#0D233A] text-center tracking-tight" style={{ lineHeight: '32px' }}>
              Scan Your Voter ID / EPIC QR Code
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
            className="rounded-full border-2 border-[#028090] px-5 py-1.5 text-sm font-semibold text-[#028090] hover:bg-[#028090] hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#F4A261] focus:ring-offset-2 relative z-10"
          >
            {lang === 'en' ? 'English ⇄ हिंदी' : 'हिंदी ⇄ English'}
          </button>
        </div>

        {/* Divider */}
        <div className="absolute bottom-0 left-8 right-8 h-px bg-[#0D233A]/10" />
      </header>

      {/* ── MAIN BODY 70vh ── */}
      <main className="h-[70vh] shrink-0 grid grid-cols-2 gap-0 px-8 py-4 overflow-hidden">

        {/* LEFT: Scanner */}
        <div className="flex flex-col items-center justify-center gap-3 pr-6 border-r border-[#0D233A]/10">
          {/* Frame */}
          <div
            className="relative aspect-square border-4 border-dashed border-[#028090] rounded-2xl flex flex-col items-center justify-center bg-white/70 overflow-hidden"
            style={{ height: 'min(42vw, 54vh)' }}
            aria-label="QR code scanner area"
          >
            {/* Corner brackets */}
            <span className="absolute top-2.5 left-2.5 w-7 h-7 border-t-[3px] border-l-[3px] border-[#028090] rounded-tl-lg" />
            <span className="absolute top-2.5 right-2.5 w-7 h-7 border-t-[3px] border-r-[3px] border-[#028090] rounded-tr-lg" />
            <span className="absolute bottom-2.5 left-2.5 w-7 h-7 border-b-[3px] border-l-[3px] border-[#028090] rounded-bl-lg" />
            <span className="absolute bottom-2.5 right-2.5 w-7 h-7 border-b-[3px] border-r-[3px] border-[#028090] rounded-br-lg" />

            <QRCodeSVG />

            <p className="mt-3 text-xs font-medium uppercase tracking-widest text-[#028090] opacity-60">
              Awaiting QR Code
            </p>

            {/* Scanning laser */}
            <div className="scanner-laser absolute left-4 right-4 h-[3px] rounded-full bg-[#028090] opacity-75 shadow-[0_0_8px_2px_#028090]" />
          </div>

          <p className="text-sm font-medium text-[#0D233A] opacity-65 text-center">
            Hold your QR code inside the frame
          </p>
        </div>

        {/* RIGHT: Manual Entry */}
        <div className="flex flex-col justify-center gap-3 pl-6 overflow-hidden">
          {/* Label + Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[#0D233A] opacity-60">
              Enter EPIC Number Manually
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={epicNumber}
                placeholder="e.g. 1234567890"
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

            {/* Bottom row: CLR · 0 · ⌫ */}
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
          className="rounded-2xl bg-[#028090] px-20 py-4 text-white text-xl font-bold shadow-[0_8px_32px_rgba(2,128,144,0.35)] hover:bg-[#026d7d] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#F4A261] focus:ring-offset-2"
        >
          Verify &amp; Proceed
        </button>
      </footer>
    </div>
  );
}