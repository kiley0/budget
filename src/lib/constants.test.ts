import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getExpenseCategoryLabel,
  getIncomeTypeLabel,
  INCOME_TYPES,
  EXPENSE_CATEGORIES,
  ENCRYPTED_STORAGE_KEY_PREFIX,
  BUDGET_ID_STORAGE_KEY,
  BUDGET_META_KEY_PREFIX,
  SELECT_NONE,
  getStoredBudgetIds,
  LAST_SYNCED_FINGERPRINT_PREFIX,
  getLastSyncedFingerprint,
  setLastSyncedFingerprint,
  clearAllBudgetsFromStorage,
  getBudgetMetadata,
  parseMetadataFromExport,
  setBudgetMetadata,
  setNewerVersionCooldown,
  isNewerVersionCooldownActive,
} from "./constants";

describe("getExpenseCategoryLabel", () => {
  it("returns – for undefined", () => {
    expect(getExpenseCategoryLabel(undefined)).toBe("–");
  });
  it("returns – for empty string", () => {
    expect(getExpenseCategoryLabel("")).toBe("–");
  });
  it("returns label for known value", () => {
    expect(getExpenseCategoryLabel("rent")).toBe("Rent / Mortgage");
    expect(getExpenseCategoryLabel("groceries")).toBe("Groceries");
    expect(getExpenseCategoryLabel("other")).toBe("Other");
  });
  it("returns the value for unknown value", () => {
    expect(getExpenseCategoryLabel("unknown-key")).toBe("unknown-key");
  });
});

describe("getIncomeTypeLabel", () => {
  it("returns – for undefined", () => {
    expect(getIncomeTypeLabel(undefined)).toBe("–");
  });
  it("returns label for known value", () => {
    expect(getIncomeTypeLabel("paycheck")).toBe("Paycheck");
    expect(getIncomeTypeLabel("stock_sale_proceeds")).toBe(
      "Stock sale proceeds",
    );
  });
});

describe("constants", () => {
  it("EXPENSE_CATEGORIES has expected shape", () => {
    expect(EXPENSE_CATEGORIES.length).toBeGreaterThan(0);
    for (const c of EXPENSE_CATEGORIES) {
      expect(c).toHaveProperty("value");
      expect(c).toHaveProperty("label");
      expect(typeof c.value).toBe("string");
      expect(typeof c.label).toBe("string");
    }
  });
  it("INCOME_TYPES has expected shape", () => {
    expect(INCOME_TYPES.length).toBeGreaterThan(0);
    for (const t of INCOME_TYPES) {
      expect(t).toHaveProperty("value");
      expect(t).toHaveProperty("label");
      expect(typeof t.value).toBe("string");
      expect(typeof t.label).toBe("string");
    }
  });
  it("storage keys are non-empty strings", () => {
    expect(ENCRYPTED_STORAGE_KEY_PREFIX).toBe("budget_encrypted_");
    expect(BUDGET_ID_STORAGE_KEY).toBe("budget_id");
    expect(BUDGET_META_KEY_PREFIX).toBe("budget_meta_");
  });
  it("SELECT_NONE is sentinel for Radix Select", () => {
    expect(SELECT_NONE).toBe("__none__");
  });
});

describe("getStoredBudgetIds", () => {
  it("returns empty array when window is undefined (Node)", () => {
    expect(getStoredBudgetIds()).toEqual([]);
  });

  it("returns budget ids from localStorage when window is defined", () => {
    const store: Record<string, string> = {};
    const mockLocalStorage = {
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
    vi.stubGlobal("window", { localStorage: mockLocalStorage });
    vi.stubGlobal("localStorage", mockLocalStorage);
    try {
      mockLocalStorage.setItem(`${ENCRYPTED_STORAGE_KEY_PREFIX}id1`, "enc1");
      mockLocalStorage.setItem(`${ENCRYPTED_STORAGE_KEY_PREFIX}id2`, "enc2");
      mockLocalStorage.setItem("other_key", "x");
      expect(getStoredBudgetIds()).toEqual(["id1", "id2"]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("clearAllBudgetsFromStorage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not throw when window is undefined (Node)", () => {
    expect(() => clearAllBudgetsFromStorage()).not.toThrow();
  });

  it("removes all budget data and metadata when window is defined", () => {
    const store: Record<string, string> = {};
    const mockLocalStorage = {
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
    vi.stubGlobal("window", { localStorage: mockLocalStorage });
    vi.stubGlobal("localStorage", mockLocalStorage);
    mockLocalStorage.setItem(`${ENCRYPTED_STORAGE_KEY_PREFIX}b1`, "enc");
    mockLocalStorage.setItem(`${BUDGET_META_KEY_PREFIX}b1`, "{}");
    mockLocalStorage.setItem("budget_last_accessed_b1", "x");
    mockLocalStorage.setItem(
      `${LAST_SYNCED_FINGERPRINT_PREFIX}b1`,
      "fingerprint",
    );
    mockLocalStorage.setItem(BUDGET_ID_STORAGE_KEY, "b1");
    clearAllBudgetsFromStorage();
    expect(
      mockLocalStorage.getItem(`${ENCRYPTED_STORAGE_KEY_PREFIX}b1`),
    ).toBeNull();
    expect(mockLocalStorage.getItem(`${BUDGET_META_KEY_PREFIX}b1`)).toBeNull();
    expect(mockLocalStorage.getItem("budget_last_accessed_b1")).toBeNull();
    expect(
      mockLocalStorage.getItem(`${LAST_SYNCED_FINGERPRINT_PREFIX}b1`),
    ).toBeNull();
    expect(mockLocalStorage.getItem(BUDGET_ID_STORAGE_KEY)).toBeNull();
  });
});

describe("getLastSyncedFingerprint / setLastSyncedFingerprint", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("localStorage", undefined);
    expect(getLastSyncedFingerprint("bid-1")).toBeNull();
  });

  it("returns null when no fingerprint stored", () => {
    const store: Record<string, string> = {};
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store[k] ?? null,
        setItem: () => {},
        removeItem: () => {},
      },
    });
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: () => {},
    });
    expect(getLastSyncedFingerprint("bid-1")).toBeNull();
  });

  it("round-trips fingerprint when window is defined", () => {
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };
    vi.stubGlobal("window", { localStorage: mockLocalStorage });
    vi.stubGlobal("localStorage", mockLocalStorage);

    setLastSyncedFingerprint("bid-1", "fp-abc");
    expect(getLastSyncedFingerprint("bid-1")).toBe("fp-abc");
    expect(getLastSyncedFingerprint("bid-2")).toBeNull();

    setLastSyncedFingerprint("bid-2", "fp-xyz");
    expect(getLastSyncedFingerprint("bid-1")).toBe("fp-abc");
    expect(getLastSyncedFingerprint("bid-2")).toBe("fp-xyz");
  });
});

describe("getBudgetMetadata / setBudgetMetadata", () => {
  it("getBudgetMetadata returns {} when window is undefined (Node)", () => {
    expect(getBudgetMetadata("any")).toEqual({});
  });

  it("round-trips metadata when window is defined", () => {
    const store: Record<string, string> = {};
    const mockLocalStorage = {
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
    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("window", { localStorage: mockLocalStorage });
    setBudgetMetadata("bid", { name: "My Budget" });
    expect(getBudgetMetadata("bid")).toEqual({
      name: "My Budget",
    });
    vi.unstubAllGlobals();
  });
});

describe("setNewerVersionCooldown / isNewerVersionCooldownActive", () => {
  it("returns false when no cooldown is set", () => {
    const store: Record<string, string> = {};
    const mockSessionStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    };
    vi.stubGlobal("sessionStorage", mockSessionStorage);
    vi.stubGlobal("window", { sessionStorage: mockSessionStorage });
    try {
      expect(isNewerVersionCooldownActive("budget-1")).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("returns true immediately after setting cooldown", () => {
    const store: Record<string, string> = {};
    const mockSessionStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    };
    vi.stubGlobal("sessionStorage", mockSessionStorage);
    vi.stubGlobal("window", { sessionStorage: mockSessionStorage });
    try {
      setNewerVersionCooldown("budget-1");
      expect(isNewerVersionCooldownActive("budget-1")).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("returns false for different budget than cooldown", () => {
    const store: Record<string, string> = {};
    const mockSessionStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    };
    vi.stubGlobal("sessionStorage", mockSessionStorage);
    vi.stubGlobal("window", { sessionStorage: mockSessionStorage });
    try {
      setNewerVersionCooldown("budget-a");
      expect(isNewerVersionCooldownActive("budget-b")).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("does not throw when window is undefined (Node)", () => {
    vi.stubGlobal("window", undefined);
    try {
      expect(() => setNewerVersionCooldown("x")).not.toThrow();
      expect(isNewerVersionCooldownActive("x")).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("parseMetadataFromExport", () => {
  it("returns {} for null or non-object", () => {
    expect(parseMetadataFromExport(null)).toEqual({});
    expect(parseMetadataFromExport(undefined)).toEqual({});
    expect(parseMetadataFromExport("string")).toEqual({});
  });

  it("extracts valid string fields only", () => {
    expect(
      parseMetadataFromExport({
        name: "My Budget",
        createdAt: "2026-01-01T00:00:00.000Z",
        lastAccessed: "2026-03-01T00:00:00.000Z",
      }),
    ).toEqual({
      name: "My Budget",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastAccessed: "2026-03-01T00:00:00.000Z",
    });
  });

  it("ignores invalid types", () => {
    expect(
      parseMetadataFromExport({
        name: 123,
        createdAt: "",
        lastAccessed: undefined,
      }),
    ).toEqual({});
  });
});
