"use client";

import { useCallback, useState } from "react";
import { computeProceedsAfterTax } from "@/lib/stock-utils";
import { parseCurrency } from "@/lib/format";

async function fetchStockPrice(symbol: string): Promise<number | null> {
  const res = await fetch(
    `/api/stock-price?symbol=${encodeURIComponent(symbol)}`,
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? "Failed to fetch price",
    );
  }
  const data = (await res.json()) as { price?: number };
  return typeof data.price === "number" ? data.price : null;
}

export interface UseStockPriceFetchOptions {
  onAmountComputed: (amount: string) => void;
}

export function useStockPriceFetch({
  onAmountComputed,
}: UseStockPriceFetchOptions) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (symbol: string, sharesStr: string, taxRateStr: string) => {
      const sym = symbol.trim().toUpperCase();
      if (!sym) {
        setError("Enter a stock symbol");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const p = await fetchStockPrice(sym);
        setPrice(p);
        if (p != null) {
          const shares = parseCurrency(sharesStr);
          const taxRate = parseCurrency(taxRateStr);
          const afterTax = computeProceedsAfterTax(shares, p, taxRate);
          if (afterTax > 0) {
            onAmountComputed(afterTax.toFixed(2));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch");
        setPrice(null);
      } finally {
        setLoading(false);
      }
    },
    [onAmountComputed],
  );

  const reset = useCallback(() => {
    setPrice(null);
    setError(null);
  }, []);

  return { fetch, price, loading, error, reset };
}
