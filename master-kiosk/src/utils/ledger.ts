import { get, set } from 'idb-keyval';

export interface SealedTransaction {
  txHash: string;
  nullifier: string;
  timestamp: string;
  candidateId?: string;
  isDecoy: boolean;
  logString: string;
}

const STORAGE_KEY = 'trustballot-transactions';
const BFT_CHANNEL_NAME = 'trustballot-consortium-mesh';

let meshChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    meshChannel = new BroadcastChannel(BFT_CHANNEL_NAME);
  }
} catch {
  meshChannel = null;
}

/**
 * Record a newly sealed transaction into the consortium ledger.
 * Saves to IndexedDB and localStorage, and broadcasts to all listening tabs.
 */
export async function recordSealedTransaction(tx: SealedTransaction): Promise<void> {
  try {
    const existing: SealedTransaction[] = (await get(STORAGE_KEY)) || [];
    if (!existing.some((t) => t.txHash === tx.txHash)) {
      const updated = [...existing, tx];
      await set(STORAGE_KEY, updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(-100)));
      } catch {}
    }

    // Broadcast in real-time to audit tab
    if (meshChannel) {
      meshChannel.postMessage({
        type: 'NEW_TRANSACTION',
        transaction: tx,
      });
    }
  } catch (err) {
    console.error('Failed to record sealed transaction:', err);
  }
}

/**
 * Retrieve all sealed transaction log strings from storage.
 */
export async function getSealedTransactions(): Promise<string[]> {
  try {
    const records: SealedTransaction[] = (await get(STORAGE_KEY)) || [];
    if (records.length > 0) {
      return records.map((r) => r.logString);
    }
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed: SealedTransaction[] = JSON.parse(local);
      return parsed.map((r) => r.logString);
    }
  } catch (err) {
    console.warn('Failed to read sealed transactions:', err);
  }
  return [];
}

/**
 * Subscribe to live transaction events from the consortium mesh.
 */
export function subscribeToMesh(callback: (tx: SealedTransaction) => void): () => void {
  if (!meshChannel) {
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const list: SealedTransaction[] = JSON.parse(e.newValue);
          const latest = list[list.length - 1];
          if (latest) callback(latest);
        } catch {}
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }

  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'NEW_TRANSACTION' && event.data.transaction) {
      callback(event.data.transaction);
    }
  };

  meshChannel.addEventListener('message', handler);
  return () => meshChannel?.removeEventListener('message', handler);
}
