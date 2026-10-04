import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { get, set } from 'idb-keyval';
import { Benchmark } from '../utils/benchmark';

export type Language = 'en' | 'hi';

export type LocalizedString = {
  en: string;
  hi: string;
};

export type Candidate = {
  id: string;
  name: LocalizedString;
  party: LocalizedString;
  color: string;
  image?: string;
};

interface KioskContextProps {
  selectedLanguage: Language;
  setSelectedLanguage: (lang: Language) => void;
  voterId: string;
  setVoterVerified: (id: string) => void; // Updated naming here
  selectedCandidate: Candidate | null;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  resetSession: () => void;
  resetActivity: () => void;
  secondsLeft: number;
  submitVote: () => Promise<void>;
  votePool: any[];
  duressMode: boolean;
  setDuressMode: (val: boolean) => void;
}

const KioskContext = createContext<KioskContextProps | undefined>(undefined);

const SESSION_TIMEOUT_SECONDS = 60;

export const KioskProvider = ({ children }: { children: ReactNode }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [voterId, setVoterId] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_TIMEOUT_SECONDS);
  const [votePool, setVotePool] = useState<any[]>([]);
  const [duressMode, setDuressMode] = useState(false);
  
  // TASK R8: Load vote pool from IndexedDB on startup
  useEffect(() => {
    get('trustballot-vote-pool').then((val) => {
      if (val && Array.isArray(val)) {
        setVotePool(val);
      }
    }).catch(e => console.error('Failed to load vote pool from IndexedDB:', e));
  }, []);

  // TASK R8: Save vote pool to IndexedDB whenever it changes
  useEffect(() => {
    set('trustballot-vote-pool', votePool).catch(e => console.error('Failed to save vote pool to IndexedDB:', e));
  }, [votePool]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Expose duressMode in resetSession
  const resetSession = useCallback(() => {
    setSecondsLeft(SESSION_TIMEOUT_SECONDS);
    setVoterId('');
    setSelectedCandidate(null);
    setDuressMode(false);
    navigate('/', { replace: true });
  }, [navigate]);

  const resetActivity = useCallback(() => {
    if (location.pathname !== '/' && location.pathname !== '/success' && location.pathname !== '/audit') {
      setSecondsLeft(SESSION_TIMEOUT_SECONDS);
    }
  }, [location.pathname]);

  const setVoterVerified = useCallback((id: string) => {
    setVoterId(id);
  }, []);

  useEffect(() => {
    const handleActivity = () => {
      if (location.pathname !== '/' && location.pathname !== '/success' && location.pathname !== '/audit') {
        setSecondsLeft(SESSION_TIMEOUT_SECONDS);
      }
    };
    
    const events = ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'click'];
    
    events.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { capture: true, passive: true });
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleActivity, { capture: true } as EventListenerOptions);
      });
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/success' || location.pathname === '/audit') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          resetSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [location.pathname, resetSession]);

  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  const flushPool = useCallback(async () => {
    // If we have nothing to flush, abort
    if (votePool.length === 0) return;
    
    // TASK R4: Cryptographically secure Fisher-Yates shuffle
    const poolToFlush = [...votePool];
    for (let i = poolToFlush.length - 1; i > 0; i--) {
      const randomBuffer = new Uint32Array(1);
      crypto.getRandomValues(randomBuffer);
      const j = randomBuffer[0] % (i + 1);
      [poolToFlush[i], poolToFlush[j]] = [poolToFlush[j], poolToFlush[i]];
    }
    
    console.log('🚀 [MIDDLEWARE] FLUSHING BATCH TO BLOCKCHAIN:', poolToFlush);
    const successfullySent = new Set();
    
    for (const payload of poolToFlush) {
      const candidateStr = payload.candidateId || 'c0';
      const voteInt = parseInt(candidateStr.replace(/[^0-9]/g, '')) || 0;
      
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
        const payloadObj = { 
          vote: voteInt,
          isDecoy: (payload as any).isDecoy || false 
        };
        Benchmark.calculatePayloadSize(payloadObj);

        const response = await Benchmark.measureTime('Network Latency (add_vote)', () => 
          fetch(`${BACKEND_URL}/add_vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadObj)
          })
        );
        
        // TASK R8: Only remove from pool if the request actually succeeds
        if (response.ok) {
          successfullySent.add(payload);
        } else {
          console.error("Backend rejected the payload", response.status);
        }
      } catch (e) {
        console.error("Failed to send payload to blockchain:", e);
      }
    }
    
    // Remove the successfully sent votes from the pool (which triggers the IndexedDB save)
    setVotePool(prev => prev.filter(p => !successfullySent.has(p)));

    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, [votePool]);

  // PRD v1.2: 50-100 votes batch capacity, 2-hour timeout flush (7200000 ms)
  // TEMPORARILY REDUCED TO 3 FOR DEMO PURPOSES (1 vote = 3 payloads)
  useEffect(() => {
    if (votePool.length >= 3) {
      flushPool();
    } else if (votePool.length > 0 && !flushTimerRef.current) {
      flushTimerRef.current = setTimeout(() => {
        flushPool();
      }, 5000); // 5 seconds instead of 2 hours for demo
    } else if (votePool.length === 0 && flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, [votePool, flushPool]);

  const submitVote = async () => {
    return Benchmark.measureTime('Local Vote Processing & Encryption', () => new Promise<void>((resolve, reject) => {
      const cryptoWorkStartTime = performance.now();
      
      // TASK R6: Remove fake 20% rejection rate
      // TASK R2: Temporary leak flag `isDecoy` so backend drops fake votes
      const decoy1 = { voterId: '9876543210', candidateId: 'c1', timestamp: Date.now() - 1000, isDecoy: true };
      const decoy2 = { voterId: '1122334455', candidateId: 'c5', timestamp: Date.now() - 2000, isDecoy: true };
      
      if (duressMode) {
        // Under duress, silently spoil the real vote by adding a 3rd decoy instead.
        const decoy3 = { voterId: '5544332211', candidateId: 'c12', timestamp: Date.now() - 500, isDecoy: true };
        setVotePool((prev) => [...prev, decoy3, decoy1, decoy2]);
      } else {
        // Normal flow
        const realPayload = { voterId, candidateId: selectedCandidate?.id, timestamp: Date.now() };
        setVotePool((prev) => [...prev, realPayload, decoy1, decoy2]);
      }
      
      // TASK R13: Constant-time execution padding to exactly 2500ms
      const cryptoWorkTime = performance.now() - cryptoWorkStartTime;
      const TARGET_TIME_MS = 2500;
      const delay = Math.max(0, TARGET_TIME_MS - cryptoWorkTime);
      
      setTimeout(() => {
        resolve();
      }, delay);
    }));
  };

  return (
    <KioskContext.Provider value={{
      selectedLanguage, setSelectedLanguage,
      voterId, setVoterVerified, // Exporting the correctly named function
      selectedCandidate, setSelectedCandidate,
      resetSession, resetActivity, secondsLeft, submitVote, votePool,
      duressMode, setDuressMode
    }}>
      {children}
    </KioskContext.Provider>
  );
};

export const useKiosk = () => {
  const context = useContext(KioskContext);
  if (!context) throw new Error('useKiosk must be used within KioskProvider');
  return context;
};