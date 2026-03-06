"use client";

import { useEffect, useState } from "react";
import { addExpenseEvent } from "@/features/budget/infrastructure/store";
import { SELECT_NONE } from "@/lib/constants";
import {
  buildExpenseScheduleFromForm,
  getDefaultRecurringYearRange,
} from "@/features/budget/domain/schedule-builders";
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

interface AddExpenseEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string | null;
  minDate: string;
}

const defaultRecurringRange = getDefaultRecurringYearRange();

export function AddExpenseEventDialog({
  open,
  onOpenChange,
  initialDate,
  minDate,
}: AddExpenseEventDialogProps) {
  const [expEventName, setExpEventName] = useState("");
  const [expEventAmount, setExpEventAmount] = useState("");
  const [expEventCategory, setExpEventCategory] = useState("");
  const [expEventScheduleType, setExpEventScheduleType] = useState<
    "one-time" | "recurring" | "whole-month"
  >("one-time");
  const [expEventDate, setExpEventDate] = useState("");
  const [expEventDayOfMonth, setExpEventDayOfMonth] = useState("");
  const [expEventRecurringStartDate, setExpEventRecurringStartDate] =
    useState("");
  const [expEventRecurringEndDate, setExpEventRecurringEndDate] = useState("");

  useEffect(() => {
    if (!open) return;
    // Sync external open/initialDate to form state when dialog opens
    /* eslint-disable react-hooks/set-state-in-effect */
    if (initialDate) {
      setExpEventDate(initialDate);
    } else {
      setExpEventDate((prev) => prev || minDate);
    }
    if (
      expEventScheduleType === "whole-month" ||
      expEventScheduleType === "recurring"
    ) {
      const year = new Date().getFullYear();
      setExpEventRecurringStartDate((prev) =>
        !prev || prev.length < 7 ? `${year}-01` : prev,
      );
      setExpEventRecurringEndDate((prev) =>
        !prev || prev.length < 7 ? `${year}-12` : prev,
      );
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, minDate, initialDate, expEventScheduleType]);

  function handleExpEventScheduleTypeChange(
    v: "one-time" | "recurring" | "whole-month",
  ) {
    if (v === "whole-month" || v === "recurring") {
      setExpEventRecurringStartDate((prev) =>
        !prev || prev.length < 7 ? defaultRecurringRange.jan : prev,
      );
      setExpEventRecurringEndDate((prev) =>
        !prev || prev.length < 7 ? defaultRecurringRange.dec : prev,
      );
    }
    setExpEventScheduleType(v);
  }

  function closeDialog() {
    onOpenChange(false);
    setExpEventName("");
    setExpEventAmount("");
    setExpEventCategory("");
    setExpEventDate("");
    setExpEventDayOfMonth("");
    setExpEventRecurringStartDate("");
    setExpEventRecurringEndDate("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = expEventName.trim();
    if (!name) return;
    const amount = parseCurrency(expEventAmount);
    if (Number.isNaN(amount) || amount < 0) return;
    const schedule = buildExpenseScheduleFromForm(
      expEventScheduleType,
      expEventDate,
      expEventDayOfMonth,
      expEventRecurringStartDate,
      expEventRecurringEndDate,
    );
    if (!schedule) return;
    addExpenseEvent({
      label: name,
      amount,
      category: expEventCategory || undefined,
      schedule,
    });
    closeDialog();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add expected expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <ExpenseEventFormFields
            idPrefix="exp-event"
            category={expEventCategory}
            onCategoryChange={setExpEventCategory}
            label={expEventName}
            onLabelChange={setExpEventName}
            amount={expEventAmount}
            onAmountChange={setExpEventAmount}
            scheduleType={expEventScheduleType}
            onScheduleTypeChange={handleExpEventScheduleTypeChange}
            date={expEventDate}
            onDateChange={setExpEventDate}
            dayOfMonth={expEventDayOfMonth}
            onDayOfMonthChange={setExpEventDayOfMonth}
            recurringStartDate={expEventRecurringStartDate}
            onRecurringStartDateChange={setExpEventRecurringStartDate}
            recurringEndDate={expEventRecurringEndDate}
            onRecurringEndDateChange={setExpEventRecurringEndDate}
            selectNoneValue={SELECT_NONE}
          />
          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit">Add expected expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
