import { migrateBudget, CURRENT_SCHEMA_VERSION } from "./budget-migrations";

describe("migrateBudget", () => {
  const testBudgetId = "test-migration-budget-id";

  it("returns fallback for null or non-object input", () => {
    const fromNull = migrateBudget(null, testBudgetId);
    expect(fromNull.budgetId).toBe(testBudgetId);
    expect(fromNull.incomeEvents).toEqual([]);
    expect(fromNull.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);

    expect(migrateBudget("string", testBudgetId).budgetId).toBe(testBudgetId);
    expect(migrateBudget(42, testBudgetId).incomeEvents).toEqual([]);
  });

  it("migrates v1 through v2 to v3, stripping expense destinations", () => {
    const v1Data = {
      budgetId: "old",
      version: 1,
      updatedAt: "2024-01-01",
      incomeEvents: [],
      expenseSources: [{ id: "es-1", name: "Landlord", description: "Rent" }],
      expenseEvents: [
        {
          id: "ee-1",
          label: "Rent",
          amount: 2000,
          expenseSourceId: "es-1",
          schedule: { type: "recurring", dayOfMonth: 1 },
        },
      ],
    };
    const result = migrateBudget(v1Data, testBudgetId);
    expect(result.budgetId).toBe(testBudgetId);
    expect(result.expenseEvents).toHaveLength(1);
    expect(result.expenseEvents[0].label).toBe("Rent");
    expect(result.expenseEvents[0].amount).toBe(2000);
    expect(
      (result.expenseEvents[0] as unknown as Record<string, unknown>)
        .expenseDestinationId,
    ).toBeUndefined();
    expect(
      (result.expenseEvents[0] as unknown as Record<string, unknown>)
        .expenseSourceId,
    ).toBeUndefined();
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("preserves actualsByMonth through migration", () => {
    const withActuals = {
      budgetId: "x",
      version: 1,
      updatedAt: "2024-06-01",
      incomeEvents: [
        {
          id: "ie1",
          label: "Salary",
          amount: 5000,
          schedule: { type: "one-time", date: "2024-06-15" },
        },
      ],
      expenseEvents: [],
      actualsByMonth: {
        "2024-06": {
          actualIncomeByEventId: { ie1: 5100 },
          actualExpenseByEventId: {},
        },
      },
    };
    const result = migrateBudget(withActuals, testBudgetId);
    expect(result.actualsByMonth?.["2024-06"]).toEqual({
      actualIncomeByEventId: { ie1: 5100 },
      actualExpenseByEventId: {},
    });
  });

  it("handles snake_case schedule fields", () => {
    const withSnakeCase = {
      budgetId: "x",
      version: 1,
      updatedAt: "2024-01-01",
      incomeEvents: [
        {
          id: "ie1",
          label: "Pay",
          amount: 100,
          schedule: {
            type: "recurring",
            day_of_month: 15,
            start_date: "2024-01-01",
            end_date: "2025-12-31",
          },
        },
      ],
      expenseEvents: [],
    };
    const result = migrateBudget(withSnakeCase, testBudgetId);
    expect(result.incomeEvents[0].schedule).toEqual({
      type: "recurring",
      daysOfMonth: [15],
      startDate: "2024-01-01",
      endDate: "2025-12-31",
    });
  });
});
