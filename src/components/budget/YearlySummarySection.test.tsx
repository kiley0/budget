/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { YearlySummarySection } from "./YearlySummarySection";

describe("YearlySummarySection", () => {
  it("renders period label in heading", () => {
    render(
      <YearlySummarySection
        periodLabel="Jan–Dec 2024"
        yearlyIncome={60000}
        yearlyExpenses={40000}
      />,
    );
    expect(
      screen.getByText(/Income and Expenses Summary: Jan–Dec 2024/),
    ).toBeInTheDocument();
  });

  it("displays income, expenses, and savings", () => {
    render(
      <YearlySummarySection
        periodLabel="2024"
        yearlyIncome={60000}
        yearlyExpenses={40000}
        yearlySavings={10000}
      />,
    );
    expect(screen.getByText("Income (take home)")).toBeInTheDocument();
    expect(screen.getByText("Total expenses")).toBeInTheDocument();
    expect(screen.getByText("Savings & investments")).toBeInTheDocument();
  });

  it("defaults savings to 0 when not provided", () => {
    render(
      <YearlySummarySection
        periodLabel="2024"
        yearlyIncome={50000}
        yearlyExpenses={30000}
      />,
    );
    const savingsLabel = screen.getByText("Savings & investments");
    const savingsValue = savingsLabel.nextElementSibling;
    expect(savingsValue?.textContent).toMatch(/0/);
  });

  it("displays positive net income in default color", () => {
    render(
      <YearlySummarySection
        periodLabel="2024"
        yearlyIncome={60000}
        yearlyExpenses={40000}
      />,
    );
    const netLabel = screen.getByText("Net income");
    const netValue = netLabel.nextElementSibling;
    expect(netValue?.textContent).toMatch(/20[,\s]*000/);
    expect(netValue).not.toHaveClass("text-destructive");
  });

  it("displays negative net income in destructive color", () => {
    render(
      <YearlySummarySection
        periodLabel="2024"
        yearlyIncome={30000}
        yearlyExpenses={40000}
      />,
    );
    const netLabel = screen.getByText("Net income");
    const netValue = netLabel.nextElementSibling;
    expect(netValue).toHaveClass("text-destructive");
  });

  it("has accessible section structure", () => {
    render(
      <YearlySummarySection
        periodLabel="2024"
        yearlyIncome={50000}
        yearlyExpenses={30000}
      />,
    );
    const heading = document.getElementById("yearly-summary-heading");
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toContain("Income and Expenses Summary");
  });
});
