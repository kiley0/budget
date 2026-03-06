"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deriveKey,
  hasStoredSalt,
  clearStoredSalt,
  verifyPassphrase,
  persistKeyToSession,
} from "@/lib/crypto";
import { useSessionStore } from "@/store/session";
import {
  BUDGET_ID_STORAGE_KEY,
  getStoredBudgetIds,
  clearAllBudgetsFromStorage,
} from "@/lib/constants";

export function useGetStartedPage() {
  const router = useRouter();
  const [hasExisting, setHasExisting] = useState<boolean | null>(null);
  const [storedBudgetIds, setStoredBudgetIds] = useState<string[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [wantsNewBudget, setWantsNewBudget] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasBudgetInStorage = storedBudgetIds.length > 0;
  const isCreate =
    hasExisting === false || wantsNewBudget || !hasBudgetInStorage;

  useEffect(() => {
    const id = setTimeout(() => {
      setHasExisting(hasStoredSalt());
      if (typeof window !== "undefined") {
        const ids = getStoredBudgetIds();
        setStoredBudgetIds(ids);
        if (ids.length > 0) setSelectedBudgetId(ids[0]);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (isCreate) {
      if (passphrase.length < 8) {
        setError("Passphrase must be at least 8 characters.");
        return;
      }
      if (passphrase !== confirm) {
        setError("Passphrases do not match.");
        return;
      }
    } else {
      if (!passphrase) {
        setError("Enter your passphrase.");
        return;
      }
    }
    setLoading(true);
    try {
      if (isCreate && wantsNewBudget) {
        clearStoredSalt();
        if (typeof window !== "undefined")
          localStorage.removeItem(BUDGET_ID_STORAGE_KEY);
      }
      if (!isCreate) {
        const budgetToUnlock =
          storedBudgetIds.length > 0 ? selectedBudgetId : undefined;
        const ok = await verifyPassphrase(
          passphrase,
          budgetToUnlock ?? undefined,
        );
        if (!ok) {
          setError("Incorrect passphrase.");
          setLoading(false);
          return;
        }
        if (budgetToUnlock && typeof window !== "undefined")
          localStorage.setItem(BUDGET_ID_STORAGE_KEY, budgetToUnlock);
      }
      const key = await deriveKey(passphrase);
      useSessionStore.getState().setKey(key);
      await persistKeyToSession(key);
      router.replace("/budget");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Get-started error:", err);
      }
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function switchToCreateNew() {
    setWantsNewBudget(true);
    setPassphrase("");
    setConfirm("");
    setError("");
  }

  function switchToUnlockExisting() {
    setWantsNewBudget(false);
    setPassphrase("");
    setConfirm("");
    setError("");
  }

  function handleEraseBudgets() {
    if (
      window.confirm(
        "Remove all budget data from this browser? This cannot be undone.",
      )
    ) {
      clearAllBudgetsFromStorage();
      setStoredBudgetIds([]);
      setSelectedBudgetId(null);
    }
  }

  return {
    hasExisting,
    storedBudgetIds,
    selectedBudgetId,
    setSelectedBudgetId,
    wantsNewBudget,
    passphrase,
    setPassphrase,
    confirm,
    setConfirm,
    error,
    loading,
    hasBudgetInStorage,
    isCreate,
    handleSubmit,
    switchToCreateNew,
    switchToUnlockExisting,
    handleEraseBudgets,
  };
}
