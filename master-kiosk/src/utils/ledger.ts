import { get, set, del } from 'idb-keyval';

export interface SealedTransaction {
  txHash: string;
  nullifier: string;
  timestamp: string;
  candidateId?: string;
  isDecoy: boolean;
  logString: string;
}

// Bumping to v2 to immediately clear previous spam records
const STORAGE_KEY = 'trustballot-transactions-v2';
const BFT_CHANNEL_NAME = 'trustballot-consortium-mesh';

// Clean up old spam storage keys from previous runs
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('trustballot-transactions');
    del('trustballot-transactions').catch(() => {});
  } catch {}
}

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
 * Only REAL voter transactions are recorded (decoys are dropped from the official ledger).
 */
export async function recordSealedTransaction(tx: SealedTransaction): Promise<void> {
  if (tx.isDecoy) {
    // Decoy votes are strictly for dummy network obfuscation and are NEVER recorded in the audit log
    return;
  }

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
    const valid = records.filter((r) => !r.isDecoy);
    if (valid.length > 0) {
      return valid.map((r) => r.logString);
    }
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed: SealedTransaction[] = JSON.parse(local);
      return parsed.filter((r) => !r.isDecoy).map((r) => r.logString);
    }
  } catch (err) {
    console.warn('Failed to read sealed transactions:', err);
  }
  return [];
}

/**
 * Clear the audit ledger.
 */
export async function clearLedger(): Promise<void> {
  try {
    await del(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    if (meshChannel) {
      meshChannel.postMessage({ type: 'CLEAR_LEDGER' });
    }
  } catch (err) {
    console.error('Failed to clear ledger:', err);
  }
}

/**
 * Subscribe to live transaction events from the consortium mesh.
 */
export function subscribeToMesh(
  onTx: (tx: SealedTransaction) => void,
  onClear?: () => void
): () => void {
  if (!meshChannel) {
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (!e.newValue) {
          onClear?.();
        } else {
          try {
            const list: SealedTransaction[] = JSON.parse(e.newValue);
            const latest = list[list.length - 1];
            if (latest && !latest.isDecoy) onTx(latest);
          } catch {}
        }
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }

  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'NEW_TRANSACTION' && event.data.transaction) {
      if (!event.data.transaction.isDecoy) {
        onTx(event.data.transaction);
      }
    } else if (event.data?.type === 'CLEAR_LEDGER') {
      onClear?.();
    }
  };

  meshChannel.addEventListener('message', handler);
  return () => meshChannel?.removeEventListener('message', handler);
}
