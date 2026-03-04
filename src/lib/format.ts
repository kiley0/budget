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
