import type { IncomeEvent, ExpenseEvent, PaycheckWithholdings } from "./types";
import { PAYCHECK_WITHHOLDINGS } from "@/lib/constants";

export interface IncomeEventFormState {
  label: string;
  amount: string;
  incomeType: string;
  stockSymbol: string;
  shares: string;
  taxRate: string;
  paycheckGross: string;
  paycheckWithholdings: Record<string, string>;
  scheduleType: "one-time" | "recurring";
  date: string;
  dayOfMonth: string;
  recurringStartDate: string;
  recurringEndDate: string;
}

export interface ExpenseEventFormState {
  label: string;
  amount: string;
  category: string;
  scheduleType: "one-time" | "recurring" | "whole-month";
  date: string;
  dayOfMonth: string;
  recurringStartDate: string;
  recurringEndDate: string;
}

/** Map IncomeEvent to form state for edit dialog. */
export function incomeEventToFormState(
  event: IncomeEvent,
): IncomeEventFormState {
  const inferredType =
    event.incomeType ??
    (event.paycheckDetails ? "paycheck" : null) ??
    (event.stockSaleDetails ? "stock_sale_proceeds" : null) ??
    "";
  const pd = event.paycheckDetails?.withholdings;
  const paycheckWithholdings = pd
    ? Object.fromEntries(
        PAYCHECK_WITHHOLDINGS.map(({ key }) => {
          const v = pd[key as keyof PaycheckWithholdings];
          return [key, v != null ? String(v) : ""];
        }),
      )
    : {};
  return {
    label: event.label,
    amount: String(event.amount),
    incomeType: inferredType,
    stockSymbol: event.stockSaleDetails?.symbol ?? "",
    shares: event.stockSaleDetails?.shares
      ? String(event.stockSaleDetails.shares)
      : "",
    taxRate:
      event.stockSaleDetails?.taxRate != null
        ? String(event.stockSaleDetails.taxRate)
        : "",
    paycheckGross: event.paycheckDetails
      ? String(event.paycheckDetails.grossAmount)
      : "",
    paycheckWithholdings,
    scheduleType: event.schedule.type,
    date: event.schedule.type === "one-time" ? event.schedule.date : "",
    dayOfMonth:
      event.schedule.type === "recurring"
        ? event.schedule.daysOfMonth.join(", ")
        : "",
    recurringStartDate:
      event.schedule.type === "recurring" && event.schedule.startDate
        ? event.schedule.startDate
        : "",
    recurringEndDate:
      event.schedule.type === "recurring" && event.schedule.endDate
        ? event.schedule.endDate
        : "",
  };
}

/** Map ExpenseEvent to form state for edit dialog. */
export function expenseEventToFormState(
  event: ExpenseEvent,
): ExpenseEventFormState {
  const s = event.schedule;
  const hasStartEnd = s.type === "recurring" || s.type === "whole-month";
  return {
    label: event.label,
    amount: String(event.amount),
    category: event.category ?? "",
    scheduleType: event.schedule.type,
    date: event.schedule.type === "one-time" ? event.schedule.date : "",
    dayOfMonth:
      event.schedule.type === "recurring"
        ? event.schedule.daysOfMonth.join(", ")
        : "",
    recurringStartDate: hasStartEnd && s.startDate ? s.startDate : "",
    recurringEndDate: hasStartEnd && s.endDate ? s.endDate : "",
  };
}
