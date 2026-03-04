import { describe, it, expect } from "vitest";
import { serializeBudgetForPersistence } from "./serialize";

describe("serializeBudgetForPersistence", () => {
  it("serializes state with fresh updatedAt timestamp", () => {
    const state = {
      budgetId: "test-id",
      updatedAt: "2020-01-01T00:00:00Z",
      version: 1,
      incomeSources: [],
      incomeEvents: [],
      expenseDestinations: [],
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
      incomeSources: [{ id: "1", name: "Job", description: "" }],
      incomeEvents: [],
      expenseDestinations: [],
      expenseEvents: [],
    };
    const result = serializeBudgetForPersistence(state);
    const parsed = JSON.parse(result);
    expect(parsed.incomeSources).toHaveLength(1);
    expect(parsed.incomeSources[0].name).toBe("Job");
  });
});
