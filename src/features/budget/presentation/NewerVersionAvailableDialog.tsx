"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudDownload } from "lucide-react";

interface NewerVersionAvailableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
  onUpdate: (passphrase: string) => Promise<{ ok: boolean }>;
  /** Called when user dismisses without updating (Stay or X). Used for cooldown. */
  onDismissWithoutUpdate?: () => void;
}

export function NewerVersionAvailableDialog({
  open,
  onOpenChange,
  budgetId,
  onUpdate,
  onDismissWithoutUpdate,
}: NewerVersionAvailableDialogProps) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const justUpdatedRef = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!passphrase.trim()) {
      setError("Enter your passphrase.");
      return;
    }
    setLoading(true);
    try {
      const result = await onUpdate(passphrase);
      if (result.ok) {
        setPassphrase("");
        justUpdatedRef.current = true;
        onOpenChange(false);
      } else {
        setError("Incorrect passphrase. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (!justUpdatedRef.current) {
        onDismissWithoutUpdate?.();
      }
      justUpdatedRef.current = false;
      setPassphrase("");
      setError("");
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudDownload className="h-5 w-5 text-muted-foreground" />
            Newer version available
          </DialogTitle>
          <DialogDescription>
            A newer version of your budget exists in the cloud (e.g., from
            another device). Enter your passphrase to update to the latest
            version.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-budget-id={budgetId}
        >
          <div className="space-y-2">
            <Label htmlFor="newer-version-passphrase">Passphrase</Label>
            <Input
              id="newer-version-passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter your passphrase"
              autoComplete="current-password"
              disabled={loading}
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Stay on current version
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating…" : "Update to latest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
