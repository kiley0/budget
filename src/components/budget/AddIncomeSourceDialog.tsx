"use client";

import { AddSourceDialog } from "./AddSourceDialog";

interface AddIncomeSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, description: string) => void;
}

export function AddIncomeSourceDialog({
  open,
  onOpenChange,
  onAdd,
}: AddIncomeSourceDialogProps) {
  return (
    <AddSourceDialog
      open={open}
      onOpenChange={onOpenChange}
      onAdd={onAdd}
      title="Add income source"
      namePlaceholder="My Employer"
      submitLabel="Add income source"
    />
  );
}
