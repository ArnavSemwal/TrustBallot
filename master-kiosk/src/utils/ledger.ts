import { get, set, del } from 'idb-keyval';

export interface SealedTransaction {
  txHash: string;
  nullifier: string;
  timestamp: string;
  candidateId?: string;
  isDecoy: boolean;
  logString: string;
}

export interface DisputeRecord {
  ref: string;
  timestamp: string;
  status: string;
}

const STORAGE_KEY = 'trustballot-transactions-v4';
const DISPUTES_KEY = 'trustballot-disputes-v4';
const BFT_CHANNEL_NAME = 'trustballot-consortium-mesh';

// Clean up old keys
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('trustballot-transactions');
    localStorage.removeItem('trustballot-transactions-v2');
    del('trustballot-transactions').catch(() => {});
    del('trustballot-transactions-v2').catch(() => {});
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
 * Records all sealed ciphertext payloads in the batch (real + decoys) to maintain
 * cryptographic indistinguishability on the audit console.
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
 * Record a procedural dispute into storage and broadcast to consortium.
 */
export async function recordDispute(ref: string): Promise<DisputeRecord> {
  const dispute: DisputeRecord = {
    ref,
    timestamp: new Date().toISOString(),
    status: 'FLAGGED_FOR_MANUAL_AUDIT',
  };

  try {
    const existing: DisputeRecord[] = (await get(DISPUTES_KEY)) || [];
    const updated = [dispute, ...existing];
    await set(DISPUTES_KEY, updated);
    try {
      localStorage.setItem(DISPUTES_KEY, JSON.stringify(updated));
    } catch {}

    if (meshChannel) {
      meshChannel.postMessage({
        type: 'NEW_DISPUTE',
        dispute,
      });
    }
  } catch (err) {
    console.error('Failed to record dispute:', err);
  }

  return dispute;
}

/**
 * Retrieve all flagged disputes.
 */
export async function getDisputes(): Promise<DisputeRecord[]> {
  try {
    const records: DisputeRecord[] = (await get(DISPUTES_KEY)) || [];
    if (records.length > 0) return records;
    const local = localStorage.getItem(DISPUTES_KEY);
    if (local) return JSON.parse(local);
  } catch {}
  return [];
}

/**
 * Clear the audit ledger.
 */
export async function clearLedger(): Promise<void> {
  try {
    await del(STORAGE_KEY);
    await del(DISPUTES_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DISPUTES_KEY);
    if (meshChannel) {
      meshChannel.postMessage({ type: 'CLEAR_LEDGER' });
    }
  } catch (err) {
    console.error('Failed to clear ledger:', err);
  }
}

/**
 * Subscribe to live events from the consortium mesh.
 */
export function subscribeToMesh(
  onTx: (tx: SealedTransaction) => void,
  onDispute?: (d: DisputeRecord) => void,
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
            if (latest) onTx(latest);
          } catch {}
        }
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }

  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'NEW_TRANSACTION' && event.data.transaction) {
      onTx(event.data.transaction);
    } else if (event.data?.type === 'NEW_DISPUTE' && event.data.dispute) {
      onDispute?.(event.data.dispute);
    } else if (event.data?.type === 'CLEAR_LEDGER') {
      onClear?.();
    }
  };

  meshChannel.addEventListener('message', handler);
  return () => meshChannel?.removeEventListener('message', handler);
}
