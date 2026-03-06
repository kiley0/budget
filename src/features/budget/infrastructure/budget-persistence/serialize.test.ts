import { describe, it, expect } from "vitest";
import {
  serializeBudgetForPersistence,
  getContentFingerprint,
} from "./serialize";

describe("serializeBudgetForPersistence", () => {
  it("serializes state with fresh updatedAt timestamp", () => {
    const state = {
      budgetId: "test-id",
      updatedAt: "2020-01-01T00:00:00Z",
      version: 1,
      incomeEvents: [],
      expenseEvents: [],
    };
    const result = serializeBudgetForPersistence(state);
    const parsed = JSON.parse(result);
    expect(parsed.budgetId).toBe("test-id");
    expect(parsed.version).toBe(1);
    expect(parsed.updatedAt).toBeDefined();
    expect(parsed.updatedAt).not.toBe("2020-01-01T00:00:00Z");
    expect(new Date(parsed.updatedAt).getTime()).toBeLessThanOrEqual(
      Date.now() + 1000,
    );
    expect(new Date(parsed.updatedAt).getTime()).toBeGreaterThanOrEqual(
      Date.now() - 1000,
    );
  });

  it("preserves all state fields", () => {
    const state = {
      budgetId: "x",
      updatedAt: "old",
      incomeEvents: [
        {
          id: "1",
          label: "Salary",
          amount: 5000,
          schedule: { type: "one-time", date: "2026-01-15" },
        },
      ],
      expenseEvents: [],
    };
    const result = serializeBudgetForPersistence(state);
    const parsed = JSON.parse(result);
    expect(parsed.incomeEvents).toHaveLength(1);
    expect(parsed.incomeEvents[0].label).toBe("Salary");
  });
});

describe("getContentFingerprint", () => {
  it("excludes updatedAt for deterministic comparison", () => {
    const state = {
      budgetId: "x",
      updatedAt: "2020-01-01T00:00:00Z",
      incomeEvents: [],
      expenseEvents: [],
    };
    const fp1 = getContentFingerprint(state);
    const fp2 = getContentFingerprint({
      ...state,
      updatedAt: "2025-12-31T23:59:59Z",
    });
    expect(fp1).toBe(fp2);
  });

  it("changes when content changes", () => {
    const base = {
      budgetId: "x",
      updatedAt: "old",
      incomeEvents: [],
      expenseEvents: [],
    };
    const fp1 = getContentFingerprint(base);
    const fp2 = getContentFingerprint({
      ...base,
      incomeEvents: [
        {
          id: "1",
          label: "Job",
          amount: 100,
          schedule: { type: "one-time", date: "2026-01-01" },
        },
      ],
    });
    expect(fp1).not.toBe(fp2);
  });
});
