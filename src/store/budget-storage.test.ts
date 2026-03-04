/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  useBudgetStore,
  loadBudget,
  saveBudget,
  replaceBudgetFromExport,
} from "./budget";
import { useSessionStore } from "./session";
import {
  encrypt,
  decrypt,
  deriveKeyWithSalt,
  persistKeyToSession,
} from "@/lib/crypto";
import {
  ENCRYPTED_STORAGE_KEY_PREFIX,
  SESSION_DECRYPTED_KEY_PREFIX,
  BUDGET_ID_STORAGE_KEY,
  SESSION_KEY_STORAGE_KEY,
} from "@/lib/constants";

const TEST_BUDGET_ID = "test-storage-budget-id";
const SALT = new Uint8Array(16);
SALT.fill(1);

async function getTestKey() {
  return deriveKeyWithSalt("test-passphrase", SALT);
}

describe("budget storage", () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    useSessionStore.getState().clearKey();
    replaceBudgetFromExport(null, TEST_BUDGET_ID);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("saveBudget", () => {
    it("writes encrypted payload to localStorage", async () => {
      const key = await getTestKey();
      useSessionStore.getState().setKey(key);
      useBudgetStore.setState((s) => ({
        ...s,
        budgetId: TEST_BUDGET_ID,
        incomeSources: [{ id: "src-1", name: "Job", description: "" }],
      }));
      await saveBudget();
      const stored = localStorage.getItem(
        `${ENCRYPTED_STORAGE_KEY_PREFIX}${TEST_BUDGET_ID}`,
      );
      expect(stored).toBeTruthy();
      expect(typeof stored).toBe("string");
      const decrypted = await decrypt(stored!, key);
      const parsed = JSON.parse(decrypted);
      expect(parsed.incomeSources).toHaveLength(1);
      expect(parsed.incomeSources[0].name).toBe("Job");
    });

    it("writes decrypted JSON to sessionStorage", async () => {
      const key = await getTestKey();
      useSessionStore.getState().setKey(key);
      useBudgetStore.setState((s) => ({
        ...s,
        budgetId: TEST_BUDGET_ID,
        expenseEvents: [
          {
            id: "ev-1",
            label: "Rent",
            amount: 1500,
            schedule: { type: "recurring", dayOfMonth: 1 },
          },
        ],
      }));
      await saveBudget();
      const sessionKey = `${SESSION_DECRYPTED_KEY_PREFIX}${TEST_BUDGET_ID}`;
      const stored = sessionStorage.getItem(sessionKey);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.expenseEvents).toHaveLength(1);
      expect(parsed.expenseEvents[0].label).toBe("Rent");
    });

    it("persists key to sessionStorage", async () => {
      const key = await getTestKey();
      useSessionStore.getState().setKey(key);
      useBudgetStore.setState((s) => ({ ...s, budgetId: TEST_BUDGET_ID }));
      await saveBudget();
      expect(sessionStorage.getItem(SESSION_KEY_STORAGE_KEY)).toBeTruthy();
    });

    it("does nothing when no key is available", async () => {
      useSessionStore.getState().clearKey();
      sessionStorage.clear();
      useBudgetStore.setState((s) => ({
        ...s,
        budgetId: TEST_BUDGET_ID,
        incomeSources: [{ id: "x", name: "Job", description: "" }],
      }));
      await saveBudget();
      expect(
        localStorage.getItem(
          `${ENCRYPTED_STORAGE_KEY_PREFIX}${TEST_BUDGET_ID}`,
        ),
      ).toBeNull();
      expect(
        sessionStorage.getItem(
          `${SESSION_DECRYPTED_KEY_PREFIX}${TEST_BUDGET_ID}`,
        ),
      ).toBeNull();
    });
  });

  describe("loadBudget", () => {
    it("loads from sessionStorage when decrypted data and key exist (fast path)", async () => {
      const key = await getTestKey();
      await persistKeyToSession(key);
      const sessionKey = `${SESSION_DECRYPTED_KEY_PREFIX}${TEST_BUDGET_ID}`;
      const budgetJson = JSON.stringify({
        budgetId: TEST_BUDGET_ID,
        version: 1,
        updatedAt: new Date().toISOString(),
        incomeSources: [{ id: "fast-src", name: "Fast Job", description: "" }],
        incomeEvents: [],
        expenseDestinations: [],
        expenseEvents: [],
      });
      sessionStorage.setItem(sessionKey, budgetJson);
      const result = await loadBudget(TEST_BUDGET_ID);
      expect(result).toEqual({ ok: true });
      const state = useBudgetStore.getState();
      expect(state.incomeSources).toHaveLength(1);
      expect(state.incomeSources[0].name).toBe("Fast Job");
    });

    it("loads from localStorage and writes decrypted to sessionStorage", async () => {
      const key = await getTestKey();
      await persistKeyToSession(key);
      const budgetJson = JSON.stringify({
        budgetId: TEST_BUDGET_ID,
        version: 1,
        updatedAt: new Date().toISOString(),
        incomeSources: [
          { id: "local-src", name: "Local Job", description: "" },
        ],
        incomeEvents: [],
        expenseDestinations: [],
        expenseEvents: [],
      });
      const encrypted = await encrypt(budgetJson, key);
      localStorage.setItem(
        `${ENCRYPTED_STORAGE_KEY_PREFIX}${TEST_BUDGET_ID}`,
        encrypted,
      );
      const result = await loadBudget(TEST_BUDGET_ID);
      expect(result).toEqual({ ok: true });
      const state = useBudgetStore.getState();
      expect(state.incomeSources[0].name).toBe("Local Job");
      expect(
        sessionStorage.getItem(
          `${SESSION_DECRYPTED_KEY_PREFIX}${TEST_BUDGET_ID}`,
        ),
      ).toBeTruthy();
    });

    it("clears sessionStorage when loading empty budget", async () => {
      const key = await getTestKey();
      await persistKeyToSession(key);
      const sessionKey = `${SESSION_DECRYPTED_KEY_PREFIX}${TEST_BUDGET_ID}`;
      // Stale/corrupt session data – loadBudget will clear it when no encrypted source exists
      sessionStorage.setItem(sessionKey, "invalid-json {{{");
      vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
      const result = await loadBudget(TEST_BUDGET_ID);
      expect(result).toEqual({ ok: true });
      expect(sessionStorage.getItem(sessionKey)).toBeNull();
      const state = useBudgetStore.getState();
      expect(state.budgetId).toBe(TEST_BUDGET_ID);
      expect(state.incomeSources).toEqual([]);
    });

    it("returns no_key when key is not available", async () => {
      sessionStorage.clear();
      useSessionStore.getState().clearKey();
      const result = await loadBudget(TEST_BUDGET_ID);
      expect(result).toEqual({ ok: false, reason: "no_key" });
    });

    it("updates BUDGET_ID_STORAGE_KEY in localStorage when loading", async () => {
      const key = await getTestKey();
      await persistKeyToSession(key);
      const budgetJson = JSON.stringify({
        budgetId: TEST_BUDGET_ID,
        version: 1,
        updatedAt: new Date().toISOString(),
        incomeSources: [],
        incomeEvents: [],
        expenseDestinations: [],
        expenseEvents: [],
      });
      localStorage.setItem(
        `${ENCRYPTED_STORAGE_KEY_PREFIX}${TEST_BUDGET_ID}`,
        await encrypt(budgetJson, key),
      );
      await loadBudget(TEST_BUDGET_ID);
      expect(localStorage.getItem(BUDGET_ID_STORAGE_KEY)).toBe(TEST_BUDGET_ID);
    });
  });
});
