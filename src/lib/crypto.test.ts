/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  persistKeyToSession,
  importKeyFromSession,
  clearSessionKey,
  clearAllSessionBudgetData,
  deriveKeyWithSalt,
} from "./crypto";
import {
  SESSION_KEY_STORAGE_KEY,
  SESSION_DECRYPTED_KEY_PREFIX,
  ENCRYPTED_STORAGE_KEY_PREFIX,
} from "./constants";

function createMockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
}

describe("session storage helpers", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("persistKeyToSession", () => {
    it("stores exported key in sessionStorage when window is defined", async () => {
      const salt = new Uint8Array(16);
      salt.fill(1);
      const key = await deriveKeyWithSalt("test-passphrase", salt);
      await persistKeyToSession(key);
      const stored = sessionStorage.getItem(SESSION_KEY_STORAGE_KEY);
      expect(stored).toBeTruthy();
      expect(typeof stored).toBe("string");
      expect(stored!.length).toBeGreaterThan(0);
    });

    it("does not throw when window is undefined", async () => {
      const originalWindow = globalThis.window;
      vi.stubGlobal("window", undefined);
      vi.stubGlobal("sessionStorage", undefined);
      try {
        const salt = new Uint8Array(16);
        salt.fill(1);
        const key = await deriveKeyWithSalt("test", salt);
        await expect(persistKeyToSession(key)).resolves.not.toThrow();
      } finally {
        vi.stubGlobal("window", originalWindow);
      }
    });
  });

  describe("importKeyFromSession", () => {
    it("returns null when sessionStorage is empty", async () => {
      const result = await importKeyFromSession();
      expect(result).toBeNull();
    });

    it("returns imported key when valid key was persisted", async () => {
      const salt = new Uint8Array(16);
      salt.fill(1);
      const key = await deriveKeyWithSalt("test-passphrase", salt);
      await persistKeyToSession(key);
      const imported = await importKeyFromSession();
      expect(imported).not.toBeNull();
      expect(imported).toBeInstanceOf(CryptoKey);
    });

    it("returns null when stored value is invalid", async () => {
      sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, "not-valid-base64!!!");
      const result = await importKeyFromSession();
      expect(result).toBeNull();
    });

    it("returns null when window is undefined", async () => {
      const originalWindow = globalThis.window;
      vi.stubGlobal("window", undefined);
      vi.stubGlobal("sessionStorage", undefined);
      try {
        const result = await importKeyFromSession();
        expect(result).toBeNull();
      } finally {
        vi.stubGlobal("window", originalWindow);
      }
    });
  });

  describe("clearSessionKey", () => {
    it("removes key from sessionStorage", async () => {
      const salt = new Uint8Array(16);
      salt.fill(1);
      const key = await deriveKeyWithSalt("test", salt);
      await persistKeyToSession(key);
      expect(sessionStorage.getItem(SESSION_KEY_STORAGE_KEY)).toBeTruthy();
      clearSessionKey();
      expect(sessionStorage.getItem(SESSION_KEY_STORAGE_KEY)).toBeNull();
    });

    it("does not throw when window is undefined", () => {
      const originalWindow = globalThis.window;
      vi.stubGlobal("window", undefined);
      vi.stubGlobal("sessionStorage", undefined);
      try {
        expect(() => clearSessionKey()).not.toThrow();
      } finally {
        vi.stubGlobal("window", originalWindow);
      }
    });
  });

  describe("clearAllSessionBudgetData", () => {
    it("removes session key and decrypted entries for stored budgets", () => {
      const mockLocalStorage = createMockStorage();
      mockLocalStorage.setItem(`${ENCRYPTED_STORAGE_KEY_PREFIX}b1`, "enc");
      mockLocalStorage.setItem(`${ENCRYPTED_STORAGE_KEY_PREFIX}b2`, "enc");
      vi.stubGlobal("localStorage", mockLocalStorage);
      sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, "key-data");
      sessionStorage.setItem(
        `${SESSION_DECRYPTED_KEY_PREFIX}b1`,
        '{"budgetId":"b1"}',
      );
      sessionStorage.setItem(
        `${SESSION_DECRYPTED_KEY_PREFIX}b2`,
        '{"budgetId":"b2"}',
      );
      clearAllSessionBudgetData();
      expect(sessionStorage.getItem(SESSION_KEY_STORAGE_KEY)).toBeNull();
      expect(
        sessionStorage.getItem(`${SESSION_DECRYPTED_KEY_PREFIX}b1`),
      ).toBeNull();
      expect(
        sessionStorage.getItem(`${SESSION_DECRYPTED_KEY_PREFIX}b2`),
      ).toBeNull();
    });
  });
});
