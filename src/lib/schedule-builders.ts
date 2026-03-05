import type { IncomeEventSchedule, ExpenseEventSchedule } from "@/store/budget";
import { DAY_OF_MONTH_MIN, DAY_OF_MONTH_MAX } from "@/lib/constants";

/** Default recurring date range for current year (YYYY-MM format). */
export function getDefaultRecurringYearRange(): { jan: string; dec: string } {
  const year = new Date().getFullYear();
  return {
    jan: `${year}-01`,
    dec: `${year}-12`,
  };
}

/** Shared schedule shape used by both income and expense events. */
type EventSchedule =
  | { type: "one-time"; date: string }
  | {
      type: "recurring";
      daysOfMonth: number[];
      startDate?: string;
      endDate?: string;
    };

/** Parse days of month from form input. Accepts "1", "1, 15, 23", "1 15 23". Returns sorted, deduplicated array or null if invalid. */
function parseDaysOfMonthInput(input: string): number[] | null {
  const parts = input
    .split(/[,/\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  const days = [...new Set(parts)].filter(
    (d) => d >= DAY_OF_MONTH_MIN && d <= DAY_OF_MONTH_MAX,
  );
  if (days.length === 0) return null;
  return days.sort((a, b) => a - b);
}

/** Build schedule from add/edit form values. Returns null if invalid. */
function buildScheduleFromForm(
  type: "one-time" | "recurring",
  date: string,
  daysOfMonthInput: string,
  recurringStartDate?: string,
  recurringEndDate?: string,
): EventSchedule | null {
  if (type === "one-time") {
    if (!date.trim()) return null;
    return { type: "one-time", date: date.trim() };
  }
  const days = parseDaysOfMonthInput(daysOfMonthInput);
  if (!days) return null;
  const start = recurringStartDate?.trim();
  const end = recurringEndDate?.trim();
  return {
    type: "recurring",
    daysOfMonth: days,
    ...(start && { startDate: start }),
    ...(end && { endDate: end }),
  };
}

/** Build IncomeEventSchedule from add/edit form values. Returns null if invalid. */
export function buildIncomeScheduleFromForm(
  ...args: Parameters<typeof buildScheduleFromForm>
): IncomeEventSchedule | null {
  return buildScheduleFromForm(...args) as IncomeEventSchedule | null;
}

export type ExpenseScheduleFormType = "one-time" | "recurring" | "whole-month";

/** Build ExpenseEventSchedule from add/edit form values. Returns null if invalid. */
export function buildExpenseScheduleFromForm(
  type: ExpenseScheduleFormType,
  date: string,
  daysOfMonthInput: string,
  recurringStartDate?: string,
  recurringEndDate?: string,
): ExpenseEventSchedule | null {
  if (type === "whole-month") {
    const start = recurringStartDate?.trim();
    const end = recurringEndDate?.trim();
    return {
      type: "whole-month",
      ...(start && { startDate: start }),
      ...(end && { endDate: end }),
    };
  }
  return buildScheduleFromForm(
    type as "one-time" | "recurring",
    date,
    daysOfMonthInput,
    recurringStartDate,
    recurringEndDate,
  ) as ExpenseEventSchedule | null;
}
