import { describe, it, expect } from "vitest";
import {
  formatDayOrdinal,
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
  it("formats recurring day of month", () => {
    expect(formatIncomeSchedule({ type: "recurring", dayOfMonth: 11 })).toBe(
      "11th of each month",
    );
  });
});

describe("formatExpenseSchedule", () => {
  it("formats one-time date", () => {
    const r = formatExpenseSchedule({ type: "one-time", date: "2026-01-02" });
    expect(r).toMatch(/Jan/);
    expect(r).toMatch(/2026/);
  });
  it("formats recurring", () => {
    expect(formatExpenseSchedule({ type: "recurring", dayOfMonth: 1 })).toBe(
      "1st of each month",
    );
  });
});

describe("getDayForSort", () => {
  it("returns date day for one-time schedule (same as parsing date with Z)", () => {
    const event: IncomeEvent = {
      id: "1",
      label: "Pay",
      amount: 1000,
      schedule: { type: "one-time", date: "2026-03-15" },
    };
    const expected =
      event.schedule.type === "one-time"
        ? new Date(event.schedule.date + "Z").getDate()
        : event.schedule.dayOfMonth;
    expect(getDayForSort(event)).toBe(expected);
  });
  it("returns dayOfMonth for recurring schedule", () => {
    const event: ExpenseEvent = {
      id: "1",
      label: "Rent",
      amount: 2000,
      schedule: { type: "recurring", dayOfMonth: 1 },
    };
    expect(getDayForSort(event)).toBe(1);
  });
});

describe("sortEventsByDayThenAmount", () => {
  it("sorts by day of month (earliest first)", () => {
    const events: IncomeEvent[] = [
      {
        id: "a",
        label: "Late",
        amount: 100,
        schedule: { type: "recurring", dayOfMonth: 25 },
      },
      {
        id: "b",
        label: "Early",
        amount: 200,
        schedule: { type: "recurring", dayOfMonth: 5 },
      },
    ];
    const sorted = sortEventsByDayThenAmount(events);
    expect(
      sorted[0].schedule.type === "recurring" && sorted[0].schedule.dayOfMonth,
    ).toBe(5);
    expect(
      sorted[1].schedule.type === "recurring" && sorted[1].schedule.dayOfMonth,
    ).toBe(25);
  });
  it("sorts by amount (largest first) when same day", () => {
    const events: IncomeEvent[] = [
      {
        id: "a",
        label: "Small",
        amount: 100,
        schedule: { type: "recurring", dayOfMonth: 15 },
      },
      {
        id: "b",
        label: "Large",
        amount: 500,
        schedule: { type: "recurring", dayOfMonth: 15 },
      },
    ];
    const sorted = sortEventsByDayThenAmount(events);
    expect(sorted[0].amount).toBe(500);
    expect(sorted[1].amount).toBe(100);
  });
  it("sorts by day first, then amount for mixed", () => {
    const events: IncomeEvent[] = [
      {
        id: "1",
        label: "A",
        amount: 50,
        schedule: { type: "recurring", dayOfMonth: 10 },
      },
      {
        id: "2",
        label: "B",
        amount: 200,
        schedule: { type: "recurring", dayOfMonth: 10 },
      },
      {
        id: "3",
        label: "C",
        amount: 100,
        schedule: { type: "recurring", dayOfMonth: 5 },
      },
    ];
    const sorted = sortEventsByDayThenAmount(events);
    expect(
      sorted[0].schedule.type === "recurring" && sorted[0].schedule.dayOfMonth,
    ).toBe(5);
    expect(sorted[0].amount).toBe(100);
    expect(sorted[1].amount).toBe(200);
    expect(sorted[2].amount).toBe(50);
  });
  it("does not mutate input array", () => {
    const events: IncomeEvent[] = [
      {
        id: "1",
        label: "A",
        amount: 100,
        schedule: { type: "recurring", dayOfMonth: 2 },
      },
      {
        id: "2",
        label: "B",
        amount: 50,
        schedule: { type: "recurring", dayOfMonth: 1 },
      },
    ];
    const copy = [...events];
    sortEventsByDayThenAmount(events);
    expect(events).toEqual(copy);
  });
});
