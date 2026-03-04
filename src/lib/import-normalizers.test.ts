import { describe, it, expect } from "vitest";
import { normalizeImportedBudget } from "./import-normalizers";

describe("normalizeImportedBudget", () => {
  it("returns default state for null or non-object", () => {
    const fromNull = normalizeImportedBudget(null);
    expect(fromNull.budgetId).toBe("");
    expect(fromNull.version).toBe(1);
    expect(fromNull.incomeSources).toEqual([]);
    expect(fromNull.incomeEvents).toEqual([]);
    expect(fromNull.expenseDestinations).toEqual([]);
    expect(fromNull.expenseEvents).toEqual([]);

    expect(normalizeImportedBudget("string").budgetId).toBe("");
    expect(normalizeImportedBudget(42).incomeSources).toEqual([]);
  });

  it("normalizes income sources and events with one-time schedule", () => {
    const raw = {
      budgetId: "b1",
      version: 2,
      updatedAt: "2026-03-01T00:00:00.000Z",
      incomeSources: [{ id: "src-1", name: "Employer", description: "Job" }],
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
    const result = normalizeImportedBudget(raw);
    expect(result.budgetId).toBe("b1");
    expect(result.version).toBe(2);
    expect(result.updatedAt).toBe("2026-03-01T00:00:00.000Z");
    expect(result.incomeSources).toHaveLength(1);
    expect(result.incomeSources[0]).toEqual({
      id: "src-1",
      name: "Employer",
      description: "Job",
    });
    expect(result.incomeEvents).toHaveLength(1);
    expect(result.incomeEvents[0].label).toBe("Paycheck");
    expect(result.incomeEvents[0].amount).toBe(5000);
    expect(result.incomeEvents[0].schedule).toEqual({
      type: "one-time",
      date: "2026-03-15",
    });
  });

  it("normalizes recurring schedule with dayOfMonth and snake_case day_of_month", () => {
    const raw = {
      budgetId: "",
      version: 1,
      updatedAt: "2026-01-01",
      incomeSources: [],
      incomeEvents: [
        {
          id: "e1",
          label: "Salary",
          amount: 4000,
          schedule: { type: "recurring", day_of_month: 25 },
        },
      ],
      expenseDestinations: [],
      expenseEvents: [],
    };
    const result = normalizeImportedBudget(raw);
    expect(result.incomeEvents[0].schedule).toEqual({
      type: "recurring",
      dayOfMonth: 25,
    });
  });

  it("normalizes recurring schedule with startDate and endDate (and snake_case)", () => {
    const raw = {
      budgetId: "",
      version: 1,
      updatedAt: "2026-01-01",
      incomeSources: [],
      incomeEvents: [
        {
          id: "e1",
          label: "Bonus",
          amount: 500,
          schedule: {
            type: "recurring",
            dayOfMonth: 1,
            start_date: "2025-06-01",
            end_date: "2025-12-31",
          },
        },
      ],
      expenseDestinations: [],
      expenseEvents: [],
    };
    const result = normalizeImportedBudget(raw);
    expect(result.incomeEvents[0].schedule).toEqual({
      type: "recurring",
      dayOfMonth: 1,
      startDate: "2025-06-01",
      endDate: "2025-12-31",
    });
  });

  it("accepts one-time type variants: onetime, one_time", () => {
    const raw = {
      budgetId: "",
      version: 1,
      updatedAt: "2026-01-01",
      incomeSources: [],
      incomeEvents: [
        {
          id: "e1",
          label: "Bonus",
          amount: 100,
          schedule: { type: "onetime", date: "2026-06-15" },
        },
        {
          id: "e2",
          label: "Other",
          amount: 200,
          schedule: { type: "one_time", date: "2026-07-20" },
        },
      ],
      expenseDestinations: [],
      expenseEvents: [],
    };
    const result = normalizeImportedBudget(raw);
    expect(result.incomeEvents).toHaveLength(2);
    expect(result.incomeEvents[0].schedule).toEqual({
      type: "one-time",
      date: "2026-06-15",
    });
    expect(result.incomeEvents[1].schedule).toEqual({
      type: "one-time",
      date: "2026-07-20",
    });
  });

  it("keeps all income events, applying default schedules for invalid/missing ones", () => {
    const raw = {
      budgetId: "",
      version: 1,
      updatedAt: "2026-01-01",
      incomeSources: [],
      incomeEvents: [
        {
          id: "valid",
          label: "Valid",
          amount: 100,
          schedule: { type: "one-time", date: "2026-01-01" },
        },
        { id: "no-schedule", label: "No schedule", amount: 50 },
        {
          id: "bad-type",
          label: "Bad",
          amount: 25,
          schedule: { type: "unknown", date: "2026-01-01" },
        },
        {
          id: "recurring-invalid-day",
          label: "Bad day",
          amount: 10,
          schedule: { type: "recurring", dayOfMonth: 0 },
        },
      ],
      expenseDestinations: [],
      expenseEvents: [],
    };
    const result = normalizeImportedBudget(raw);
    expect(result.incomeEvents).toHaveLength(4);
    expect(result.incomeEvents[0].label).toBe("Valid");
    expect(result.incomeEvents[0].schedule).toEqual({
      type: "one-time",
      date: "2026-01-01",
    });
    // Invalid/missing schedules get defaults (self-healing preserves data)
    expect(result.incomeEvents[1].label).toBe("No schedule");
    expect(result.incomeEvents[2].label).toBe("Bad");
    expect(result.incomeEvents[3].label).toBe("Bad day");
    expect(result.incomeEvents[3].schedule).toEqual({
      type: "recurring",
      dayOfMonth: 1,
    });
  });

  it("normalizes expense destinations and events with category", () => {
    const raw = {
      budgetId: "",
      version: 1,
      updatedAt: "2026-01-01",
      incomeSources: [],
      incomeEvents: [],
      expenseDestinations: [{ id: "es-1", name: "Landlord", description: "" }],
      expenseEvents: [
        {
          id: "ee-1",
          label: "Rent",
          amount: 2000,
          expenseDestinationId: "es-1",
          category: "rent",
          schedule: { type: "recurring", dayOfMonth: 1 },
        },
      ],
    };
    const result = normalizeImportedBudget(raw);
    expect(result.expenseDestinations).toHaveLength(1);
    expect(result.expenseDestinations[0].name).toBe("Landlord");
    expect(result.expenseEvents).toHaveLength(1);
    expect(result.expenseEvents[0].label).toBe("Rent");
    expect(result.expenseEvents[0].category).toBe("rent");
    expect(result.expenseEvents[0].schedule).toEqual({
      type: "recurring",
      dayOfMonth: 1,
    });
  });

  it("clamps invalid version to 1 and uses default updatedAt when missing", () => {
    const raw = {
      budgetId: "x",
      version: 0,
      incomeSources: [],
      incomeEvents: [],
      expenseDestinations: [],
      expenseEvents: [],
    };
    const result = normalizeImportedBudget(raw);
    expect(result.version).toBe(1);
    expect(typeof result.updatedAt).toBe("string");
    expect(result.updatedAt.length).toBeGreaterThan(0);
  });
});
