/**
 * Date view mode for the budget page: which 12 months to display.
 * - current-year: Jan–Dec of the current year
 * - next-12-months: current month through 11 months ahead (e.g. Mar 2026 – Feb 2027)
 * - next-year: Jan–Dec of the next year
 */
export type DateViewMode = "current-year" | "next-12-months" | "next-year";

export interface MonthSlot {
  year: number;
  monthIndex: number; // 0–11
}

const now = new Date();
const currentYear = now.getFullYear();
const currentMonthIndex = now.getMonth();

/** Returns the 12 months to display for the given view mode. */
export function getMonthsForViewMode(mode: DateViewMode): MonthSlot[] {
  if (mode === "current-year") {
    return Array.from({ length: 12 }, (_, i) => ({
      year: currentYear,
      monthIndex: i,
    }));
  }
  if (mode === "next-year") {
    return Array.from({ length: 12 }, (_, i) => ({
      year: currentYear + 1,
      monthIndex: i,
    }));
  }
  // next-12-months: start at current month, then next 11
  return Array.from({ length: 12 }, (_, i) => {
    const totalMonths = currentYear * 12 + currentMonthIndex + i;
    const year = Math.floor(totalMonths / 12);
    const monthIndex = totalMonths % 12;
    return { year, monthIndex };
  });
}

/** Human-readable label for the period (for headings and summary). */
export function getPeriodLabel(mode: DateViewMode): string {
  if (mode === "current-year") return String(currentYear);
  if (mode === "next-year") return String(currentYear + 1);
  // next-12-months: e.g. "Mar 2026 – Feb 2027"
  const start = new Date(currentYear, currentMonthIndex, 1);
  const end = new Date(currentYear, currentMonthIndex + 11, 1);
  const startStr = start.toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });
  const endStr = end.toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });
  return `${startStr} – ${endStr}`;
}

export const DATE_VIEW_MODE_LABELS: Record<DateViewMode, string> = {
  "current-year": "Current year (Jan–Dec)",
  "next-12-months": "Next 12 months",
  "next-year": "Next year (Jan–Dec)",
};
