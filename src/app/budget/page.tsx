"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/session";
import { BUDGET_ID_STORAGE_KEY } from "@/lib/constants";
import { importKeyFromSession } from "@/lib/crypto";

/** Redirect /budget to /budget/[budgetId]. Uses or creates a budget UUID. */
export default function BudgetRedirectPage() {
  const router = useRouter();
  const isUnlocked = useSessionStore((s) => s.isUnlocked());
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    importKeyFromSession()
      .then((key) => {
        if (key) useSessionStore.getState().setKey(key);
      })
      .finally(() => setSessionRestored(true));
  }, []);

  useEffect(() => {
    if (!sessionRestored) return;
    if (!isUnlocked) {
      router.replace("/get-started");
      return;
    }
    let budgetId =
      typeof window !== "undefined"
        ? localStorage.getItem(BUDGET_ID_STORAGE_KEY)
        : null;
    if (!budgetId) {
      budgetId = crypto.randomUUID();
      localStorage.setItem(BUDGET_ID_STORAGE_KEY, budgetId);
    }
    router.replace(`/budget/${budgetId}`);
  }, [sessionRestored, isUnlocked, router]);

  if (!sessionRestored) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground" role="status" aria-live="polite">
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground" role="status" aria-live="polite">
        Loading your budget…
      </p>
    </div>
  );
}
