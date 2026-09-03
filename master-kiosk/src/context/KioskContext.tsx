import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
}

const KioskContext = createContext<KioskContextProps | undefined>(undefined);

const SESSION_TIMEOUT_SECONDS = 60;

export const KioskProvider = ({ children }: { children: ReactNode }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [voterId, setVoterId] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_TIMEOUT_SECONDS);
  const [votePool, setVotePool] = useState<any[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Wrapper function to match AuthPage's expected call
  const setVoterVerified = useCallback((id: string) => {
    setVoterId(id);
  }, []);

  const resetSession = () => {
    setSelectedLanguage('en');
    setVoterId('');
    setSelectedCandidate(null);
    setSecondsLeft(SESSION_TIMEOUT_SECONDS);
    navigate('/', { replace: true });
  };

  const resetActivity = useCallback(() => {
    setSecondsLeft(SESSION_TIMEOUT_SECONDS);
  }, []);

  useEffect(() => {
    const handleActivity = () => {
      if (location.pathname !== '/' && location.pathname !== '/success') {
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
    if (location.pathname === '/' || location.pathname === '/success') {
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
  }, [location.pathname]);

  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  const flushPool = useCallback(() => {
    setVotePool((currentPool) => {
      if (currentPool.length > 0) {
        const shuffledPool = [...currentPool].sort(() => Math.random() - 0.5);
        console.log('🚀 [MIDDLEWARE] FLUSHING BATCH TO BLOCKCHAIN:', shuffledPool);
      }
      return [];
    });
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (votePool.length >= 15) {
      flushPool();
    } else if (votePool.length > 0 && !flushTimerRef.current) {
      flushTimerRef.current = setTimeout(() => {
        flushPool();
      }, 60000);
    } else if (votePool.length === 0 && flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, [votePool, flushPool]);

  const submitVote = async () => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.2) {
          reject(new Error('NULLIFIER_COLLISION'));
        } else {
          const realPayload = { voterId, candidateId: selectedCandidate?.id, timestamp: Date.now() };
          const decoy1 = { voterId: '9876543210', candidateId: 'c1', timestamp: Date.now() - 1000 };
          const decoy2 = { voterId: '1122334455', candidateId: 'c5', timestamp: Date.now() - 2000 };
          
          setVotePool((prev) => [...prev, realPayload, decoy1, decoy2]);
          resolve();
        }
      }, 800);
    });
  };

  return (
    <KioskContext.Provider value={{
      selectedLanguage, setSelectedLanguage,
      voterId, setVoterVerified, // Exporting the correctly named function
      selectedCandidate, setSelectedCandidate,
      resetSession, resetActivity, secondsLeft, submitVote, votePool
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