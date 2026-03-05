"use client";

import { useCallback, useRef, useState } from "react";
import { useBudgetStore, saveBudget } from "@/store/budget";
import { applyImportedBudget } from "@/lib/budget-import";
import { toast } from "sonner";

export interface UseBudgetPageImportParams {
  budgetId: string | undefined;
  onImportSuccess?: (meta: { name?: string }) => void;
}

export function useBudgetPageImport({
  budgetId,
  onImportSuccess,
}: UseBudgetPageImportParams) {
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportClick = useCallback(() => {
    importFileRef.current?.click();
  }, []);

  const handleImportFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const file = input.files?.[0];
      if (!file) return;
      setImportError(null);
      const confirmed = window.confirm(
        "Import this data? It will replace all existing budget data.",
      );
      if (!confirmed) {
        input.value = "";
        return;
      }
      try {
        const text = await file.text();
        const raw = JSON.parse(text) as unknown;
        const currentBudgetId =
          budgetId ?? useBudgetStore.getState().budgetId ?? "";
        const result = applyImportedBudget(raw, currentBudgetId);
        await saveBudget();
        onImportSuccess?.(result);
        toast.success("Import successful.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Invalid or unsupported file.";
        setImportError(`Import failed: ${message}`);
        toast.error("Import failed. " + message);
      } finally {
        input.value = "";
      }
    },
    [budgetId, onImportSuccess],
  );

  return {
    importFileRef,
    importError,
    setImportError,
    handleImportClick,
    handleImportFileChange,
  };
}
