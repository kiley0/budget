"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  getBudgetMetadata,
  clearAllBudgetsFromStorage,
  type BudgetMetadata,
} from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

function budgetDisplayName(budgetId: string): string {
  return budgetId.length >= 8
    ? `Budget ${budgetId.slice(0, 8)}…`
    : `Budget ${budgetId}`;
}

function formatMetaDate(iso: string | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatLastOpened(meta: BudgetMetadata): string {
  const last = formatMetaDate(meta.lastAccessed);
  return last ? `Last opened ${last}` : "";
}

export default function GetStartedPage() {
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

  if (hasExisting === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground" role="status" aria-live="polite">
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isCreate && hasBudgetInStorage ? (
            <Card className="space-y-5">
              <CardHeader className="space-y-1.5">
                <CardTitle className="text-2xl text-foreground">
                  Open a budget
                </CardTitle>
                <CardDescription>
                  Choose a budget below and enter your passphrase to unlock it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Budget to unlock
                  </span>
                  <div className="mt-2 space-y-2">
                    <RadioGroup
                      value={selectedBudgetId ?? ""}
                      onValueChange={(v) => setSelectedBudgetId(v || null)}
                    >
                      {storedBudgetIds.map((id) => {
                        const meta = getBudgetMetadata(id);
                        const name = meta.name?.trim() || budgetDisplayName(id);
                        const lastOpened = formatLastOpened(meta);
                        const label = lastOpened
                          ? `${name} (${lastOpened})`
                          : name;
                        return (
                          <div key={id} className="flex items-center gap-2">
                            <RadioGroupItem value={id} id={`budget-${id}`} />
                            <Label
                              htmlFor={`budget-${id}`}
                              className="cursor-pointer font-normal"
                            >
                              {label}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0 text-muted-foreground"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove all budget data from this browser? This cannot be undone.",
                        )
                      ) {
                        clearAllBudgetsFromStorage();
                        setStoredBudgetIds([]);
                        setSelectedBudgetId(null);
                      }
                    }}
                  >
                    Erase budgets from my browser
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passphrase-unlock">Passphrase</Label>
                  <Input
                    id="passphrase-unlock"
                    type="password"
                    autoComplete="current-password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Your passphrase"
                    disabled={loading}
                    aria-invalid={!!error}
                    aria-describedby={error ? "unlock-error" : undefined}
                  />
                </div>
                {error && (
                  <p
                    id="unlock-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  aria-describedby={error ? "unlock-error" : undefined}
                >
                  {loading ? "Please wait…" : "Unlock"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By proceeding, you agree to the terms of service.
                </p>
              </CardFooter>
            </Card>
          ) : (
            <Card className="space-y-5">
              <CardHeader className="space-y-1.5">
                <CardTitle className="text-2xl text-foreground">
                  Create your passphrase
                </CardTitle>
                <CardDescription>
                  Your budget data will be encrypted with this passphrase and
                  stored only on this device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="passphrase-create">Passphrase</Label>
                  <Input
                    id="passphrase-create"
                    type="password"
                    autoComplete="new-password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={loading}
                    aria-invalid={!!error}
                    aria-describedby={error ? "create-error" : undefined}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-passphrase">Confirm passphrase</Label>
                  <Input
                    id="confirm-passphrase"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm passphrase"
                    disabled={loading}
                    aria-invalid={!!error && error.includes("match")}
                    aria-describedby={error ? "create-error" : undefined}
                  />
                </div>

                {error && (
                  <p
                    id="create-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  aria-describedby={error ? "create-error" : undefined}
                >
                  {loading ? "Please wait…" : "Create and continue"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By proceeding, you agree to the terms of service.
                </p>
              </CardFooter>
            </Card>
          )}
          {hasExisting && !wantsNewBudget && hasBudgetInStorage && (
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an existing budget?{" "}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 font-medium"
                onClick={() => {
                  setWantsNewBudget(true);
                  setPassphrase("");
                  setConfirm("");
                  setError("");
                }}
              >
                Create a new one
              </Button>
            </p>
          )}
        </form>

        {hasExisting && wantsNewBudget ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 font-medium"
              onClick={() => {
                setWantsNewBudget(false);
                setPassphrase("");
                setConfirm("");
                setError("");
              }}
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
