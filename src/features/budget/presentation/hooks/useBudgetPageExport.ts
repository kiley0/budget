"use client";

import { useCallback } from "react";
import { useBudgetStore } from "@/features/budget/infrastructure/store";
import { getBudgetMetadata } from "@/lib/constants";
import { buildBudgetExportData } from "@/features/budget/infrastructure/export-json";
import { budgetStateToCsv } from "@/features/budget/infrastructure/export-csv";
import { downloadBlob } from "@/features/budget/infrastructure/download";
import { getExportTimestamp } from "@/features/budget/infrastructure/budget-export-utils";

/**
 * Hook that provides export handlers for the budget page.
 */
export function useBudgetPageExport(): {
  handleExport: () => void;
  handleExportCsv: () => void;
} {
  const handleExport = useCallback(() => {
    const state = useBudgetStore.getState();
    const metadata = state.budgetId
      ? getBudgetMetadata(state.budgetId)
      : undefined;
    const exportData = buildBudgetExportData(state, metadata);
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    downloadBlob(blob, `budget-export-${getExportTimestamp()}.json`);
  }, []);

  const handleExportCsv = useCallback(() => {
    const state = useBudgetStore.getState();
    const csv = budgetStateToCsv(state);
    const blob = new Blob([csv], { type: "text/csv; charset=utf-8" });
    downloadBlob(blob, `budget-export-${getExportTimestamp()}.csv`);
  }, []);

  return { handleExport, handleExportCsv };
}
