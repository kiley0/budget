import { describe, it, expect } from "vitest";
import { buildYearlySummaryData } from "./yearly-summary";
import { SAVINGS_CATEGORY, DEBT_REPAYMENT_CATEGORY } from "./constants";
import type { IncomeEvent, ExpenseEvent } from "@/store/budget";
import type { MonthSlot } from "./date-view";

function monthSlot(year: number, month: number): MonthSlot {
  return { year, monthIndex: month - 1 };
}

describe("buildYearlySummaryData", () => {
  it("returns empty rows and zeros for no events", () => {
    const months: MonthSlot[] = [
      monthSlot(2024, 1),
      monthSlot(2024, 2),
      monthSlot(2024, 3),
    ];
    const result = buildYearlySummaryData([], [], months);
    expect(result.incomeRows).toHaveLength(0);
    expect(result.expenseRows).toHaveLength(0);
    expect(result.savingsRows).toHaveLength(0);
    expect(result.debtRepaymentRows).toHaveLength(0);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.totalSavings).toBe(0);
    expect(result.totalDebtRepayment).toBe(0);
  });

  it("aggregates recurring income across months", () => {
    const income: IncomeEvent[] = [
      {
        id: "ie1",
        label: "Salary",
        amount: 5000,
        schedule: { type: "recurring", daysOfMonth: [15] },
      },
    ];
    const months: MonthSlot[] = [
      monthSlot(2024, 1),
      monthSlot(2024, 2),
      monthSlot(2024, 3),
    ];
    const result = buildYearlySummaryData(income, [], months);
    expect(result.incomeRows).toHaveLength(1);
    expect(result.incomeRows[0]).toMatchObject({
      label: "Salary",
      amount: 15000,
      isRecurring: true,
    });
    expect(result.totalIncome).toBe(15000);
  });

  it("aggregates recurring expenses across months", () => {
    const expenses: ExpenseEvent[] = [
      {
        id: "ee1",
        label: "Rent",
        amount: 2000,
        schedule: { type: "recurring", daysOfMonth: [1] },
      },
    ];
    const months: MonthSlot[] = [monthSlot(2024, 1), monthSlot(2024, 2)];
    const result = buildYearlySummaryData([], expenses, months);
    expect(result.expenseRows).toHaveLength(1);
    expect(result.expenseRows[0]).toMatchObject({
      label: "Rent",
      amount: 4000,
      isRecurring: true,
    });
    expect(result.totalExpenses).toBe(4000);
  });

  it("includes one-time income for matching month", () => {
    const income: IncomeEvent[] = [
      {
        id: "ie1",
        label: "Bonus",
        amount: 2000,
        schedule: { type: "one-time", date: "2024-02-15" },
      },
    ];
    const months: MonthSlot[] = [
      monthSlot(2024, 1),
      monthSlot(2024, 2),
      monthSlot(2024, 3),
    ];
    const result = buildYearlySummaryData(income, [], months);
    expect(result.incomeRows).toHaveLength(1);
    expect(result.incomeRows[0]).toMatchObject({
      label: "Bonus",
      amount: 2000,
      isRecurring: false,
      date: "2024-02-15",
    });
    expect(result.totalIncome).toBe(2000);
  });

  it("excludes one-time events outside month range", () => {
    const income: IncomeEvent[] = [
      {
        id: "ie1",
        label: "Bonus",
        amount: 2000,
        schedule: { type: "one-time", date: "2024-04-15" },
      },
    ];
    const months: MonthSlot[] = [
      monthSlot(2024, 1),
      monthSlot(2024, 2),
      monthSlot(2024, 3),
    ];
    const result = buildYearlySummaryData(income, [], months);
    expect(result.incomeRows).toHaveLength(0);
    expect(result.totalIncome).toBe(0);
  });

  it("respects actuals when provided", () => {
    const income: IncomeEvent[] = [
      {
        id: "ie1",
        label: "Salary",
        amount: 5000,
        schedule: { type: "recurring", daysOfMonth: [15] },
      },
    ];
    const months: MonthSlot[] = [
      monthSlot(2024, 1),
      monthSlot(2024, 2),
      monthSlot(2024, 3),
    ];
    const actualsByMonth = {
      "2024-01": {
        actualIncomeByEventId: { ie1: 5200 },
      },
      "2024-02": {},
      "2024-03": {
        actualIncomeByEventId: { ie1: 4800 },
      },
    };
    const result = buildYearlySummaryData(income, [], months, actualsByMonth);
    expect(result.incomeRows[0].amount).toBe(5200 + 5000 + 4800);
    expect(result.totalIncome).toBe(15000);
  });

  it("separates savings and debt repayment from expenses", () => {
    const expenses: ExpenseEvent[] = [
      {
        id: "ee1",
        label: "Rent",
        amount: 2000,
        category: "rent",
        schedule: { type: "recurring", daysOfMonth: [1] },
      },
      {
        id: "ee2",
        label: "401k",
        amount: 500,
        category: SAVINGS_CATEGORY,
        schedule: { type: "recurring", daysOfMonth: [15] },
      },
      {
        id: "ee3",
        label: "Credit card",
        amount: 300,
        category: DEBT_REPAYMENT_CATEGORY,
        schedule: { type: "recurring", daysOfMonth: [20] },
      },
    ];
    const months: MonthSlot[] = [monthSlot(2024, 1), monthSlot(2024, 2)];
    const result = buildYearlySummaryData([], expenses, months);
    expect(result.expenseRows).toHaveLength(1);
    expect(result.expenseRows[0].label).toBe("Rent");
    expect(result.expenseRows[0].amount).toBe(4000);
    expect(result.savingsRows).toHaveLength(1);
    expect(result.savingsRows[0]).toMatchObject({
      label: "401k",
      amount: 1000,
      isRecurring: true,
    });
    expect(result.debtRepaymentRows).toHaveLength(1);
    expect(result.debtRepaymentRows[0]).toMatchObject({
      label: "Credit card",
      amount: 600,
      isRecurring: true,
    });
  });

  it("includes pre-tax withholdings in savings from paycheck", () => {
    const income: IncomeEvent[] = [
      {
        id: "ie1",
        label: "Paycheck",
        amount: 4500,
        incomeType: "paycheck",
        paycheckDetails: {
          grossAmount: 6000,
          withholdings: {
            retirement401k: 1000,
            hsa: 150,
            federalTax: 200,
          },
        },
        schedule: { type: "recurring", daysOfMonth: [15] },
      },
    ];
    const months: MonthSlot[] = [monthSlot(2024, 1), monthSlot(2024, 2)];
    const result = buildYearlySummaryData(income, [], months);
    expect(result.incomeRows).toHaveLength(1);
    expect(result.incomeRows[0].amount).toBe(9000);
    expect(result.incomeRows[0].paycheckBreakdown).toMatchObject({
      grossAmount: 12000,
      withholdings: expect.arrayContaining([
        { label: "401(k) / Retirement", amount: 2000 },
        { label: "HSA", amount: 300 },
      ]),
    });
    expect(result.savingsRows.length).toBeGreaterThanOrEqual(1);
    const retirement = result.savingsRows.find(
      (r) => r.label === "401(k) / Retirement",
    );
    expect(retirement?.amount).toBe(2000);
  });

  it("includes stock breakdown for stock sale income", () => {
    const income: IncomeEvent[] = [
      {
        id: "ie1",
        label: "RSU vest",
        amount: 8000,
        incomeType: "stock_sale_proceeds",
        stockSaleDetails: {
          symbol: "XYZ",
          shares: 100,
          taxRate: 25,
        },
        schedule: { type: "one-time", date: "2024-02-15" },
      },
    ];
    const months: MonthSlot[] = [monthSlot(2024, 1), monthSlot(2024, 2)];
    const result = buildYearlySummaryData(income, [], months);
    expect(result.incomeRows).toHaveLength(1);
    expect(result.incomeRows[0].stockBreakdown).toBeDefined();
    expect(result.incomeRows[0].stockBreakdown?.shares).toBe(100);
    expect(result.incomeRows[0].stockBreakdown?.grossAmount).toBeCloseTo(
      8000 / 0.75,
      0,
    );
  });

  it("filters recurring events by startDate and endDate", () => {
    const income: IncomeEvent[] = [
      {
        id: "ie1",
        label: "Contract",
        amount: 3000,
        schedule: {
          type: "recurring",
          daysOfMonth: [1],
          startDate: "2024-02-01",
          endDate: "2024-03-31",
        },
      },
    ];
    const months: MonthSlot[] = [
      monthSlot(2024, 1),
      monthSlot(2024, 2),
      monthSlot(2024, 3),
      monthSlot(2024, 4),
    ];
    const result = buildYearlySummaryData(income, [], months);
    expect(result.incomeRows).toHaveLength(1);
    expect(result.incomeRows[0].amount).toBe(6000);
    expect(result.totalIncome).toBe(6000);
  });
});
