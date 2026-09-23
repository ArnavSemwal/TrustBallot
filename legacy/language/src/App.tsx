import logo from './imports/ymmetry.png';

export default function App() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F9F9FB] text-[#0D233A] font-sans selection:bg-[#028090] selection:text-white">
      {/* Main Content Area - Locked to Viewport, Flex evenly spacing */}
      <main className="flex-1 flex flex-col items-center justify-evenly px-6 w-full max-w-6xl mx-auto py-6">
        
        {/* Header Area */}
        <header className="flex flex-col items-center shrink-0 w-full">
          {/* Scaled Logo */}
          <img 
            src={logo} 
            alt="TrustBallot Logo" 
            className="w-64 md:w-80 lg:w-[420px] h-auto object-contain mix-blend-multiply" 
          />
          
          {/* Typography perfectly equalized in size */}
          <h1 className="flex flex-col items-center gap-3 text-center mt-6">
            <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0D233A]">
              Choose Your Language
            </span>
            <span className="text-4xl md:text-5xl lg:text-6xl font-medium text-[#0D233A] opacity-80">
              अपनी भाषा चुनें
            </span>
          </h1>
        </header>

        {/* Core Interaction / Cards */}
        <div className="grid w-full grid-cols-1 justify-items-center gap-6 xl:grid-cols-2 xl:gap-12 mt-4">
          <button 
            type="button"
            className="group grid h-40 md:h-48 w-full max-w-[28rem] grid-cols-[4rem_1fr_4rem] items-center rounded-[2.5rem] bg-[#028090] px-6 shadow-xl transition-all duration-150 ease-in-out hover:bg-[#0D233A] focus:outline-none focus:ring-8 focus:ring-[#0D233A]/50 active:scale-95"
          >
            <span aria-hidden="true" />
            <span className="text-5xl md:text-6xl font-bold text-white text-center w-full">हिंदी</span>
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/20 transition-all group-hover:bg-white/30">
              <span aria-hidden="true" className="-mt-1 text-4xl font-medium text-white">→</span>
            </div>
          </button>

          <button 
            type="button"
            className="group grid h-40 md:h-48 w-full max-w-[28rem] grid-cols-[4rem_1fr_4rem] items-center rounded-[2.5rem] bg-[#028090] px-6 shadow-xl transition-all duration-150 ease-in-out hover:bg-[#0D233A] focus:outline-none focus:ring-8 focus:ring-[#0D233A]/50 active:scale-95"
          >
            <span aria-hidden="true" />
            <span className="text-5xl md:text-6xl font-bold text-white text-center w-full">English</span>
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/20 transition-all group-hover:bg-white/30">
              <span aria-hidden="true" className="-mt-1 text-4xl font-medium text-white">→</span>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}