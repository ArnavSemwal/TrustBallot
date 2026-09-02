import React, { useState } from 'react';
import logo from './imports/ymmetry.png';

export default function App() {
  const [step, setStep] = useState(2); // Step 2: Review Screen
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F9F9FB] font-sans text-[#0D233A] select-none">
      
      {/* HEADER SECTION - Locked Symmetry */}
      <header className="h-[15vh] shrink-0 w-full flex items-center justify-between px-8 border-b border-gray-200 bg-white relative">
        <div className="flex items-center">
          <img src={logo} alt="TrustBallot Logo" className="h-16 w-auto object-contain" />
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center gap-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#028090]/10 text-[#028090] text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#028090] animate-pulse"></span>
            Step 2 of 3: Voter Identity Review
          </div>
          <h1 className="text-xl font-bold text-[#0D233A] mt-1">Confirm Your Voter Details</h1>
        </div>

        <div>
          <button className="px-5 py-2.5 rounded-full border-2 border-[#028090] text-[#028090] font-semibold text-sm hover:bg-[#028090]/5 transition-colors">
            English ⇌ हिंदी
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA - Digital Profile Card */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col gap-8">
          
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Verification Status</span>
              <h2 className="text-lg font-bold text-[#028090]">QR Code Scanned Successfully</h2>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">EPIC Number</span>
              <p className="font-mono text-base font-bold text-[#0D233A]">9876543210</p>
            </div>
          </div>

          {/* ID Card Split Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* Voter Photo Box */}
            <div className="flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6">
              <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 font-medium overflow-hidden shadow-inner">
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <span className="mt-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Official Photo ID</span>
            </div>

            {/* Voter Details Grid */}
            <div className="md:col-span-2 grid grid-cols-2 gap-6 bg-[#F9F9FB] p-6 rounded-xl border border-gray-200">
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Voter Name</span>
                <p className="text-xl font-bold text-[#0D233A] mt-0.5">Arnav Semwal</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Age / Gender</span>
                <p className="text-xl font-bold text-[#0D233A] mt-0.5">22 / Male</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Father's Name</span>
                <p className="text-lg font-semibold text-[#0D233A] mt-0.5">Pradeep Kumar Semwal</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Constituency</span>
                <p className="text-lg font-semibold text-[#0D233A] mt-0.5">Dehradun (Constituency #23)</p>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER ACTIONS - Binary CTA */}
      <footer className="h-[12vh] shrink-0 w-full bg-white border-t border-gray-200 px-8 flex items-center justify-between">
        <button 
          onClick={() => alert("Session Reset. Returning to scanner.")}
          className="px-8 py-4 rounded-xl border-2 border-red-500 text-red-600 font-bold text-base hover:bg-red-50 transition-colors active:scale-95"
        >
          Not Me / Cancel
        </button>

        <button 
          onClick={() => alert("Identity Confirmed! Proceeding to Ballot.")}
          className="px-10 py-4 rounded-xl bg-[#028090] text-white font-bold text-base shadow-lg hover:bg-[#026d7a] transition-all active:scale-95"
        >
          Yes, Confirm & Proceed →
        </button>
      </footer>

    </div>
  );
}