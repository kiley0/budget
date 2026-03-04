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
  const days = schedule.daysOfMonth;
  const dayStr =
    days.length === 1
      ? `${days[0]}${ordinalSuffix(days[0]!)}`
      : days.map((d) => `${d}${ordinalSuffix(d)}`).join(", ");
  let result = `${dayStr} of each month`;
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

/** Day of month used for ordering: one-time from date, recurring from first day, whole-month first (0). */
export function getDayForSort(event: IncomeEvent | ExpenseEvent): number {
  const s = event.schedule;
  if (s.type === "one-time") return parseDayFromDateString(s.date);
  if (s.type === "whole-month") return 0;
  return s.daysOfMonth[0] ?? 1;
}

/** Day label for display: "Monthly" for whole-month, else ordinal(s) like "15th" or "1st, 15th, 23rd". */
export function formatDayForDisplay(event: IncomeEvent | ExpenseEvent): string {
  const s = event.schedule as { type: string; daysOfMonth?: number[] };
  if (s.type === "whole-month") return "Monthly";
  const days = s.daysOfMonth ?? [getDayForSort(event)];
  if (days.length === 1) return formatDayOrdinal(days[0]!);
  return days.map(formatDayOrdinal).join(", ");
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
  if (schedule.type === "whole-month") {
    let result = "Total for the month";
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
  const days = schedule.daysOfMonth;
  const dayStr =
    days.length === 1
      ? `${days[0]}${ordinalSuffix(days[0]!)}`
      : days.map((d) => `${d}${ordinalSuffix(d)}`).join(", ");
  let result = `${dayStr} of each month`;
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
