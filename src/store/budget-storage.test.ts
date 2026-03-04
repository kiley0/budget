/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  useBudgetStore,
  loadBudget,
  saveBudget,
  replaceBudgetFromExport,
  loadRemoteVersionAndApply,
  isRemoteNewer,
} from "./budget";
import { useSessionStore } from "./session";
import {
  encrypt,
  decrypt,
  deriveKeyWithSalt,
  persistKeyToSession,
  prepareSyncPayload,
  setStoredSalt,
} from "@/lib/crypto";
import {
  ENCRYPTED_STORAGE_KEY_PREFIX,
  SESSION_DECRYPTED_KEY_PREFIX,
  BUDGET_ID_STORAGE_KEY,
  SESSION_KEY_STORAGE_KEY,
  setLastSyncedFingerprint,
  setNewerVersionCooldown,
} from "@/lib/constants";
import { getContentFingerprint } from "@/lib/budget-persistence/serialize";

const TEST_BUDGET_ID = "test-storage-budget-id";
const SALT = new Uint8Array(16);
SALT.fill(1);

async function getTestKey() {
  return deriveKeyWithSalt("test-passphrase", SALT);
}

describe("isRemoteNewer", () => {
  it("returns true when remote is strictly greater", () => {
    expect(isRemoteNewer("2025-06-01T00:00:00Z", "2025-01-01T00:00:00Z")).toBe(
      true,
    );
  });

  it("returns false when remote equals local", () => {
    const t = "2025-01-01T00:00:00Z";
    expect(isRemoteNewer(t, t)).toBe(false);
  });

  it("returns false when remote is older", () => {
    expect(isRemoteNewer("2025-01-01T00:00:00Z", "2025-06-01T00:00:00Z")).toBe(
      false,
    );
  });

  it("returns false for invalid timestamps", () => {
    expect(isRemoteNewer("not-a-date", "2025-01-01T00:00:00Z")).toBe(false);
    expect(isRemoteNewer("2025-01-01T00:00:00Z", "invalid")).toBe(false);
    expect(isRemoteNewer("", "")).toBe(false);
  });
});

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

    it("skips sync when content fingerprint matches last synced", async () => {
      const key = await getTestKey();
      useSessionStore.getState().setKey(key);
      const state = {
        budgetId: TEST_BUDGET_ID,
        version: 1,
        updatedAt: new Date().toISOString(),
        incomeSources: [{ id: "src-1", name: "Job", description: "" }],
        incomeEvents: [],
        expenseDestinations: [],
        expenseEvents: [],
      };
      useBudgetStore.setState(state);
      await new Promise((r) => setTimeout(r, 0));
      const fingerprint = getContentFingerprint(
        useBudgetStore.getState() as Parameters<
          typeof getContentFingerprint
        >[0],
      );
      setLastSyncedFingerprint(TEST_BUDGET_ID, fingerprint);

      const fetchMock = vi.mocked(fetch);
      fetchMock.mockClear();

      await saveBudget();

      const syncCalls = fetchMock.mock.calls.filter(
        (call) =>
          String(call[0]).includes("/api/sync") &&
          (call[1] as { method?: string })?.method === "POST",
      );
      expect(syncCalls).toHaveLength(0);

      expect(
        localStorage.getItem(
          `${ENCRYPTED_STORAGE_KEY_PREFIX}${TEST_BUDGET_ID}`,
        ),
      ).toBeTruthy();
    });

    it("calls sync when content fingerprint differs from last synced", async () => {
      const key = await getTestKey();
      useSessionStore.getState().setKey(key);
      useBudgetStore.setState((s) => ({
        ...s,
        budgetId: TEST_BUDGET_ID,
        incomeSources: [{ id: "src-1", name: "Job", description: "" }],
      }));

      const fetchMock = vi.mocked(fetch);
      fetchMock.mockClear();

      await saveBudget();

      const syncCalls = fetchMock.mock.calls.filter(
        (call) =>
          String(call[0]).includes("/api/sync") &&
          (call[1] as { method?: string })?.method === "POST",
      );
      expect(syncCalls.length).toBeGreaterThanOrEqual(1);
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

    it("returns newerVersionAvailable when remote metadata has newer updatedAt (fast path)", async () => {
      const key = await getTestKey();
      await persistKeyToSession(key);
      useSessionStore.getState().setKey(key);
      const sessionKey = `${SESSION_DECRYPTED_KEY_PREFIX}${TEST_BUDGET_ID}`;
      const sessionTime = "2025-01-01T00:00:00Z";
      const budgetJson = JSON.stringify({
        budgetId: TEST_BUDGET_ID,
        version: 1,
        updatedAt: sessionTime,
        incomeSources: [{ id: "src", name: "Job", description: "" }],
        incomeEvents: [],
        expenseDestinations: [],
        expenseEvents: [],
      });
      sessionStorage.setItem(sessionKey, budgetJson);
      // Set store with older data so we don't early-return (current < migrated)
      useBudgetStore.setState((s) => ({
        ...s,
        updatedAt: "2024-06-01T00:00:00Z",
      }));
      vi.mocked(fetch).mockImplementation((url) => {
        if (String(url).includes("meta=1")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                updatedAt: "2025-06-01T00:00:00Z",
              }),
          } as Response);
        }
        return Promise.resolve({ ok: false } as Response);
      });
      const result = await loadBudget(TEST_BUDGET_ID);
      expect(result).toEqual({ ok: true, newerVersionAvailable: true });
      const state = useBudgetStore.getState();
      expect(state.incomeSources[0].name).toBe("Job");
    });

    it("does not return newerVersionAvailable when cooldown is active", async () => {
      const key = await getTestKey();
      await persistKeyToSession(key);
      useSessionStore.getState().setKey(key);
      setNewerVersionCooldown(TEST_BUDGET_ID);
      const sessionKey = `${SESSION_DECRYPTED_KEY_PREFIX}${TEST_BUDGET_ID}`;
      const budgetJson = JSON.stringify({
        budgetId: TEST_BUDGET_ID,
        version: 1,
        updatedAt: "2025-01-01T00:00:00Z",
        incomeSources: [],
        incomeEvents: [],
        expenseDestinations: [],
        expenseEvents: [],
      });
      sessionStorage.setItem(sessionKey, budgetJson);
      useBudgetStore.setState((s) => ({
        ...s,
        updatedAt: "2024-06-01T00:00:00Z",
      }));
      vi.mocked(fetch).mockImplementation((url) => {
        if (String(url).includes("meta=1")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ updatedAt: "2025-06-01T00:00:00Z" }),
          } as Response);
        }
        return Promise.resolve({ ok: false } as Response);
      });
      const result = await loadBudget(TEST_BUDGET_ID);
      expect(result).toEqual({ ok: true });
      expect("newerVersionAvailable" in result).toBe(false);
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

  describe("loadRemoteVersionAndApply", () => {
    it("returns decrypt_failed when sync returns no blob", async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
      const result = await loadRemoteVersionAndApply(
        TEST_BUDGET_ID,
        "test-passphrase",
      );
      expect(result).toEqual({ ok: false, reason: "decrypt_failed" });
    });

    it("loads remote blob and persists to all stores when decrypt succeeds", async () => {
      setStoredSalt(SALT);
      const key = await getTestKey();
      const budgetJson = JSON.stringify({
        budgetId: TEST_BUDGET_ID,
        version: 1,
        updatedAt: new Date().toISOString(),
        incomeSources: [
          { id: "remote-src", name: "Remote Job", description: "" },
        ],
        incomeEvents: [],
        expenseDestinations: [],
        expenseEvents: [],
      });
      const encrypted = await encrypt(budgetJson, key);
      const portablePayload = prepareSyncPayload(encrypted);

      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(portablePayload),
          } as Response),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({ ok: true } as Response),
        );

      const result = await loadRemoteVersionAndApply(
        TEST_BUDGET_ID,
        "test-passphrase",
      );
      expect(result).toEqual({ ok: true });
      const state = useBudgetStore.getState();
      expect(state.incomeSources).toHaveLength(1);
      expect(state.incomeSources[0].name).toBe("Remote Job");
      expect(
        localStorage.getItem(
          `${ENCRYPTED_STORAGE_KEY_PREFIX}${TEST_BUDGET_ID}`,
        ),
      ).toBeTruthy();
      expect(
        sessionStorage.getItem(
          `${SESSION_DECRYPTED_KEY_PREFIX}${TEST_BUDGET_ID}`,
        ),
      ).toBeTruthy();
      expect(localStorage.getItem(BUDGET_ID_STORAGE_KEY)).toBe(TEST_BUDGET_ID);
    });

    it("sets last synced fingerprint so subsequent saveBudget skips redundant sync", async () => {
      setStoredSalt(SALT);
      const key = await getTestKey();
      const budgetJson = JSON.stringify({
        budgetId: TEST_BUDGET_ID,
        version: 1,
        updatedAt: new Date().toISOString(),
        incomeSources: [
          { id: "remote-src", name: "Remote Job", description: "" },
        ],
        incomeEvents: [],
        expenseDestinations: [],
        expenseEvents: [],
      });
      const encrypted = await encrypt(budgetJson, key);
      const portablePayload = prepareSyncPayload(encrypted);

      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(portablePayload),
          } as Response),
        )
        .mockImplementation(() => Promise.resolve({ ok: true } as Response));

      await loadRemoteVersionAndApply(TEST_BUDGET_ID, "test-passphrase");

      vi.mocked(fetch).mockClear();

      await saveBudget();

      const syncPostCalls = vi
        .mocked(fetch)
        .mock.calls.filter(
          (call) =>
            String(call[0]).includes("/api/sync") &&
            (call[1] as { method?: string })?.method === "POST",
        );
      expect(syncPostCalls).toHaveLength(0);
    });
  });
});
