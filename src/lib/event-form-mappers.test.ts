import { describe, it, expect } from "vitest";
import {
  incomeEventToFormState,
  expenseEventToFormState,
} from "./event-form-mappers";
import type { IncomeEvent, ExpenseEvent } from "@/store/budget";

describe("incomeEventToFormState", () => {
  it("maps one-time income event to form state", () => {
    const event: IncomeEvent = {
      id: "e1",
      label: "Bonus",
      amount: 500,
      schedule: { type: "one-time", date: "2026-06-15" },
    };
    const form = incomeEventToFormState(event);
    expect(form.label).toBe("Bonus");
    expect(form.amount).toBe("500");
    expect(form.scheduleType).toBe("one-time");
    expect(form.date).toBe("2026-06-15");
  });

  it("maps recurring income with paycheck details", () => {
    const event: IncomeEvent = {
      id: "e2",
      label: "Salary",
      amount: 4000,
      incomeType: "paycheck",
      paycheckDetails: {
        grossAmount: 5000,
        withholdings: { federalTax: 500, stateTax: 200 },
      },
      schedule: {
        type: "recurring",
        daysOfMonth: [15],
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
    };
    const form = incomeEventToFormState(event);
    expect(form.incomeType).toBe("paycheck");
    expect(form.paycheckGross).toBe("5000");
    expect(form.scheduleType).toBe("recurring");
    expect(form.dayOfMonth).toBe("15");
    expect(form.recurringStartDate).toBe("2026-01-01");
    expect(form.recurringEndDate).toBe("2026-12-31");
  });
});

describe("expenseEventToFormState", () => {
  it("maps expense event to form state", () => {
    const event: ExpenseEvent = {
      id: "ee1",
      label: "Rent",
      amount: 2000,
      category: "rent",
      schedule: { type: "recurring", daysOfMonth: [1] },
    };
    const form = expenseEventToFormState(event);
    expect(form.label).toBe("Rent");
    expect(form.amount).toBe("2000");
    expect(form.category).toBe("rent");
    expect(form.scheduleType).toBe("recurring");
    expect(form.dayOfMonth).toBe("1");
  });
});
