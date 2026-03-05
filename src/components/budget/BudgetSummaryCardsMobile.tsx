"use client";

import { Banknote, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface BudgetSummaryCardsMobileProps {
  yearlyTotalGrossIncome: number;
  yearlyTotalIncome: number;
  yearlyTotalExpenses: number;
  yearlyNetIncome: number;
  yearlyTotalSavings: number;
  onIncomeClick: () => void;
  onExpenseClick: () => void;
}

export function BudgetSummaryCardsMobile({
  yearlyTotalGrossIncome,
  yearlyTotalIncome,
  yearlyTotalExpenses,
  yearlyNetIncome,
  yearlyTotalSavings,
  onIncomeClick,
  onExpenseClick,
}: BudgetSummaryCardsMobileProps) {
  return (
    <Card className="mb-6 md:hidden">
      <CardContent className="px-4 py-4">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 text-sm">
          <button
            type="button"
            onClick={onIncomeClick}
            className="flex flex-col rounded px-1 -mx-1 py-0.5 text-left hover:bg-muted/50 cursor-pointer"
          >
            <span className="text-xs font-medium text-muted-foreground">
              Income (gross)
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Banknote className="size-3.5 shrink-0" aria-hidden />
              {formatCurrency(yearlyTotalGrossIncome)}
            </span>
          </button>
          <button
            type="button"
            onClick={onIncomeClick}
            className="flex flex-col rounded px-1 -mx-1 py-0.5 text-left hover:bg-muted/50 cursor-pointer"
          >
            <span className="text-xs font-medium text-muted-foreground">
              Income (take home)
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Banknote className="size-3.5 shrink-0" aria-hidden />
              {formatCurrency(yearlyTotalIncome)}
            </span>
          </button>
          <button
            type="button"
            onClick={onExpenseClick}
            className="flex flex-col rounded px-1 -mx-1 py-0.5 text-left hover:bg-muted/50 cursor-pointer"
          >
            <span className="text-xs font-medium text-muted-foreground">
              Expenses
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <CreditCard className="size-3.5 shrink-0" aria-hidden />
              {formatCurrency(yearlyTotalExpenses)}
            </span>
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              Net income
            </span>
            <span
              className={`${
                yearlyNetIncome >= 0 ? "text-emerald-600" : "text-destructive"
              }`}
            >
              {formatCurrency(yearlyNetIncome)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              Savings & investments
            </span>
            <span
              className={`${
                yearlyTotalSavings >= 0
                  ? "text-emerald-600"
                  : "text-destructive"
              }`}
            >
              {formatCurrency(yearlyTotalSavings)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
