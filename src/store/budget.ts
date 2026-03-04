import { create } from "zustand";
import {
  encrypt,
  decrypt,
  prepareSyncPayload,
  stripSaltForDecrypt,
  persistKeyToSession,
  importKeyFromSession,
} from "@/lib/crypto";
import { migrateBudget } from "@/lib/budget-migrations";
import { debounce } from "@/lib/debounce";
import {
  ENCRYPTED_STORAGE_KEY_PREFIX,
  SESSION_DECRYPTED_KEY_PREFIX,
  BUDGET_ID_STORAGE_KEY,
  getBudgetMetadata,
  setBudgetMetadata,
} from "@/lib/constants";
import { toast } from "sonner";
import { useSessionStore } from "./session";

/** Generate a UUID v4 for entity ids. */
function generateId(): string {
  return crypto.randomUUID();
}

export interface IncomeSource {
  /** UUID */
  id: string;
  name: string;
  description: string;
}

export interface ExpenseDestination {
  /** UUID */
  id: string;
  name: string;
  description: string;
}

export type IncomeEventSchedule =
  | { type: "one-time"; date: string }
  | {
      type: "recurring";
      dayOfMonth: number;
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
  incomeSourceId?: string;
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
      dayOfMonth: number;
      startDate?: string;
      endDate?: string;
    };

export interface ExpenseEvent {
  /** UUID */
  id: string;
  label: string;
  amount: number;
  expenseDestinationId?: string;
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
  incomeSources: IncomeSource[];
  incomeEvents: IncomeEvent[];
  expenseDestinations: ExpenseDestination[];
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
    incomeSources: [],
    incomeEvents: [],
    expenseDestinations: [],
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

export function addIncomeSource(name: string, description: string): void {
  useBudgetStore.setState((state) => ({
    incomeSources: [
      ...state.incomeSources,
      { id: generateId(), name, description },
    ],
  }));
}

export function updateIncomeSource(
  id: string,
  updates: { name?: string; description?: string },
): void {
  useBudgetStore.setState((state) => ({
    incomeSources: state.incomeSources.map((source) =>
      source.id === id ? { ...source, ...updates } : source,
    ),
  }));
}

export function deleteIncomeSource(id: string): void {
  useBudgetStore.setState((state) => ({
    incomeSources: state.incomeSources.filter((source) => source.id !== id),
    incomeEvents: state.incomeEvents.map((ev) =>
      ev.incomeSourceId === id ? { ...ev, incomeSourceId: undefined } : ev,
    ),
  }));
}

export function addExpenseDestination(name: string, description: string): void {
  useBudgetStore.setState((state) => ({
    expenseDestinations: [
      ...state.expenseDestinations,
      { id: generateId(), name, description },
    ],
  }));
}

export function updateExpenseDestination(
  id: string,
  updates: { name?: string; description?: string },
): void {
  useBudgetStore.setState((state) => ({
    expenseDestinations: state.expenseDestinations.map((dest) =>
      dest.id === id ? { ...dest, ...updates } : dest,
    ),
  }));
}

export function deleteExpenseDestination(id: string): void {
  useBudgetStore.setState((state) => ({
    expenseDestinations: state.expenseDestinations.filter(
      (dest) => dest.id !== id,
    ),
    expenseEvents: state.expenseEvents.map((ev) =>
      ev.expenseDestinationId === id
        ? { ...ev, expenseDestinationId: undefined }
        : ev,
    ),
  }));
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

export type LoadBudgetResult =
  | { ok: true }
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
    return { ok: true };
  } catch {
    useBudgetStore.setState(defaultForBudget);
    sessionStorage.removeItem(sessionDecryptedKey);
    return { ok: false, reason: "decrypt_failed" };
  }
}

/** Save current budget to localStorage (encrypted), sessionStorage (decrypted), and push to sync. */
export async function saveBudget(): Promise<void> {
  const key = await getKey();
  if (!key) return;
  if (typeof window === "undefined") return;
  const state = useBudgetStore.getState();
  if (!state.budgetId) return;
  const toSave = { ...state, updatedAt: new Date().toISOString() };
  const plaintext = JSON.stringify(toSave);
  const payload = await encrypt(plaintext, key);
  const storageKey = `${ENCRYPTED_STORAGE_KEY_PREFIX}${state.budgetId}`;
  const sessionDecryptedKey = `${SESSION_DECRYPTED_KEY_PREFIX}${state.budgetId}`;
  localStorage.setItem(storageKey, payload);
  sessionStorage.setItem(sessionDecryptedKey, plaintext);
  await persistKeyToSession(key);
  const syncPayload = prepareSyncPayload(payload);
  try {
    await fetch(SYNC_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgetId: state.budgetId, data: syncPayload }),
    });
  } catch {
    toast.error("Saved locally, but sync failed. Check your connection.");
  }
}

// Persist to encrypted localStorage and sync whenever state changes.
// Debounce 400ms to avoid save storms from rapid edits; coalesces multiple changes into one save.
const debouncedSave = debounce(saveBudget, 400);
useBudgetStore.subscribe(() => {
  debouncedSave();
});
