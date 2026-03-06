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
import { INCOME_TYPES, STOCK_INCOME_TYPES } from "@/lib/constants";
import { PaycheckIncomeForm } from "./PaycheckIncomeForm";
import type { ScheduleType } from "./ScheduleFields";
import { ScheduleFields } from "./ScheduleFields";
import { StockIncomeForm } from "./StockIncomeForm";

export interface IncomeEventFormFieldsProps {
  idPrefix: string;
  incomeType: string;
  /** Called with Select value (SELECT_NONE or type). Parent handles reset of stock/paycheck fields. */
  onIncomeTypeChange: (v: string) => void;
  // Stock fields
  stockSymbol: string;
  stockShares: string;
  stockTaxRate: string;
  onStockSymbolChange: (v: string) => void;
  onStockSharesChange: (v: string) => void;
  onStockTaxRateChange: (v: string) => void;
  stockFetch: {
    fetch: (symbol: string, sharesStr: string, taxRateStr: string) => void;
    price: number | null;
    loading: boolean;
    error: string | null;
    reset: () => void;
  };
  // Paycheck fields
  paycheckGross: string;
  paycheckWithholdings: Record<string, string>;
  onPaycheckGrossChange: (v: string) => void;
  onPaycheckWithholdingChange: (key: string, value: string) => void;
  // Common
  label: string;
  onLabelChange: (v: string) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  // Schedule
  scheduleType: "one-time" | "recurring";
  onScheduleTypeChange: (v: ScheduleType) => void;
  date: string;
  onDateChange: (v: string) => void;
  dayOfMonth: string;
  onDayOfMonthChange: (v: string) => void;
  recurringStartDate: string;
  onRecurringStartDateChange: (v: string) => void;
  recurringEndDate: string;
  onRecurringEndDateChange: (v: string) => void;
  selectNoneValue: string;
  /** Optional. Use "sr-only" for compact/inline contexts. */
  labelClassName?: string;
  amountLabelClassName?: string;
  scheduleLegendClassName?: string;
  scheduleAriaLabel?: string;
}

export function IncomeEventFormFields({
  idPrefix,
  incomeType,
  onIncomeTypeChange,
  stockSymbol,
  stockShares,
  stockTaxRate,
  onStockSymbolChange,
  onStockSharesChange,
  onStockTaxRateChange,
  stockFetch,
  paycheckGross,
  paycheckWithholdings,
  onPaycheckGrossChange,
  onPaycheckWithholdingChange,
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
  selectNoneValue,
  labelClassName,
  amountLabelClassName,
  scheduleLegendClassName,
  scheduleAriaLabel,
}: IncomeEventFormFieldsProps) {
  const isStockType = STOCK_INCOME_TYPES.includes(
    incomeType as (typeof STOCK_INCOME_TYPES)[number],
  );
  const isPaycheckType = incomeType === "paycheck";

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-type`} className={labelClassName}>
          Type
        </Label>
        <Select
          value={incomeType || selectNoneValue}
          onValueChange={onIncomeTypeChange}
        >
          <SelectTrigger id={`${idPrefix}-type`} className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={selectNoneValue}>Select type</SelectItem>
            {INCOME_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isStockType && (
        <StockIncomeForm
          idPrefix={`${idPrefix}-stock`}
          symbol={stockSymbol}
          shares={stockShares}
          taxRate={stockTaxRate}
          onSymbolChange={onStockSymbolChange}
          onSharesChange={onStockSharesChange}
          onTaxRateChange={onStockTaxRateChange}
          stockFetch={stockFetch}
        />
      )}
      {isPaycheckType && (
        <PaycheckIncomeForm
          idPrefix={`${idPrefix}-paycheck`}
          gross={paycheckGross}
          withholdings={paycheckWithholdings}
          onGrossChange={onPaycheckGrossChange}
          onWithholdingChange={onPaycheckWithholdingChange}
        />
      )}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`} className={labelClassName}>
          Label
        </Label>
        <Input
          id={`${idPrefix}-name`}
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="e.g. Paycheck"
          required
        />
      </div>
      {!isPaycheckType && (
        <div className="space-y-2">
          <Label
            htmlFor={`${idPrefix}-amount`}
            className={amountLabelClassName}
          >
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
      )}
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
