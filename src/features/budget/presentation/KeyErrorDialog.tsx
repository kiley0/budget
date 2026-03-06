"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type KeyErrorReason = "no_key" | "decrypt_failed" | null;

interface KeyErrorDialogProps {
  open: boolean;
  reason: KeyErrorReason;
  onUnlockAgain: () => void;
}

export function KeyErrorDialog({
  open,
  reason,
  onUnlockAgain,
}: KeyErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onUnlockAgain()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{"Couldn't unlock your budget"}</DialogTitle>
          <DialogDescription>
            {reason === "no_key"
              ? "Your session key is missing. Please unlock again with your passphrase."
              : "Your passphrase may be wrong or the data may be corrupted. Please unlock again with your passphrase."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button onClick={onUnlockAgain}>Unlock again</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
