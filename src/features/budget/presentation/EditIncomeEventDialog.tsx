"use client";

import { useEffect, useState } from "react";
import {
  updateIncomeEvent,
  type IncomeEvent,
} from "@/features/budget/infrastructure/store";
import { SELECT_NONE, STOCK_INCOME_TYPES } from "@/lib/constants";
import {
  buildIncomeScheduleFromForm,
  getDefaultRecurringYearRange,
} from "@/features/budget/domain/schedule-builders";
import { incomeEventToFormState } from "@/features/budget/domain/event-form-mappers";
import { parseIncomeFormFromInputs } from "@/features/budget/domain/income-form-utils";
import { useStockPriceFetch } from "./hooks/useStockPriceFetch";
import { IncomeEventFormFields } from "./IncomeEventFormFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditIncomeEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: IncomeEvent | null;
}

const defaultRecurringRange = getDefaultRecurringYearRange();

export function EditIncomeEventDialog({
  open,
  onOpenChange,
  event,
}: EditIncomeEventDialogProps) {
  const [editEventLabel, setEditEventLabel] = useState("");
  const [editEventAmount, setEditEventAmount] = useState("");
  const [editEventIncomeType, setEditEventIncomeType] = useState("");
  const [editEventStockSymbol, setEditEventStockSymbol] = useState("");
  const [editEventShares, setEditEventShares] = useState("");
  const [editEventStockTaxRate, setEditEventStockTaxRate] = useState("");
  const editStockFetch = useStockPriceFetch({
    onAmountComputed: setEditEventAmount,
  });
  const [editEventPaycheckGross, setEditEventPaycheckGross] = useState("");
  const [editEventPaycheckWithholdings, setEditEventPaycheckWithholdings] =
    useState<Record<string, string>>({});
  const [editEventScheduleType, setEditEventScheduleType] = useState<
    "one-time" | "recurring"
  >("one-time");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventDayOfMonth, setEditEventDayOfMonth] = useState("");
  const [editEventRecurringStartDate, setEditEventRecurringStartDate] =
    useState("");
  const [editEventRecurringEndDate, setEditEventRecurringEndDate] =
    useState("");

  useEffect(() => {
    if (!open || !event) return;
    const form = incomeEventToFormState(event);
    setEditEventLabel(form.label);
    setEditEventAmount(form.amount);
    setEditEventIncomeType(form.incomeType);
    setEditEventStockSymbol(form.stockSymbol);
    setEditEventShares(form.shares);
    setEditEventStockTaxRate(form.taxRate);
    editStockFetch.reset();
    setEditEventPaycheckGross(form.paycheckGross);
    setEditEventPaycheckWithholdings(form.paycheckWithholdings);
    setEditEventScheduleType(form.scheduleType);
    setEditEventDate(form.date);
    setEditEventDayOfMonth(form.dayOfMonth);
    setEditEventRecurringStartDate(form.recurringStartDate);
    setEditEventRecurringEndDate(form.recurringEndDate);
    // editStockFetch.reset is stable; omit to avoid effect churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event]);

  function handleEditEventScheduleTypeChange(
    v: "one-time" | "recurring" | "whole-month",
  ) {
    if (v !== "one-time" && v !== "recurring") return;
    if (v === "recurring") {
      setEditEventRecurringStartDate((prev) =>
        !prev || prev.length < 7 ? defaultRecurringRange.jan : prev,
      );
      setEditEventRecurringEndDate((prev) =>
        !prev || prev.length < 7 ? defaultRecurringRange.dec : prev,
      );
    }
    setEditEventScheduleType(v);
  }

  function closeDialog() {
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    const name = editEventLabel.trim();
    if (!name) return;
    const schedule = buildIncomeScheduleFromForm(
      editEventScheduleType,
      editEventDate,
      editEventDayOfMonth,
      editEventRecurringStartDate,
      editEventRecurringEndDate,
    );
    if (!schedule) return;

    const parsed = parseIncomeFormFromInputs(
      editEventIncomeType,
      editEventAmount,
      editEventIncomeType === "paycheck"
        ? {
            gross: editEventPaycheckGross,
            withholdings: editEventPaycheckWithholdings,
          }
        : null,
      STOCK_INCOME_TYPES.includes(
        editEventIncomeType as (typeof STOCK_INCOME_TYPES)[number],
      )
        ? {
            symbol: editEventStockSymbol,
            shares: editEventShares,
            taxRate: editEventStockTaxRate,
          }
        : null,
    );
    if (!parsed) return;

    updateIncomeEvent(event.id, {
      label: name,
      amount: parsed.amount,
      incomeType: editEventIncomeType || undefined,
      stockSaleDetails: parsed.stockSaleDetails,
      paycheckDetails: parsed.paycheckDetails,
      schedule,
    });
    closeDialog();
  }

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit expected income</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <IncomeEventFormFields
            idPrefix={`edit-dialog-income-${event.id}`}
            incomeType={editEventIncomeType}
            onIncomeTypeChange={(v) => {
              const next = v === SELECT_NONE ? "" : v;
              setEditEventIncomeType(next);
              if (
                !STOCK_INCOME_TYPES.includes(
                  next as (typeof STOCK_INCOME_TYPES)[number],
                )
              ) {
                setEditEventStockSymbol("");
                setEditEventShares("");
                setEditEventStockTaxRate("");
                editStockFetch.reset();
              }
              if (next !== "paycheck") {
                setEditEventPaycheckGross("");
                setEditEventPaycheckWithholdings({});
              }
            }}
            stockSymbol={editEventStockSymbol}
            stockShares={editEventShares}
            stockTaxRate={editEventStockTaxRate}
            onStockSymbolChange={setEditEventStockSymbol}
            onStockSharesChange={setEditEventShares}
            onStockTaxRateChange={setEditEventStockTaxRate}
            stockFetch={editStockFetch}
            paycheckGross={editEventPaycheckGross}
            paycheckWithholdings={editEventPaycheckWithholdings}
            onPaycheckGrossChange={setEditEventPaycheckGross}
            onPaycheckWithholdingChange={(key, v) =>
              setEditEventPaycheckWithholdings((prev) => ({
                ...prev,
                [key]: v,
              }))
            }
            label={editEventLabel}
            onLabelChange={setEditEventLabel}
            amount={editEventAmount}
            onAmountChange={setEditEventAmount}
            scheduleType={editEventScheduleType}
            onScheduleTypeChange={handleEditEventScheduleTypeChange}
            date={editEventDate}
            onDateChange={setEditEventDate}
            dayOfMonth={editEventDayOfMonth}
            onDayOfMonthChange={setEditEventDayOfMonth}
            recurringStartDate={editEventRecurringStartDate}
            onRecurringStartDateChange={setEditEventRecurringStartDate}
            recurringEndDate={editEventRecurringEndDate}
            onRecurringEndDateChange={setEditEventRecurringEndDate}
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
