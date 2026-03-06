"use client";

import { Banknote, CreditCard } from "lucide-react";
import { formatCurrency, getAmountVariant } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SummaryStat } from "./SummaryStat";

interface BudgetSummaryAsideProps {
  yearlyTotalGrossIncome: number;
  yearlyTotalIncome: number;
  yearlyTotalExpenses: number;
  yearlyNetIncome: number;
  yearlyTotalSavings: number;
  yearlyTotalDebtRepayment: number;
  hotkeysVisible: boolean;
  onIncomeClick: () => void;
  onExpenseClick: () => void;
  onShowHotkeys: () => void;
  onHideHotkeys: () => void;
}

export function BudgetSummaryAside({
  yearlyTotalGrossIncome,
  yearlyTotalIncome,
  yearlyTotalExpenses,
  yearlyNetIncome,
  yearlyTotalSavings,
  yearlyTotalDebtRepayment,
  hotkeysVisible,
  onIncomeClick,
  onExpenseClick,
  onShowHotkeys,
  onHideHotkeys,
}: BudgetSummaryAsideProps) {
  return (
    <aside
      className="hidden md:block w-52 shrink-0"
      aria-label="Yearly summary and keyboard shortcuts"
    >
      <div className="sticky top-8 space-y-4 pt-1">
        <div className="space-y-2">
          <SummaryStat
            label="Income (gross)"
            value={formatCurrency(yearlyTotalGrossIncome)}
            icon={<Banknote className="size-3.5 shrink-0" aria-hidden />}
            onClick={onIncomeClick}
          />
          <SummaryStat
            label="Income (take home)"
            value={formatCurrency(yearlyTotalIncome)}
            icon={<Banknote className="size-3.5 shrink-0" aria-hidden />}
            onClick={onIncomeClick}
          />
          <SummaryStat
            label="Expenses"
            value={formatCurrency(yearlyTotalExpenses)}
            icon={<CreditCard className="size-3.5 shrink-0" aria-hidden />}
            onClick={onExpenseClick}
          />
          <SummaryStat
            label="Net income"
            value={formatCurrency(yearlyNetIncome)}
            variant={getAmountVariant(yearlyNetIncome)}
          />
          <SummaryStat
            label="Savings & investments"
            value={formatCurrency(yearlyTotalSavings)}
            variant={getAmountVariant(yearlyTotalSavings)}
          />
          <SummaryStat
            label="Debt repayment"
            value={formatCurrency(yearlyTotalDebtRepayment)}
            variant={getAmountVariant(yearlyTotalDebtRepayment)}
          />
          <span className="sr-only">
            Income (gross) {formatCurrency(yearlyTotalGrossIncome)}, Income
            (take home) {formatCurrency(yearlyTotalIncome)}, expenses{" "}
            {formatCurrency(yearlyTotalExpenses)}, net income{" "}
            {formatCurrency(yearlyNetIncome)}, savings & investments{" "}
            {formatCurrency(yearlyTotalSavings)}, debt repayment{" "}
            {formatCurrency(yearlyTotalDebtRepayment)}
          </span>
        </div>
        <Separator />
        {hotkeysVisible ? (
          <BudgetHotkeysHelp onHide={onHideHotkeys} />
        ) : (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={onShowHotkeys}
          >
            Show Hotkeys
          </Button>
        )}
      </div>
    </aside>
  );
}

function BudgetHotkeysHelp({ onHide }: { onHide: () => void }) {
  const hotkeys: { key: string; label: string }[] = [
    { key: "⌘K", label: "Command palette" },
    { key: "Y", label: "Yearly summary" },
    { key: "I", label: "Add expected income" },
    { key: "E", label: "Add expected expense" },
    { key: "C", label: "Jump to current month" },
    { key: "J", label: "Previous month" },
    { key: "K", label: "Next month" },
    { key: "T", label: "Back to top" },
    { key: "⌘I", label: "Manage income" },
    { key: "⌘E", label: "Manage expenses" },
  ];

  return (
    <div className="space-y-3">
      {hotkeys.map(({ key, label }) => (
        <p key={key} className="text-xs text-muted-foreground" role="status">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            {key}
          </kbd>{" "}
          {label}
        </p>
      ))}
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
        onClick={onHide}
      >
        Hide
      </Button>
    </div>
  );
}
