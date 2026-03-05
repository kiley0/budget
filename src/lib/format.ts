/** Parse a currency string (handles commas) to number. Returns NaN if invalid. */
export function parseCurrency(s: string): number {
  return parseFloat(String(s ?? "").replace(/,/g, ""));
}

/** Format a number as USD currency. */
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(n);
}

/** Returns "positive" (emerald) or "negative" (destructive) for amount display. */
export function getAmountVariant(amount: number): "positive" | "negative" {
  return amount >= 0 ? "positive" : "negative";
}
