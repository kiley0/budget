"use client";

import { useEffect, useState } from "react";
import {
  updateExpenseEvent,
  type ExpenseEvent,
} from "@/features/budget/infrastructure/store";
import { SELECT_NONE } from "@/lib/constants";
import {
  buildExpenseScheduleFromForm,
  getDefaultRecurringYearRange,
} from "@/features/budget/domain/schedule-builders";
import { expenseEventToFormState } from "@/features/budget/domain/event-form-mappers";
import { parseCurrency } from "@/lib/format";
import { ExpenseEventFormFields } from "./ExpenseEventFormFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditExpenseEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ExpenseEvent | null;
}

const defaultRecurringRange = getDefaultRecurringYearRange();

export function EditExpenseEventDialog({
  open,
  onOpenChange,
  event,
}: EditExpenseEventDialogProps) {
  const [editExpEventName, setEditExpEventName] = useState("");
  const [editExpEventAmount, setEditExpEventAmount] = useState("");
  const [editExpEventCategory, setEditExpEventCategory] = useState("");
  const [editExpEventScheduleType, setEditExpEventScheduleType] = useState<
    "one-time" | "recurring" | "whole-month"
  >("one-time");
  const [editExpEventDate, setEditExpEventDate] = useState("");
  const [editExpEventDayOfMonth, setEditExpEventDayOfMonth] = useState("");
  const [editExpEventRecurringStartDate, setEditExpEventRecurringStartDate] =
    useState("");
  const [editExpEventRecurringEndDate, setEditExpEventRecurringEndDate] =
    useState("");

  useEffect(() => {
    if (!open || !event) return;
    const form = expenseEventToFormState(event);
    /* eslint-disable react-hooks/set-state-in-effect -- populate form from event when dialog opens */
    setEditExpEventName(form.label);
    setEditExpEventAmount(form.amount);
    setEditExpEventCategory(form.category);
    setEditExpEventScheduleType(form.scheduleType);
    setEditExpEventDate(form.date);
    setEditExpEventDayOfMonth(form.dayOfMonth);
    setEditExpEventRecurringStartDate(form.recurringStartDate);
    setEditExpEventRecurringEndDate(form.recurringEndDate);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, event]);

  function handleEditExpEventScheduleTypeChange(
    v: "one-time" | "recurring" | "whole-month",
  ) {
    if (v === "whole-month" || v === "recurring") {
      setEditExpEventRecurringStartDate((prev) =>
        !prev || prev.length < 7 ? defaultRecurringRange.jan : prev,
      );
      setEditExpEventRecurringEndDate((prev) =>
        !prev || prev.length < 7 ? defaultRecurringRange.dec : prev,
      );
    }
    setEditExpEventScheduleType(v);
  }

  function closeDialog() {
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    const name = editExpEventName.trim();
    if (!name) return;
    const amount = parseCurrency(editExpEventAmount);
    if (Number.isNaN(amount) || amount < 0) return;
    const schedule = buildExpenseScheduleFromForm(
      editExpEventScheduleType,
      editExpEventDate,
      editExpEventDayOfMonth,
      editExpEventRecurringStartDate,
      editExpEventRecurringEndDate,
    );
    if (!schedule) return;
    updateExpenseEvent(event.id, {
      label: name,
      amount,
      category: editExpEventCategory || undefined,
      schedule,
    });
    closeDialog();
  }

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit expected expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <ExpenseEventFormFields
            idPrefix={`edit-dialog-exp-${event.id}`}
            category={editExpEventCategory}
            onCategoryChange={setEditExpEventCategory}
            label={editExpEventName}
            onLabelChange={setEditExpEventName}
            amount={editExpEventAmount}
            onAmountChange={setEditExpEventAmount}
            scheduleType={editExpEventScheduleType}
            onScheduleTypeChange={handleEditExpEventScheduleTypeChange}
            date={editExpEventDate}
            onDateChange={setEditExpEventDate}
            dayOfMonth={editExpEventDayOfMonth}
            onDayOfMonthChange={setEditExpEventDayOfMonth}
            recurringStartDate={editExpEventRecurringStartDate}
            onRecurringStartDateChange={setEditExpEventRecurringStartDate}
            recurringEndDate={editExpEventRecurringEndDate}
            onRecurringEndDateChange={setEditExpEventRecurringEndDate}
            selectNoneValue={SELECT_NONE}
            scheduleLegendClassName="sr-only"
            scheduleAriaLabel="Schedule type"
          />
          <DialogFooter className="gap-2 pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
