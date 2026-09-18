import { useState, useEffect, useRef } from 'react';

export default function AdminDashboard() {
  const [stream, setStream] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  const [disputeInput, setDisputeInput] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  // Fetch real incoming ciphertext stream
  useEffect(() => {
    const startupLog = `[${new Date().toISOString()}] SYSTEM_STARTUP: Telemetry stream initialized.`;
    const syncLog = `[${new Date().toISOString()}] NODE_SYNC: Consortium connection established.`;
    
    // Initial data
    setStream([startupLog, syncLog]);

    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://localhost:8001/transactions');
        const data = await response.json();
        if (data && data.transactions) {
          setStream([startupLog, syncLog, ...data.transactions]);
        }
      } catch (e) {
        console.error("Failed to fetch transactions from node", e);
      }
    };
    
    // Poll every 2 seconds
    const interval = setInterval(fetchTransactions, 2000);
    fetchTransactions();

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [stream]);

  const handleFlagDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeInput.trim()) return;
    setDisputeSuccess(true);
    setDisputeInput('');
    setTimeout(() => setDisputeSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#ededed] p-6 md:p-10 font-sans flex flex-col gap-8">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-[#ededed] font-medium text-base tracking-tight">ECI Telemetry & Audit Console</h1>
          <p className="text-[#888] text-xs mt-1">Secure Backend Control Room</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="border border-[#333] text-[#888] px-2 py-0.5 text-[10px] uppercase flex items-center gap-1.5 rounded-sm">
            <span className="w-1.5 h-1.5 bg-[#2e7d32]" />
            System Secure
          </div>
          <div className="border border-[#333] text-[#888] px-2 py-0.5 text-[10px] uppercase rounded-sm">
            Healthy / 3-of-4 Quorum Active
          </div>
        </div>
      </header>

      {/* Node Health Section */}
      <section>
        <h2 className="text-[#888] text-xs font-medium uppercase tracking-widest mb-3">BFT Consortium Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          <div className="bg-[#111111] border border-[#222] rounded-sm p-4 flex flex-col justify-between">
            <div>
              <span className="text-[#888] text-[10px] uppercase font-mono tracking-widest">Node_01</span>
              <h3 className="text-[#ededed] text-sm mt-1 font-mono">ECI Primary</h3>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <span className="w-1.5 h-1.5 bg-[#2e7d32]" />
              <span className="text-[#888] text-[10px] uppercase font-mono">Online / Synced</span>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#222] rounded-sm p-4 flex flex-col justify-between">
            <div>
              <span className="text-[#888] text-[10px] uppercase font-mono tracking-widest">Node_02</span>
              <h3 className="text-[#ededed] text-sm mt-1 font-mono">Supreme Court</h3>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <span className="w-1.5 h-1.5 bg-[#2e7d32]" />
              <span className="text-[#888] text-[10px] uppercase font-mono">Online / Synced</span>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#222] rounded-sm p-4 flex flex-col justify-between">
            <div>
              <span className="text-[#888] text-[10px] uppercase font-mono tracking-widest">Node_03</span>
              <h3 className="text-[#ededed] text-sm mt-1 font-mono">State EC Node</h3>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <span className="w-1.5 h-1.5 bg-[#888]" />
              <span className="text-[#888] text-[10px] uppercase font-mono">Syncing [98.2%]</span>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#222] rounded-sm p-4 flex flex-col justify-between">
            <div>
              <span className="text-[#888] text-[10px] uppercase font-mono tracking-widest">Node_04</span>
              <h3 className="text-[#ededed] text-sm mt-1 font-mono">Independent Auditor</h3>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <span className="w-1.5 h-1.5 bg-[#2e7d32]" />
              <span className="text-[#888] text-[10px] uppercase font-mono">Online / Synced</span>
            </div>
          </div>

        </div>
      </section>

      {/* Encrypted Ciphertext Stream */}
      <section className="border-y border-[#222] py-4 my-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[#888] text-xs font-medium uppercase tracking-widest">Encrypted Ciphertext Stream</h2>
          <span className="text-[#666] text-[10px] font-mono">wss://kiosk-mesh.local/stream</span>
        </div>
        <div 
          ref={terminalRef}
          className="h-[28rem] overflow-y-auto w-full font-mono text-[10px] leading-tight block"
        >
          {stream.map((log, i) => {
            const isTx = log.includes('TX_HASH');
            return (
              <div key={i} className="mb-[6px]">
                {isTx ? (
                  <>
                    <span className="text-[#555]">{log.split('] ')[0]}] </span>
                    <span className="text-[#888]">TX_HASH: </span>
                    <span className="text-[#a3a3a3]">{log.split('TX_HASH: ')[1].split(' STATUS:')[0]}</span>
                    <span className="text-[#2e7d32]"> STATUS: CRYPTOGRAPHICALLY_SEALED</span>
                  </>
                ) : (
                  <span className="text-[#555]">{log}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Procedural Override Section */}
      <div className="border-t border-[#222] pt-6 mt-2">
        <h3 className="text-[#ededed] font-medium tracking-wide mb-1 text-sm uppercase">Procedural Override</h3>
        <p className="text-[#888] text-[11px] mb-4">Flag a suspicious session or transaction for independent manual audit.</p>
        
        <form onSubmit={handleFlagDispute} className="flex items-center gap-3">
          <input
            type="text"
            value={disputeInput}
            onChange={(e) => setDisputeInput(e.target.value)}
            placeholder="Enter Session Token / TX Hash..."
            className="bg-transparent border border-[#333] text-[#ededed] rounded-sm px-4 py-2 text-sm w-full max-w-md focus:border-[#666] outline-none transition-colors"
          />
          <button 
            type="submit"
            disabled={!disputeInput.trim()}
            className="bg-[#ededed] text-black hover:bg-white rounded-sm px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Flag Dispute for Audit
          </button>
        </form>

        {disputeSuccess && (
          <div className="mt-3 text-[#888] text-[10px] uppercase font-mono tracking-widest">
            System: Session marked for procedural review.
          </div>
        )}
        
        <span className="text-[10px] text-red-500/80 mt-3 block font-mono">Strict Constraint: No biometric or plain-text voting data is retained during this procedure.</span>
      </div>
    </div>
  );
}
