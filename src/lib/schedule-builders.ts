import type { IncomeEventSchedule, ExpenseEventSchedule } from "@/store/budget";
import { DAY_OF_MONTH_MIN, DAY_OF_MONTH_MAX } from "@/lib/constants";

/** Shared schedule shape used by both income and expense events. */
type EventSchedule =
  | { type: "one-time"; date: string }
  | {
      type: "recurring";
      dayOfMonth: number;
      startDate?: string;
      endDate?: string;
    };

/** Build schedule from add/edit form values. Returns null if invalid. */
function buildScheduleFromForm(
  type: "one-time" | "recurring",
  date: string,
  dayOfMonth: string,
  recurringStartDate?: string,
  recurringEndDate?: string,
): EventSchedule | null {
  if (type === "one-time") {
    if (!date.trim()) return null;
    return { type: "one-time", date: date.trim() };
  }
  const day = parseInt(dayOfMonth, 10);
  if (Number.isNaN(day) || day < DAY_OF_MONTH_MIN || day > DAY_OF_MONTH_MAX)
    return null;
  const start = recurringStartDate?.trim();
  const end = recurringEndDate?.trim();
  return {
    type: "recurring",
    dayOfMonth: day,
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

/** Build ExpenseEventSchedule from add/edit form values. Returns null if invalid. */
export function buildExpenseScheduleFromForm(
  ...args: Parameters<typeof buildScheduleFromForm>
): ExpenseEventSchedule | null {
  return buildScheduleFromForm(...args) as ExpenseEventSchedule | null;
}
