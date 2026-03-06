"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BudgetTitleSectionProps {
  budgetName: string;
  isEditing: boolean;
  onBudgetNameChange: (value: string) => void;
  onEditClick: () => void;
  onDoneEdit: () => void;
  onBlur?: (value: string) => void;
  onManageIncome: () => void;
  onManageExpenses: () => void;
  onYearlySummary: () => void;
}

export function BudgetTitleSection({
  budgetName,
  isEditing,
  onBudgetNameChange,
  onEditClick,
  onDoneEdit,
  onBlur,
  onManageIncome,
  onManageExpenses,
  onYearlySummary,
}: BudgetTitleSectionProps) {
  if (isEditing) {
    return (
      <>
        <div className="space-y-2">
          <Label
            htmlFor="budget-name"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Budget name
          </Label>
          <Input
            id="budget-name"
            type="text"
            value={budgetName}
            onChange={(e) => onBudgetNameChange(e.target.value)}
            onBlur={(e) => {
              const value =
                (e.target as HTMLInputElement).value.trim() || undefined;
              onBlur?.(value ?? "");
            }}
            placeholder="e.g. Personal, Household"
            className="text-lg font-semibold"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onDoneEdit();
            }}
          >
            Done
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {budgetName || "My Budget"}
            </h1>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-primary"
              onClick={onEditClick}
            >
              Edit
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onManageIncome}
          >
            Manage income
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onManageExpenses}
          >
            Manage expenses
          </Button>
          <Button type="button" size="sm" onClick={onYearlySummary}>
            View Yearly Summary
          </Button>
        </div>
      </div>
    </div>
  );
}
