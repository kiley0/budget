"use client";

import { AddSourceDialog } from "./AddSourceDialog";

interface AddExpenseDestinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, description: string) => void;
}

export function AddExpenseDestinationDialog({
  open,
  onOpenChange,
  onAdd,
}: AddExpenseDestinationDialogProps) {
  return (
    <AddSourceDialog
      open={open}
      onOpenChange={onOpenChange}
      onAdd={onAdd}
      title="Add expense destination"
      namePlaceholder="Landlord"
      submitLabel="Add expense destination"
    />
  );
}
