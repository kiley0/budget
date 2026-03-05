"use client";

import { useState } from "react";
import {
  useBudgetStore,
  updateIncomeEvent,
  deleteIncomeEvent,
  type IncomeEvent,
} from "@/store/budget";
import {
  SELECT_NONE,
  STOCK_INCOME_TYPES,
  getIncomeTypeLabel,
} from "@/lib/constants";
import {
  buildIncomeScheduleFromForm,
  getDefaultRecurringYearRange,
} from "@/lib/schedule-builders";
import { formatIncomeSchedule } from "@/lib/schedule-format";
import { formatCurrency } from "@/lib/format";
import { incomeEventToFormState } from "@/lib/event-form-mappers";
import { parseIncomeFormFromInputs } from "@/lib/income-form-utils";
import { useStockPriceFetch } from "@/hooks/useStockPriceFetch";
import { IncomeEventFormFields } from "./IncomeEventFormFields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ManageIncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClick: () => void;
}

const defaultRecurringRange = getDefaultRecurringYearRange();

export function ManageIncomeModal({
  open,
  onOpenChange,
  onAddClick,
}: ManageIncomeModalProps) {
  const incomeEvents = useBudgetStore((s) => s.incomeEvents);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
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

  function startEditingEvent(event: IncomeEvent) {
    const form = incomeEventToFormState(event);
    setEditingEventId(event.id);
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
  }

  function cancelEditingEvent() {
    setEditingEventId(null);
  }

  function handleSaveEventEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEventId) return;
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

    updateIncomeEvent(editingEventId, {
      label: name,
      amount: parsed.amount,
      incomeType: editEventIncomeType || undefined,
      stockSaleDetails: parsed.stockSaleDetails,
      paycheckDetails: parsed.paycheckDetails,
      schedule,
    });
    cancelEditingEvent();
  }

  function handleDeleteEvent(id: string) {
    deleteIncomeEvent(id);
    if (editingEventId === id) cancelEditingEvent();
  }

  function handleAddClick() {
    onOpenChange(false);
    onAddClick();
  }

  const groups = [
    {
      label: "Recurring",
      events: incomeEvents.filter((e) => e.schedule.type === "recurring"),
    },
    {
      label: "One-off",
      events: incomeEvents.filter((e) => e.schedule.type === "one-time"),
    },
  ].filter((g) => g.events.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Income</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 py-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  Expected income
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddClick}
                >
                  Add expected income
                </Button>
              </div>
              {incomeEvents.length > 0 ? (
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
                                    onSubmit={handleSaveEventEdit}
                                    className="space-y-3"
                                  >
                                    <IncomeEventFormFields
                                      idPrefix={`edit-event-${event.id}`}
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
                                      onStockSymbolChange={
                                        setEditEventStockSymbol
                                      }
                                      onStockSharesChange={setEditEventShares}
                                      onStockTaxRateChange={
                                        setEditEventStockTaxRate
                                      }
                                      stockFetch={editStockFetch}
                                      paycheckGross={editEventPaycheckGross}
                                      paycheckWithholdings={
                                        editEventPaycheckWithholdings
                                      }
                                      onPaycheckGrossChange={
                                        setEditEventPaycheckGross
                                      }
                                      onPaycheckWithholdingChange={(key, v) =>
                                        setEditEventPaycheckWithholdings(
                                          (prev) => ({ ...prev, [key]: v }),
                                        )
                                      }
                                      label={editEventLabel}
                                      onLabelChange={setEditEventLabel}
                                      amount={editEventAmount}
                                      onAmountChange={setEditEventAmount}
                                      scheduleType={editEventScheduleType}
                                      onScheduleTypeChange={
                                        handleEditEventScheduleTypeChange
                                      }
                                      date={editEventDate}
                                      onDateChange={setEditEventDate}
                                      dayOfMonth={editEventDayOfMonth}
                                      onDayOfMonthChange={
                                        setEditEventDayOfMonth
                                      }
                                      recurringStartDate={
                                        editEventRecurringStartDate
                                      }
                                      onRecurringStartDateChange={
                                        setEditEventRecurringStartDate
                                      }
                                      recurringEndDate={
                                        editEventRecurringEndDate
                                      }
                                      onRecurringEndDateChange={
                                        setEditEventRecurringEndDate
                                      }
                                      selectNoneValue={SELECT_NONE}
                                      labelClassName="sr-only"
                                      amountLabelClassName="sr-only"
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
                                        onClick={cancelEditingEvent}
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
                                      · {formatIncomeSchedule(event.schedule)} ·{" "}
                                      {getIncomeTypeLabel(event.incomeType)}
                                      {event.stockSaleDetails != null && (
                                        <>
                                          {" "}
                                          · {event.stockSaleDetails.shares}{" "}
                                          shares {event.stockSaleDetails.symbol}
                                          {event.stockSaleDetails.taxRate !=
                                          null
                                            ? ` · ${event.stockSaleDetails.taxRate}% tax`
                                            : ""}
                                        </>
                                      )}
                                      {event.paycheckDetails != null && (
                                        <>
                                          {" "}
                                          · Gross:{" "}
                                          {formatCurrency(
                                            event.paycheckDetails.grossAmount,
                                          )}
                                        </>
                                      )}
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                      <Button
                                        type="button"
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-primary"
                                        onClick={() => startEditingEvent(event)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-destructive hover:text-destructive/90"
                                        onClick={() =>
                                          handleDeleteEvent(event.id)
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
                  No expected income yet.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
