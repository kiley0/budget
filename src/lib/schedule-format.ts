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
      const d = parseLocalDate(schedule.date);
      if (Number.isNaN(d.getTime())) return schedule.date;
      return d.toLocaleDateString(undefined, {
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
      const d = parseLocalDate(schedule.startDate);
      if (!Number.isNaN(d.getTime())) {
        result = `${result} from ${d.toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        })}`;
      } else {
        result = `${result} from ${schedule.startDate}`;
      }
    } catch {
      result = `${result} from ${schedule.startDate}`;
    }
  }
  if (schedule.endDate) {
    try {
      const d = parseLocalDate(schedule.endDate);
      if (!Number.isNaN(d.getTime())) {
        result = `${result} until ${d.toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        })}`;
      } else {
        result = `${result} until ${schedule.endDate}`;
      }
    } catch {
      result = `${result} until ${schedule.endDate}`;
    }
  }
  return result;
}

/**
 * Parse day of month (1–31) from YYYY-MM-DD string. Avoids timezone issues:
 * new Date("2026-08-07Z") is midnight UTC, which can be the previous calendar
 * day in timezones behind UTC (e.g. PST shows Aug 6).
 */
function parseDayFromDateString(dateStr: string): number {
  const parts = dateStr.slice(0, 10).split("-").map(Number);
  const day = parts[2];
  if (Number.isNaN(day)) return 1;
  return Math.max(1, Math.min(31, day));
}

/**
 * Parse YYYY-MM-DD or YYYY-MM and create a local Date for formatting. Avoids
 * timezone shift when displaying date-only values. For YYYY-MM, uses day 1.
 */
function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.slice(0, 10).split("-").map(Number);
  const y = parts[0],
    m = parts[1],
    d = parts[2] ?? 1;
  if (Number.isNaN(y) || Number.isNaN(m)) return new Date(NaN);
  return new Date(y, m - 1, d);
}

/** Day of month used for ordering: one-time from date, recurring from dayOfMonth. */
export function getDayForSort(event: IncomeEvent | ExpenseEvent): number {
  return event.schedule.type === "one-time"
    ? parseDayFromDateString(event.schedule.date)
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
      const d = parseLocalDate(schedule.date);
      if (Number.isNaN(d.getTime())) return schedule.date;
      return d.toLocaleDateString(undefined, {
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
      const d = parseLocalDate(schedule.startDate);
      if (!Number.isNaN(d.getTime())) {
        result = `${result} from ${d.toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        })}`;
      } else {
        result = `${result} from ${schedule.startDate}`;
      }
    } catch {
      result = `${result} from ${schedule.startDate}`;
    }
  }
  if (schedule.endDate) {
    try {
      const d = parseLocalDate(schedule.endDate);
      if (!Number.isNaN(d.getTime())) {
        result = `${result} until ${d.toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        })}`;
      } else {
        result = `${result} until ${schedule.endDate}`;
      }
    } catch {
      result = `${result} until ${schedule.endDate}`;
    }
  }
  return result;
}
