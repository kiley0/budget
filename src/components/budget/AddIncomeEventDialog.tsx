"use client";

import { useEffect, useState } from "react";
import { addIncomeEvent } from "@/store/budget";
import { SELECT_NONE, STOCK_INCOME_TYPES } from "@/lib/constants";
import {
  buildIncomeScheduleFromForm,
  getDefaultRecurringYearRange,
} from "@/lib/schedule-builders";
import { parseIncomeFormFromInputs } from "@/lib/income-form-utils";
import { useStockPriceFetch } from "@/hooks/useStockPriceFetch";
import { IncomeEventFormFields } from "./IncomeEventFormFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddIncomeEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string | null;
  minDate: string;
}

const defaultRecurringRange = getDefaultRecurringYearRange();

export function AddIncomeEventDialog({
  open,
  onOpenChange,
  initialDate,
  minDate,
}: AddIncomeEventDialogProps) {
  const [eventLabel, setEventLabel] = useState("");
  const [eventAmount, setEventAmount] = useState("");
  const [eventIncomeType, setEventIncomeType] = useState("");
  const [eventStockSymbol, setEventStockSymbol] = useState("");
  const [eventShares, setEventShares] = useState("");
  const [eventStockTaxRate, setEventStockTaxRate] = useState("");
  const addStockFetch = useStockPriceFetch({
    onAmountComputed: setEventAmount,
  });
  const [eventPaycheckGross, setEventPaycheckGross] = useState("");
  const [eventPaycheckWithholdings, setEventPaycheckWithholdings] = useState<
    Record<string, string>
  >({});
  const [eventScheduleType, setEventScheduleType] = useState<
    "one-time" | "recurring"
  >("one-time");
  const [eventDate, setEventDate] = useState("");
  const [eventDayOfMonth, setEventDayOfMonth] = useState("");
  const [eventRecurringStartDate, setEventRecurringStartDate] = useState("");
  const [eventRecurringEndDate, setEventRecurringEndDate] = useState("");

  useEffect(() => {
    if (!open) return;
    // Sync external open/initialDate to form state when dialog opens
    /* eslint-disable react-hooks/set-state-in-effect */
    if (initialDate) {
      setEventDate(initialDate);
    } else {
      setEventDate((prev) => prev || minDate);
    }
    if (eventScheduleType === "recurring") {
      setEventRecurringStartDate((prev) =>
        !prev || prev.length < 7 ? defaultRecurringRange.jan : prev,
      );
      setEventRecurringEndDate((prev) =>
        !prev || prev.length < 7 ? defaultRecurringRange.dec : prev,
      );
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, minDate, initialDate, eventScheduleType]);

  function handleEventScheduleTypeChange(
    v: "one-time" | "recurring" | "whole-month",
  ) {
    if (v !== "one-time" && v !== "recurring") return;
    if (v === "recurring") {
      setEventRecurringStartDate((prev) =>
        !prev || prev.length < 7 ? defaultRecurringRange.jan : prev,
      );
      setEventRecurringEndDate((prev) =>
        !prev || prev.length < 7 ? defaultRecurringRange.dec : prev,
      );
    }
    setEventScheduleType(v);
  }

  function closeDialog() {
    onOpenChange(false);
    setEventLabel("");
    setEventAmount("");
    setEventIncomeType("");
    setEventStockSymbol("");
    setEventShares("");
    setEventStockTaxRate("");
    addStockFetch.reset();
    setEventPaycheckGross("");
    setEventPaycheckWithholdings({});
    setEventDate("");
    setEventDayOfMonth("");
    setEventRecurringStartDate("");
    setEventRecurringEndDate("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const label = eventLabel.trim();
    if (!label) return;
    const schedule = buildIncomeScheduleFromForm(
      eventScheduleType,
      eventDate,
      eventDayOfMonth,
      eventRecurringStartDate,
      eventRecurringEndDate,
    );
    if (!schedule) return;

    const parsed = parseIncomeFormFromInputs(
      eventIncomeType,
      eventAmount,
      eventIncomeType === "paycheck"
        ? { gross: eventPaycheckGross, withholdings: eventPaycheckWithholdings }
        : null,
      STOCK_INCOME_TYPES.includes(
        eventIncomeType as (typeof STOCK_INCOME_TYPES)[number],
      )
        ? {
            symbol: eventStockSymbol,
            shares: eventShares,
            taxRate: eventStockTaxRate,
          }
        : null,
    );
    if (!parsed) return;

    addIncomeEvent({
      label,
      amount: parsed.amount,
      incomeType: eventIncomeType || undefined,
      stockSaleDetails: parsed.stockSaleDetails,
      paycheckDetails: parsed.paycheckDetails,
      schedule,
    });
    closeDialog();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add expected income</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <IncomeEventFormFields
            idPrefix="event"
            incomeType={eventIncomeType}
            onIncomeTypeChange={(v) => {
              const next = v === SELECT_NONE ? "" : v;
              setEventIncomeType(next);
              if (
                !STOCK_INCOME_TYPES.includes(
                  next as (typeof STOCK_INCOME_TYPES)[number],
                )
              ) {
                setEventStockSymbol("");
                setEventShares("");
                setEventStockTaxRate("");
                addStockFetch.reset();
              }
              if (next !== "paycheck") {
                setEventPaycheckGross("");
                setEventPaycheckWithholdings({});
              }
            }}
            stockSymbol={eventStockSymbol}
            stockShares={eventShares}
            stockTaxRate={eventStockTaxRate}
            onStockSymbolChange={setEventStockSymbol}
            onStockSharesChange={setEventShares}
            onStockTaxRateChange={setEventStockTaxRate}
            stockFetch={addStockFetch}
            paycheckGross={eventPaycheckGross}
            paycheckWithholdings={eventPaycheckWithholdings}
            onPaycheckGrossChange={setEventPaycheckGross}
            onPaycheckWithholdingChange={(key, v) =>
              setEventPaycheckWithholdings((prev) => ({ ...prev, [key]: v }))
            }
            label={eventLabel}
            onLabelChange={setEventLabel}
            amount={eventAmount}
            onAmountChange={setEventAmount}
            scheduleType={eventScheduleType}
            onScheduleTypeChange={handleEventScheduleTypeChange}
            date={eventDate}
            onDateChange={setEventDate}
            dayOfMonth={eventDayOfMonth}
            onDayOfMonthChange={setEventDayOfMonth}
            recurringStartDate={eventRecurringStartDate}
            onRecurringStartDateChange={setEventRecurringStartDate}
            recurringEndDate={eventRecurringEndDate}
            onRecurringEndDateChange={setEventRecurringEndDate}
            selectNoneValue={SELECT_NONE}
          />
          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit">Add expected income</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
