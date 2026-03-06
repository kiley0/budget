import { describe, it, expect, beforeEach } from "vitest";
import {
  useBudgetStore,
  replaceBudgetFromExport,
  addIncomeEvent,
  addExpenseEvent,
  deleteIncomeEvent,
  deleteExpenseEvent,
  setMonthActuals,
} from "./store";

describe("replaceBudgetFromExport", () => {
  const testBudgetId = "test-budget-id-123";

  beforeEach(() => {
    replaceBudgetFromExport(null, testBudgetId);
  });

  it("replaces state with default when data is null", () => {
    replaceBudgetFromExport(null, testBudgetId);
    const state = useBudgetStore.getState();
    expect(state.budgetId).toBe(testBudgetId);
    expect(state.incomeEvents).toEqual([]);
    expect(state.expenseEvents).toEqual([]);
  });

  it("replaces state with default when data is not an object", () => {
    replaceBudgetFromExport("invalid", testBudgetId);
    const state = useBudgetStore.getState();
    expect(state.budgetId).toBe(testBudgetId);
    expect(state.incomeEvents).toEqual([]);
  });

  it("uses currentBudgetId and ignores imported budgetId", () => {
    replaceBudgetFromExport(
      {
        budgetId: "other-id",
        version: 1,
        updatedAt: "2020-01-01",
        incomeEvents: [],
        expenseEvents: [],
      },
      testBudgetId,
    );
    const state = useBudgetStore.getState();
    expect(state.budgetId).toBe(testBudgetId);
  });

  it("imports income events (legacy incomeSourceId stripped)", () => {
    const exportData = {
      version: 1,
      updatedAt: "2026-03-01T00:00:00.000Z",
      incomeSources: [
        { id: "src-1", name: "Employer", description: "Main job" },
      ],
      incomeEvents: [
        {
          id: "ev-1",
          label: "Paycheck",
          amount: 5000,
          incomeSourceId: "src-1",
          schedule: { type: "one-time", date: "2026-03-15" },
        },
      ],
      expenseDestinations: [],
      expenseEvents: [],
    };
    replaceBudgetFromExport(exportData, testBudgetId);
    const state = useBudgetStore.getState();
    expect(state.budgetId).toBe(testBudgetId);
    expect(state.incomeEvents).toHaveLength(1);
    expect(state.incomeEvents[0].label).toBe("Paycheck");
    expect(state.incomeEvents[0].amount).toBe(5000);
    expect(state.incomeEvents[0].schedule).toEqual({
      type: "one-time",
      date: "2026-03-15",
    });
    expect("incomeSourceId" in state.incomeEvents[0]).toBe(false);
  });

  it("imports expense events (destinations stripped by v3 migration)", () => {
    const exportData = {
      version: 1,
      updatedAt: "2026-03-01T00:00:00.000Z",
      incomeEvents: [],
      expenseDestinations: [
        { id: "exp-src-1", name: "Landlord", description: "Rent" },
      ],
      expenseEvents: [
        {
          id: "exp-ev-1",
          label: "Rent",
          amount: 2000,
          expenseDestinationId: "exp-src-1",
          category: "rent",
          schedule: { type: "recurring", daysOfMonth: [1] },
        },
      ],
    };
    replaceBudgetFromExport(exportData, testBudgetId);
    const state = useBudgetStore.getState();
    expect(state.expenseEvents).toHaveLength(1);
    expect(state.expenseEvents[0].label).toBe("Rent");
    expect(state.expenseEvents[0].amount).toBe(2000);
    expect(state.expenseEvents[0].category).toBe("rent");
    expect(state.expenseEvents[0].schedule).toEqual({
      type: "recurring",
      daysOfMonth: [1],
    });
  });

  it("matches export format from app (empty arrays)", () => {
    const exportData = {
      version: 1,
      updatedAt: "2026-03-03T17:47:44.484Z",
      incomeEvents: [],
      expenseDestinations: [],
      expenseEvents: [],
    };
    replaceBudgetFromExport(exportData, testBudgetId);
    const state = useBudgetStore.getState();
    expect(state.budgetId).toBe(testBudgetId);
    expect(state.version).toBe(1);
    expect(state.incomeEvents).toEqual([]);
    expect(state.expenseEvents).toEqual([]);
  });
});

describe("orphan cleanup on delete", () => {
  const testBudgetId = "test-orphan-cleanup";

  beforeEach(() => {
    replaceBudgetFromExport(null, testBudgetId);
  });

  it("prunes actuals when deleting income event", () => {
    addIncomeEvent({
      label: "Pay",
      amount: 5000,
      schedule: { type: "one-time", date: "2026-06-15" },
    });
    const evId = useBudgetStore.getState().incomeEvents[0].id;
    setMonthActuals("2026-06", { actualIncomeByEventId: { [evId]: 5100 } });
    expect(
      useBudgetStore.getState().actualsByMonth?.["2026-06"]
        ?.actualIncomeByEventId?.[evId],
    ).toBe(5100);
    deleteIncomeEvent(evId);
    const state = useBudgetStore.getState();
    expect(state.incomeEvents).toHaveLength(0);
    expect(
      state.actualsByMonth?.["2026-06"]?.actualIncomeByEventId?.[evId],
    ).toBeUndefined();
  });

  it("prunes actuals when deleting expense event", () => {
    addExpenseEvent({
      label: "Rent",
      amount: 2000,
      schedule: { type: "recurring", daysOfMonth: [1] },
    });
    const evId = useBudgetStore.getState().expenseEvents[0].id;
    setMonthActuals("2026-06", { actualExpenseByEventId: { [evId]: 2000 } });
    deleteExpenseEvent(evId);
    const state = useBudgetStore.getState();
    expect(state.expenseEvents).toHaveLength(0);
    expect(
      state.actualsByMonth?.["2026-06"]?.actualExpenseByEventId?.[evId],
    ).toBeUndefined();
  });
});
