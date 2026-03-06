import type { IncomeEvent, ExpenseEvent } from "./types";
import type { MonthSlot } from "./date-view";
import { getMonthKey } from "./types";
import { filterEventsForMonth } from "./event-month-filter";
import {
  SAVINGS_CATEGORY,
  DEBT_REPAYMENT_CATEGORY,
  PAYCHECK_WITHHOLDINGS,
  STOCK_INCOME_TYPES,
} from "@/lib/constants";

export interface PaycheckBreakdown {
  grossAmount: number;
  withholdings: { label: string; amount: number }[];
}

export interface StockBreakdown {
  grossAmount: number;
  taxesWithheld: number;
  netAmount: number;
  /** Total shares across all occurrences (for display: price = grossAmount / shares) */
  shares: number;
}

export interface YearlySummaryRow {
  label: string;
  sublabel?: string;
  amount: number;
  isRecurring: boolean;
  date?: string;
  /** Event ID for income rows. */
  eventId?: string;
  /** Paycheck breakdown when income type is paycheck. */
  paycheckBreakdown?: PaycheckBreakdown;
  /** Stock/RSU breakdown when income type is stock_sale_proceeds or rsu_vesting. */
  stockBreakdown?: StockBreakdown;
}

export interface YearlySummaryData {
  incomeRows: YearlySummaryRow[];
  expenseRows: YearlySummaryRow[];
  savingsRows: YearlySummaryRow[];
  debtRepaymentRows: YearlySummaryRow[];
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalDebtRepayment: number;
}

/** Build P&L table rows for the yearly summary. Uses actuals when available. */
export function buildYearlySummaryData(
  incomeEvents: IncomeEvent[],
  expenseEvents: ExpenseEvent[],
  months: MonthSlot[],
  actualsByMonth: Record<
    string,
    {
      actualIncomeByEventId?: Record<string, number>;
      actualExpenseByEventId?: Record<string, number>;
    }
  > = {},
): YearlySummaryData {
  const recurringIncomeMap = new Map<
    string,
    { label: string; sublabel?: string; sum: number }
  >();
  const oneTimeIncomeRows: YearlySummaryRow[] = [];
  const recurringExpenseMap = new Map<
    string,
    { label: string; sublabel?: string; sum: number }
  >();
  const oneTimeExpenseRows: YearlySummaryRow[] = [];
  const preTaxSavingsByType = new Map<string, number>();
  const recurringSavingsMap = new Map<
    string,
    { label: string; sublabel?: string; sum: number }
  >();
  const oneTimeSavingsRows: YearlySummaryRow[] = [];
  const recurringDebtMap = new Map<
    string,
    { label: string; sublabel?: string; sum: number }
  >();
  const oneTimeDebtRows: YearlySummaryRow[] = [];
  const paycheckBreakdownByEventId = new Map<
    string,
    { grossSum: number; withholdingsByLabel: Map<string, number> }
  >();
  const stockBreakdownByEventId = new Map<
    string,
    { grossSum: number; taxesSum: number; netSum: number; sharesSum: number }
  >();

  for (let i = 0; i < months.length; i++) {
    const slot = months[i]!;
    const { year, monthIndex } = slot;
    const month = monthIndex + 1;
    const monthKey = getMonthKey(year, monthIndex);
    const actuals = actualsByMonth[monthKey];

    const incomeForMonth = filterEventsForMonth(incomeEvents, year, month);

    for (const e of incomeForMonth) {
      const baseAmount = actuals?.actualIncomeByEventId?.[e.id] ?? undefined;
      const amount =
        baseAmount !== undefined
          ? baseAmount
          : e.schedule.type === "recurring"
            ? e.amount * e.schedule.daysOfMonth.length
            : e.amount;
      if (e.schedule.type === "recurring") {
        const existing = recurringIncomeMap.get(e.id);
        if (existing) {
          existing.sum += amount;
        } else {
          recurringIncomeMap.set(e.id, {
            label: e.label,
            sum: amount,
          });
        }
      } else {
        const row: YearlySummaryRow = {
          label: e.label,
          date: e.schedule.date.slice(0, 10),
          amount,
          isRecurring: false,
        };
        if (e.paycheckDetails) row.eventId = e.id;
        if (
          e.stockSaleDetails &&
          e.incomeType &&
          (STOCK_INCOME_TYPES as readonly string[]).includes(e.incomeType)
        ) {
          row.eventId = e.id;
        }
        oneTimeIncomeRows.push(row);
      }
      if (
        e.stockSaleDetails &&
        e.incomeType &&
        (STOCK_INCOME_TYPES as readonly string[]).includes(e.incomeType)
      ) {
        const net = amount;
        const rate = e.stockSaleDetails.taxRate ?? 0;
        const gross = rate > 0 && rate < 100 ? net / (1 - rate / 100) : net;
        const taxes = gross - net;
        const shares = e.stockSaleDetails.shares ?? 0;
        let sb = stockBreakdownByEventId.get(e.id);
        if (!sb) {
          sb = { grossSum: 0, taxesSum: 0, netSum: 0, sharesSum: 0 };
          stockBreakdownByEventId.set(e.id, sb);
        }
        sb.grossSum += gross;
        sb.taxesSum += taxes;
        sb.netSum += net;
        sb.sharesSum += shares;
      }
      const w = e.paycheckDetails?.withholdings;
      const gross = e.paycheckDetails?.grossAmount;
      const occMult =
        e.schedule.type === "recurring" ? e.schedule.daysOfMonth.length : 1;
      if (w || (gross ?? 0) > 0) {
        const add = (key: string, val: number | undefined) => {
          if ((val ?? 0) > 0) {
            const prev = preTaxSavingsByType.get(key) ?? 0;
            preTaxSavingsByType.set(key, prev + (val ?? 0) * occMult);
          }
        };
        add("401(k) / Retirement", w?.retirement401k);
        add("HSA", w?.hsa);
        add("FSA", w?.fsa);
        let pb = paycheckBreakdownByEventId.get(e.id);
        if (!pb) {
          pb = { grossSum: 0, withholdingsByLabel: new Map() };
          paycheckBreakdownByEventId.set(e.id, pb);
        }
        pb.grossSum += (gross ?? 0) * occMult;
        for (const { key, label } of PAYCHECK_WITHHOLDINGS) {
          const val = (w as Record<string, number | undefined>)?.[key];
          if ((val ?? 0) > 0) {
            pb.withholdingsByLabel.set(
              label,
              (pb.withholdingsByLabel.get(label) ?? 0) + (val ?? 0) * occMult,
            );
          }
        }
      }
    }
  }

  for (const row of oneTimeIncomeRows) {
    if (row.eventId) {
      const pb = paycheckBreakdownByEventId.get(row.eventId);
      if (pb) {
        row.paycheckBreakdown = {
          grossAmount: pb.grossSum,
          withholdings: Array.from(pb.withholdingsByLabel.entries())
            .map(([label, amt]) => ({ label, amount: amt }))
            .sort((a, b) => b.amount - a.amount),
        };
      }
      const sb = stockBreakdownByEventId.get(row.eventId);
      if (sb) {
        row.stockBreakdown = {
          grossAmount: sb.grossSum,
          taxesWithheld: sb.taxesSum,
          netAmount: sb.netSum,
          shares: sb.sharesSum,
        };
      }
    }
  }

  for (let i = 0; i < months.length; i++) {
    const slot = months[i]!;
    const { year, monthIndex } = slot;
    const month = monthIndex + 1;
    const monthKey = getMonthKey(year, monthIndex);
    const actuals = actualsByMonth[monthKey];
    const expenseForMonth = filterEventsForMonth(expenseEvents, year, month);

    for (const e of expenseForMonth) {
      const actualAmount = actuals?.actualExpenseByEventId?.[e.id];
      const amount =
        actualAmount !== undefined
          ? actualAmount
          : e.schedule.type === "recurring"
            ? e.amount * e.schedule.daysOfMonth.length
            : e.schedule.type === "whole-month"
              ? e.amount
              : e.amount;
      if (
        e.category !== DEBT_REPAYMENT_CATEGORY &&
        e.category !== SAVINGS_CATEGORY
      ) {
        if (
          e.schedule.type === "recurring" ||
          e.schedule.type === "whole-month"
        ) {
          const existing = recurringExpenseMap.get(e.id);
          if (existing) {
            existing.sum += amount;
          } else {
            recurringExpenseMap.set(e.id, {
              label: e.label,
              sum: amount,
            });
          }
        } else {
          oneTimeExpenseRows.push({
            label: e.label,
            date: e.schedule.date.slice(0, 10),
            amount,
            isRecurring: false,
          });
        }
      }
      if (e.category === SAVINGS_CATEGORY) {
        const savingsActual = actuals?.actualExpenseByEventId?.[e.id];
        const savingsAmount =
          savingsActual !== undefined
            ? savingsActual
            : e.schedule.type === "recurring"
              ? e.amount * e.schedule.daysOfMonth.length
              : e.schedule.type === "whole-month"
                ? e.amount
                : e.amount;
        if (
          e.schedule.type === "recurring" ||
          e.schedule.type === "whole-month"
        ) {
          const existing = recurringSavingsMap.get(e.id);
          if (existing) {
            existing.sum += savingsAmount;
          } else {
            recurringSavingsMap.set(e.id, {
              label: e.label,
              sum: savingsAmount,
            });
          }
        } else {
          oneTimeSavingsRows.push({
            label: e.label,
            date: e.schedule.date.slice(0, 10),
            amount: savingsAmount,
            isRecurring: false,
          });
        }
      }
      if (e.category === DEBT_REPAYMENT_CATEGORY) {
        const debtActual = actuals?.actualExpenseByEventId?.[e.id];
        const debtAmount =
          debtActual !== undefined
            ? debtActual
            : e.schedule.type === "recurring"
              ? e.amount * e.schedule.daysOfMonth.length
              : e.schedule.type === "whole-month"
                ? e.amount
                : e.amount;
        if (
          e.schedule.type === "recurring" ||
          e.schedule.type === "whole-month"
        ) {
          const existing = recurringDebtMap.get(e.id);
          if (existing) {
            existing.sum += debtAmount;
          } else {
            recurringDebtMap.set(e.id, {
              label: e.label,
              sum: debtAmount,
            });
          }
        } else {
          oneTimeDebtRows.push({
            label: e.label,
            date: e.schedule.date.slice(0, 10),
            amount: debtAmount,
            isRecurring: false,
          });
        }
      }
    }
  }

  const preTaxSavingsRows: YearlySummaryRow[] = Array.from(
    preTaxSavingsByType.entries(),
  )
    .map(([label, amount]) => ({
      label,
      amount,
      isRecurring: true as const,
    }))
    .sort((a, b) => b.amount - a.amount);

  const savingsRows: YearlySummaryRow[] = [
    ...preTaxSavingsRows,
    ...Array.from(recurringSavingsMap.values()).map((v) => ({
      label: v.label,
      sublabel: v.sublabel,
      amount: v.sum,
      isRecurring: true as const,
    })),
    ...oneTimeSavingsRows,
  ].sort((a, b) => b.amount - a.amount);

  const recurringIncomeRows: YearlySummaryRow[] = Array.from(
    recurringIncomeMap.entries(),
  ).map(([eventId, v]) => {
    const row: YearlySummaryRow = {
      label: v.label,
      sublabel: v.sublabel,
      amount: v.sum,
      isRecurring: true as const,
    };
    const pb = paycheckBreakdownByEventId.get(eventId);
    if (pb) {
      row.eventId = eventId;
      row.paycheckBreakdown = {
        grossAmount: pb.grossSum,
        withholdings: Array.from(pb.withholdingsByLabel.entries())
          .map(([label, amt]) => ({ label, amount: amt }))
          .sort((a, b) => b.amount - a.amount),
      };
    }
    const sb = stockBreakdownByEventId.get(eventId);
    if (sb) {
      row.eventId = eventId;
      row.stockBreakdown = {
        grossAmount: sb.grossSum,
        taxesWithheld: sb.taxesSum,
        netAmount: sb.netSum,
        shares: sb.sharesSum,
      };
    }
    return row;
  });
  const incomeRows: YearlySummaryRow[] = [
    ...recurringIncomeRows,
    ...oneTimeIncomeRows,
  ].sort((a, b) => b.amount - a.amount);

  const expenseRows: YearlySummaryRow[] = [
    ...Array.from(recurringExpenseMap.values()).map((v) => ({
      label: v.label,
      sublabel: v.sublabel,
      amount: v.sum,
      isRecurring: true as const,
    })),
    ...oneTimeExpenseRows,
  ].sort((a, b) => b.amount - a.amount);

  const debtRepaymentRows: YearlySummaryRow[] = [
    ...Array.from(recurringDebtMap.values()).map((v) => ({
      label: v.label,
      sublabel: v.sublabel,
      amount: v.sum,
      isRecurring: true as const,
    })),
    ...oneTimeDebtRows,
  ].sort((a, b) => b.amount - a.amount);

  const totalIncome = incomeRows.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenseRows.reduce((s, r) => s + r.amount, 0);
  const totalSavings = savingsRows.reduce((s, r) => s + r.amount, 0);
  const totalDebtRepayment = debtRepaymentRows.reduce(
    (s, r) => s + r.amount,
    0,
  );

  return {
    incomeRows,
    expenseRows,
    savingsRows,
    debtRepaymentRows,
    totalIncome,
    totalExpenses,
    totalSavings,
    totalDebtRepayment,
  };
}
