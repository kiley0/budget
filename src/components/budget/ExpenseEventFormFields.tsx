"use client";

import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { ExpenseDestination } from "@/store/budget";
import { ScheduleFields } from "./ScheduleFields";

export interface ExpenseEventFormFieldsProps {
  idPrefix: string;
  destinations: ExpenseDestination[];
  destinationId: string;
  onDestinationIdChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  label: string;
  onLabelChange: (v: string) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  scheduleType: "one-time" | "recurring";
  onScheduleTypeChange: (v: "one-time" | "recurring") => void;
  date: string;
  onDateChange: (v: string) => void;
  dayOfMonth: string;
  onDayOfMonthChange: (v: string) => void;
  recurringStartDate: string;
  onRecurringStartDateChange: (v: string) => void;
  recurringEndDate: string;
  onRecurringEndDateChange: (v: string) => void;
  /** Optional. Use "sr-only" for compact/inline contexts. */
  labelClassName?: string;
  amountLabelClassName?: string;
  selectNoneValue: string;
  scheduleLegendClassName?: string;
  scheduleAriaLabel?: string;
}

export function ExpenseEventFormFields({
  idPrefix,
  destinations,
  destinationId,
  onDestinationIdChange,
  category,
  onCategoryChange,
  label,
  onLabelChange,
  amount,
  onAmountChange,
  scheduleType,
  onScheduleTypeChange,
  date,
  onDateChange,
  dayOfMonth,
  onDayOfMonthChange,
  recurringStartDate,
  onRecurringStartDateChange,
  recurringEndDate,
  onRecurringEndDateChange,
  labelClassName,
  amountLabelClassName,
  selectNoneValue,
  scheduleLegendClassName,
  scheduleAriaLabel,
}: ExpenseEventFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-destination`} className={labelClassName}>
          Destination
        </Label>
        <Select
          value={destinationId || selectNoneValue}
          onValueChange={(v) =>
            onDestinationIdChange(v === selectNoneValue ? "" : v)
          }
        >
          <SelectTrigger id={`${idPrefix}-destination`} className="w-full">
            <SelectValue placeholder="Select a destination" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={selectNoneValue}>
              Select a destination
            </SelectItem>
            {destinations.map((dest) => (
              <SelectItem key={dest.id} value={dest.id}>
                {dest.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-category`} className={labelClassName}>
          Category
        </Label>
        <Select
          value={category || selectNoneValue}
          onValueChange={(v) =>
            onCategoryChange(v === selectNoneValue ? "" : v)
          }
        >
          <SelectTrigger id={`${idPrefix}-category`} className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={selectNoneValue}>Select a category</SelectItem>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`} className={labelClassName}>
          Label
        </Label>
        <Input
          id={`${idPrefix}-name`}
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="e.g. Rent payment"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-amount`} className={amountLabelClassName}>
          Amount
        </Label>
        <CurrencyInput
          id={`${idPrefix}-amount`}
          value={amount}
          onChange={onAmountChange}
          min={0}
          placeholder="0.00"
          required
        />
      </div>
      <ScheduleFields
        scheduleType={scheduleType}
        onScheduleTypeChange={onScheduleTypeChange}
        date={date}
        onDateChange={onDateChange}
        dayOfMonth={dayOfMonth}
        onDayOfMonthChange={onDayOfMonthChange}
        recurringStartDate={recurringStartDate}
        onRecurringStartDateChange={onRecurringStartDateChange}
        recurringEndDate={recurringEndDate}
        onRecurringEndDateChange={onRecurringEndDateChange}
        idPrefix={idPrefix}
        legendClassName={scheduleLegendClassName}
        ariaLabel={scheduleAriaLabel}
      />
    </>
  );
}
