import { describe, it, expect } from "vitest";
import {
  formatDayOrdinal,
  formatDayForDisplay,
  formatIncomeSchedule,
  formatExpenseSchedule,
  getDayForSort,
  sortEventsByDayThenAmount,
} from "./schedule-format";
import type { IncomeEvent, ExpenseEvent } from "@/store/budget";

describe("formatDayOrdinal", () => {
  it("formats 1 as 1st, 2 as 2nd, 3 as 3rd", () => {
    expect(formatDayOrdinal(1)).toBe("1st");
    expect(formatDayOrdinal(2)).toBe("2nd");
    expect(formatDayOrdinal(3)).toBe("3rd");
  });
  it("formats 11 as 11th, 21 as 21st", () => {
    expect(formatDayOrdinal(11)).toBe("11th");
    expect(formatDayOrdinal(21)).toBe("21st");
  });
});

describe("formatIncomeSchedule", () => {
  it("formats one-time date", () => {
    const r = formatIncomeSchedule({ type: "one-time", date: "2026-03-15" });
    expect(r).toMatch(/Mar/);
    expect(r).toMatch(/2026/);
    expect(r.length).toBeGreaterThan(5);
  });
  it("formats Aug 7 as day 7, not 6 (timezone-safe)", () => {
    const r = formatIncomeSchedule({ type: "one-time", date: "2026-08-07" });
    expect(r).toMatch(/7/);
    expect(r).not.toMatch(/\s6,/);
  });
  it("formats recurring day of month", () => {
    expect(formatIncomeSchedule({ type: "recurring", daysOfMonth: [11] })).toBe(
      "11th of each month",
    );
  });
  it("formats recurring with startDate/endDate using local date (timezone-safe)", () => {
    const r = formatIncomeSchedule({
      type: "recurring",
      daysOfMonth: [15],
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    });
    expect(r).toMatch(/Jan.*2026/);
    expect(r).toMatch(/Dec.*2026/);
    expect(r).not.toMatch(/Dec.*2025/);
  });
});

describe("formatExpenseSchedule", () => {
  it("formats one-time date", () => {
    const r = formatExpenseSchedule({ type: "one-time", date: "2026-01-02" });
    expect(r).toMatch(/Jan/);
    expect(r).toMatch(/2026/);
  });
  it("formats Aug 7 as day 7, not 6 (timezone-safe)", () => {
    const r = formatExpenseSchedule({ type: "one-time", date: "2026-08-07" });
    expect(r).toMatch(/7/);
    expect(r).not.toMatch(/\s6,/);
  });
  it("formats recurring", () => {
    expect(formatExpenseSchedule({ type: "recurring", daysOfMonth: [1] })).toBe(
      "1st of each month",
    );
  });
  it("formats recurring with multiple days", () => {
    expect(
      formatExpenseSchedule({
        type: "recurring",
        daysOfMonth: [1, 15, 23, 29],
      }),
    ).toBe("1st, 15th, 23rd, 29th of each month");
  });
  it("formats whole-month", () => {
    expect(formatExpenseSchedule({ type: "whole-month" })).toBe(
      "Total for the month",
    );
  });
  it("formats whole-month with startDate and endDate", () => {
    const r = formatExpenseSchedule({
      type: "whole-month",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });
    expect(r).toMatch(/Total for the month/);
    expect(r).toMatch(/Jan.*2025/);
    expect(r).toMatch(/Dec.*2025/);
  });
});

describe("getDayForSort", () => {
  it("returns day from date string for one-time schedule (timezone-safe)", () => {
    const event: IncomeEvent = {
      id: "1",
      label: "Pay",
      amount: 1000,
      schedule: { type: "one-time", date: "2026-03-15" },
    };
    expect(getDayForSort(event)).toBe(15);
  });
  it("returns 7 for Aug 7 regardless of timezone (fixes UTC parse bug)", () => {
    const event: IncomeEvent = {
      id: "1",
      label: "Income",
      amount: 500,
      schedule: { type: "one-time", date: "2026-08-07" },
    };
    expect(getDayForSort(event)).toBe(7);
  });
  it("returns 1 for Jan 1 (timezone-sensitive: UTC midnight is Dec 31 in PST)", () => {
    const event: IncomeEvent = {
      id: "1",
      label: "New Year",
      amount: 100,
      schedule: { type: "one-time", date: "2026-01-01" },
    };
    expect(getDayForSort(event)).toBe(1);
  });
  it("returns 31 for Dec 31 (timezone-sensitive: UTC midnight can roll to next day)", () => {
    const event: IncomeEvent = {
      id: "1",
      label: "Year end",
      amount: 100,
      schedule: { type: "one-time", date: "2026-12-31" },
    };
    expect(getDayForSort(event)).toBe(31);
  });
  it("returns dayOfMonth for recurring schedule", () => {
    const event: ExpenseEvent = {
      id: "1",
      label: "Rent",
      amount: 2000,
      schedule: { type: "recurring", daysOfMonth: [1] },
    };
    expect(getDayForSort(event)).toBe(1);
  });
  it("returns 0 for whole-month schedule", () => {
    const event: ExpenseEvent = {
      id: "1",
      label: "Groceries",
      amount: 800,
      schedule: { type: "whole-month" },
    };
    expect(getDayForSort(event)).toBe(0);
  });
});

describe("formatDayForDisplay", () => {
  it("returns Monthly for whole-month expense", () => {
    const event: ExpenseEvent = {
      id: "1",
      label: "Groceries",
      amount: 800,
      schedule: { type: "whole-month" },
    };
    expect(formatDayForDisplay(event)).toBe("Monthly");
  });
  it("returns ordinals for recurring with multiple days", () => {
    const event: ExpenseEvent = {
      id: "1",
      label: "Twice monthly",
      amount: 100,
      schedule: { type: "recurring", daysOfMonth: [1, 15] },
    };
    expect(formatDayForDisplay(event)).toBe("1st, 15th");
  });
  it("returns ordinal for recurring expense", () => {
    const event: ExpenseEvent = {
      id: "1",
      label: "Rent",
      amount: 2000,
      schedule: { type: "recurring", daysOfMonth: [15] },
    };
    expect(formatDayForDisplay(event)).toBe("15th");
  });
});

describe("sortEventsByDayThenAmount", () => {
  it("sorts by day of month (earliest first)", () => {
    const events: IncomeEvent[] = [
      {
        id: "a",
        label: "Late",
        amount: 100,
        schedule: { type: "recurring", daysOfMonth: [25] },
      },
      {
        id: "b",
        label: "Early",
        amount: 200,
        schedule: { type: "recurring", daysOfMonth: [5] },
      },
    ];
    const sorted = sortEventsByDayThenAmount(events);
    expect(
      sorted[0].schedule.type === "recurring" &&
        sorted[0].schedule.daysOfMonth[0],
    ).toBe(5);
    expect(
      sorted[1].schedule.type === "recurring" &&
        sorted[1].schedule.daysOfMonth[0],
    ).toBe(25);
  });
  it("sorts by amount (largest first) when same day", () => {
    const events: IncomeEvent[] = [
      {
        id: "a",
        label: "Small",
        amount: 100,
        schedule: { type: "recurring", daysOfMonth: [15] },
      },
      {
        id: "b",
        label: "Large",
        amount: 500,
        schedule: { type: "recurring", daysOfMonth: [15] },
      },
    ];
    const sorted = sortEventsByDayThenAmount(events);
    expect(sorted[0].amount).toBe(500);
    expect(sorted[1].amount).toBe(100);
  });
  it("sorts whole-month (day 0) before other days", () => {
    const events: ExpenseEvent[] = [
      {
        id: "a",
        label: "Rent",
        amount: 2000,
        schedule: { type: "recurring", daysOfMonth: [1] },
      },
      {
        id: "b",
        label: "Groceries",
        amount: 800,
        schedule: { type: "whole-month" },
      },
    ];
    const sorted = sortEventsByDayThenAmount(events);
    expect(sorted[0].label).toBe("Groceries");
    expect(sorted[1].label).toBe("Rent");
  });
  it("sorts by day first, then amount for mixed", () => {
    const events: IncomeEvent[] = [
      {
        id: "1",
        label: "A",
        amount: 50,
        schedule: { type: "recurring", daysOfMonth: [10] },
      },
      {
        id: "2",
        label: "B",
        amount: 200,
        schedule: { type: "recurring", daysOfMonth: [10] },
      },
      {
        id: "3",
        label: "C",
        amount: 100,
        schedule: { type: "recurring", daysOfMonth: [5] },
      },
    ];
    const sorted = sortEventsByDayThenAmount(events);
    expect(
      sorted[0].schedule.type === "recurring" &&
        sorted[0].schedule.daysOfMonth[0],
    ).toBe(5);
    expect(sorted[0].amount).toBe(100);
    expect(sorted[1].amount).toBe(200);
    expect(sorted[2].amount).toBe(50);
  });
  it("sorts one-time events by correct day (timezone-safe)", () => {
    const events: IncomeEvent[] = [
      {
        id: "a",
        label: "Aug 7",
        amount: 100,
        schedule: { type: "one-time", date: "2026-08-07" },
      },
      {
        id: "b",
        label: "Aug 6",
        amount: 200,
        schedule: { type: "one-time", date: "2026-08-06" },
      },
      {
        id: "c",
        label: "Aug 8",
        amount: 150,
        schedule: { type: "one-time", date: "2026-08-08" },
      },
    ];
    const sorted = sortEventsByDayThenAmount(events);
    expect(getDayForSort(sorted[0])).toBe(6);
    expect(getDayForSort(sorted[1])).toBe(7);
    expect(getDayForSort(sorted[2])).toBe(8);
  });
  it("does not mutate input array", () => {
    const events: IncomeEvent[] = [
      {
        id: "1",
        label: "A",
        amount: 100,
        schedule: { type: "recurring", daysOfMonth: [2] },
      },
      {
        id: "2",
        label: "B",
        amount: 50,
        schedule: { type: "recurring", daysOfMonth: [1] },
      },
    ];
    const copy = [...events];
    sortEventsByDayThenAmount(events);
    expect(events).toEqual(copy);
  });
});
