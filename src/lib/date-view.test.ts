import { describe, expect, it } from "vitest";
import {
  getTodayIsoDate,
  slotToIsoDate,
  formatMonthLabel,
  getMonthsForViewMode,
} from "./date-view";

describe("getTodayIsoDate", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = getTodayIsoDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("slotToIsoDate", () => {
  it("returns first day of month as YYYY-MM-DD", () => {
    expect(slotToIsoDate({ year: 2026, monthIndex: 0 })).toBe("2026-01-01");
    expect(slotToIsoDate({ year: 2025, monthIndex: 11 })).toBe("2025-12-01");
  });
});

describe("formatMonthLabel", () => {
  it("formats slot as month name and year", () => {
    expect(formatMonthLabel({ year: 2026, monthIndex: 0 })).toBe(
      "January 2026",
    );
  });
});

describe("getMonthsForViewMode", () => {
  it("returns 12 months for current-year", () => {
    const months = getMonthsForViewMode("current-year");
    expect(months).toHaveLength(12);
    expect(months[0].monthIndex).toBe(0);
  });
});
