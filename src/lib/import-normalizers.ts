import type { BudgetState } from "@/store/budget";
import { migrateBudget } from "./budget-migrations";

/** Normalize parsed JSON (e.g. from import) into current BudgetState schema. Handles old/missing fields via migrateBudget. */
export function normalizeImportedBudget(raw: unknown): BudgetState {
  const budgetId =
    raw &&
    typeof raw === "object" &&
    typeof (raw as Record<string, unknown>).budgetId === "string"
      ? ((raw as Record<string, unknown>).budgetId as string)
      : "";
  return migrateBudget(raw, budgetId);
}
