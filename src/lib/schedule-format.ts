import type {
  IncomeEventSchedule,
  ExpenseEventSchedule,
  IncomeEvent,
  ExpenseEvent,
} from "@/store/budget";

function ordinalSuffix(n: number): string {
  return n === 1 || n === 21 || n === 31
    ? "st"
    : n === 2 || n === 22
      ? "nd"
      : n === 3 || n === 23
        ? "rd"
        : "th";
}

/** Format a day number (1–31) as ordinal, e.g. 11 → "11th", 25 → "25th". */
export function formatDayOrdinal(day: number): string {
  return `${day}${ordinalSuffix(day)}`;
}

export function formatIncomeSchedule(schedule: IncomeEventSchedule): string {
  if (schedule.type === "one-time") {
    try {
      return new Date(schedule.date + "Z").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return schedule.date;
    }
  }
  const n = schedule.dayOfMonth;
  let result = `${n}${ordinalSuffix(n)} of each month`;
  if (schedule.startDate) {
    try {
      const formatted = new Date(schedule.startDate + "Z").toLocaleDateString(
        undefined,
        {
          month: "short",
          year: "numeric",
        },
      );
      result = `${result} from ${formatted}`;
    } catch {
      result = `${result} from ${schedule.startDate}`;
    }
  }
  if (schedule.endDate) {
    try {
      const formatted = new Date(schedule.endDate + "Z").toLocaleDateString(
        undefined,
        {
          month: "short",
          year: "numeric",
        },
      );
      result = `${result} until ${formatted}`;
    } catch {
      result = `${result} until ${schedule.endDate}`;
    }
  }
  return result;
}

/** Day of month used for ordering: one-time from date, recurring from dayOfMonth. */
export function getDayForSort(event: IncomeEvent | ExpenseEvent): number {
  return event.schedule.type === "one-time"
    ? new Date(event.schedule.date + "Z").getDate()
    : event.schedule.dayOfMonth;
}

/** Sort by day of month (earliest first), then by amount (largest first). */
export function sortEventsByDayThenAmount<T extends IncomeEvent | ExpenseEvent>(
  events: T[],
): T[] {
  return [...events].sort((a, b) => {
    const dayA = getDayForSort(a);
    const dayB = getDayForSort(b);
    if (dayA !== dayB) return dayA - dayB;
    return b.amount - a.amount;
  });
}

export function formatExpenseSchedule(schedule: ExpenseEventSchedule): string {
  if (schedule.type === "one-time") {
    try {
      return new Date(schedule.date + "Z").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return schedule.date;
    }
  }
  const n = schedule.dayOfMonth;
  let result = `${n}${ordinalSuffix(n)} of each month`;
  if (schedule.startDate) {
    try {
      const formatted = new Date(schedule.startDate + "Z").toLocaleDateString(
        undefined,
        {
          month: "short",
          year: "numeric",
        },
      );
      result = `${result} from ${formatted}`;
    } catch {
      result = `${result} from ${schedule.startDate}`;
    }
  }
  if (schedule.endDate) {
    try {
      const formatted = new Date(schedule.endDate + "Z").toLocaleDateString(
        undefined,
        {
          month: "short",
          year: "numeric",
        },
      );
      result = `${result} until ${formatted}`;
    } catch {
      result = `${result} until ${schedule.endDate}`;
    }
  }
  return result;
}
