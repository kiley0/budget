import { useBudgetStore } from "@/store/budget";

/** Returns helpers to resolve source IDs to display names for budget line items. */
export function useBudgetSourceNames() {
  const incomeSources = useBudgetStore((s) => s.incomeSources);
  const expenseDestinations = useBudgetStore((s) => s.expenseDestinations);

  const getIncomeSourceName = (id: string | undefined): string => {
    if (!id) return "—";
    return incomeSources.find((s) => s.id === id)?.name ?? "—";
  };

  const getExpenseDestinationName = (id: string | undefined): string => {
    if (!id) return "—";
    return expenseDestinations.find((d) => d.id === id)?.name ?? "—";
  };

  return { getIncomeSourceName, getExpenseDestinationName };
}
