import {
  parseMonthFromDateString,
  isOneTimeEventInMonth,
  isRecurringEventInMonth,
  filterEventsForMonth,
} from "./event-month-filter";

describe("parseMonthFromDateString", () => {
  it("parses YYYY-MM format", () => {
    expect(parseMonthFromDateString("2024-06")).toEqual([2024, 6]);
    expect(parseMonthFromDateString("2024-01")).toEqual([2024, 1]);
    expect(parseMonthFromDateString("2024-12")).toEqual([2024, 12]);
  });

  it("parses YYYY-M format", () => {
    expect(parseMonthFromDateString("2024-6")).toEqual([2024, 6]);
  });

  it("returns NaN for invalid input", () => {
    expect(parseMonthFromDateString("invalid")).toEqual([NaN, NaN]);
    expect(parseMonthFromDateString("2024")).toEqual([NaN, NaN]);
    expect(parseMonthFromDateString("")).toEqual([NaN, NaN]);
  });
});

describe("isOneTimeEventInMonth", () => {
  it("returns true when date matches", () => {
    expect(isOneTimeEventInMonth("2024-06-15", 2024, 6)).toBe(true);
    expect(isOneTimeEventInMonth("2024-6-15", 2024, 6)).toBe(true);
  });

  it("returns false when year or month differ", () => {
    expect(isOneTimeEventInMonth("2024-06-15", 2024, 7)).toBe(false);
    expect(isOneTimeEventInMonth("2024-06-15", 2023, 6)).toBe(false);
  });

  it("handles malformed date gracefully", () => {
    expect(isOneTimeEventInMonth("invalid", 2024, 6)).toBe(false);
  });
});

describe("isRecurringEventInMonth", () => {
  it("returns true when no start/end", () => {
    expect(isRecurringEventInMonth({}, 2024, 6)).toBe(true);
  });

  it("respects startDate", () => {
    expect(isRecurringEventInMonth({ startDate: "2024-06-01" }, 2024, 5)).toBe(
      false,
    );
    expect(isRecurringEventInMonth({ startDate: "2024-06-01" }, 2024, 6)).toBe(
      true,
    );
    expect(isRecurringEventInMonth({ startDate: "2024-06-01" }, 2024, 7)).toBe(
      true,
    );
  });

  it("respects endDate", () => {
    expect(isRecurringEventInMonth({ endDate: "2024-06-30" }, 2024, 7)).toBe(
      false,
    );
    expect(isRecurringEventInMonth({ endDate: "2024-06-30" }, 2024, 6)).toBe(
      true,
    );
    expect(isRecurringEventInMonth({ endDate: "2024-06-30" }, 2024, 5)).toBe(
      true,
    );
  });

  it("respects both startDate and endDate", () => {
    const schedule = { startDate: "2024-03-01", endDate: "2024-08-31" };
    expect(isRecurringEventInMonth(schedule, 2024, 2)).toBe(false);
    expect(isRecurringEventInMonth(schedule, 2024, 3)).toBe(true);
    expect(isRecurringEventInMonth(schedule, 2024, 6)).toBe(true);
    expect(isRecurringEventInMonth(schedule, 2024, 9)).toBe(false);
  });
});

describe("filterEventsForMonth", () => {
  it("filters one-time events by exact date", () => {
    const events = [
      {
        id: "1",
        schedule: { type: "one-time" as const, date: "2024-06-15" },
      },
      {
        id: "2",
        schedule: { type: "one-time" as const, date: "2024-07-20" },
      },
    ];
    expect(filterEventsForMonth(events, 2024, 6)).toHaveLength(1);
    expect(filterEventsForMonth(events, 2024, 6)[0].id).toBe("1");
  });

  it("filters recurring events by range", () => {
    const events = [
      {
        id: "1",
        schedule: {
          type: "recurring" as const,
          daysOfMonth: [15],
          startDate: "2024-03-01",
          endDate: "2024-08-31",
        },
      },
    ];
    expect(filterEventsForMonth(events, 2024, 2)).toHaveLength(0);
    expect(filterEventsForMonth(events, 2024, 6)).toHaveLength(1);
    expect(filterEventsForMonth(events, 2024, 9)).toHaveLength(0);
  });

  it("filters whole-month events by startDate/endDate range", () => {
    const events = [
      {
        id: "1",
        schedule: {
          type: "whole-month" as const,
          startDate: "2024-03-01",
          endDate: "2024-08-31",
        },
      },
    ];
    expect(filterEventsForMonth(events, 2024, 2)).toHaveLength(0);
    expect(filterEventsForMonth(events, 2024, 6)).toHaveLength(1);
    expect(filterEventsForMonth(events, 2024, 9)).toHaveLength(0);
  });

  it("includes whole-month events with no range in all months", () => {
    const events = [{ id: "1", schedule: { type: "whole-month" as const } }];
    expect(filterEventsForMonth(events, 2024, 1)).toHaveLength(1);
    expect(filterEventsForMonth(events, 2024, 12)).toHaveLength(1);
  });
});
