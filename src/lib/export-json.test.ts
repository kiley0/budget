import { describe, it, expect, beforeEach } from "vitest";
import { buildBudgetExportData } from "./export-json";
import type { BudgetState } from "@/store/budget";
import type { BudgetMetadata } from "./constants";
import { useBudgetStore, replaceBudgetFromExport } from "@/store/budget";

function emptyState(budgetId = "test-id"): BudgetState {
  return {
    budgetId,
    version: 1,
    updatedAt: new Date().toISOString(),
    incomeSources: [],
    incomeEvents: [],
    expenseDestinations: [],
    expenseEvents: [],
  };
}

describe("buildBudgetExportData", () => {
  it("returns an object with all required export keys", () => {
    const state = emptyState();
    const data = buildBudgetExportData(state);
    expect(data).toHaveProperty("budgetId");
    expect(data).toHaveProperty("version");
    expect(data).toHaveProperty("updatedAt");
    expect(data).toHaveProperty("incomeSources");
    expect(data).toHaveProperty("incomeEvents");
    expect(data).toHaveProperty("expenseDestinations");
    expect(data).toHaveProperty("expenseEvents");
    expect(Array.isArray(data.incomeSources)).toBe(true);
    expect(Array.isArray(data.incomeEvents)).toBe(true);
    expect(Array.isArray(data.expenseDestinations)).toBe(true);
    expect(Array.isArray(data.expenseEvents)).toBe(true);
  });

  it("copies state arrays and primitives into export", () => {
    const state: BudgetState = {
      ...emptyState("my-budget"),
      version: 2,
      updatedAt: "2026-01-15T12:00:00.000Z",
      incomeSources: [{ id: "s1", name: "Employer", description: "Job" }],
      incomeEvents: [
        {
          id: "e1",
          label: "Salary",
          amount: 5000,
          incomeSourceId: "s1",
          schedule: { type: "recurring", dayOfMonth: 15 },
        },
      ],
      expenseDestinations: [],
      expenseEvents: [],
    };
    const data = buildBudgetExportData(state);
    expect(data.budgetId).toBe("my-budget");
    expect(data.version).toBe(2);
    expect(data.updatedAt).toBe("2026-01-15T12:00:00.000Z");
    expect(data.incomeSources).toHaveLength(1);
    expect(data.incomeSources[0].name).toBe("Employer");
    expect(data.incomeEvents).toHaveLength(1);
    expect(data.incomeEvents[0].amount).toBe(5000);
    expect(data.incomeEvents[0].schedule).toEqual({
      type: "recurring",
      dayOfMonth: 15,
    });
  });

  it("includes metadata when provided with keys", () => {
    const state = emptyState();
    const metadata: BudgetMetadata = {
      name: "Household",
    };
    const data = buildBudgetExportData(state, metadata);
    expect(data.metadata).toEqual(metadata);
  });

  it("omits metadata when not provided", () => {
    const state = emptyState();
    const data = buildBudgetExportData(state);
    expect(data).not.toHaveProperty("metadata");
  });

  it("omits metadata when empty object", () => {
    const state = emptyState();
    const data = buildBudgetExportData(state, {});
    expect(data).not.toHaveProperty("metadata");
  });

  it("includes metadata when it has createdAt only", () => {
    const state = emptyState();
    const data = buildBudgetExportData(state, {
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(data.metadata).toEqual({
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });
});

describe("buildBudgetExportData round-trip with replaceBudgetFromExport", () => {
  const testBudgetId = "round-trip-id";

  beforeEach(() => {
    replaceBudgetFromExport(null, testBudgetId);
  });

  it("round-trips empty state", () => {
    const state = emptyState(testBudgetId);
    const data = buildBudgetExportData(state);
    replaceBudgetFromExport(data, testBudgetId);
    const after = useBudgetStore.getState();
    expect(after.budgetId).toBe(testBudgetId);
    expect(after.incomeSources).toEqual([]);
    expect(after.incomeEvents).toEqual([]);
    expect(after.expenseDestinations).toEqual([]);
    expect(after.expenseEvents).toEqual([]);
  });

  it("round-trips state with income and expense destinations and events", () => {
    const state: BudgetState = {
      ...emptyState(testBudgetId),
      incomeSources: [{ id: "is1", name: "Employer", description: "Main job" }],
      incomeEvents: [
        {
          id: "ie1",
          label: "Paycheck",
          amount: 4000,
          incomeSourceId: "is1",
          schedule: { type: "one-time", date: "2026-06-15" },
        },
      ],
      expenseDestinations: [
        { id: "es1", name: "Landlord", description: "Rent" },
      ],
      expenseEvents: [
        {
          id: "ee1",
          label: "Rent",
          amount: 1800,
          expenseDestinationId: "es1",
          category: "rent",
          schedule: { type: "recurring", dayOfMonth: 1 },
        },
      ],
    };
    const data = buildBudgetExportData(state);
    replaceBudgetFromExport(data, testBudgetId);
    const after = useBudgetStore.getState();
    expect(after.budgetId).toBe(testBudgetId);
    expect(after.incomeSources).toHaveLength(1);
    expect(after.incomeSources[0].id).toBe("is1");
    expect(after.incomeSources[0].name).toBe("Employer");
    expect(after.incomeEvents).toHaveLength(1);
    expect(after.incomeEvents[0].label).toBe("Paycheck");
    expect(after.incomeEvents[0].amount).toBe(4000);
    expect(after.incomeEvents[0].schedule).toEqual({
      type: "one-time",
      date: "2026-06-15",
    });
    expect(after.expenseDestinations).toHaveLength(1);
    expect(after.expenseDestinations[0].name).toBe("Landlord");
    expect(after.expenseEvents).toHaveLength(1);
    expect(after.expenseEvents[0].label).toBe("Rent");
    expect(after.expenseEvents[0].category).toBe("rent");
    expect(after.expenseEvents[0].schedule).toEqual({
      type: "recurring",
      dayOfMonth: 1,
    });
  });

  it("round-trips recurring schedule with startDate and endDate", () => {
    const state: BudgetState = {
      ...emptyState(testBudgetId),
      incomeSources: [],
      incomeEvents: [
        {
          id: "e1",
          label: "Contract",
          amount: 2000,
          schedule: {
            type: "recurring",
            dayOfMonth: 10,
            startDate: "2026-03-01",
            endDate: "2026-08-31",
          },
        },
      ],
      expenseDestinations: [],
      expenseEvents: [],
    };
    const data = buildBudgetExportData(state);
    replaceBudgetFromExport(data, testBudgetId);
    const after = useBudgetStore.getState();
    expect(after.incomeEvents[0].schedule).toEqual({
      type: "recurring",
      dayOfMonth: 10,
      startDate: "2026-03-01",
      endDate: "2026-08-31",
    });
  });
});
