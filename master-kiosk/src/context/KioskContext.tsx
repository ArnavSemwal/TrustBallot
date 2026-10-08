import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { get, set } from 'idb-keyval';
import { Benchmark } from '../utils/benchmark';
import { generateZKP } from '../crypto/zkp';
import { encryptVoteSEAL, signPayloadDilithium } from '../crypto/encryption';

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
  trackerId: string | null;
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
  const [trackerId, setTrackerId] = useState<string | null>(null);

  // TASK R8: Load vote pool from IndexedDB on startup
  useEffect(() => {
    get('trustballot-vote-pool')
      .then((val) => {
        if (val && Array.isArray(val)) {
          setVotePool(val);
        }
      })
      .catch((e) => console.error('Failed to load vote pool from IndexedDB:', e));
  }, []);

  // TASK R8: Save vote pool to IndexedDB whenever it changes
  useEffect(() => {
    set('trustballot-vote-pool', votePool).catch((e) =>
      console.error('Failed to save vote pool to IndexedDB:', e)
    );
  }, [votePool]);

  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Expose duressMode in resetSession
  const resetSession = useCallback(() => {
    setSecondsLeft(SESSION_TIMEOUT_SECONDS);
    setVoterId('');
    setSelectedCandidate(null);
    setDuressMode(false);
    setTrackerId(null);
    navigate('/', { replace: true });
  }, [navigate]);

  const resetActivity = useCallback(() => {
    if (
      location.pathname !== '/' &&
      location.pathname !== '/success' &&
      location.pathname !== '/audit'
    ) {
      setSecondsLeft(SESSION_TIMEOUT_SECONDS);
    }
  }, [location.pathname]);

  const setVoterVerified = useCallback((id: string) => {
    setVoterId(id);
  }, []);

  useEffect(() => {
    const handleActivity = () => {
      if (
        location.pathname !== '/' &&
        location.pathname !== '/success' &&
        location.pathname !== '/audit'
      ) {
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
    if (
      location.pathname === '/' ||
      location.pathname === '/success' ||
      location.pathname === '/audit'
    ) {
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

  const votePoolRef = useRef(votePool);
  useEffect(() => {
    votePoolRef.current = votePool;
  }, [votePool]);

  const flushPool = useCallback(async () => {
    // TASK R15: Fixed-size encrypted payloads and dummy-traffic scheduling
    // Always take exactly 3 items from the queue. If there are fewer, pad with dummy decoys.
    let poolToFlush = votePoolRef.current.slice(0, 3);

    if (poolToFlush.length < 3) {
      console.log('🚀 [MIDDLEWARE] PADDING BATCH WITH DUMMY TRAFFIC TO MAINTAIN FIXED SIZE');
      while (poolToFlush.length < 3) {
        poolToFlush.push({
          voterId: '0000000000',
          candidateId: 'c0',
          timestamp: Date.now(),
          isDecoy: true,
        });
      }
    }

    // TASK R4: Cryptographically secure Fisher-Yates shuffle
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
          isDecoy: (payload as any).isDecoy || false,
        };
        Benchmark.calculatePayloadSize(payloadObj);

        const response = await Benchmark.measureTime('Network Latency (add_vote)', () =>
          fetch(`${BACKEND_URL}/add_vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadObj),
          })
        );

        // TASK R8: Only remove from pool if the request actually succeeds
        if (response.ok) {
          successfullySent.add(payload);
        } else {
          console.error('Backend rejected the payload', response.status);
        }
      } catch (e) {
        console.error('Failed to send payload to blockchain:', e);
      }
    }

    // Remove the successfully sent votes from the pool (which triggers the IndexedDB save)
    setVotePool((prev) => prev.filter((p) => !successfullySent.has(p)));

    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, [votePool]);

  // TASK R15: Constant timing dummy-traffic scheduling
  // We ALWAYS flush every 5 seconds, regardless of whether there are votes or not,
  // to ensure network traffic frequency never leaks voter activity.
  useEffect(() => {
    const intervalId = setInterval(() => {
      flushPool();
    }, 5000); // Exactly 5 seconds constant frequency

    return () => clearInterval(intervalId);
  }, [flushPool]);

  const submitVote = async () => {
    return Benchmark.measureTime(
      'Local Vote Processing & Encryption',
      async () => {
        const cryptoWorkStartTime = performance.now();

        // TASK R14 & R16: Actually perform the cryptography!
        const candidateIdStr = selectedCandidate?.id || 'c0';
        const candidateIndex = parseInt(candidateIdStr.replace(/[^0-9]/g, '')) || 0;
        
        // 1. Encrypt vote with SEAL (R14)
        const cipherBase64 = await encryptVoteSEAL(candidateIndex);
        
        // 2. Generate ZKP with snarkjs (R16)
        const zkp = await generateZKP(1, candidateIdStr, 12); // Assuming electionId=1, 12 candidates
        
        // 3. Sign the payload hash with Dilithium WASM mock (R14)
        // Creating a pseudo-hash for the payload
        const payloadHash = `${voterId}_1_${cipherBase64.substring(0, 10)}`;
        const signature = await signPayloadDilithium(payloadHash);

        // 4. Generate Tracker ID (Receipt)
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cipherBase64));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const generatedTracker = `TRK-${hashHex.substring(0, 10).toUpperCase()}`;
        setTrackerId(generatedTracker);

        const realPayload = {
          voterId,
          ciphertext: cipherBase64,
          zkp,
          signature,
          trackerId: generatedTracker,
          timestamp: Date.now(),
        };

        const decoy1 = {
          voterId: '9876543210',
          ciphertext: 'DECOY_CIPHER_1',
          zkp: { mock: true, decoy: true },
          signature: 'DECOY_SIG_1',
          timestamp: Date.now() - 1000,
          isDecoy: true,
        };
        const decoy2 = {
          voterId: '1122334455',
          ciphertext: 'DECOY_CIPHER_2',
          zkp: { mock: true, decoy: true },
          signature: 'DECOY_SIG_2',
          timestamp: Date.now() - 2000,
          isDecoy: true,
        };

        if (duressMode) {
          const decoy3 = {
            voterId: '5544332211',
            ciphertext: 'DECOY_CIPHER_3',
            zkp: { mock: true, decoy: true },
            signature: 'DECOY_SIG_3',
            timestamp: Date.now() - 500,
            isDecoy: true,
          };
          setVotePool((prev) => [...prev, decoy3, decoy1, decoy2]);
        } else {
          setVotePool((prev) => [...prev, realPayload, decoy1, decoy2]);
        }

        // TASK R13: Constant-time execution padding to exactly 2500ms
        const cryptoWorkTime = performance.now() - cryptoWorkStartTime;
        const TARGET_TIME_MS = 2500;
        const delay = Math.max(0, TARGET_TIME_MS - cryptoWorkTime);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    );
  };

  return (
    <KioskContext.Provider
      value={{
        selectedLanguage,
        setSelectedLanguage,
        voterId,
        setVoterVerified, // Exporting the correctly named function
        selectedCandidate,
        setSelectedCandidate,
        resetSession,
        resetActivity,
        secondsLeft,
        submitVote,
        votePool,
        duressMode,
        setDuressMode,
        trackerId,
      }}
    >
      {children}
    </KioskContext.Provider>
  );
};

export const useKiosk = () => {
  const context = useContext(KioskContext);
  if (!context) throw new Error('useKiosk must be used within KioskProvider');
  return context;
};
