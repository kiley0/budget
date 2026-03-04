import type { IncomeEventSchedule, ExpenseEventSchedule } from "@/store/budget";

export type EventSchedule = IncomeEventSchedule | ExpenseEventSchedule;

export interface EventWithSchedule<T> {
  schedule: EventSchedule;
  [key: string]: unknown;
  __brand?: T;
}

/** Minimal shape for events that can be filtered by month. */
export interface HasSchedule {
  schedule: EventSchedule;
}

/**
 * Parse "YYYY-MM" or "YYYY-M" to [year, month]. Returns [NaN, NaN] for invalid input.
 */
export function parseMonthFromDateString(dateStr: string): [number, number] {
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 2) return [Number.NaN, Number.NaN];
  const [y, m] = parts;
  return [y, m];
}

/**
 * Check if a one-time event with the given date falls in the specified (year, month).
 * month is 1-12.
 */
export function isOneTimeEventInMonth(
  dateStr: string,
  year: number,
  month: number,
): boolean {
  const [y, m] = parseMonthFromDateString(dateStr);
  return y === year && m === month;
}

/**
 * Check if a recurring event is active in the given (year, month).
 * Considers startDate and endDate boundaries. month is 1-12.
 */
export function isRecurringEventInMonth(
  schedule: { startDate?: string; endDate?: string },
  year: number,
  month: number,
): boolean {
  if (schedule.startDate) {
    const [y, m] = parseMonthFromDateString(schedule.startDate);
    if (!Number.isNaN(y) && !Number.isNaN(m)) {
      if (year < y) return false;
      if (year === y && month < m) return false;
    }
  }
  if (schedule.endDate) {
    const [y, m] = parseMonthFromDateString(schedule.endDate);
    if (!Number.isNaN(y) && !Number.isNaN(m)) {
      if (year > y) return false;
      if (year === y && month > m) return false;
    }
  }
  return true;
}

/**
 * Filter events that fall in the given (year, month).
 * One-time: exact date match. Recurring: within start/end range.
 */
export function filterEventsForMonth<T extends HasSchedule>(
  events: T[],
  year: number,
  month: number,
): T[] {
  return events.filter((event) => {
    if (event.schedule.type === "one-time") {
      return isOneTimeEventInMonth(event.schedule.date, year, month);
    }
    return isRecurringEventInMonth(event.schedule, year, month);
  });
}
