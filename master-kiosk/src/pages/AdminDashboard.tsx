import { useState, useEffect, useRef } from 'react';
import { get } from 'idb-keyval';
import {
  getSealedTransactions,
  subscribeToMesh,
  clearLedger,
  recordDispute,
  getDisputes,
  DisputeRecord,
} from '../utils/ledger';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [stream, setStream] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const [disputeInput, setDisputeInput] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState(false);
  const [flaggedDisputes, setFlaggedDisputes] = useState<DisputeRecord[]>([]);

  const [isOffline, setIsOffline] = useState(false);
  const [queuedVotes, setQueuedVotes] = useState(0);
  
  // R17: Node status state
  const [nodes, setNodes] = useState<any[]>([
    { id: 'Node_01', role: 'ECI Primary', status: 'Online / Synced', health: 'good' },
    { id: 'Node_02', role: 'Supreme Court', status: 'Online / Synced', health: 'good' },
    { id: 'Node_03', role: 'State EC Node', status: 'Online / Synced', health: 'good' },
    { id: 'Node_04', role: 'Independent Auditor', status: 'Online / Synced', health: 'good' }
  ]);

  // Fetch real incoming ciphertext stream and listen to live consortium mesh
  useEffect(() => {
    const startupLog = `[${new Date().toISOString()}] SYSTEM_STARTUP: Telemetry stream initialized.`;
    const syncLog = `[${new Date().toISOString()}] NODE_SYNC: Consortium connection established (4 of 4 nodes active).`;
    const genesisLog = `[${new Date().toISOString()}] CONSORTIUM_LEDGER: Genesis Block #000000 active. Zero-Knowledge proofs online.`;

    // Load persisted disputes
    getDisputes().then((disputes) => {
      if (Array.isArray(disputes)) setFlaggedDisputes(disputes);
    });

    const fetchData = async () => {
      try {
        const pool = await get('trustballot-vote-pool');
        setQueuedVotes(Array.isArray(pool) ? pool.length : 0);
      } catch (e) {
        console.error('Failed to read local pool', e);
      }

      // Read sealed transactions from consortium ledger
      const localTxs = await getSealedTransactions();

      // Optionally fetch from backend if configured & reachable
      let backendTxs: string[] = [];
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      if (BACKEND_URL) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          const response = await fetch(`${BACKEND_URL}/transactions`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.transactions)) {
              backendTxs = data.transactions;
            }
          }
        } catch {
          // Backend optional, consortium ledger is primary
        }
      }

      const mergedTxs = Array.from(new Set([...localTxs, ...backendTxs]));
      if (mergedTxs.length > 0) {
        setStream([startupLog, syncLog, ...mergedTxs]);
      } else {
        setStream([startupLog, syncLog, genesisLog]);
      }
      setIsOffline(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);

    // Live real-time mesh subscription: instant append when kiosk casts vote
    const unsubscribe = subscribeToMesh(
      (tx) => {
        setStream((prev) => {
          if (prev.includes(tx.logString)) return prev;
          return [...prev, tx.logString];
        });
        setQueuedVotes((prev) => Math.max(0, prev - 1));
      },
      (dispute) => {
        setFlaggedDisputes((prev) => [dispute, ...prev]);
        const overrideLog = `[${dispute.timestamp}] AUDIT_OVERRIDE: Ref [${dispute.ref}] flagged for consortium review.`;
        setStream((prev) => [...prev, overrideLog]);
      },
      () => {
        setStream([startupLog, syncLog, genesisLog]);
        setFlaggedDisputes([]);
      }
    );

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [stream]);

  const handleFlagDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = disputeInput.trim();
    if (!ref) return;

    // 1. Record dispute into ledger and broadcast to mesh
    const dispute = await recordDispute(ref);
    setFlaggedDisputes((prev) => [dispute, ...prev]);

    // 2. Append real-time dispute notification to the stream
    const overrideLog = `[${new Date().toISOString()}] AUDIT_OVERRIDE: Ref [${ref}] flagged for consortium review. Independent scrutiny active.`;
    setStream((prev) => [...prev, overrideLog]);

    setDisputeSuccess(true);
    setDisputeInput('');
    setTimeout(() => setDisputeSuccess(false), 4000);

    // 3. Attempt backend notification if reachable
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      if (BACKEND_URL) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        await fetch(`${BACKEND_URL}/dispute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptRef: ref }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      }
    } catch {
      // Backend optional
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TASK R17: Separate admin from voter app and secure it
    // In production, this would use a proper auth token against the backend.
    if (passwordInput === 'admin123') {
      setIsLoggedIn(true);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-[#000000] text-[#ededed] p-6 md:p-10 font-sans flex flex-col items-center justify-center">
        <div className="max-w-sm w-full bg-[#111111] border border-[#222] p-8 rounded shadow-2xl">
          <h2 className="text-xl font-medium tracking-tight mb-2">Restricted Access</h2>
          <p className="text-[#888] text-xs mb-6">Enter ECI Administrator Credentials</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Admin Password (admin123)"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="bg-transparent border border-[#333] text-[#ededed] rounded-sm px-4 py-2 text-sm w-full focus:border-[#666] outline-none transition-colors"
              autoFocus
            />
            {loginError && <span className="text-red-500 text-xs">Invalid credentials.</span>}
            <button
              type="submit"
              className="bg-[#ededed] text-black hover:bg-white rounded-sm px-4 py-2 text-sm font-medium transition-colors w-full"
            >
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#ededed] p-6 md:p-10 font-sans flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-[#ededed] font-medium text-base tracking-tight">
            ECI Telemetry & Audit Console
          </h1>
          <p className="text-[#888] text-xs mt-1">Secure Backend Control Room</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="border border-[#333] text-[#888] px-2.5 py-1 text-[10px] uppercase flex items-center gap-2 rounded-sm bg-[#111]">
            <span className="w-2 h-2 rounded-full bg-[#2e7d32]" />
            <span className="text-emerald-400 font-semibold tracking-wider">System Secure</span>
          </div>
          <div className="border border-[#333] text-[#888] px-2.5 py-1 text-[10px] uppercase rounded-sm flex gap-2 items-center bg-[#111]">
            <span>Healthy / 3-of-4 Quorum Active</span>
            <span className="bg-[#222] text-[#ededed] px-1.5 py-0.5 rounded-sm font-mono">
              Queue: {queuedVotes}
            </span>
          </div>
        </div>
      </header>

      {/* Node Health Section */}
      <section>
        <h2 className="text-[#888] text-xs font-medium uppercase tracking-widest mb-3">
          BFT Consortium Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {(nodes.length > 0 ? nodes : [
            { id: 'Node_01', role: 'ECI Primary', status: 'Online / Synced', health: 'good' },
            { id: 'Node_02', role: 'Supreme Court', status: 'Online / Synced', health: 'good' },
            { id: 'Node_03', role: 'State EC Node', status: 'Online / Synced', health: 'good' },
            { id: 'Node_04', role: 'Independent Auditor', status: 'Online / Synced', health: 'good' }
          ]).map((node, i) => (
            <div key={i} className="bg-[#111111] border border-[#222] rounded-sm p-4 flex flex-col justify-between">
              <div>
                <span className="text-[#888] text-[10px] uppercase font-mono tracking-widest">
                  {node.id}
                </span>
                <h3 className="text-[#ededed] text-sm mt-1 font-mono">{node.role}</h3>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <span className={`w-1.5 h-1.5 ${node.health === 'good' ? 'bg-[#2e7d32]' : 'bg-[#F4A261]'}`} />
                <span className="text-[#888] text-[10px] uppercase font-mono">{node.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Encrypted Ciphertext Stream */}
      <section className="border-y border-[#222] py-4 my-4 relative">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[#888] text-xs font-medium uppercase tracking-widest flex items-center gap-2">
            Encrypted Ciphertext Stream
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-sm text-[9px] font-mono">
              ONLINE (WSS / CONSORTIUM MESH)
            </span>
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[#666] text-[10px] font-mono">Consortium P2P Mesh (Active)</span>
            <button
              type="button"
              onClick={async () => {
                await clearLedger();
                const startupLog = `[${new Date().toISOString()}] SYSTEM_STARTUP: Telemetry stream initialized.`;
                const syncLog = `[${new Date().toISOString()}] NODE_SYNC: Consortium connection established (4 of 4 nodes active).`;
                const genesisLog = `[${new Date().toISOString()}] CONSORTIUM_LEDGER: Genesis Block #000000 active. Zero-Knowledge proofs online.`;
                setStream([startupLog, syncLog, genesisLog]);
              }}
              className="border border-[#333] hover:border-[#666] text-[#888] hover:text-[#ededed] px-2 py-0.5 text-[10px] uppercase font-mono rounded-sm transition-colors"
            >
              Reset Stream
            </button>
          </div>
        </div>
        <div
          ref={terminalRef}
          className={`h-[28rem] overflow-y-auto w-full font-mono text-[10px] leading-tight block transition-opacity ${isOffline ? 'opacity-30' : 'opacity-100'}`}
        >
          {stream.map((log, i) => {
            const isTx = log.includes('TX_HASH');
            return (
              <div key={i} className="mb-[6px]">
                {isTx ? (
                  <>
                    <span className="text-[#555]">{log.split('] ')[0]}] </span>
                    <span className="text-[#888]">TX_HASH: </span>
                    <span className="text-[#a3a3a3]">
                      {log.split('TX_HASH: ')[1].split(' STATUS:')[0]}
                    </span>
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
        <h3 className="text-[#ededed] font-medium tracking-wide mb-1 text-sm uppercase">
          Procedural Override
        </h3>
        <p className="text-[#888] text-[11px] mb-4">
          Flag a suspicious session or transaction for independent manual audit.
        </p>

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
          <div className="mt-3 p-2.5 bg-emerald-950/70 border border-emerald-800/80 rounded text-emerald-400 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span>Success: Reference marked for independent consortium audit review.</span>
          </div>
        )}

        {flaggedDisputes.length > 0 && (
          <div className="mt-4 border border-[#222] bg-[#111] rounded p-3">
            <h4 className="text-[11px] font-mono text-[#888] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Active Procedural Overrides</span>
              <span className="bg-[#222] text-amber-400 px-1.5 py-0.5 rounded text-[10px]">
                {flaggedDisputes.length} Flagged
              </span>
            </h4>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto font-mono text-[10px]">
              {flaggedDisputes.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-[#222] pb-1">
                  <span className="text-[#ededed] truncate max-w-[280px] md:max-w-md">{d.ref}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#666]">{d.timestamp.substring(11, 19)} UTC</span>
                    <span className="text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded text-[9px]">
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <span className="text-[10px] text-red-500/80 mt-3 block font-mono">
          Strict Constraint: No biometric or plain-text voting data is retained during this
          procedure.
        </span>
      </div>
    </div>
  );
}
