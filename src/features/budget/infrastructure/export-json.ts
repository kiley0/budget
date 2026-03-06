import type { BudgetState } from "@/features/budget/domain/types";
import type { BudgetMetadata } from "@/lib/constants";

/** Shape of the JSON export file (for importing and for tests). */
export interface BudgetExportData {
  budgetId: string;
  version: number;
  updatedAt: string;
  schemaVersion?: number;
  incomeEvents: BudgetState["incomeEvents"];
  expenseEvents: BudgetState["expenseEvents"];
  metadata?: BudgetMetadata;
}

/** Build the export object that gets serialized to JSON. Used for export and for unit tests. */
export function buildBudgetExportData(
  state: BudgetState,
  metadata?: BudgetMetadata,
): BudgetExportData {
  const data: BudgetExportData = {
    budgetId: state.budgetId,
    version: state.version,
    updatedAt: state.updatedAt,
    schemaVersion: state.schemaVersion ?? 3,
    incomeEvents: state.incomeEvents,
    expenseEvents: state.expenseEvents,
  };
  if (metadata && Object.keys(metadata).length > 0) {
    data.metadata = metadata;
  }
  return data;
}
