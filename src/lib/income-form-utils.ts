import type {
  PaycheckWithholdings,
  PaycheckDetails,
  StockSaleDetails,
} from "@/store/budget";
import { parseCurrency } from "@/lib/format";
import { PAYCHECK_WITHHOLDINGS, STOCK_INCOME_TYPES } from "@/lib/constants";

export { parseCurrency } from "@/lib/format";

/** Valid currency: non-NaN and >= 0. */
export function isValidAmount(n: number): boolean {
  return !Number.isNaN(n) && n >= 0;
}

/** Valid tax rate: 0–100. */
export function parseTaxRate(s: string): number | undefined {
  const r = parseCurrency(s);
  return !Number.isNaN(r) && r >= 0 && r <= 100 ? r : undefined;
}

export interface ParsedIncomeFormResult {
  amount: number;
  stockSaleDetails?: StockSaleDetails;
  paycheckDetails?: PaycheckDetails;
}

export interface PaycheckFormInputs {
  gross: string;
  withholdings: Record<string, string>;
}

export interface StockFormInputs {
  symbol: string;
  shares: string;
  taxRate: string;
}

/**
 * Compute take-home amount from paycheck form inputs (gross - withholdings).
 * Returns null if gross is invalid.
 */
export function computePaycheckTakeHome(
  inputs: PaycheckFormInputs,
): number | null {
  const gross = parseCurrency(inputs.gross);
  if (Number.isNaN(gross) || gross <= 0) return null;
  const totalWithheld = PAYCHECK_WITHHOLDINGS.reduce(
    (sum, { key }) =>
      sum + (parseCurrency(inputs.withholdings[key] ?? "") || 0),
    0,
  );
  return Math.max(0, gross - totalWithheld);
}

/**
 * Parse income form inputs into amount + optional stockSaleDetails/paycheckDetails.
 * Used by Add income, Edit income, and Onboarding step 2.
 */
export function parseIncomeFormFromInputs(
  incomeType: string,
  amountInput: string,
  paycheckInputs: PaycheckFormInputs | null,
  stockInputs: StockFormInputs | null,
): ParsedIncomeFormResult | null {
  const isPaycheck = incomeType === "paycheck";
  const isStock = STOCK_INCOME_TYPES.includes(
    incomeType as (typeof STOCK_INCOME_TYPES)[number],
  );

  if (isPaycheck && paycheckInputs) {
    const gross = parseCurrency(paycheckInputs.gross);
    if (!isValidAmount(gross)) return null;

    const withholdingsObj: PaycheckWithholdings = {};
    let totalWithheld = 0;
    for (const { key } of PAYCHECK_WITHHOLDINGS) {
      const v = parseCurrency(paycheckInputs.withholdings[key] ?? "");
      if (!Number.isNaN(v) && v >= 0) {
        withholdingsObj[key as keyof PaycheckWithholdings] = v;
        totalWithheld += v;
      }
    }

    return {
      amount: Math.max(0, gross - totalWithheld),
      paycheckDetails: {
        grossAmount: gross,
        withholdings: withholdingsObj,
      },
      stockSaleDetails: undefined,
    };
  }

  if (isStock && stockInputs) {
    const shares = parseCurrency(stockInputs.shares);
    const stockSaleDetails =
      stockInputs.symbol.trim() && !Number.isNaN(shares) && shares > 0
        ? {
            symbol: stockInputs.symbol.trim().toUpperCase(),
            shares,
            taxRate: parseTaxRate(stockInputs.taxRate),
          }
        : undefined;

    const amount = parseCurrency(amountInput);
    if (!isValidAmount(amount)) return null;

    return {
      amount,
      stockSaleDetails,
      paycheckDetails: undefined,
    };
  }

  const amount = parseCurrency(amountInput);
  if (!isValidAmount(amount)) return null;

  return {
    amount,
    stockSaleDetails: undefined,
    paycheckDetails: undefined,
  };
}
