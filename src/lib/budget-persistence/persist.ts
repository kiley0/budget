import { encrypt, prepareSyncPayload, persistKeyToSession } from "@/lib/crypto";
import {
  ENCRYPTED_STORAGE_KEY_PREFIX,
  SESSION_DECRYPTED_KEY_PREFIX,
} from "@/lib/constants";
import {
  serializeBudgetForPersistence,
  type SerializableBudgetState,
} from "./serialize";

/** Payloads produced for each store. */
export interface PersistPayloads {
  /** Decrypted plaintext JSON for session storage. */
  decrypted: string;
  /** Base64 encrypted payload for local storage. */
  encrypted: string;
  /** Portable format (salt + encrypted) for sync API. */
  syncPayload: string;
  /** ISO timestamp for sync metadata (enables version comparison). */
  updatedAt: string;
}

/**
 * Storage adapters for budget persistence. Inject mocks in tests.
 */
export interface PersistenceAdapters {
  writeSession(
    budgetId: string,
    decrypted: string,
    key: CryptoKey,
  ): Promise<void>;
  writeLocal(budgetId: string, encrypted: string): void;
  writeSync(
    budgetId: string,
    syncPayload: string,
    updatedAt: string,
  ): Promise<void>;
}

/**
 * Write budget payloads to all stores in order: session → local → sync.
 * Fully testable with mocked adapters.
 */
export async function persistToStoresInOrder(
  budgetId: string,
  payloads: PersistPayloads,
  adapters: PersistenceAdapters,
  key: CryptoKey,
): Promise<void> {
  await adapters.writeSession(budgetId, payloads.decrypted, key);
  adapters.writeLocal(budgetId, payloads.encrypted);
  await adapters.writeSync(budgetId, payloads.syncPayload, payloads.updatedAt);
}

/**
 * Encrypt plaintext and prepare sync payload. Uses crypto module.
 */
export async function preparePersistPayloads(
  plaintext: string,
  key: CryptoKey,
): Promise<PersistPayloads> {
  const encrypted = await encrypt(plaintext, key);
  const syncPayload = prepareSyncPayload(encrypted);
  let updatedAt = "";
  try {
    const parsed = JSON.parse(plaintext) as { updatedAt?: string };
    updatedAt = typeof parsed?.updatedAt === "string" ? parsed.updatedAt : "";
  } catch {
    // ignore
  }
  return { decrypted: plaintext, encrypted, syncPayload, updatedAt };
}

/**
 * Full pipeline: serialize state → prepare payloads.
 * Separated so serializeBudgetForPersistence stays pure.
 */
export async function serializeAndPreparePayloads(
  state: SerializableBudgetState,
  key: CryptoKey,
): Promise<PersistPayloads> {
  const plaintext = serializeBudgetForPersistence(state);
  return preparePersistPayloads(plaintext, key);
}

/**
 * Create default adapters using real sessionStorage, localStorage, and fetch.
 */
export function createDefaultPersistenceAdapters(options: {
  syncApiUrl: string;
  onSyncError?: () => void;
}): PersistenceAdapters {
  const { syncApiUrl, onSyncError } = options;

  return {
    async writeSession(
      budgetId: string,
      decrypted: string,
      key: CryptoKey,
    ): Promise<void> {
      if (typeof window === "undefined") return;
      const sessionDecryptedKey = `${SESSION_DECRYPTED_KEY_PREFIX}${budgetId}`;
      sessionStorage.setItem(sessionDecryptedKey, decrypted);
      await persistKeyToSession(key);
    },

    writeLocal(budgetId: string, encrypted: string): void {
      if (typeof window === "undefined") return;
      const storageKey = `${ENCRYPTED_STORAGE_KEY_PREFIX}${budgetId}`;
      localStorage.setItem(storageKey, encrypted);
    },

    async writeSync(
      budgetId: string,
      syncPayload: string,
      updatedAt: string,
    ): Promise<void> {
      try {
        const res = await fetch(syncApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            budgetId,
            data: syncPayload,
            ...(updatedAt && { updatedAt }),
          }),
        });
        if (!res.ok) throw new Error("Sync failed");
      } catch {
        onSyncError?.();
      }
    },
  };
}
