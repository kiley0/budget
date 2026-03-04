/** Key for encrypted budget data in localStorage. Stored per budget as budget_encrypted_${budgetId}. */
export const ENCRYPTED_STORAGE_KEY_PREFIX = "budget_encrypted_";

/** Key for decrypted budget data in sessionStorage. Enables reload without passphrase. budget_session_decrypted_${budgetId}. */
export const SESSION_DECRYPTED_KEY_PREFIX = "budget_session_decrypted_";

/** Key for exported encryption key in sessionStorage. Restored on reload for same-tab session. */
export const SESSION_KEY_STORAGE_KEY = "budget_session_key";

/** Key for the current/last-used budget ID in localStorage (for redirect from /budget). */
export const BUDGET_ID_STORAGE_KEY = "budget_id";

/** Prefix for newer-version cooldown in sessionStorage. Cooldown expires at ISO timestamp. */
const NEWER_VERSION_COOLDOWN_PREFIX = "budget_newer_version_cooldown_";
const NEWER_VERSION_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

export function setNewerVersionCooldown(budgetId: string): void {
  if (typeof window === "undefined") return;
  const expiresAt = new Date(
    Date.now() + NEWER_VERSION_COOLDOWN_MS,
  ).toISOString();
  sessionStorage.setItem(
    `${NEWER_VERSION_COOLDOWN_PREFIX}${budgetId}`,
    expiresAt,
  );
}

export function isNewerVersionCooldownActive(budgetId: string): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(
    `${NEWER_VERSION_COOLDOWN_PREFIX}${budgetId}`,
  );
  if (!raw) return false;
  const expiresAt = new Date(raw).getTime();
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

/** Sentinel value for Radix Select "no selection" (SelectItem cannot use value=""). */
export const SELECT_NONE = "__none__";

/** Key for user preferences in localStorage (JSON). Separate from budget data. */
export const PREFERENCES_STORAGE_KEY = "budget_preferences";

export interface BudgetPreferences {
  hotkeysVisible?: boolean;
}

/** Get preferences from localStorage. */
export function getPreferences(): BudgetPreferences {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const o = parsed as Record<string, unknown>;
    return {
      hotkeysVisible:
        typeof o.hotkeysVisible === "boolean" ? o.hotkeysVisible : undefined,
    };
  } catch {
    return {};
  }
}

/** Save preferences to localStorage. */
export function setPreferences(next: BudgetPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
}

/** Key for last-synced content fingerprint per budget. Used to skip sync when content unchanged. budget_last_synced_fingerprint_${budgetId}. */
export const LAST_SYNCED_FINGERPRINT_PREFIX = "budget_last_synced_fingerprint_";

export function getLastSyncedFingerprint(budgetId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${LAST_SYNCED_FINGERPRINT_PREFIX}${budgetId}`);
}

export function setLastSyncedFingerprint(
  budgetId: string,
  fingerprint: string,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${LAST_SYNCED_FINGERPRINT_PREFIX}${budgetId}`,
    fingerprint,
  );
}

/** Key for unencrypted budget metadata per budget. Stored as budget_meta_${budgetId} (JSON). */
export const BUDGET_META_KEY_PREFIX = "budget_meta_";

export interface BudgetMetadata {
  /** ISO timestamp when the budget was first created/stored. */
  createdAt?: string;
  /** ISO timestamp when the budget was last opened. */
  lastAccessed?: string;
  /** User-defined name for the budget (unencrypted, shown on get-started). */
  name?: string;
}

const META_KEY = (id: string) => `${BUDGET_META_KEY_PREFIX}${id}`;

const LEGACY_LAST_ACCESSED_PREFIX = "budget_last_accessed_";

/** Returns unencrypted metadata for a budget (createdAt, lastAccessed). Migrates from legacy budget_last_accessed_* if present. */
export function getBudgetMetadata(budgetId: string): BudgetMetadata {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(META_KEY(budgetId));
    if (!raw) {
      const legacy = localStorage.getItem(
        `${LEGACY_LAST_ACCESSED_PREFIX}${budgetId}`,
      );
      if (legacy) return { lastAccessed: legacy };
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const o = parsed as Record<string, unknown>;
    return {
      createdAt: typeof o.createdAt === "string" ? o.createdAt : undefined,
      lastAccessed:
        typeof o.lastAccessed === "string" ? o.lastAccessed : undefined,
      name: typeof o.name === "string" ? o.name : undefined,
    };
  } catch {
    return {};
  }
}

/** Parse metadata from export JSON (raw "metadata" value). Returns a safe BudgetMetadata. Empty strings are treated as undefined. */
export function parseMetadataFromExport(raw: unknown): BudgetMetadata {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;
  const name = str(o.name);
  const createdAt = str(o.createdAt);
  const lastAccessed = str(o.lastAccessed);
  const result: BudgetMetadata = {};
  if (name !== undefined) result.name = name;
  if (createdAt !== undefined) result.createdAt = createdAt;
  if (lastAccessed !== undefined) result.lastAccessed = lastAccessed;
  return result;
}

/** Writes unencrypted metadata for a budget. Merges with existing; pass partial updates. Removes legacy key if present. */
export function setBudgetMetadata(
  budgetId: string,
  updates: Partial<BudgetMetadata>,
): void {
  if (typeof window === "undefined") return;
  const current = getBudgetMetadata(budgetId);
  const next: BudgetMetadata = {
    ...current,
    ...updates,
  };
  localStorage.setItem(META_KEY(budgetId), JSON.stringify(next));
  localStorage.removeItem(`${LEGACY_LAST_ACCESSED_PREFIX}${budgetId}`);
}

/** Returns all budget IDs that have encrypted data in localStorage. */
export function getStoredBudgetIds(): string[] {
  if (typeof window === "undefined") return [];
  const prefix = ENCRYPTED_STORAGE_KEY_PREFIX;
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      const id = key.slice(prefix.length);
      if (id) ids.push(id);
    }
  }
  return ids;
}

/** Removes all budget data and metadata from localStorage (encrypted payloads, metadata, current budget id). */
export function clearAllBudgetsFromStorage(): void {
  if (typeof window === "undefined") return;
  const ids = getStoredBudgetIds();
  for (const id of ids) {
    localStorage.removeItem(`${ENCRYPTED_STORAGE_KEY_PREFIX}${id}`);
    localStorage.removeItem(`${BUDGET_META_KEY_PREFIX}${id}`);
    localStorage.removeItem(`${LEGACY_LAST_ACCESSED_PREFIX}${id}`);
    localStorage.removeItem(`${LAST_SYNCED_FINGERPRINT_PREFIX}${id}`);
  }
  localStorage.removeItem(BUDGET_ID_STORAGE_KEY);
}

/** Category value for "Savings & investments" — used in MonthlyPnLSection savings display. */
export const SAVINGS_CATEGORY = "savings" as const;

/** Category value for "Debt repayment" — used in MonthlyPnLSection debt repayment display. */
export const DEBT_REPAYMENT_CATEGORY = "debt_repayment" as const;

export const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent / Mortgage" },
  { value: "utilities", label: "Utilities" },
  { value: "groceries", label: "Groceries" },
  { value: "transportation", label: "Transportation" },
  { value: "insurance", label: "Insurance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "entertainment", label: "Entertainment" },
  { value: "dining", label: "Dining out" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: DEBT_REPAYMENT_CATEGORY, label: "Debt repayment" },
  { value: SAVINGS_CATEGORY, label: "Savings & investments" },
  { value: "personal", label: "Personal care" },
  { value: "education", label: "Education" },
  { value: "gifts", label: "Gifts & donations" },
  { value: "other", label: "Other" },
] as const;

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number]["value"];

export function getExpenseCategoryLabel(value: string | undefined): string {
  if (!value) return "–";
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const INCOME_TYPES = [
  { value: "paycheck", label: "Paycheck" },
  { value: "stock_sale_proceeds", label: "Stock sale proceeds" },
  { value: "rsu_vesting", label: "RSU vesting" },
  { value: "freelance", label: "Freelance / Contract" },
  { value: "rental", label: "Rental income" },
  { value: "dividends", label: "Dividends" },
  { value: "interest", label: "Interest" },
  { value: "bonus", label: "Bonus" },
  { value: "other", label: "Other" },
] as const;

export type IncomeTypeValue = (typeof INCOME_TYPES)[number]["value"];

export function getIncomeTypeLabel(value: string | undefined): string {
  if (!value) return "–";
  return INCOME_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** Income types that use stock symbol + shares + tax for expected proceeds. */
export const STOCK_INCOME_TYPES = [
  "stock_sale_proceeds",
  "rsu_vesting",
] as const;

/** Valid range for recurring schedule day of month. */
export const DAY_OF_MONTH_MIN = 1;
export const DAY_OF_MONTH_MAX = 31;

/** Paycheck withholding field keys and labels for the Add/Edit income form. */
export const PAYCHECK_WITHHOLDINGS = [
  { key: "federalTax", label: "Federal tax" },
  { key: "stateTax", label: "State tax" },
  { key: "socialSecurity", label: "Social Security" },
  { key: "medicare", label: "Medicare" },
  { key: "retirement401k", label: "401(k) / Retirement" },
  { key: "healthInsurance", label: "Health insurance" },
  { key: "hsa", label: "HSA" },
  { key: "fsa", label: "FSA" },
  { key: "other", label: "Other" },
] as const;

export type PaycheckWithholdingKey =
  (typeof PAYCHECK_WITHHOLDINGS)[number]["key"];
