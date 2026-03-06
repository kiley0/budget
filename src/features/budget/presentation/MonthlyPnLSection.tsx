"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useBudgetMonthData } from "./hooks/useBudgetMonthData";
import { formatCurrency, parseCurrency } from "@/lib/format";
import {
  formatDayForDisplay,
  formatDayOrdinal,
  getDayForSort,
  sortEventsByDayThenAmount,
} from "@/features/budget/domain/schedule-format";
import { Repeat } from "lucide-react";
import { DEBT_REPAYMENT_CATEGORY, getIncomeTypeLabel } from "@/lib/constants";
import {
  type DateViewMode,
  type MonthSlot,
  DATE_VIEW_MODE_LABELS,
  formatMonthLabel,
} from "@/features/budget/domain/date-view";
import type {
  IncomeEvent,
  ExpenseEvent,
} from "@/features/budget/infrastructure/store";
import {
  getMonthKey,
  setMonthActuals,
  useBudgetStore,
} from "@/features/budget/infrastructure/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

function isWholeMonthExpense(event: IncomeEvent | ExpenseEvent): boolean {
  return (event.schedule as { type?: string }).type === "whole-month";
}

/** Expected amount for the month: per-occurrence × occurrences for recurring. */
function getExpectedAmountForMonth(event: IncomeEvent | ExpenseEvent): number {
  const s = event.schedule as { type?: string; daysOfMonth?: number[] };
  if (s.type === "recurring" && s.daysOfMonth)
    return event.amount * s.daysOfMonth.length;
  return event.amount;
}

function formatMonthShort({ year, monthIndex }: MonthSlot): string {
  return new Date(year, monthIndex, 1).toLocaleString(undefined, {
    month: "short",
  });
}

const pnlChartConfig = {
  income: {
    label: "Income (take home)",
    color: "var(--chart-1)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function isCurrentOrPastMonth(slot: MonthSlot): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  return (
    slot.year < year || (slot.year === year && slot.monthIndex <= monthIndex)
  );
}

function isCurrentMonth(slot: MonthSlot): boolean {
  const now = new Date();
  return slot.year === now.getFullYear() && slot.monthIndex === now.getMonth();
}

export function MonthlyPnLSection({
  months,
  dateViewMode,
  onDateViewModeChange,
  onEditIncomeEvent,
  onEditExpenseEvent,
  onAddIncome,
  onAddExpense,
  addIncomeDisabled,
  addExpenseDisabled,
}: {
  months: MonthSlot[];
  dateViewMode: DateViewMode;
  onDateViewModeChange: (mode: DateViewMode) => void;
  onEditIncomeEvent?: (event: IncomeEvent) => void;
  onEditExpenseEvent?: (event: ExpenseEvent) => void;
  onAddIncome?: (slot: MonthSlot) => void;
  onAddExpense?: (slot: MonthSlot) => void;
  addIncomeDisabled?: boolean;
  addExpenseDisabled?: boolean;
}) {
  const { getEventsForMonth, getExpenseEventsForMonth } =
    useBudgetMonthData(months);
  const actualsByMonth = useBudgetStore((s) => s.actualsByMonth);
  const incomeEvents = useBudgetStore((s) => s.incomeEvents);
  const actuals = useMemo(() => actualsByMonth ?? {}, [actualsByMonth]);

  const symbolsToFetch = useMemo(() => {
    const set = new Set<string>();
    for (const e of incomeEvents) {
      if (e.stockSaleDetails?.symbol) set.add(e.stockSaleDetails.symbol);
    }
    return Array.from(set);
  }, [incomeEvents]);

  const [stockPricesBySymbol, setStockPricesBySymbol] = useState<
    Record<string, number>
  >({});
  const hasFetchedStocksRef = useRef(false);

  useEffect(() => {
    if (symbolsToFetch.length === 0 || hasFetchedStocksRef.current) return;
    hasFetchedStocksRef.current = true;
    let cancelled = false;
    const syms = [...symbolsToFetch];
    (async () => {
      const results: Record<string, number> = {};
      for (const symbol of syms) {
        if (cancelled) return;
        try {
          const res = await fetch(
            `/api/stock-price?symbol=${encodeURIComponent(symbol)}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (typeof data.price === "number") results[symbol] = data.price;
          }
        } catch {
          // skip
        }
      }
      if (!cancelled)
        setStockPricesBySymbol((prev) => ({ ...prev, ...results }));
    })();
    return () => {
      cancelled = true;
    };
  }, [symbolsToFetch]);
  const chartData = useMemo(() => {
    return months.map((slot, i) => {
      const monthKey = getMonthKey(slot.year, slot.monthIndex);
      const monthActuals = actuals[monthKey];
      const incomeEventsForMonth = sortEventsByDayThenAmount(
        getEventsForMonth(i),
      );
      const expenseEventsForMonth = sortEventsByDayThenAmount(
        getExpenseEventsForMonth(i),
      );
      const income = incomeEventsForMonth.reduce(
        (sum, e) =>
          sum + (monthActuals?.actualIncomeByEventId?.[e.id] ?? e.amount),
        0,
      );
      const expenses = expenseEventsForMonth.reduce(
        (sum, e) =>
          sum + (monthActuals?.actualExpenseByEventId?.[e.id] ?? e.amount),
        0,
      );
      return {
        month: formatMonthShort(slot),
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
      };
    });
  }, [months, actuals, getEventsForMonth, getExpenseEventsForMonth]);

  const [actualsDialogSlot, setActualsDialogSlot] = useState<{
    slot: MonthSlot;
    slotIndex: number;
  } | null>(null);
  /** Per-event actual input values. Key: event id. */
  const [actualInputsByEventId, setActualInputsByEventId] = useState<
    Record<string, string>
  >({});

  function openActualsDialog(slot: MonthSlot, slotIndex: number) {
    const monthKey = getMonthKey(slot.year, slot.monthIndex);
    const existing = actuals[monthKey];
    const incomeEvents = sortEventsByDayThenAmount(
      getEventsForMonth(slotIndex),
    );
    const expenseEvents = sortEventsByDayThenAmount(
      getExpenseEventsForMonth(slotIndex),
    );
    const inputs: Record<string, string> = {};
    for (const e of incomeEvents) {
      const v = existing?.actualIncomeByEventId?.[e.id];
      inputs[e.id] =
        v !== undefined && v !== null ? String(v) : String(e.amount);
    }
    for (const e of expenseEvents) {
      const v = existing?.actualExpenseByEventId?.[e.id];
      inputs[e.id] =
        v !== undefined && v !== null ? String(v) : String(e.amount);
    }
    setActualsDialogSlot({ slot, slotIndex });
    setActualInputsByEventId(inputs);
  }

  function closeActualsDialog() {
    setActualsDialogSlot(null);
    setActualInputsByEventId({});
  }

  function setActualInput(eventId: string, value: string) {
    setActualInputsByEventId((prev) => ({ ...prev, [eventId]: value }));
  }

  function handleSaveActuals() {
    if (!actualsDialogSlot) return;
    const monthKey = getMonthKey(
      actualsDialogSlot.slot.year,
      actualsDialogSlot.slot.monthIndex,
    );
    const incomeEvents = sortEventsByDayThenAmount(
      getEventsForMonth(actualsDialogSlot.slotIndex),
    );
    const expenseEvents = sortEventsByDayThenAmount(
      getExpenseEventsForMonth(actualsDialogSlot.slotIndex),
    );
    const actualIncomeByEventId: Record<string, number> = {};
    const actualExpenseByEventId: Record<string, number> = {};
    const parse = (s: string) => {
      const n = parseCurrency(s);
      return !Number.isNaN(n) && n >= 0 ? n : undefined;
    };
    for (const e of incomeEvents) {
      const v = parse(actualInputsByEventId[e.id] ?? "");
      if (v !== undefined) actualIncomeByEventId[e.id] = v;
    }
    for (const e of expenseEvents) {
      const v = parse(actualInputsByEventId[e.id] ?? "");
      if (v !== undefined) actualExpenseByEventId[e.id] = v;
    }
    setMonthActuals(monthKey, {
      actualIncomeByEventId:
        Object.keys(actualIncomeByEventId).length > 0
          ? actualIncomeByEventId
          : undefined,
      actualExpenseByEventId:
        Object.keys(actualExpenseByEventId).length > 0
          ? actualExpenseByEventId
          : undefined,
    });
    closeActualsDialog();
  }

  function scrollToMonthCard(index: number) {
    const el = document.querySelector(`[data-month-index="${index}"]`);
    if (el) {
      const y =
        (el as HTMLElement).getBoundingClientRect().top +
        (window.scrollY ?? document.documentElement.scrollTop);
      window.scrollTo({ top: y - 16, behavior: "smooth" });
    }
  }

  return (
    <section className="mt-10" aria-labelledby="monthly-pnl-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            id="monthly-pnl-heading"
            className="text-lg font-semibold text-foreground"
          >
            Monthly Income and Expenses
          </h2>
          {months.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMonthLabel(months[0])} to{" "}
              {formatMonthLabel(months[months.length - 1])}
            </p>
          )}
        </div>
        <Select
          value={dateViewMode}
          onValueChange={(value) => onDateViewModeChange(value as DateViewMode)}
        >
          <SelectTrigger
            id="date-view-select"
            className="w-[220px] shrink-0"
            aria-label="Date range to display"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-year">
              {DATE_VIEW_MODE_LABELS["current-year"]}
            </SelectItem>
            <SelectItem value="next-12-months">
              {DATE_VIEW_MODE_LABELS["next-12-months"]}
            </SelectItem>
            <SelectItem value="next-year">
              {DATE_VIEW_MODE_LABELS["next-year"]}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {chartData.length > 0 && (
        <Card className="px-4 py-4 mt-4 mb-4">
          <CardContent className="px-0 pt-6">
            <ChartContainer
              config={pnlChartConfig}
              className="h-[140px] w-full cursor-pointer"
              role="img"
              aria-label="Monthly income and expenses. Click a month to jump to that month."
            >
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted/30"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                    }).format(v)
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => (
                        <div className="flex w-full items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{
                              backgroundColor:
                                item?.color ?? item?.payload?.fill,
                            }}
                          />
                          <div className="flex flex-1 justify-between items-center gap-4">
                            <span className="text-muted-foreground">
                              {name === "income"
                                ? "Income (take home)"
                                : name === "expenses"
                                  ? "Expenses"
                                  : name}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatCurrency(Number(value))}
                            </span>
                          </div>
                        </div>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="income"
                  fill="var(--color-income)"
                  radius={[2, 2, 0, 0]}
                  cursor="pointer"
                  onClick={(_, index) => scrollToMonthCard(index)}
                />
                <Bar
                  dataKey="expenses"
                  fill="var(--color-expenses)"
                  radius={[2, 2, 0, 0]}
                  cursor="pointer"
                  onClick={(_, index) => scrollToMonthCard(index)}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
      <ul className="mt-3 list-none space-y-4">
        {months.map((slot, i) => {
          const monthKey = getMonthKey(slot.year, slot.monthIndex);
          const monthActuals = actuals[monthKey];
          const monthLabel = formatMonthLabel(slot);
          const incomeEventsForMonth = sortEventsByDayThenAmount(
            getEventsForMonth(i),
          );
          const expenseEventsForMonth = sortEventsByDayThenAmount(
            getExpenseEventsForMonth(i),
          );
          const totalIncome = incomeEventsForMonth.reduce(
            (sum, e) =>
              sum + (monthActuals?.actualIncomeByEventId?.[e.id] ?? e.amount),
            0,
          );
          const totalExpenses = expenseEventsForMonth.reduce(
            (sum, e) =>
              sum + (monthActuals?.actualExpenseByEventId?.[e.id] ?? e.amount),
            0,
          );
          const preTaxSavingsItems: {
            day: number;
            label: string;
            amount: number;
          }[] = [];
          for (const e of incomeEventsForMonth) {
            const w = e.paycheckDetails?.withholdings;
            if (!w) continue;
            const day = getDayForSort(e);
            if ((w.retirement401k ?? 0) > 0) {
              preTaxSavingsItems.push({
                day,
                label: "401(k) / Retirement",
                amount: w.retirement401k ?? 0,
              });
            }
            if ((w.hsa ?? 0) > 0) {
              preTaxSavingsItems.push({
                day,
                label: "HSA",
                amount: w.hsa ?? 0,
              });
            }
          }
          const sortedPreTaxSavingsItems = [...preTaxSavingsItems].sort(
            (a, b) => (a.day !== b.day ? a.day - b.day : b.amount - a.amount),
          );
          const totalPreTaxSavings = preTaxSavingsItems.reduce(
            (sum, item) => sum + item.amount,
            0,
          );
          const debtRepaymentEvents = expenseEventsForMonth.filter(
            (e) => e.category === DEBT_REPAYMENT_CATEGORY,
          );
          const totalDebtRepayment = debtRepaymentEvents.reduce(
            (sum, e) =>
              sum + (monthActuals?.actualExpenseByEventId?.[e.id] ?? e.amount),
            0,
          );
          const expenseEventsExcludingDebt = expenseEventsForMonth.filter(
            (e) => e.category !== DEBT_REPAYMENT_CATEGORY,
          );
          const totalExpensesExcludingDebt = expenseEventsExcludingDebt.reduce(
            (sum, e) =>
              sum + (monthActuals?.actualExpenseByEventId?.[e.id] ?? e.amount),
            0,
          );
          const net = totalIncome - totalExpenses;

          return (
            <li key={`${slot.year}-${slot.monthIndex}`}>
              <Card
                className={`px-4 py-4 ${isCurrentMonth(slot) ? "scroll-mt-4" : ""}`}
                id={
                  isCurrentMonth(slot)
                    ? "current-month-card"
                    : `month-card-${i}`
                }
                data-month-index={i}
              >
                <CardHeader className="space-y-0 pb-2 px-0">
                  <CardTitle className="text-base">{monthLabel}</CardTitle>
                  {isCurrentOrPastMonth(slot) && (
                    <CardAction>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openActualsDialog(slot, i)}
                      >
                        Enter actuals
                      </Button>
                    </CardAction>
                  )}
                </CardHeader>
                <Separator className="mb-3" />
                <CardContent className="grid gap-4 sm:grid-cols-2 px-0">
                  <div className="flex min-h-0 flex-col">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Income (take home)
                    </h4>
                    <div className="mt-1 min-h-0 flex-1">
                      {incomeEventsForMonth.length === 0 ? (
                        <p className="text-sm text-muted-foreground">–</p>
                      ) : (
                        <ul className="list-none space-y-1">
                          {incomeEventsForMonth.map((event) => (
                            <li
                              key={event.id}
                              className={`flex items-center justify-between gap-2 text-sm min-h-5 ${onEditIncomeEvent ? "cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50" : ""}`}
                              role={onEditIncomeEvent ? "button" : undefined}
                              tabIndex={onEditIncomeEvent ? 0 : undefined}
                              onClick={
                                onEditIncomeEvent
                                  ? () => onEditIncomeEvent(event)
                                  : undefined
                              }
                              onKeyDown={
                                onEditIncomeEvent
                                  ? (e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        onEditIncomeEvent(event);
                                      }
                                    }
                                  : undefined
                              }
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                <span className="w-7 shrink-0 flex items-center text-left text-[10px] font-semibold text-muted-foreground">
                                  {isWholeMonthExpense(event) ? (
                                    <Repeat
                                      className="size-3.5 shrink-0"
                                      aria-label="Monthly total"
                                    />
                                  ) : (
                                    formatDayForDisplay(event)
                                  )}
                                </span>
                                <span className="min-w-0 truncate text-foreground">
                                  {event.label}
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    {[
                                      event.incomeType
                                        ? getIncomeTypeLabel(event.incomeType)
                                        : null,
                                      event.stockSaleDetails
                                        ? (() => {
                                            const p =
                                              stockPricesBySymbol[
                                                event.stockSaleDetails!.symbol
                                              ];
                                            const base = `${event.stockSaleDetails!.shares} shares ${event.stockSaleDetails!.symbol}`;
                                            return p != null
                                              ? `${base} @ ${formatCurrency(p)}`
                                              : base;
                                          })()
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </span>
                                </span>
                              </div>
                              <span className="shrink-0 tabular-nums text-foreground">
                                {(() => {
                                  const actual =
                                    monthActuals?.actualIncomeByEventId?.[
                                      event.id
                                    ];
                                  const differs =
                                    actual !== undefined &&
                                    actual !== getExpectedAmountForMonth(event);
                                  if (differs) {
                                    return (
                                      <>
                                        <span className="line-through text-muted-foreground">
                                          {formatCurrency(
                                            getExpectedAmountForMonth(event),
                                          )}
                                        </span>{" "}
                                        {formatCurrency(actual)}
                                      </>
                                    );
                                  }
                                  return formatCurrency(
                                    getExpectedAmountForMonth(event),
                                  );
                                })()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {onAddIncome != null && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-1.5 -ml-1 h-7 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => onAddIncome(slot)}
                          disabled={addIncomeDisabled}
                        >
                          + Add income
                        </Button>
                      )}
                    </div>
                    <Separator className="my-2" />
                    <p className="mt-auto pt-2 text-sm font-medium text-foreground">
                      Total income (take home): {formatCurrency(totalIncome)}
                    </p>
                  </div>
                  <div className="flex min-h-0 flex-col">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Expenses
                    </h4>
                    <div className="mt-1 min-h-0 flex-1">
                      {expenseEventsExcludingDebt.length === 0 ? (
                        <p className="text-sm text-muted-foreground">–</p>
                      ) : (
                        <ul className="list-none space-y-1">
                          {expenseEventsExcludingDebt.map((event) => (
                            <li
                              key={event.id}
                              className={`flex items-center justify-between gap-2 text-sm min-h-5 ${onEditExpenseEvent ? "cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50" : ""}`}
                              role={onEditExpenseEvent ? "button" : undefined}
                              tabIndex={onEditExpenseEvent ? 0 : undefined}
                              onClick={
                                onEditExpenseEvent
                                  ? () => onEditExpenseEvent(event)
                                  : undefined
                              }
                              onKeyDown={
                                onEditExpenseEvent
                                  ? (e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        onEditExpenseEvent(event);
                                      }
                                    }
                                  : undefined
                              }
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                <span className="w-7 shrink-0 flex items-center text-left text-[10px] font-semibold text-muted-foreground">
                                  {isWholeMonthExpense(event) ? (
                                    <Repeat
                                      className="size-3.5 shrink-0"
                                      aria-label="Monthly total"
                                    />
                                  ) : (
                                    formatDayForDisplay(event)
                                  )}
                                </span>
                                <span className="min-w-0 truncate text-foreground">
                                  {event.label}
                                </span>
                              </div>
                              <span className="shrink-0 tabular-nums text-foreground">
                                {(() => {
                                  const actual =
                                    monthActuals?.actualExpenseByEventId?.[
                                      event.id
                                    ];
                                  const differs =
                                    actual !== undefined &&
                                    actual !== getExpectedAmountForMonth(event);
                                  if (differs) {
                                    return (
                                      <>
                                        <span className="line-through text-muted-foreground">
                                          {formatCurrency(
                                            getExpectedAmountForMonth(event),
                                          )}
                                        </span>{" "}
                                        {formatCurrency(actual)}
                                      </>
                                    );
                                  }
                                  return formatCurrency(
                                    getExpectedAmountForMonth(event),
                                  );
                                })()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {onAddExpense != null && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-1.5 -ml-1 h-7 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => onAddExpense(slot)}
                          disabled={addExpenseDisabled}
                        >
                          + Add expense
                        </Button>
                      )}
                    </div>
                    <Separator className="my-2" />
                    <p className="mt-auto pt-2 text-sm font-medium text-foreground">
                      Total expenses:{" "}
                      {formatCurrency(totalExpensesExcludingDebt)}
                    </p>
                  </div>
                  {totalDebtRepayment > 0 && (
                    <div className="sm:col-span-2 mt-4 pt-4 border-t border-border">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Debt repayment
                      </h4>
                      <ul className="mt-2 list-none space-y-1">
                        {debtRepaymentEvents.map((event) => (
                          <li
                            key={event.id}
                            className={`flex items-center justify-between gap-2 text-sm min-h-5 ${onEditExpenseEvent ? "cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50" : ""}`}
                            role={onEditExpenseEvent ? "button" : undefined}
                            tabIndex={onEditExpenseEvent ? 0 : undefined}
                            onClick={
                              onEditExpenseEvent
                                ? () => onEditExpenseEvent(event)
                                : undefined
                            }
                            onKeyDown={
                              onEditExpenseEvent
                                ? (e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      onEditExpenseEvent(event);
                                    }
                                  }
                                : undefined
                            }
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-1.5">
                              <span className="w-7 shrink-0 flex items-center text-left text-[10px] font-semibold text-muted-foreground">
                                {isWholeMonthExpense(event) ? (
                                  <Repeat
                                    className="size-3.5 shrink-0"
                                    aria-label="Monthly total"
                                  />
                                ) : (
                                  formatDayForDisplay(event)
                                )}
                              </span>
                              <span className="min-w-0 truncate text-foreground">
                                {event.label}
                              </span>
                            </div>
                            <span className="shrink-0 tabular-nums text-foreground">
                              {(() => {
                                const actual =
                                  monthActuals?.actualExpenseByEventId?.[
                                    event.id
                                  ];
                                const differs =
                                  actual !== undefined &&
                                  actual !== getExpectedAmountForMonth(event);
                                if (differs) {
                                  return (
                                    <>
                                      <span className="line-through text-muted-foreground">
                                        {formatCurrency(
                                          getExpectedAmountForMonth(event),
                                        )}
                                      </span>{" "}
                                      {formatCurrency(actual)}
                                    </>
                                  );
                                }
                                return formatCurrency(
                                  getExpectedAmountForMonth(event),
                                );
                              })()}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        Total debt repayment:{" "}
                        {formatCurrency(totalDebtRepayment)}
                      </p>
                    </div>
                  )}
                  {totalPreTaxSavings > 0 && (
                    <div className="sm:col-span-2 mt-4 pt-4 border-t border-border">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Pre-tax savings
                      </h4>
                      <ul className="mt-2 list-none space-y-1">
                        {sortedPreTaxSavingsItems.map((item, idx) => (
                          <li
                            key={`${item.day}-${item.label}-${idx}`}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-1.5">
                              <span className="w-7 shrink-0 text-left text-[10px] font-semibold text-muted-foreground">
                                {formatDayOrdinal(item.day)}
                              </span>
                              <span className="min-w-0 truncate text-foreground">
                                {item.label}
                              </span>
                            </div>
                            <span className="shrink-0 tabular-nums text-foreground">
                              {formatCurrency(item.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 pt-2 text-sm font-medium text-foreground">
                        Total pre-tax savings:{" "}
                        {formatCurrency(totalPreTaxSavings)}
                      </p>
                    </div>
                  )}
                </CardContent>
                <Separator className="my-4" />
                <CardFooter className="flex flex-wrap items-center justify-between gap-2 pt-0 px-0">
                  <span className="text-sm font-semibold text-foreground">
                    {net >= 0 ? "Net profit" : "Net loss"}
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className={`tabular-nums font-semibold ${
                        net > 0
                          ? "text-emerald-600"
                          : net < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {formatCurrency(net)}
                    </span>
                  </span>
                </CardFooter>
              </Card>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={actualsDialogSlot !== null}
        onOpenChange={(open) => !open && closeActualsDialog()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Enter actuals:{" "}
              {actualsDialogSlot
                ? formatMonthLabel(actualsDialogSlot.slot)
                : ""}
            </DialogTitle>
          </DialogHeader>
          {actualsDialogSlot && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Income: enter actual amount for each
                </h4>
                {(() => {
                  const incomeEvents = sortEventsByDayThenAmount(
                    getEventsForMonth(actualsDialogSlot.slotIndex),
                  );
                  if (incomeEvents.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        No expected income
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {incomeEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex flex-wrap items-center gap-2 sm:gap-3"
                        >
                          <div className="min-w-0 flex-1 basis-48">
                            <span className="text-sm inline-flex items-center gap-1.5">
                              {isWholeMonthExpense(event) ? (
                                <Repeat
                                  className="size-3.5 shrink-0"
                                  aria-label="Monthly total"
                                />
                              ) : (
                                formatDayForDisplay(event)
                              )}
                              {event.label}
                            </span>
                            <span className="ml-1 text-sm text-muted-foreground tabular-nums">
                              (expected:{" "}
                              {formatCurrency(getExpectedAmountForMonth(event))}
                              )
                            </span>
                          </div>
                          <div className="w-full sm:w-28 shrink-0">
                            <CurrencyInput
                              id={`actual-income-${event.id}`}
                              value={actualInputsByEventId[event.id] ?? ""}
                              onChange={(v) => setActualInput(event.id, v)}
                              min={0}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Expenses: enter actual amount for each
                </h4>
                {(() => {
                  const expenseEvents = sortEventsByDayThenAmount(
                    getExpenseEventsForMonth(actualsDialogSlot.slotIndex),
                  );
                  if (expenseEvents.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        No expected expenses
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {expenseEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex flex-wrap items-center gap-2 sm:gap-3"
                        >
                          <div className="min-w-0 flex-1 basis-48">
                            <span className="text-sm inline-flex items-center gap-1.5">
                              {isWholeMonthExpense(event) ? (
                                <Repeat
                                  className="size-3.5 shrink-0"
                                  aria-label="Monthly total"
                                />
                              ) : (
                                formatDayForDisplay(event)
                              )}
                              {event.label}
                            </span>
                            <span className="ml-1 text-sm text-muted-foreground tabular-nums">
                              (expected:{" "}
                              {formatCurrency(getExpectedAmountForMonth(event))}
                              )
                            </span>
                          </div>
                          <div className="w-full sm:w-28 shrink-0">
                            <CurrencyInput
                              id={`actual-expense-${event.id}`}
                              value={actualInputsByEventId[event.id] ?? ""}
                              onChange={(v) => setActualInput(event.id, v)}
                              min={0}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeActualsDialog}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveActuals}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
