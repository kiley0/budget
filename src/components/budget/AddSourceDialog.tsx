"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, description: string) => void;
  title: string;
  namePlaceholder: string;
  submitLabel: string;
}

function AddSourceForm({
  onAdd,
  onOpenChange,
  namePlaceholder,
  submitLabel,
}: Pick<
  AddSourceDialogProps,
  "onAdd" | "onOpenChange" | "namePlaceholder" | "submitLabel"
>) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, description.trim());
    onOpenChange(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="space-y-2">
        <Label htmlFor="add-source-name">Name</Label>
        <Input
          id="add-source-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={namePlaceholder}
          autoComplete="off"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="add-source-description">Description</Label>
        <Textarea
          id="add-source-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details"
          rows={2}
        />
      </div>
      <DialogFooter className="gap-2 pt-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}

export function AddSourceDialog({
  open,
  onOpenChange,
  onAdd,
  title,
  namePlaceholder,
  submitLabel,
}: AddSourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {open && (
          <AddSourceForm
            key="open"
            onAdd={onAdd}
            onOpenChange={onOpenChange}
            namePlaceholder={namePlaceholder}
            submitLabel={submitLabel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
