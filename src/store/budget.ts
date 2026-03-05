import { create } from "zustand";
import {
  decrypt,
  deriveKey,
  stripSaltForDecrypt,
  persistKeyToSession,
  importKeyFromSession,
  decryptSyncPayloadWithPassphrase,
  isPortableFormat,
} from "@/lib/crypto";
import {
  serializeAndPreparePayloads,
  persistToStoresInOrder,
  createDefaultPersistenceAdapters,
} from "@/lib/budget-persistence";
import { getContentFingerprint } from "@/lib/budget-persistence/serialize";
import { migrateBudget } from "@/lib/budget-migrations";
import { debounceLeadingTrailing } from "@/lib/debounce";
import {
  ENCRYPTED_STORAGE_KEY_PREFIX,
  SESSION_DECRYPTED_KEY_PREFIX,
  BUDGET_ID_STORAGE_KEY,
  getBudgetMetadata,
  setBudgetMetadata,
  getLastSyncedFingerprint,
  setLastSyncedFingerprint,
  isNewerVersionCooldownActive,
} from "@/lib/constants";
import { toast } from "sonner";
import { useSessionStore } from "./session";

/** Generate a UUID v4 for entity ids. */
function generateId(): string {
  return crypto.randomUUID();
}

export type IncomeEventSchedule =
  | { type: "one-time"; date: string }
  | {
      type: "recurring";
      /** One or more days of the month (1–31). Sorted, deduplicated. */
      daysOfMonth: number[];
      startDate?: string;
      endDate?: string;
    };

/** Details for stock sale / RSU vesting income. Used when incomeType is stock_sale_proceeds or rsu_vesting. */
export interface StockSaleDetails {
  symbol: string;
  shares: number;
  /** Estimated tax rate 0–100. Used to compute expected proceeds after taxes. */
  taxRate?: number;
}

/** Withholdings for paycheck income. All amounts in dollars. */
export interface PaycheckWithholdings {
  federalTax?: number;
  stateTax?: number;
  socialSecurity?: number;
  medicare?: number;
  retirement401k?: number;
  healthInsurance?: number;
  hsa?: number;
  fsa?: number;
  other?: number;
}

/** Details for paycheck income. amount = grossAmount - sum(withholdings). */
export interface PaycheckDetails {
  grossAmount: number;
  withholdings?: PaycheckWithholdings;
}

export interface IncomeEvent {
  /** UUID */
  id: string;
  label: string;
  amount: number;
  /** Type of income (e.g. paycheck, dividends). */
  incomeType?: string;
  /** Stock symbol, shares, tax rate. Used when incomeType is stock_sale_proceeds or rsu_vesting. */
  stockSaleDetails?: StockSaleDetails;
  /** Gross and withholdings. Used when incomeType is paycheck. amount is net (take-home). */
  paycheckDetails?: PaycheckDetails;
  schedule: IncomeEventSchedule;
}

export type ExpenseEventSchedule =
  | { type: "one-time"; date: string }
  | {
      type: "recurring";
      /** One or more days of the month (1–31). Sorted, deduplicated. */
      daysOfMonth: number[];
      startDate?: string;
      endDate?: string;
    }
  | {
      type: "whole-month";
      startDate?: string;
      endDate?: string;
    };

export interface ExpenseEvent {
  /** UUID */
  id: string;
  label: string;
  amount: number;
  /** Category key from a predefined list (e.g. "rent", "groceries"). */
  category?: string;
  schedule: ExpenseEventSchedule;
}

export interface MonthActuals {
  /** Actual amount received for each income event. Key: event id. */
  actualIncomeByEventId?: Record<string, number>;
  /** Actual amount paid for each expense event. Key: event id. */
  actualExpenseByEventId?: Record<string, number>;
}

export interface BudgetState {
  /** Unique ID for this budget (used in URL and sync path). */
  budgetId: string;
  version: number;
  updatedAt: string;
  incomeEvents: IncomeEvent[];
  expenseEvents: ExpenseEvent[];
  /** Actual income/expenses by month. Key: "YYYY-MM". */
  actualsByMonth?: Record<string, MonthActuals>;
  /** Schema version for migrations. Omit in old data; inferred during migrateBudget. */
  schemaVersion?: number;
  [key: string]: unknown;
}

function getDefaultState(budgetId: string): BudgetState {
  return {
    budgetId,
    version: 1,
    updatedAt: new Date().toISOString(),
    incomeEvents: [],
    expenseEvents: [],
    actualsByMonth: {},
    schemaVersion: 2,
  };
}

const defaultState: BudgetState = getDefaultState("");

export const useBudgetStore = create<BudgetState>(() => defaultState);

/** Parses export-format JSON and replaces the entire budget state. Keeps currentBudgetId. Uses migrateBudget for self-healing. */
function parseExportShape(data: unknown, currentBudgetId: string): BudgetState {
  return migrateBudget(data, currentBudgetId);
}

/** Replace entire budget state from exported JSON. Use this for import. */
export function replaceBudgetFromExport(
  data: unknown,
  currentBudgetId: string,
): void {
  const state = parseExportShape(data, currentBudgetId);
  useBudgetStore.setState(state, true);
  // Persist immediately; don't rely on debounced save (user may reload before it fires).
  void saveBudget();
}

export function addExpenseEvent(event: Omit<ExpenseEvent, "id">): void {
  useBudgetStore.setState((state) => ({
    expenseEvents: [...state.expenseEvents, { ...event, id: generateId() }],
  }));
}

export function updateExpenseEvent(
  id: string,
  updates: Partial<Omit<ExpenseEvent, "id">>,
): void {
  useBudgetStore.setState((state) => ({
    expenseEvents: state.expenseEvents.map((ev) =>
      ev.id === id ? { ...ev, ...updates } : ev,
    ),
  }));
}

export function deleteExpenseEvent(id: string): void {
  useBudgetStore.setState((state) => ({
    expenseEvents: state.expenseEvents.filter((ev) => ev.id !== id),
    actualsByMonth:
      pruneActualsForEvent(state.actualsByMonth, id, "expense") ??
      state.actualsByMonth,
  }));
}

export function addIncomeEvent(event: Omit<IncomeEvent, "id">): void {
  useBudgetStore.setState((state) => ({
    incomeEvents: [...state.incomeEvents, { ...event, id: generateId() }],
  }));
}

export function updateIncomeEvent(
  id: string,
  updates: Partial<Omit<IncomeEvent, "id">>,
): void {
  useBudgetStore.setState((state) => ({
    incomeEvents: state.incomeEvents.map((ev) =>
      ev.id === id ? { ...ev, ...updates } : ev,
    ),
  }));
}

function pruneActualsForEvent(
  actualsByMonth: Record<string, MonthActuals> | undefined,
  eventId: string,
  kind: "income" | "expense",
): Record<string, MonthActuals> | undefined {
  if (!actualsByMonth) return undefined;
  const key =
    kind === "income" ? "actualIncomeByEventId" : "actualExpenseByEventId";
  let changed = false;
  const next: Record<string, MonthActuals> = {};
  for (const [month, monthActuals] of Object.entries(actualsByMonth)) {
    const map = monthActuals[key];
    if (map && eventId in map) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit pattern
      const { [eventId]: _, ...rest } = map;
      const isEmpty = Object.keys(rest).length === 0;
      const otherKey =
        kind === "income" ? "actualExpenseByEventId" : "actualIncomeByEventId";
      const otherEmpty =
        !monthActuals[otherKey] ||
        Object.keys(monthActuals[otherKey]).length === 0;
      if (isEmpty && otherEmpty) {
        changed = true;
        continue; // omit month entirely
      }
      next[month] = { ...monthActuals, [key]: rest };
      changed = true;
    } else {
      next[month] = monthActuals;
    }
  }
  return changed ? next : actualsByMonth;
}

export function deleteIncomeEvent(id: string): void {
  useBudgetStore.setState((state) => ({
    incomeEvents: state.incomeEvents.filter((ev) => ev.id !== id),
    actualsByMonth:
      pruneActualsForEvent(state.actualsByMonth, id, "income") ??
      state.actualsByMonth,
  }));
}

/** Key for a month: "YYYY-MM". */
export function getMonthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function setMonthActuals(
  monthKey: string,
  actuals: Partial<MonthActuals>,
): void {
  useBudgetStore.setState((state) => {
    const current = state.actualsByMonth ?? {};
    const existing = current[monthKey] ?? {};
    const next = {
      ...existing,
      ...actuals,
    };
    const isEmpty =
      (!next.actualIncomeByEventId ||
        Object.keys(next.actualIncomeByEventId).length === 0) &&
      (!next.actualExpenseByEventId ||
        Object.keys(next.actualExpenseByEventId).length === 0);
    if (isEmpty) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit pattern
      const { [monthKey]: _, ...rest } = current;
      return { actualsByMonth: rest };
    }
    return {
      actualsByMonth: {
        ...current,
        [monthKey]: next,
      },
    };
  });
}

async function getKey(): Promise<CryptoKey | null> {
  const fromStore = useSessionStore.getState().key;
  if (fromStore) return fromStore;
  const fromSession = await importKeyFromSession();
  if (fromSession) {
    useSessionStore.getState().setKey(fromSession);
    return fromSession;
  }
  return null;
}

const SYNC_API = "/api/sync";

const defaultAdapters = createDefaultPersistenceAdapters({
  syncApiUrl: SYNC_API,
  onSyncError: () =>
    toast.error("Saved locally, but sync failed. Check your connection."),
});

/** Fetch encrypted blob from sync by budgetId. Returns null if 404 or empty. */
export async function fetchEncryptedFromSync(
  budgetId: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${SYNC_API}?budgetId=${encodeURIComponent(budgetId)}`,
    );
    if (!res.ok) return null;
    const text = await res.text();
    return text || null;
  } catch {
    return null;
  }
}

/** Returns true if remote updatedAt is strictly greater than local. Invalid timestamps are treated as not newer. */
export function isRemoteNewer(
  remoteUpdatedAt: string,
  localUpdatedAt: string,
): boolean {
  const remoteTime = new Date(remoteUpdatedAt).getTime();
  const localTime = new Date(localUpdatedAt).getTime();
  if (!Number.isFinite(remoteTime) || !Number.isFinite(localTime)) return false;
  return remoteTime > localTime;
}

/** Fetch sync metadata (updatedAt) for version comparison. Returns null if 404 or unavailable. */
export async function fetchSyncMetadata(
  budgetId: string,
): Promise<{ updatedAt: string } | null> {
  try {
    const res = await fetch(
      `${SYNC_API}?budgetId=${encodeURIComponent(budgetId)}&meta=1`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const updatedAt = json?.updatedAt;
    return typeof updatedAt === "string" ? { updatedAt } : null;
  } catch {
    return null;
  }
}

export type LoadBudgetResult =
  | { ok: true }
  | { ok: true; newerVersionAvailable: true }
  | { ok: false; reason: "no_key" | "decrypt_failed" };

/** Load budget for the given budgetId: prefer sessionStorage (decrypted, no passphrase on reload), then localStorage/sync. */
export async function loadBudget(budgetId: string): Promise<LoadBudgetResult> {
  if (typeof window === "undefined") return { ok: false, reason: "no_key" };
  const sessionDecryptedKey = `${SESSION_DECRYPTED_KEY_PREFIX}${budgetId}`;
  const defaultForBudget = getDefaultState(budgetId);

  // Fast path: sessionStorage has decrypted data and we can restore the key
  const sessionDecrypted = sessionStorage.getItem(sessionDecryptedKey);
  if (sessionDecrypted) {
    const key = await getKey();
    if (key) {
      try {
        const parsed = JSON.parse(sessionDecrypted) as unknown;
        const migrated = migrateBudget(parsed, budgetId);
        const current = useBudgetStore.getState();
        const isSameBudget = current.budgetId === budgetId;
        const currentUpdated = new Date(current.updatedAt).getTime();
        const migratedUpdated = new Date(migrated.updatedAt).getTime();
        if (isSameBudget && currentUpdated > migratedUpdated) {
          return { ok: true };
        }
        useBudgetStore.setState(migrated);
        localStorage.setItem(BUDGET_ID_STORAGE_KEY, budgetId);
        const now = new Date().toISOString();
        const meta = getBudgetMetadata(budgetId);
        setBudgetMetadata(budgetId, {
          lastAccessed: now,
          createdAt: meta.createdAt ?? now,
        });
        // Check if a newer version exists in Vercel Blob
        if (!isNewerVersionCooldownActive(budgetId)) {
          const remoteMeta = await fetchSyncMetadata(budgetId);
          if (
            remoteMeta?.updatedAt &&
            isRemoteNewer(remoteMeta.updatedAt, migrated.updatedAt)
          ) {
            return { ok: true, newerVersionAvailable: true };
          }
        }
        return { ok: true };
      } catch {
        sessionStorage.removeItem(sessionDecryptedKey);
      }
    }
  }

  const key = await getKey();
  if (!key) return { ok: false, reason: "no_key" };
  const storageKey = `${ENCRYPTED_STORAGE_KEY_PREFIX}${budgetId}`;

  let raw: string | null = localStorage.getItem(storageKey);
  if (!raw) {
    try {
      const res = await fetch(
        `${SYNC_API}?budgetId=${encodeURIComponent(budgetId)}`,
      );
      if (res.ok) {
        const text = await res.text();
        if (text) raw = text;
      }
    } catch {
      // Offline or sync unavailable
    }
  }

  localStorage.setItem(BUDGET_ID_STORAGE_KEY, budgetId);
  const now = new Date().toISOString();
  const meta = getBudgetMetadata(budgetId);
  setBudgetMetadata(budgetId, {
    lastAccessed: now,
    createdAt: meta.createdAt ?? now,
  });

  if (!raw) {
    useBudgetStore.setState(defaultForBudget);
    sessionStorage.removeItem(sessionDecryptedKey);
    return { ok: true };
  }
  try {
    let decrypted: string;
    try {
      decrypted = await decrypt(raw, key);
    } catch {
      const stripped = stripSaltForDecrypt(raw);
      decrypted = await decrypt(stripped, key);
    }
    sessionStorage.setItem(sessionDecryptedKey, decrypted);
    await persistKeyToSession(key);
    const parsed = JSON.parse(decrypted) as unknown;
    const migrated = migrateBudget(parsed, budgetId);
    const current = useBudgetStore.getState();
    const isSameBudget = current.budgetId === budgetId;
    const currentUpdated = new Date(current.updatedAt).getTime();
    const migratedUpdated = new Date(migrated.updatedAt).getTime();
    if (isSameBudget && currentUpdated > migratedUpdated) {
      return { ok: true };
    }
    useBudgetStore.setState(migrated);
    // Check if a newer version exists in Vercel Blob (slow path)
    if (!isNewerVersionCooldownActive(budgetId)) {
      const remoteMeta = await fetchSyncMetadata(budgetId);
      if (
        remoteMeta?.updatedAt &&
        isRemoteNewer(remoteMeta.updatedAt, migrated.updatedAt)
      ) {
        return { ok: true, newerVersionAvailable: true };
      }
    }
    return { ok: true };
  } catch {
    useBudgetStore.setState(defaultForBudget);
    sessionStorage.removeItem(sessionDecryptedKey);
    return { ok: false, reason: "decrypt_failed" };
  }
}

/**
 * Load the remote version from Vercel Blob using passphrase and apply it.
 * Call when user confirms they want to update to a newer version.
 */
export async function loadRemoteVersionAndApply(
  budgetId: string,
  passphrase: string,
): Promise<{ ok: true } | { ok: false; reason: "decrypt_failed" }> {
  const raw = await fetchEncryptedFromSync(budgetId);
  if (!raw) return { ok: false, reason: "decrypt_failed" };
  try {
    let decrypted: string;
    let key: CryptoKey;
    if (isPortableFormat(raw)) {
      const result = await decryptSyncPayloadWithPassphrase(raw, passphrase);
      decrypted = result.plaintext;
      key = result.key;
    } else {
      key = await deriveKey(passphrase);
      try {
        decrypted = await decrypt(raw, key);
      } catch {
        decrypted = await decrypt(stripSaltForDecrypt(raw), key);
      }
    }
    useSessionStore.getState().setKey(key);
    await persistKeyToSession(key);
    const parsed = JSON.parse(decrypted) as unknown;
    const migrated = migrateBudget(parsed, budgetId);
    useBudgetStore.setState(migrated);
    // Content matches remote; mark as synced so saveBudget skips redundant sync
    setLastSyncedFingerprint(budgetId, getContentFingerprint(migrated));
    await saveBudget();
    localStorage.setItem(BUDGET_ID_STORAGE_KEY, budgetId);
    const now = new Date().toISOString();
    const meta = getBudgetMetadata(budgetId);
    setBudgetMetadata(budgetId, {
      lastAccessed: now,
      createdAt: meta.createdAt ?? now,
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "decrypt_failed" };
  }
}

/** Save current budget in order: sessionStorage (decrypted), localStorage (encrypted), Vercel Blob. Skips sync when content unchanged. */
export async function saveBudget(): Promise<void> {
  const key = await getKey();
  if (!key) return;
  if (typeof window === "undefined") return;
  const state = useBudgetStore.getState();
  if (!state.budgetId) return;

  const payloads = await serializeAndPreparePayloads(state, key);
  const fingerprint = getContentFingerprint(state);
  const lastSynced = getLastSyncedFingerprint(state.budgetId);
  const skipSync = lastSynced !== null && lastSynced === fingerprint;

  await persistToStoresInOrder(state.budgetId, payloads, defaultAdapters, key, {
    skipSync,
  });

  if (!skipSync) {
    setLastSyncedFingerprint(state.budgetId, fingerprint);
  }
}

// Persist whenever state changes. First change saves immediately; rapid edits coalesce into one save after 400ms.
const debouncedSave = debounceLeadingTrailing(saveBudget, 400);
useBudgetStore.subscribe(() => {
  debouncedSave();
});
