import { useBudgetStore } from "@/store/budget";

/** Returns helpers to resolve source IDs to display names for budget line items. */
export function useBudgetSourceNames() {
  const incomeSources = useBudgetStore((s) => s.incomeSources);

  const getIncomeSourceName = (id: string | undefined): string => {
    if (!id) return "–";
    return incomeSources.find((s) => s.id === id)?.name ?? "–";
  };

  return { getIncomeSourceName };
}
