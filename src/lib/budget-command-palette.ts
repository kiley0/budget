import type { MonthSlot } from "./date-view";
import { formatMonthLabel } from "./date-view";

export interface BudgetCommandItem {
  value: string;
  label: string;
}

/** Build command palette items for the budget page. */
export function buildBudgetCommandPaletteCommands(
  dateViewMonths: MonthSlot[],
): BudgetCommandItem[] {
  return [
    { value: "back-to-top", label: "Back to top" },
    { value: "prev-month", label: "Previous month" },
    { value: "next-month", label: "Next month" },
    { value: "add-income", label: "Add expected income" },
    { value: "add-expense", label: "Add expected expense" },
    { value: "manage-income", label: "Manage income" },
    { value: "manage-expenses", label: "Manage expenses" },
    { value: "yearly-summary", label: "Yearly summary" },
    { value: "jump-current", label: "Jump to current month" },
    ...dateViewMonths.map((slot, i) => ({
      value: `jump-${i}`,
      label: `Jump to ${formatMonthLabel(slot)}`,
    })),
  ];
}
