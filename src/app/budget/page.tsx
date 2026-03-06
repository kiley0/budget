"use client";

import { useBudgetRedirect } from "@/features/session";
import { LoadingScreen } from "@/components/ui/loading-screen";

/** Redirect /budget to /budget/[budgetId]. Uses or creates a budget UUID. */
export default function BudgetRedirectPage() {
  const { sessionRestored } = useBudgetRedirect();

  if (!sessionRestored) {
    return <LoadingScreen />;
  }

  return <LoadingScreen message="Loading your budget…" />;
}
