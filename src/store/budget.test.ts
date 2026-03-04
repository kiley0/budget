import { describe, it, expect, beforeEach } from "vitest";
import {
  useBudgetStore,
  replaceBudgetFromExport,
  addIncomeSource,
  addIncomeEvent,
  deleteIncomeSource,
  addExpenseDestination,
  addExpenseEvent,
  deleteExpenseDestination,
  deleteIncomeEvent,
  deleteExpenseEvent,
  setMonthActuals,
} from "./budget";

describe("replaceBudgetFromExport", () => {
  const testBudgetId = "test-budget-id-123";

  beforeEach(() => {
    replaceBudgetFromExport(null, testBudgetId);
  });

  it("replaces state with default when data is null", () => {
    replaceBudgetFromExport(null, testBudgetId);
    const state = useBudgetStore.getState();
    expect(state.budgetId).toBe(testBudgetId);
    expect(state.incomeSources).toEqual([]);
    expect(state.incomeEvents).toEqual([]);
    expect(state.expenseDestinations).toEqual([]);
    expect(state.expenseEvents).toEqual([]);
  });

  it("replaces state with default when data is not an object", () => {
    replaceBudgetFromExport("invalid", testBudgetId);
    const state = useBudgetStore.getState();
    expect(state.budgetId).toBe(testBudgetId);
    expect(state.incomeSources).toEqual([]);
  });

  it("uses currentBudgetId and ignores imported budgetId", () => {
    replaceBudgetFromExport(
      {
        budgetId: "other-id",
        version: 1,
        updatedAt: "2020-01-01",
        incomeSources: [],
        incomeEvents: [],
        expenseDestinations: [],
        expenseEvents: [],
      },
      testBudgetId,
    );
    const state = useBudgetStore.getState();
    expect(state.budgetId).toBe(testBudgetId);
  });

  it("imports income sources and events", () => {
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
    expect(state.incomeSources).toHaveLength(1);
    expect(state.incomeSources[0].name).toBe("Employer");
    expect(state.incomeSources[0].id).toBe("src-1");
    expect(state.incomeEvents).toHaveLength(1);
    expect(state.incomeEvents[0].label).toBe("Paycheck");
    expect(state.incomeEvents[0].amount).toBe(5000);
    expect(state.incomeEvents[0].schedule).toEqual({
      type: "one-time",
      date: "2026-03-15",
    });
  });

  it("imports expense destinations and events", () => {
    const exportData = {
      version: 1,
      updatedAt: "2026-03-01T00:00:00.000Z",
      incomeSources: [],
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
          schedule: { type: "recurring", dayOfMonth: 1 },
        },
      ],
    };
    replaceBudgetFromExport(exportData, testBudgetId);
    const state = useBudgetStore.getState();
    expect(state.expenseDestinations).toHaveLength(1);
    expect(state.expenseDestinations[0].name).toBe("Landlord");
    expect(state.expenseEvents).toHaveLength(1);
    expect(state.expenseEvents[0].label).toBe("Rent");
    expect(state.expenseEvents[0].amount).toBe(2000);
    expect(state.expenseEvents[0].category).toBe("rent");
    expect(state.expenseEvents[0].schedule).toEqual({
      type: "recurring",
      dayOfMonth: 1,
    });
  });

  it("matches export format from app (empty arrays)", () => {
    const exportData = {
      version: 1,
      updatedAt: "2026-03-03T17:47:44.484Z",
      incomeSources: [],
      incomeEvents: [],
      expenseDestinations: [],
      expenseEvents: [],
    };
    replaceBudgetFromExport(exportData, testBudgetId);
    const state = useBudgetStore.getState();
    expect(state.budgetId).toBe(testBudgetId);
    expect(state.version).toBe(1);
    expect(state.incomeSources).toEqual([]);
    expect(state.incomeEvents).toEqual([]);
    expect(state.expenseDestinations).toEqual([]);
    expect(state.expenseEvents).toEqual([]);
  });
});

describe("orphan cleanup on delete", () => {
  const testBudgetId = "test-orphan-cleanup";

  beforeEach(() => {
    replaceBudgetFromExport(null, testBudgetId);
  });

  it("clears incomeSourceId when deleting income source", () => {
    addIncomeSource("Job", "");
    const srcId = useBudgetStore.getState().incomeSources[0].id;
    addIncomeEvent({
      label: "Pay",
      amount: 5000,
      incomeSourceId: srcId,
      schedule: { type: "one-time", date: "2026-06-15" },
    });
    deleteIncomeSource(srcId);
    const state = useBudgetStore.getState();
    expect(state.incomeSources).toHaveLength(0);
    expect(state.incomeEvents).toHaveLength(1);
    expect(state.incomeEvents[0].incomeSourceId).toBeUndefined();
  });

  it("clears expenseDestinationId when deleting expense destination", () => {
    addExpenseDestination("Landlord", "");
    const destId = useBudgetStore.getState().expenseDestinations[0].id;
    addExpenseEvent({
      label: "Rent",
      amount: 2000,
      expenseDestinationId: destId,
      schedule: { type: "recurring", dayOfMonth: 1 },
    });
    deleteExpenseDestination(destId);
    const state = useBudgetStore.getState();
    expect(state.expenseDestinations).toHaveLength(0);
    expect(state.expenseEvents).toHaveLength(1);
    expect(state.expenseEvents[0].expenseDestinationId).toBeUndefined();
  });

  it("prunes actuals when deleting income event", () => {
    addIncomeSource("Job", "");
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
    addExpenseDestination("Landlord", "");
    addExpenseEvent({
      label: "Rent",
      amount: 2000,
      schedule: { type: "recurring", dayOfMonth: 1 },
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
