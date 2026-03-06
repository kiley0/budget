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

/** Fallback display name for a budget when metadata name is missing. */
export function budgetDisplayName(budgetId: string): string {
  return budgetId.length >= 8
    ? `Budget ${budgetId.slice(0, 8)}…`
    : `Budget ${budgetId}`;
}

/** Format an ISO date string for display (e.g. "Mar 4, 2026"). Returns "" if invalid. */
export function formatMetaDate(iso: string | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** "Last opened Mar 4, 2026" from lastAccessed ISO string, or "" if missing. */
export function formatLastOpened(lastAccessed: string | undefined): string {
  const last = formatMetaDate(lastAccessed);
  return last ? `Last opened ${last}` : "";
}

/** Parse ordinal day string to number (e.g. "1st" -> 1, "22nd" -> 22) for sorting. */
export function parseDayOrdinal(day: string): number {
  const n = parseInt(day.replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}
