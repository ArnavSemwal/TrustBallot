import { useEffect, useState } from 'react';

type Log = { id: number; name: string; type: 'time' | 'size'; value: string };

export default function BenchmarkOverlay() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const handleLog = (e: Event) => {
      const customEvent = e as CustomEvent;
      setLogs((prev) => {
        const newLogs = [...prev, { id: Date.now() + Math.random(), ...customEvent.detail }];
        // Keep only last 5 logs
        return newLogs.slice(-5);
      });
    };

    window.addEventListener('benchmark-log', handleLog);
    return () => window.removeEventListener('benchmark-log', handleLog);
  }, []);

  if (logs.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 z-[9999] pointer-events-none select-none flex flex-col gap-1">
      {logs.map((log) => (
        <div key={log.id} className="bg-black/80 text-green-400 font-mono text-[10px] px-2 py-1 rounded border border-green-900/50 shadow-lg backdrop-blur-sm animate-fade-in-down">
          <span className="opacity-50">[{log.type.toUpperCase()}]</span> {log.name}: <span className="text-white font-bold">{log.value}</span>
        </div>
      ))}
      <style>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
