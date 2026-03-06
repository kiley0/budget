/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { YearlySummaryDialogContent } from "./YearlySummaryDialogContent";
import type { YearlySummaryData } from "@/features/budget/domain/yearly-summary";

function mockData(
  overrides: Partial<YearlySummaryData> = {},
): YearlySummaryData {
  return {
    incomeRows: [],
    expenseRows: [],
    savingsRows: [],
    debtRepaymentRows: [],
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    totalDebtRepayment: 0,
    ...overrides,
  };
}

describe("YearlySummaryDialogContent", () => {
  it("renders empty state for income when no rows", () => {
    render(
      <YearlySummaryDialogContent
        data={mockData()}
        expandedEventIds={new Set()}
        onToggleExpand={() => {}}
      />,
    );
    expect(
      screen.getByRole("columnheader", {
        name: /Income \(after taxes and withholdings\)/,
      }),
    ).toBeInTheDocument();
    const emptyCells = screen.getAllByText("–");
    expect(emptyCells.length).toBeGreaterThanOrEqual(1);
  });

  it("renders income rows with labels and amounts", () => {
    const data = mockData({
      incomeRows: [
        {
          label: "Salary",
          amount: 5000,
          isRecurring: true,
        },
      ],
      totalIncome: 5000,
    });
    render(
      <YearlySummaryDialogContent
        data={data}
        expandedEventIds={new Set()}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Total income (take home)")).toBeInTheDocument();
  });

  it("renders expandable income row and calls onToggleExpand when clicked", async () => {
    const data = mockData({
      incomeRows: [
        {
          label: "Paycheck",
          amount: 4500,
          isRecurring: true,
          eventId: "ev-1",
          paycheckBreakdown: {
            grossAmount: 6000,
            withholdings: [
              { label: "401(k) / Retirement", amount: 1000 },
              { label: "Federal tax", amount: 500 },
            ],
          },
        },
      ],
      totalIncome: 4500,
    });
    const onToggle = vi.fn();
    render(
      <YearlySummaryDialogContent
        data={data}
        expandedEventIds={new Set()}
        onToggleExpand={onToggle}
      />,
    );
    const row = screen.getByRole("button");
    expect(row).toHaveTextContent("Paycheck");
    expect(screen.queryByText("Gross pay")).not.toBeInTheDocument();

    fireEvent.click(row);
    expect(onToggle).toHaveBeenCalledWith("ev-1");
  });

  it("shows paycheck breakdown when expanded", () => {
    const data = mockData({
      incomeRows: [
        {
          label: "Paycheck",
          amount: 4500,
          isRecurring: true,
          eventId: "ev-1",
          paycheckBreakdown: {
            grossAmount: 6000,
            withholdings: [{ label: "401(k) / Retirement", amount: 1000 }],
          },
        },
      ],
      totalIncome: 4500,
    });
    render(
      <YearlySummaryDialogContent
        data={data}
        expandedEventIds={new Set(["ev-1"])}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText("Gross pay")).toBeInTheDocument();
    expect(screen.getByText("401(k) / Retirement")).toBeInTheDocument();
    expect(screen.getByText("Net take-home")).toBeInTheDocument();
  });

  it("renders savings, expenses, and debt repayment sections", () => {
    const data = mockData({
      expenseRows: [{ label: "Rent", amount: 2000, isRecurring: true }],
      savingsRows: [{ label: "401k", amount: 500, isRecurring: true }],
      debtRepaymentRows: [
        { label: "Credit card", amount: 300, isRecurring: true },
      ],
      totalExpenses: 2000,
      totalSavings: 500,
      totalDebtRepayment: 300,
    });
    render(
      <YearlySummaryDialogContent
        data={data}
        expandedEventIds={new Set()}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("401k")).toBeInTheDocument();
    expect(screen.getByText("Credit card")).toBeInTheDocument();
    expect(screen.getByText("Total income (take home)")).toBeInTheDocument();
    expect(screen.getByText("Total savings & investments")).toBeInTheDocument();
    expect(screen.getByText("Total expenses")).toBeInTheDocument();
    expect(screen.getByText("Total debt repayment")).toBeInTheDocument();
  });
});
