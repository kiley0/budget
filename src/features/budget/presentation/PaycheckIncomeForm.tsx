"use client";

import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { PAYCHECK_WITHHOLDINGS } from "@/lib/constants";
import { computePaycheckTakeHome } from "@/features/budget/domain/income-form-utils";
import { formatCurrency } from "@/lib/format";

export interface PaycheckIncomeFormProps {
  idPrefix: string;
  gross: string;
  withholdings: Record<string, string>;
  onGrossChange: (v: string) => void;
  onWithholdingChange: (key: string, value: string) => void;
}

export function PaycheckIncomeForm({
  idPrefix,
  gross,
  withholdings,
  onGrossChange,
  onWithholdingChange,
}: PaycheckIncomeFormProps) {
  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
      <p className="text-sm font-medium text-foreground">Paycheck details</p>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-gross`}>Gross amount</Label>
        <CurrencyInput
          id={`${idPrefix}-gross`}
          value={gross}
          onChange={onGrossChange}
          min={0}
          placeholder="0.00"
          required
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Withholdings{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYCHECK_WITHHOLDINGS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={`${idPrefix}-${key}`}>{label}</Label>
              <CurrencyInput
                id={`${idPrefix}-${key}`}
                value={withholdings[key] ?? ""}
                onChange={(v) => onWithholdingChange(key, v)}
                min={0}
                placeholder="0"
              />
            </div>
          ))}
        </div>
        {(() => {
          const net = computePaycheckTakeHome({ gross, withholdings });
          if (net === null) return null;
          return (
            <p className="mt-2 font-medium text-foreground">
              Take-home (expected): {formatCurrency(net)}
            </p>
          );
        })()}
      </div>
    </div>
  );
}
