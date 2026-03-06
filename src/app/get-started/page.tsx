"use client";

import Link from "next/link";
import { useGetStartedPage } from "@/hooks/useGetStartedPage";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  UnlockExistingCard,
  CreatePassphraseCard,
} from "@/components/get-started";
import { Button } from "@/components/ui/button";

export default function GetStartedPage() {
  const p = useGetStartedPage();

  if (p.hasExisting === null) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <form onSubmit={p.handleSubmit} className="space-y-5">
          {!p.isCreate && p.hasBudgetInStorage ? (
            <UnlockExistingCard
              storedBudgetIds={p.storedBudgetIds}
              selectedBudgetId={p.selectedBudgetId}
              onSelectedBudgetIdChange={p.setSelectedBudgetId}
              passphrase={p.passphrase}
              onPassphraseChange={p.setPassphrase}
              error={p.error}
              loading={p.loading}
              onEraseBudgets={p.handleEraseBudgets}
            />
          ) : (
            <CreatePassphraseCard
              passphrase={p.passphrase}
              onPassphraseChange={p.setPassphrase}
              confirm={p.confirm}
              onConfirmChange={p.setConfirm}
              error={p.error}
              loading={p.loading}
            />
          )}
          {p.hasExisting && !p.wantsNewBudget && p.hasBudgetInStorage && (
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an existing budget?{" "}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 font-medium"
                onClick={p.switchToCreateNew}
              >
                Create a new one
              </Button>
            </p>
          )}
        </form>

        {p.hasExisting && p.wantsNewBudget ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 font-medium"
              onClick={p.switchToUnlockExisting}
            >
              ← Back to unlock existing budget
            </Button>
          </p>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Button variant="link" asChild size="sm" className="h-auto p-0">
            <Link href="/">← Back to home</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}
