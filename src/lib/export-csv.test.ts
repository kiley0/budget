import { describe, it, expect } from "vitest";
import { budgetStateToCsv } from "./export-csv";
import type { BudgetState } from "@/store/budget";

function emptyState(): BudgetState {
  return {
    budgetId: "test-id",
    version: 1,
    updatedAt: new Date().toISOString(),
    incomeSources: [],
    incomeEvents: [],
    expenseDestinations: [],
    expenseEvents: [],
  };
}

describe("budgetStateToCsv", () => {
  const year = 2026;

  it("returns header and no data rows for empty state", () => {
    const csv = budgetStateToCsv(emptyState(), year);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Income,Expense,Name,Source,Type");
    expect(lines.length).toBe(1);
  });

  it("includes one row for one-time income event in the given year", () => {
    const state: BudgetState = {
      ...emptyState(),
      incomeSources: [{ id: "src-1", name: "Employer", description: "Job" }],
      incomeEvents: [
        {
          id: "ev-1",
          label: "Bonus",
          amount: 500,
          incomeSourceId: "src-1",
          schedule: { type: "one-time", date: "2026-03-15" },
        },
      ],
    };
    const csv = budgetStateToCsv(state, year);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Income,Expense,Name,Source,Type");
    expect(lines[1]).toBe("2026-03-15,500,,Bonus,Employer,–");
    expect(lines.length).toBe(2);
  });

  it("omits one-time event when date is outside the given year", () => {
    const state: BudgetState = {
      ...emptyState(),
      incomeEvents: [
        {
          id: "ev-1",
          label: "Other",
          amount: 100,
          schedule: { type: "one-time", date: "2025-06-01" },
        },
      ],
    };
    const csv = budgetStateToCsv(state, year);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Income,Expense,Name,Source,Type");
    expect(lines.length).toBe(1);
  });

  it("includes 12 rows for recurring income on the 15th", () => {
    const state: BudgetState = {
      ...emptyState(),
      incomeSources: [{ id: "s1", name: "Salary", description: "" }],
      incomeEvents: [
        {
          id: "e1",
          label: "Paycheck",
          amount: 3000,
          incomeSourceId: "s1",
          schedule: { type: "recurring", daysOfMonth: [15] },
        },
      ],
    };
    const csv = budgetStateToCsv(state, year);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Income,Expense,Name,Source,Type");
    expect(lines.length).toBe(13);
    expect(lines[1]).toBe("2026-01-15,3000,,Paycheck,Salary,–");
    expect(lines[12]).toBe("2026-12-15,3000,,Paycheck,Salary,–");
  });

  it("respects startDate and endDate for recurring event", () => {
    const state: BudgetState = {
      ...emptyState(),
      incomeEvents: [
        {
          id: "e1",
          label: "Contract",
          amount: 2000,
          schedule: {
            type: "recurring",
            daysOfMonth: [1],
            startDate: "2026-04-01",
            endDate: "2026-07-31",
          },
        },
      ],
    };
    const csv = budgetStateToCsv(state, year);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Income,Expense,Name,Source,Type");
    expect(lines.length).toBe(5); // Apr, May, Jun, Jul
    expect(lines[1]).toBe("2026-04-01,2000,,Contract,,–");
    expect(lines[4]).toBe("2026-07-01,2000,,Contract,,–");
  });

  it("clamps day 31 to last day of month (e.g. February)", () => {
    const state: BudgetState = {
      ...emptyState(),
      expenseEvents: [
        {
          id: "e1",
          label: "Rent",
          amount: 1500,
          schedule: { type: "recurring", daysOfMonth: [31] },
        },
      ],
    };
    const csv = budgetStateToCsv(state, year);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Income,Expense,Name,Source,Type");
    expect(lines.length).toBe(13);
    // 2026 is not a leap year, so Feb has 28 days
    const febLine = lines.find((l) => l.startsWith("2026-02-"));
    expect(febLine).toBe("2026-02-28,,1500,Rent,,–");
  });

  it("includes expense events with source name", () => {
    const state: BudgetState = {
      ...emptyState(),
      expenseEvents: [
        {
          id: "e1",
          label: "Rent",
          amount: 1200,
          schedule: { type: "one-time", date: "2026-01-01" },
        },
      ],
    };
    const csv = budgetStateToCsv(state, year);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("2026-01-01,,1200,Rent,,–");
  });

  it("sorts rows by date", () => {
    const state: BudgetState = {
      ...emptyState(),
      incomeEvents: [
        {
          id: "e1",
          label: "A",
          amount: 100,
          schedule: { type: "one-time", date: "2026-12-01" },
        },
        {
          id: "e2",
          label: "B",
          amount: 200,
          schedule: { type: "one-time", date: "2026-01-15" },
        },
      ],
    };
    const csv = budgetStateToCsv(state, year);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("2026-01-15,200,,B,,–");
    expect(lines[2]).toBe("2026-12-01,100,,A,,–");
  });

  it("escapes fields containing commas and quotes", () => {
    const state: BudgetState = {
      ...emptyState(),
      incomeSources: [{ id: "s1", name: "Acme, Inc.", description: "" }],
      incomeEvents: [
        {
          id: "e1",
          label: 'Pay "bonus"',
          amount: 500,
          incomeSourceId: "s1",
          schedule: { type: "one-time", date: "2026-06-01" },
        },
      ],
    };
    const csv = budgetStateToCsv(state, year);
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"Acme, Inc."');
    expect(lines[1]).toContain('"Pay ""bonus"""');
  });
});
