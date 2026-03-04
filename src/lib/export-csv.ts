import type {
  BudgetState,
  IncomeEvent,
  ExpenseEvent,
  IncomeEventSchedule,
  ExpenseEventSchedule,
} from "@/store/budget";
import { getIncomeTypeLabel, getExpenseCategoryLabel } from "@/lib/constants";

function escapeCsvField(value: string): string {
  const s = String(value ?? "");
  if (
    s.includes('"') ||
    s.includes(",") ||
    s.includes("\n") ||
    s.includes("\r")
  ) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Get all transaction dates for a schedule within the given year. */
function getDatesForSchedule(
  schedule: IncomeEventSchedule | ExpenseEventSchedule,
  year: number,
): string[] {
  if (schedule.type === "one-time") {
    const dateStr = schedule.date.slice(0, 10);
    const [y] = schedule.date.split("-").map(Number);
    return y === year ? [dateStr] : [];
  }
  if (schedule.type === "whole-month") {
    const { startDate, endDate } = schedule;
    const dates: string[] = [];
    for (let month = 1; month <= 12; month++) {
      if (startDate) {
        const [sy, sm] = startDate.split("-").map(Number);
        if (year < sy || (year === sy && month < sm)) continue;
      }
      if (endDate) {
        const [ey, em] = endDate.split("-").map(Number);
        if (year > ey || (year === ey && month > em)) continue;
      }
      dates.push(`${year}-${String(month).padStart(2, "0")}-01`);
    }
    return dates;
  }
  const { daysOfMonth, startDate, endDate } = schedule;
  const dates: string[] = [];
  for (let month = 1; month <= 12; month++) {
    if (startDate) {
      const [sy, sm] = startDate.split("-").map(Number);
      if (year < sy || (year === sy && month < sm)) continue;
    }
    if (endDate) {
      const [ey, em] = endDate.split("-").map(Number);
      if (year > ey || (year === ey && month > em)) continue;
    }
    const lastDay = new Date(year, month, 0).getDate();
    for (const dayOfMonth of daysOfMonth) {
      const day = Math.min(dayOfMonth, lastDay);
      const date = new Date(year, month - 1, day);
      dates.push(date.toISOString().slice(0, 10));
    }
  }
  return dates;
}

interface TransactionRow {
  date: string;
  income: number | "";
  expense: number | "";
  source: string;
  name: string;
  type?: string;
}

/** Build CSV content: one row per expected transaction. Columns: date, income, expense, name, source. */
export function budgetStateToCsv(
  state: BudgetState,
  year = new Date().getFullYear(),
): string {
  const incomeSourceName = (id: string | undefined) =>
    state.incomeSources.find((s) => s.id === id)?.name ?? "";

  const actualsByMonth = state.actualsByMonth ?? {};
  const rows: TransactionRow[] = [];

  for (const e of state.incomeEvents as IncomeEvent[]) {
    const source = incomeSourceName(e.incomeSourceId);
    const type = getIncomeTypeLabel(e.incomeType);
    for (const date of getDatesForSchedule(e.schedule, year)) {
      const monthKey = date.slice(0, 7); // "YYYY-MM"
      const actual = actualsByMonth[monthKey]?.actualIncomeByEventId?.[e.id];
      const amount = actual !== undefined ? actual : e.amount;
      rows.push({
        date,
        income: amount,
        expense: "",
        source,
        name: e.label,
        type,
      });
    }
  }

  for (const e of state.expenseEvents as ExpenseEvent[]) {
    const source = "";
    const type = getExpenseCategoryLabel(e.category);
    for (const date of getDatesForSchedule(e.schedule, year)) {
      const monthKey = date.slice(0, 7); // "YYYY-MM"
      const actual = actualsByMonth[monthKey]?.actualExpenseByEventId?.[e.id];
      const amount = actual !== undefined ? actual : e.amount;
      rows.push({
        date,
        income: "",
        expense: amount,
        source,
        name: e.label,
        type,
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));

  const headers = ["Date", "Income", "Expense", "Name", "Source", "Type"];
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((r) =>
    [
      r.date,
      r.income === "" ? "" : String(r.income),
      r.expense === "" ? "" : String(r.expense),
      r.name,
      r.source,
      r.type ?? "",
    ]
      .map(escapeCsvField)
      .join(","),
  );
  return [headerLine, ...dataLines].join("\n");
}
