"use client";

import { useState } from "react";
import {
  useBudgetStore,
  updateExpenseEvent,
  deleteExpenseEvent,
  type ExpenseEvent,
} from "@/features/budget/infrastructure/store";
import { SELECT_NONE, getExpenseCategoryLabel } from "@/lib/constants";
import {
  buildExpenseScheduleFromForm,
  getDefaultRecurringYearRange,
} from "@/features/budget/domain/schedule-builders";
import { formatExpenseSchedule } from "@/features/budget/domain/schedule-format";
import { parseCurrency } from "@/lib/format";
import { expenseEventToFormState } from "@/features/budget/domain/event-form-mappers";
import { ExpenseEventFormFields } from "./ExpenseEventFormFields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ManageExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClick: () => void;
}

const defaultRecurringRange = getDefaultRecurringYearRange();

export function ManageExpenseModal({
  open,
  onOpenChange,
  onAddClick,
}: ManageExpenseModalProps) {
  const expenseEvents = useBudgetStore((s) => s.expenseEvents);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
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

  function startEditingExpenseEvent(event: ExpenseEvent) {
    const form = expenseEventToFormState(event);
    setEditingEventId(event.id);
    setEditExpEventName(form.label);
    setEditExpEventAmount(form.amount);
    setEditExpEventCategory(form.category);
    setEditExpEventScheduleType(form.scheduleType);
    setEditExpEventDate(form.date);
    setEditExpEventDayOfMonth(form.dayOfMonth);
    setEditExpEventRecurringStartDate(form.recurringStartDate);
    setEditExpEventRecurringEndDate(form.recurringEndDate);
  }

  function cancelEditingExpenseEvent() {
    setEditingEventId(null);
  }

  function handleSaveExpenseEventEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEventId) return;
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
    updateExpenseEvent(editingEventId, {
      label: name,
      amount,
      category: editExpEventCategory || undefined,
      schedule,
    });
    cancelEditingExpenseEvent();
  }

  function handleDeleteExpenseEvent(id: string) {
    deleteExpenseEvent(id);
    if (editingEventId === id) cancelEditingExpenseEvent();
  }

  function handleAddClick() {
    onOpenChange(false);
    onAddClick();
  }

  const groups = [
    {
      label: "Monthly total",
      events: expenseEvents.filter((e) => e.schedule.type === "whole-month"),
    },
    {
      label: "Recurring",
      events: expenseEvents.filter((e) => e.schedule.type === "recurring"),
    },
    {
      label: "One-off",
      events: expenseEvents.filter((e) => e.schedule.type === "one-time"),
    },
  ].filter((g) => g.events.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Expenses</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 py-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  Expected expenses
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddClick}
                >
                  Add expected expense
                </Button>
              </div>
              {expenseEvents.length > 0 ? (
                <>
                  {groups.map(({ label, events }) => (
                    <div key={label} className="mt-4 first:mt-3">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        {label}
                      </h4>
                      <ul className="mt-2 list-none space-y-2">
                        {events.map((event) => (
                          <li key={event.id}>
                            <Card className="bg-muted/50 px-4 py-3">
                              <CardContent className="p-0">
                                {editingEventId === event.id ? (
                                  <form
                                    onSubmit={handleSaveExpenseEventEdit}
                                    className="space-y-3"
                                  >
                                    <ExpenseEventFormFields
                                      idPrefix={`edit-exp-event-${event.id}`}
                                      category={editExpEventCategory}
                                      onCategoryChange={setEditExpEventCategory}
                                      label={editExpEventName}
                                      onLabelChange={setEditExpEventName}
                                      amount={editExpEventAmount}
                                      onAmountChange={setEditExpEventAmount}
                                      scheduleType={editExpEventScheduleType}
                                      onScheduleTypeChange={
                                        handleEditExpEventScheduleTypeChange
                                      }
                                      date={editExpEventDate}
                                      onDateChange={setEditExpEventDate}
                                      dayOfMonth={editExpEventDayOfMonth}
                                      onDayOfMonthChange={
                                        setEditExpEventDayOfMonth
                                      }
                                      recurringStartDate={
                                        editExpEventRecurringStartDate
                                      }
                                      onRecurringStartDateChange={
                                        setEditExpEventRecurringStartDate
                                      }
                                      recurringEndDate={
                                        editExpEventRecurringEndDate
                                      }
                                      onRecurringEndDateChange={
                                        setEditExpEventRecurringEndDate
                                      }
                                      labelClassName="sr-only"
                                      amountLabelClassName="sr-only"
                                      selectNoneValue={SELECT_NONE}
                                      scheduleLegendClassName="sr-only"
                                      scheduleAriaLabel="Schedule type"
                                    />
                                    <div className="flex gap-2">
                                      <Button type="submit" size="sm">
                                        Save
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={cancelEditingExpenseEvent}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </form>
                                ) : (
                                  <>
                                    <p className="font-medium text-foreground">
                                      {event.label}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {new Intl.NumberFormat(undefined, {
                                        style: "currency",
                                        currency: "USD",
                                      }).format(event.amount)}{" "}
                                      · {formatExpenseSchedule(event.schedule)}{" "}
                                      ·{" "}
                                      {getExpenseCategoryLabel(event.category)}
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                      <Button
                                        type="button"
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-primary"
                                        onClick={() =>
                                          startEditingExpenseEvent(event)
                                        }
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-destructive hover:text-destructive/90"
                                        onClick={() =>
                                          handleDeleteExpenseEvent(event.id)
                                        }
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </CardContent>
                            </Card>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No expected expenses yet.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
