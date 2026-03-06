import { replaceBudgetFromExport } from "./store";
import { parseMetadataFromExport, setBudgetMetadata } from "@/lib/constants";

export interface ImportResult {
  name?: string;
}

/**
 * Apply imported budget data. Returns metadata for UI updates (e.g. budget name).
 * Caller is responsible for saveBudget() and clearing import error.
 */
export function applyImportedBudget(
  raw: unknown,
  budgetId: string,
): ImportResult {
  replaceBudgetFromExport(raw, budgetId);
  if (raw && typeof raw === "object" && "metadata" in raw) {
    const meta = parseMetadataFromExport(
      (raw as { metadata: unknown }).metadata,
    );
    setBudgetMetadata(budgetId, meta);
    return { name: meta.name };
  }
  return {};
}
