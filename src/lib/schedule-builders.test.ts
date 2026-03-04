import { describe, it, expect } from "vitest";
import {
  buildIncomeScheduleFromForm,
  buildExpenseScheduleFromForm,
} from "./schedule-builders";

describe("buildIncomeScheduleFromForm", () => {
  it("returns one-time schedule when type is one-time and date is provided", () => {
    const result = buildIncomeScheduleFromForm(
      "one-time",
      "2026-03-15",
      "",
      undefined,
      undefined,
    );
    expect(result).toEqual({ type: "one-time", date: "2026-03-15" });
  });
  it("returns null for one-time with empty date", () => {
    expect(
      buildIncomeScheduleFromForm("one-time", "", "", undefined, undefined),
    ).toBeNull();
  });
  it("trims one-time date", () => {
    const result = buildIncomeScheduleFromForm(
      "one-time",
      "  2026-01-01  ",
      "",
      undefined,
      undefined,
    );
    expect(result).toEqual({ type: "one-time", date: "2026-01-01" });
  });
  it("returns recurring schedule for valid day of month", () => {
    const result = buildIncomeScheduleFromForm(
      "recurring",
      "",
      "15",
      undefined,
      undefined,
    );
    expect(result).toEqual({ type: "recurring", dayOfMonth: 15 });
  });
  it("returns recurring with start and end dates when provided", () => {
    const result = buildIncomeScheduleFromForm(
      "recurring",
      "",
      "1",
      "2025-01-01",
      "2025-12-31",
    );
    expect(result).toEqual({
      type: "recurring",
      dayOfMonth: 1,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });
  });
  it("returns null for recurring with invalid day", () => {
    expect(
      buildIncomeScheduleFromForm("recurring", "", "0", undefined, undefined),
    ).toBeNull();
    expect(
      buildIncomeScheduleFromForm("recurring", "", "32", undefined, undefined),
    ).toBeNull();
    expect(
      buildIncomeScheduleFromForm("recurring", "", "abc", undefined, undefined),
    ).toBeNull();
  });
});

describe("buildExpenseScheduleFromForm", () => {
  it("returns one-time when date provided", () => {
    const result = buildExpenseScheduleFromForm(
      "one-time",
      "2026-06-20",
      "",
      undefined,
      undefined,
    );
    expect(result).toEqual({ type: "one-time", date: "2026-06-20" });
  });
  it("returns null for one-time with empty date", () => {
    expect(
      buildExpenseScheduleFromForm("one-time", "", "", undefined, undefined),
    ).toBeNull();
  });
  it("returns recurring for valid day", () => {
    const result = buildExpenseScheduleFromForm(
      "recurring",
      "",
      "25",
      undefined,
      undefined,
    );
    expect(result).toEqual({ type: "recurring", dayOfMonth: 25 });
  });
  it("returns null for recurring with invalid day", () => {
    expect(
      buildExpenseScheduleFromForm("recurring", "", "99", undefined, undefined),
    ).toBeNull();
  });
});
