"use client";

import { formatCurrency, getAmountVariant } from "@/lib/format";

interface BudgetYearlySummaryFooterProps {
  netIncome: number;
  savings: number;
  debtRepayment: number;
}

export function BudgetYearlySummaryFooter({
  netIncome,
  savings,
  debtRepayment,
}: BudgetYearlySummaryFooterProps) {
  const amountClass = (n: number) =>
    getAmountVariant(n) === "positive"
      ? "text-emerald-600"
      : "text-destructive";

  return (
    <div className="flex-shrink-0 mt-6 pt-4 border-t border-border -mx-6 px-6">
      <table className="ml-auto text-sm border-collapse">
        <tbody>
          <tr className="font-semibold">
            <td className="py-0.5 pr-3 text-right">Net income</td>
            <td
              className={`py-0.5 text-right whitespace-nowrap ${amountClass(netIncome)}`}
            >
              <span className="tabular-nums">{formatCurrency(netIncome)}</span>
            </td>
          </tr>
          <tr className="font-semibold">
            <td className="py-0.5 pr-3 text-right">Savings & investments</td>
            <td
              className={`py-0.5 text-right whitespace-nowrap ${amountClass(savings)}`}
            >
              <span className="tabular-nums">{formatCurrency(savings)}</span>
            </td>
          </tr>
          <tr className="font-semibold">
            <td className="py-0.5 pr-3 text-right">Debt repayment</td>
            <td
              className={`py-0.5 text-right whitespace-nowrap ${amountClass(debtRepayment)}`}
            >
              <span className="tabular-nums">
                {formatCurrency(debtRepayment)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
