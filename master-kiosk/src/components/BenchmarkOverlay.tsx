import { useEffect, useState } from 'react';

export default function BenchmarkOverlay() {
  const [lastTime, setLastTime] = useState<string | null>(null);
  const [lastSize, setLastSize] = useState<string | null>(null);

  useEffect(() => {
    const handleLog = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.type === 'time') {
        setLastTime(customEvent.detail.value);
      } else if (customEvent.detail.type === 'size') {
        setLastSize(customEvent.detail.value);
      }
    };

    window.addEventListener('benchmark-log', handleLog);
    return () => window.removeEventListener('benchmark-log', handleLog);
  }, []);

  if (!lastTime && !lastSize) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[9999] bg-white border border-[#028090]/20 text-[#0D233A] text-[11px] font-mono px-4 py-2 rounded-full shadow-[0_4px_20px_rgba(2,128,144,0.15)] flex items-center gap-4 pointer-events-none transition-all duration-300">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#F4A261] animate-pulse"></span>
        <span className="opacity-60 font-semibold tracking-wider">LATENCY:</span> 
        <span className="font-bold">{lastTime || '-- ms'}</span>
      </div>
      <div className="w-px h-3 bg-[#0D233A]/10"></div>
      <div className="flex items-center gap-1.5">
        <span className="text-[#028090] opacity-60 font-semibold tracking-wider">PAYLOAD:</span> 
        <span className="text-[#028090] font-bold">{lastSize || '-- bytes'}</span>
      </div>
    </div>
  );
}
