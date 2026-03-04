"use client";

import { useState } from "react";
import {
  addIncomeSource,
  addIncomeEvent,
  addExpenseEvent,
} from "@/store/budget";
import { useBudgetStore } from "@/store/budget";
import {
  DAY_OF_MONTH_MAX,
  DAY_OF_MONTH_MIN,
  EXPENSE_CATEGORIES,
  INCOME_TYPES,
  SELECT_NONE,
  STOCK_INCOME_TYPES,
} from "@/lib/constants";
import { parseIncomeFormFromInputs } from "@/lib/income-form-utils";
import { parseCurrency } from "@/lib/format";
import { useStockPriceFetch } from "@/hooks/useStockPriceFetch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaycheckIncomeForm } from "./PaycheckIncomeForm";
import { StockIncomeForm } from "./StockIncomeForm";

export type OnboardingStep = 1 | 2 | 3 | "done";

export interface OnboardingFlowProps {
  open: boolean;
  step: OnboardingStep;
  onStepChange: (step: OnboardingStep) => void;
  onDismiss: () => void;
  onStepReset: () => void;
}

export function OnboardingFlow({
  open,
  step,
  onStepChange,
  onDismiss,
  onStepReset,
}: OnboardingFlowProps) {
  const [incomeName, setIncomeName] = useState("");
  const [incomeDesc, setIncomeDesc] = useState("");
  const [incomeLabel, setIncomeLabel] = useState("");
  const [incomeType, setIncomeType] = useState("paycheck");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDay, setIncomeDay] = useState("15");
  const [paycheckGross, setPaycheckGross] = useState("");
  const [paycheckWithholdings, setPaycheckWithholdings] = useState<
    Record<string, string>
  >({});
  const [stockSymbol, setStockSymbol] = useState("");
  const [stockShares, setStockShares] = useState("");
  const [stockTaxRate, setStockTaxRate] = useState("");
  const stockFetch = useStockPriceFetch({ onAmountComputed: setIncomeAmount });
  const [expenseLabel, setExpenseLabel] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseDay, setExpenseDay] = useState("1");

  const incomeSources = useBudgetStore((s) => s.incomeSources);

  function resetToStep1() {
    setIncomeName("");
    setIncomeDesc("");
    setIncomeLabel("");
    setIncomeType("paycheck");
    setIncomeAmount("");
    setIncomeDay("15");
    setPaycheckGross("");
    setPaycheckWithholdings({});
    setStockSymbol("");
    setStockShares("");
    setStockTaxRate("");
    stockFetch.reset();
    setExpenseLabel("");
    setExpenseAmount("");
    setExpenseCategory("");
    setExpenseDay("1");
    onStepReset();
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    const name = incomeName.trim();
    if (!name) return;
    addIncomeSource(name, incomeDesc.trim());
    onStepChange(2);
  }

  function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    const label = incomeLabel.trim();
    if (!label) return;
    const sourceId = incomeSources[0]?.id;
    if (!sourceId) return;
    const day = parseInt(incomeDay, 10);
    const schedule =
      Number.isNaN(day) || day < DAY_OF_MONTH_MIN || day > DAY_OF_MONTH_MAX
        ? { type: "recurring" as const, daysOfMonth: [15] }
        : { type: "recurring" as const, daysOfMonth: [day] };

    const parsed = parseIncomeFormFromInputs(
      incomeType,
      incomeAmount,
      incomeType === "paycheck"
        ? { gross: paycheckGross, withholdings: paycheckWithholdings }
        : null,
      STOCK_INCOME_TYPES.includes(
        incomeType as (typeof STOCK_INCOME_TYPES)[number],
      )
        ? { symbol: stockSymbol, shares: stockShares, taxRate: stockTaxRate }
        : null,
    );
    if (!parsed) return;

    addIncomeEvent({
      label,
      amount: parsed.amount,
      incomeSourceId: sourceId,
      incomeType: incomeType || undefined,
      stockSaleDetails: parsed.stockSaleDetails,
      paycheckDetails: parsed.paycheckDetails,
      schedule,
    });
    onStepChange(3);
  }

  function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    const label = expenseLabel.trim();
    if (!label) return;
    const amount = parseCurrency(expenseAmount);
    if (Number.isNaN(amount) || amount < 0) return;
    const day = parseInt(expenseDay, 10);
    const schedule =
      Number.isNaN(day) || day < DAY_OF_MONTH_MIN || day > DAY_OF_MONTH_MAX
        ? { type: "recurring" as const, daysOfMonth: [DAY_OF_MONTH_MIN] }
        : { type: "recurring" as const, daysOfMonth: [day] };
    addExpenseEvent({
      label,
      amount,
      category: expenseCategory || undefined,
      schedule,
    });
    onStepChange("done");
  }

  function handleSkipStep1() {
    onDismiss();
    resetToStep1();
  }

  function handleDone() {
    onDismiss();
    resetToStep1();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetToStep1()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Add your first income source"}
            {step === 2 && "Add your first expected income"}
            {step === 3 && "Add your first expected expense"}
            {step === "done" && "You're all set!"}
          </DialogTitle>
          {step !== "done" && (
            <p className="text-sm text-muted-foreground">Step {step} of 3</p>
          )}
          <DialogDescription>
            {step === 1 &&
              "Income sources are where your money comes from (e.g. employer, freelance client)."}
            {step === 2 &&
              "Expected income is what you plan to receive and when."}
            {step === 3 &&
              "Expected expenses are what you plan to pay and when."}
            {step === "done" &&
              "You've added your first income and expense. You can manage and add more from the main budget view."}
          </DialogDescription>
        </DialogHeader>
        {step === 1 && (
          <form onSubmit={handleStep1} className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="onboard-income-name">Name</Label>
              <Input
                id="onboard-income-name"
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
                placeholder="e.g. My Employer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-income-desc">
                Description (optional)
              </Label>
              <Input
                id="onboard-income-desc"
                value={incomeDesc}
                onChange={(e) => setIncomeDesc(e.target.value)}
                placeholder="e.g. Primary job"
              />
            </div>
            <DialogFooter className="gap-2 pt-2 sm:justify-end">
              <Button type="button" variant="ghost" onClick={handleSkipStep1}>
                Skip
              </Button>
              <Button type="submit">Continue</Button>
            </DialogFooter>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleStep2} className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="onboard-income-type">Type</Label>
              <Select
                value={incomeType || SELECT_NONE}
                onValueChange={(v) => {
                  const next = v === SELECT_NONE ? "" : v;
                  setIncomeType(next);
                  if (
                    !STOCK_INCOME_TYPES.includes(
                      next as (typeof STOCK_INCOME_TYPES)[number],
                    )
                  ) {
                    setStockSymbol("");
                    setStockShares("");
                    setStockTaxRate("");
                    stockFetch.reset();
                  }
                  if (next !== "paycheck") {
                    setPaycheckGross("");
                    setPaycheckWithholdings({});
                  }
                }}
              >
                <SelectTrigger id="onboard-income-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>Select type</SelectItem>
                  {INCOME_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {STOCK_INCOME_TYPES.includes(
              incomeType as (typeof STOCK_INCOME_TYPES)[number],
            ) && (
              <StockIncomeForm
                idPrefix="onboard-stock"
                symbol={stockSymbol}
                shares={stockShares}
                taxRate={stockTaxRate}
                onSymbolChange={setStockSymbol}
                onSharesChange={setStockShares}
                onTaxRateChange={setStockTaxRate}
                stockFetch={stockFetch}
              />
            )}
            {incomeType === "paycheck" && (
              <PaycheckIncomeForm
                idPrefix="onboard-paycheck"
                gross={paycheckGross}
                withholdings={paycheckWithholdings}
                onGrossChange={setPaycheckGross}
                onWithholdingChange={(key, v) =>
                  setPaycheckWithholdings((prev) => ({ ...prev, [key]: v }))
                }
              />
            )}
            <div className="space-y-2">
              <Label htmlFor="onboard-income-label">Label</Label>
              <Input
                id="onboard-income-label"
                value={incomeLabel}
                onChange={(e) => setIncomeLabel(e.target.value)}
                placeholder="e.g. Paycheck"
                required
              />
            </div>
            {incomeType !== "paycheck" && (
              <div className="space-y-2">
                <Label htmlFor="onboard-income-amount">Amount</Label>
                <CurrencyInput
                  id="onboard-income-amount"
                  value={incomeAmount}
                  onChange={setIncomeAmount}
                  min={0}
                  placeholder={
                    STOCK_INCOME_TYPES.includes(
                      incomeType as (typeof STOCK_INCOME_TYPES)[number],
                    )
                      ? "0.00 (or fetch price above)"
                      : "0.00"
                  }
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="onboard-income-day">
                Day of month (recurring)
              </Label>
              <Input
                id="onboard-income-day"
                type="number"
                min={1}
                max={31}
                value={incomeDay}
                onChange={(e) => setIncomeDay(e.target.value)}
                placeholder="15"
              />
            </div>
            <DialogFooter className="gap-2 pt-2 sm:justify-end">
              <Button type="button" variant="ghost" onClick={resetToStep1}>
                Skip
              </Button>
              <Button type="submit">Continue</Button>
            </DialogFooter>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleStep3} className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="onboard-expense-label">Label</Label>
              <Input
                id="onboard-expense-label"
                value={expenseLabel}
                onChange={(e) => setExpenseLabel(e.target.value)}
                placeholder="e.g. Rent"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-expense-amount">Amount</Label>
              <CurrencyInput
                id="onboard-expense-amount"
                value={expenseAmount}
                onChange={setExpenseAmount}
                min={0}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-expense-category">
                Category (optional)
              </Label>
              <Select
                value={expenseCategory || SELECT_NONE}
                onValueChange={(v) =>
                  setExpenseCategory(v === SELECT_NONE ? "" : v)
                }
              >
                <SelectTrigger id="onboard-expense-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>None</SelectItem>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-expense-day">
                Day of month (recurring)
              </Label>
              <Input
                id="onboard-expense-day"
                type="number"
                min={1}
                max={31}
                value={expenseDay}
                onChange={(e) => setExpenseDay(e.target.value)}
                placeholder="1"
              />
            </div>
            <DialogFooter className="gap-2 pt-2 sm:justify-end">
              <Button type="button" variant="ghost" onClick={resetToStep1}>
                Skip
              </Button>
              <Button type="submit">Continue</Button>
            </DialogFooter>
          </form>
        )}
        {step === "done" && (
          <DialogFooter className="mt-4">
            <Button onClick={handleDone}>Done</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
