"use client";

import { getBudgetMetadata } from "@/lib/constants";
import { budgetDisplayName, formatLastOpened } from "@/lib/format";
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

interface UnlockExistingCardProps {
  storedBudgetIds: string[];
  selectedBudgetId: string | null;
  onSelectedBudgetIdChange: (id: string | null) => void;
  passphrase: string;
  onPassphraseChange: (value: string) => void;
  error: string;
  loading: boolean;
  onEraseBudgets: () => void;
}

export function UnlockExistingCard({
  storedBudgetIds,
  selectedBudgetId,
  onSelectedBudgetIdChange,
  passphrase,
  onPassphraseChange,
  error,
  loading,
  onEraseBudgets,
}: UnlockExistingCardProps) {
  return (
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
              onValueChange={(v) => onSelectedBudgetIdChange(v || null)}
            >
              {storedBudgetIds.map((id) => {
                const meta = getBudgetMetadata(id);
                const name = meta.name?.trim() || budgetDisplayName(id);
                const lastOpened = formatLastOpened(meta.lastAccessed);
                const label = lastOpened ? `${name} (${lastOpened})` : name;
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
            onClick={onEraseBudgets}
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
            onChange={(e) => onPassphraseChange(e.target.value)}
            placeholder="Your passphrase"
            disabled={loading}
            aria-invalid={!!error}
            aria-describedby={error ? "unlock-error" : undefined}
          />
          {error && (
            <p
              id="unlock-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
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
  );
}
