"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, parseCurrency } from "@/lib/format";
import { computeProceedsAfterTax } from "@/lib/stock-utils";
export interface StockIncomeFormProps {
  idPrefix: string;
  symbol: string;
  shares: string;
  taxRate: string;
  onSymbolChange: (v: string) => void;
  onSharesChange: (v: string) => void;
  onTaxRateChange: (v: string) => void;
  stockFetch: {
    fetch: (symbol: string, sharesStr: string, taxRateStr: string) => void;
    price: number | null;
    loading: boolean;
    error: string | null;
    reset: () => void;
  };
}

export function StockIncomeForm({
  idPrefix,
  symbol,
  shares,
  taxRate,
  onSymbolChange,
  onSharesChange,
  onTaxRateChange,
  stockFetch,
}: StockIncomeFormProps) {
  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
      <p className="text-sm font-medium text-foreground">Stock details</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-symbol`}>Symbol</Label>
          <Input
            id={`${idPrefix}-symbol`}
            value={symbol}
            onChange={(e) => {
              onSymbolChange(e.target.value.toUpperCase());
              stockFetch.reset();
            }}
            placeholder="e.g. AAPL"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-shares`}>Shares</Label>
          <Input
            id={`${idPrefix}-shares`}
            type="number"
            min={0}
            step="any"
            value={shares}
            onChange={(e) => onSharesChange(e.target.value)}
            placeholder="100"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-tax`}>
          Tax rate %{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={`${idPrefix}-tax`}
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={taxRate}
          onChange={(e) => onTaxRateChange(e.target.value)}
          placeholder="e.g. 37"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => stockFetch.fetch(symbol, shares, taxRate)}
        disabled={!symbol.trim() || stockFetch.loading}
      >
        {stockFetch.loading ? "Fetching…" : "Fetch current price"}
      </Button>
      {stockFetch.error && (
        <p className="text-sm text-destructive">{stockFetch.error}</p>
      )}
      {stockFetch.price != null && (
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            Current price: {formatCurrency(stockFetch.price)}
          </p>
          {(() => {
            const sharesNum = parseCurrency(shares);
            const taxRateNum = parseCurrency(taxRate);
            if (Number.isNaN(sharesNum) || sharesNum <= 0) return null;
            const afterTax = computeProceedsAfterTax(
              sharesNum,
              stockFetch.price!,
              taxRateNum,
            );
            const gross = sharesNum * stockFetch.price!;
            return (
              <>
                <p className="text-muted-foreground">
                  Gross: {formatCurrency(gross)}
                </p>
                <p className="font-medium text-foreground">
                  Expected after tax: {formatCurrency(afterTax)}
                </p>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
