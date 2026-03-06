"use client";

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
import { Button } from "@/components/ui/button";

interface CreatePassphraseCardProps {
  passphrase: string;
  onPassphraseChange: (value: string) => void;
  confirm: string;
  onConfirmChange: (value: string) => void;
  error: string;
  loading: boolean;
}

export function CreatePassphraseCard({
  passphrase,
  onPassphraseChange,
  confirm,
  onConfirmChange,
  error,
  loading,
}: CreatePassphraseCardProps) {
  return (
    <Card className="space-y-5">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-2xl text-foreground">
          Create your passphrase
        </CardTitle>
        <CardDescription>
          Your budget data will be encrypted with this passphrase and stored
          only on this device.
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
            onChange={(e) => onPassphraseChange(e.target.value)}
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
            onChange={(e) => onConfirmChange(e.target.value)}
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
  );
}
