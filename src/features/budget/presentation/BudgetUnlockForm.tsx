"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { replaceBudgetFromExport } from "@/features/budget/infrastructure/store";
import {
  decryptSyncPayloadWithPassphrase,
  isPortableFormat,
  persistKeyToSession,
} from "@/lib/crypto";
import {
  BUDGET_ID_STORAGE_KEY,
  parseMetadataFromExport,
  setBudgetMetadata,
} from "@/lib/constants";
import { useSessionStore } from "@/features/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BudgetUnlockFormProps {
  encryptedBlob: string;
  budgetId: string;
  onSuccess?: (meta: { name?: string }) => void;
  onCancel?: () => void;
}

export function BudgetUnlockForm({
  encryptedBlob,
  budgetId,
  onSuccess,
  onCancel,
}: BudgetUnlockFormProps) {
  const router = useRouter();
  const [urlPassphrase, setUrlPassphrase] = useState("");
  const [urlPassphraseError, setUrlPassphraseError] = useState("");
  const [urlUnlockLoading, setUrlUnlockLoading] = useState(false);

  const handleCancel = () => {
    if (onCancel) onCancel();
    else router.replace("/get-started");
  };

  if (!isPortableFormat(encryptedBlob)) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          This budget was created before link sharing. Open it on the device
          where you created it.
        </p>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setUrlPassphraseError("");
        if (!urlPassphrase.trim()) {
          setUrlPassphraseError("Enter your passphrase.");
          return;
        }
        setUrlUnlockLoading(true);
        try {
          const { plaintext, key } = await decryptSyncPayloadWithPassphrase(
            encryptedBlob,
            urlPassphrase,
          );
          useSessionStore.getState().setKey(key);
          await persistKeyToSession(key);
          if (typeof window !== "undefined") {
            localStorage.setItem(BUDGET_ID_STORAGE_KEY, budgetId);
          }
          const parsed = JSON.parse(plaintext) as unknown;
          replaceBudgetFromExport(parsed, budgetId);
          const meta = parseMetadataFromExport(
            parsed && typeof parsed === "object" && "metadata" in parsed
              ? (parsed as { metadata: unknown }).metadata
              : undefined,
          );
          setBudgetMetadata(budgetId, meta);
          onSuccess?.({ name: meta.name });
        } catch {
          setUrlPassphraseError("Incorrect passphrase. Please try again.");
        } finally {
          setUrlUnlockLoading(false);
        }
      }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="url-passphrase">Passphrase</Label>
        <Input
          id="url-passphrase"
          type="password"
          autoComplete="current-password"
          value={urlPassphrase}
          onChange={(e) => {
            setUrlPassphrase(e.target.value);
            setUrlPassphraseError("");
          }}
          placeholder="Your passphrase"
          disabled={urlUnlockLoading}
          aria-invalid={!!urlPassphraseError}
        />
      </div>
      {urlPassphraseError && (
        <p
          className="text-sm text-destructive"
          role="alert"
          id="url-passphrase-error"
        >
          {urlPassphraseError}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={urlUnlockLoading}>
          {urlUnlockLoading ? "Unlocking…" : "Unlock"}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
