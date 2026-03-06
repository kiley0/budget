/**
 * Compute proceeds after tax for stock sale: (shares × price) × (1 - rate/100).
 * Returns 0 if shares is invalid or <= 0.
 */
export function computeProceedsAfterTax(
  shares: number,
  pricePerShare: number,
  taxRatePercent: number,
): number {
  if (shares <= 0 || Number.isNaN(shares)) return 0;
  const rate =
    Number.isNaN(taxRatePercent) || taxRatePercent < 0
      ? 0
      : Math.min(100, taxRatePercent);
  const gross = shares * pricePerShare;
  return gross * (1 - rate / 100);
}
