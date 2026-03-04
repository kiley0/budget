import { useMemo } from "react";
import { useBudgetStore } from "@/store/budget";
import type { IncomeEvent, ExpenseEvent } from "@/store/budget";
import type { MonthSlot } from "@/lib/date-view";
import { filterEventsForMonth } from "@/lib/event-month-filter";
import { SAVINGS_CATEGORY, DEBT_REPAYMENT_CATEGORY } from "@/lib/constants";

export function useBudgetMonthData(months: MonthSlot[]) {
  const incomeEvents = useBudgetStore((s) => s.incomeEvents);
  const expenseEvents = useBudgetStore((s) => s.expenseEvents);

  return useMemo(() => {
    function getEventsForMonth(slotIndex: number): IncomeEvent[] {
      const { year, monthIndex } = months[slotIndex] ?? {
        year: new Date().getFullYear(),
        monthIndex: 0,
      };
      const month = monthIndex + 1;
      return filterEventsForMonth(incomeEvents, year, month);
    }

    function getExpenseEventsForMonth(slotIndex: number): ExpenseEvent[] {
      const { year, monthIndex } = months[slotIndex] ?? {
        year: new Date().getFullYear(),
        monthIndex: 0,
      };
      const month = monthIndex + 1;
      return filterEventsForMonth(expenseEvents, year, month);
    }

    const getYearlyTotalIncome = () =>
      Array.from({ length: months.length }, (_, i) =>
        getEventsForMonth(i).reduce((sum, e) => sum + e.amount, 0),
      ).reduce((a, b) => a + b, 0);

    const getYearlyTotalGrossIncome = () =>
      Array.from({ length: months.length }, (_, i) =>
        getEventsForMonth(i).reduce((sum, e) => {
          const gross =
            e.paycheckDetails != null
              ? e.paycheckDetails.grossAmount
              : e.amount;
          return sum + gross;
        }, 0),
      ).reduce((a, b) => a + b, 0);

    const getYearlyTotalExpenses = () =>
      Array.from({ length: months.length }, (_, i) =>
        getExpenseEventsForMonth(i).reduce((sum, e) => sum + e.amount, 0),
      ).reduce((a, b) => a + b, 0);

    const getYearlyTotalSavings = () => {
      const incomeSavings = Array.from({ length: months.length }, (_, i) =>
        getEventsForMonth(i).reduce((acc, e) => {
          const w = e.paycheckDetails?.withholdings;
          if (!w) return acc;
          return acc + (w.retirement401k ?? 0) + (w.hsa ?? 0) + (w.fsa ?? 0);
        }, 0),
      ).reduce((a, b) => a + b, 0);
      const expenseSavings = Array.from({ length: months.length }, (_, i) =>
        getExpenseEventsForMonth(i)
          .filter((e) => e.category === SAVINGS_CATEGORY)
          .reduce((sum, e) => sum + e.amount, 0),
      ).reduce((a, b) => a + b, 0);
      return incomeSavings + expenseSavings;
    };

    const getYearlyTotalDebtRepayment = () =>
      Array.from({ length: months.length }, (_, i) =>
        getExpenseEventsForMonth(i)
          .filter((e) => e.category === DEBT_REPAYMENT_CATEGORY)
          .reduce((sum, e) => sum + e.amount, 0),
      ).reduce((a, b) => a + b, 0);

    return {
      getEventsForMonth,
      getExpenseEventsForMonth,
      getYearlyTotalIncome,
      getYearlyTotalGrossIncome,
      getYearlyTotalExpenses,
      getYearlyTotalSavings,
      getYearlyTotalDebtRepayment,
    };
  }, [months, incomeEvents, expenseEvents]);
}
