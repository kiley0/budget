/**
 * Budget domain types.
 * Core entities and value objects for the budget feature.
 */

export type IncomeEventSchedule =
  | { type: "one-time"; date: string }
  | {
      type: "recurring";
      /** One or more days of the month (1–31). Sorted, deduplicated. */
      daysOfMonth: number[];
      startDate?: string;
      endDate?: string;
    };

/** Details for stock sale / RSU vesting income. Used when incomeType is stock_sale_proceeds or rsu_vesting. */
export interface StockSaleDetails {
  symbol: string;
  shares: number;
  /** Estimated tax rate 0–100. Used to compute expected proceeds after taxes. */
  taxRate?: number;
}

/** Withholdings for paycheck income. All amounts in dollars. */
export interface PaycheckWithholdings {
  federalTax?: number;
  stateTax?: number;
  socialSecurity?: number;
  medicare?: number;
  retirement401k?: number;
  healthInsurance?: number;
  hsa?: number;
  fsa?: number;
  other?: number;
}

/** Details for paycheck income. amount = grossAmount - sum(withholdings). */
export interface PaycheckDetails {
  grossAmount: number;
  withholdings?: PaycheckWithholdings;
}

export interface IncomeEvent {
  /** UUID */
  id: string;
  label: string;
  amount: number;
  /** Type of income (e.g. paycheck, dividends). */
  incomeType?: string;
  /** Stock symbol, shares, tax rate. Used when incomeType is stock_sale_proceeds or rsu_vesting. */
  stockSaleDetails?: StockSaleDetails;
  /** Gross and withholdings. Used when incomeType is paycheck. amount is net (take-home). */
  paycheckDetails?: PaycheckDetails;
  schedule: IncomeEventSchedule;
}

export type ExpenseEventSchedule =
  | { type: "one-time"; date: string }
  | {
      type: "recurring";
      /** One or more days of the month (1–31). Sorted, deduplicated. */
      daysOfMonth: number[];
      startDate?: string;
      endDate?: string;
    }
  | {
      type: "whole-month";
      startDate?: string;
      endDate?: string;
    };

export interface ExpenseEvent {
  /** UUID */
  id: string;
  label: string;
  amount: number;
  /** Category key from a predefined list (e.g. "rent", "groceries"). */
  category?: string;
  schedule: ExpenseEventSchedule;
}

export interface MonthActuals {
  /** Actual amount received for each income event. Key: event id. */
  actualIncomeByEventId?: Record<string, number>;
  /** Actual amount paid for each expense event. Key: event id. */
  actualExpenseByEventId?: Record<string, number>;
}

export interface BudgetState {
  /** Unique ID for this budget (used in URL and sync path). */
  budgetId: string;
  version: number;
  updatedAt: string;
  incomeEvents: IncomeEvent[];
  expenseEvents: ExpenseEvent[];
  /** Actual income/expenses by month. Key: "YYYY-MM". */
  actualsByMonth?: Record<string, MonthActuals>;
  /** Schema version for migrations. Omit in old data; inferred during migrateBudget. */
  schemaVersion?: number;
  [key: string]: unknown;
}

/** Key for a month: "YYYY-MM". */
export function getMonthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

/** Create default budget state for a new budget. */
export function getDefaultState(budgetId: string): BudgetState {
  return {
    budgetId,
    version: 1,
    updatedAt: new Date().toISOString(),
    incomeEvents: [],
    expenseEvents: [],
    actualsByMonth: {},
    schemaVersion: 2,
  };
}
