import { DAY_OF_MONTH_MIN, DAY_OF_MONTH_MAX } from "@/lib/constants";
import type {
  BudgetState,
  IncomeEvent,
  ExpenseEvent,
  ExpenseEventSchedule,
  MonthActuals,
  IncomeEventSchedule,
  StockSaleDetails,
  PaycheckDetails,
} from "./types";

/**
 * Schema version for budget data. Increment when making breaking changes.
 * Used for self-healing: old budgets are migrated to current schema on load/import.
 */
export const CURRENT_SCHEMA_VERSION = 5;

/** Infer schema version from raw data shape (for data without explicit schemaVersion). */
function inferSchemaVersion(o: Record<string, unknown>): number {
  if (typeof o.schemaVersion === "number" && o.schemaVersion >= 1) {
    return o.schemaVersion;
  }
  // Pre-schemaVersion data: expenseSources = v1, expenseDestinations = v2
  if (Array.isArray(o.expenseDestinations)) return 2;
  if (Array.isArray(o.expenseSources)) return 1;
  return 1;
}

/** Generate a UUID v4. */
function generateId(): string {
  return crypto.randomUUID();
}

/** Parse days of month from unknown. Handles dayOfMonth, daysOfMonth, days_of_month. */
function parseDaysOfMonth(o: Record<string, unknown>): number[] {
  const days = o.daysOfMonth ?? o.days_of_month;
  if (Array.isArray(days)) {
    const nums = days
      .map((d) => Number(d))
      .filter(
        (n) =>
          !Number.isNaN(n) && n >= DAY_OF_MONTH_MIN && n <= DAY_OF_MONTH_MAX,
      );
    if (nums.length > 0) {
      return [...new Set(nums)].sort((a, b) => a - b);
    }
  }
  const day = Number(o.dayOfMonth ?? o.day_of_month ?? 1);
  const d =
    Number.isNaN(day) || day < DAY_OF_MONTH_MIN || day > DAY_OF_MONTH_MAX
      ? DAY_OF_MONTH_MIN
      : Math.round(day);
  return [d];
}

/** Parse schedule from unknown. Handles snake_case (day_of_month, start_date, end_date). */
function parseSchedule(s: unknown): IncomeEventSchedule {
  if (s && typeof s === "object") {
    const o = s as Record<string, unknown>;
    const t = o.type;
    const recur = t === "recurring";
    if (recur) {
      const start = o.startDate ?? o.start_date;
      const end = o.endDate ?? o.end_date;
      return {
        type: "recurring",
        daysOfMonth: parseDaysOfMonth(o),
        ...(typeof start === "string" &&
          start.trim() && { startDate: start.trim() }),
        ...(typeof end === "string" && end.trim() && { endDate: end.trim() }),
      };
    }
    const date = o.date;
    if (typeof date === "string" && date.trim())
      return { type: "one-time", date: date.trim() };
  }
  return { type: "one-time", date: "2020-01-01" };
}

/** Parse expense schedule from unknown. Handles whole-month in addition to one-time and recurring. */
function parseExpenseSchedule(s: unknown): ExpenseEventSchedule {
  if (s && typeof s === "object") {
    const o = s as Record<string, unknown>;
    const t = o.type;
    if (t === "whole-month") {
      const start = o.startDate ?? o.start_date;
      const end = o.endDate ?? o.end_date;
      return {
        type: "whole-month",
        ...(typeof start === "string" &&
          start.trim() && { startDate: start.trim() }),
        ...(typeof end === "string" && end.trim() && { endDate: end.trim() }),
      };
    }
  }
  return parseSchedule(s) as ExpenseEventSchedule;
}

/** Parse stock sale details. */
function parseStockSaleDetails(d: unknown): StockSaleDetails | undefined {
  if (!d || typeof d !== "object") return undefined;
  const o = d as Record<string, unknown>;
  const sym = typeof o.symbol === "string" ? o.symbol.trim() : "";
  const shares = Number(o.shares);
  if (!sym || Number.isNaN(shares) || shares <= 0) return undefined;
  const taxRate =
    typeof o.taxRate === "number" && o.taxRate >= 0 && o.taxRate <= 100
      ? o.taxRate
      : undefined;
  return { symbol: sym.toUpperCase(), shares, taxRate };
}

/** Parse paycheck details. */
function parsePaycheckDetails(d: unknown): PaycheckDetails | undefined {
  if (!d || typeof d !== "object") return undefined;
  const o = d as Record<string, unknown>;
  const grossAmount = Number(o.grossAmount);
  if (Number.isNaN(grossAmount) || grossAmount < 0) return undefined;
  const w = o.withholdings;
  if (!w || typeof w !== "object") return { grossAmount } as PaycheckDetails;
  const wo = w as Record<string, unknown>;
  const num = (v: unknown) => {
    const n = Number(v);
    return !Number.isNaN(n) && n >= 0 ? n : undefined;
  };
  const withholdings: PaycheckDetails["withholdings"] = {};
  const keys = [
    "federalTax",
    "stateTax",
    "socialSecurity",
    "medicare",
    "retirement401k",
    "healthInsurance",
    "hsa",
    "fsa",
    "other",
  ] as const;
  for (const key of keys) {
    const v = num(wo[key]);
    if (v !== undefined) withholdings[key] = v;
  }
  return {
    grossAmount,
    withholdings:
      Object.keys(withholdings).length > 0 ? withholdings : undefined,
  } as PaycheckDetails;
}

/** Parse income events from array. */
function parseIncomeEvents(arr: unknown[]): IncomeEvent[] {
  return arr.map((item: unknown) => {
    if (!item || typeof item !== "object")
      return {
        id: generateId(),
        label: "",
        amount: 0,
        schedule: { type: "one-time" as const, date: "2020-01-01" },
      };
    const x = item as Record<string, unknown>;
    const amount = Number(x.amount);
    return {
      id: typeof x.id === "string" && x.id ? x.id : generateId(),
      label: String(x.label ?? x.name ?? ""),
      amount: Number.isNaN(amount) || amount < 0 ? 0 : amount,
      incomeType: typeof x.incomeType === "string" ? x.incomeType : undefined,
      stockSaleDetails: parseStockSaleDetails(x.stockSaleDetails),
      paycheckDetails: parsePaycheckDetails(x.paycheckDetails),
      schedule: parseSchedule(x.schedule),
    };
  });
}

/** Parse expense events from array. Drops expenseDestinationId / expenseSourceId (removed in v3). */
function parseExpenseEvents(arr: unknown[]): ExpenseEvent[] {
  return arr.map((item: unknown) => {
    if (!item || typeof item !== "object")
      return {
        id: generateId(),
        label: "",
        amount: 0,
        schedule: { type: "one-time" as const, date: "2020-01-01" },
      };
    const x = item as Record<string, unknown>;
    const amount = Number(x.amount);
    return {
      id: typeof x.id === "string" && x.id ? x.id : generateId(),
      label: String(x.label ?? x.name ?? ""),
      amount: Number.isNaN(amount) || amount < 0 ? 0 : amount,
      category: typeof x.category === "string" ? x.category : undefined,
      schedule: parseExpenseSchedule(x.schedule),
    };
  });
}

/** Parse actualsByMonth, normalizing old actualIncome/actualExpenses to new shape if needed. */
function parseActualsByMonth(
  raw: unknown,
): Record<string, MonthActuals> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const result: Record<string, MonthActuals> = {};
  for (const monthKey of Object.keys(o)) {
    const monthVal = o[monthKey];
    if (!monthVal || typeof monthVal !== "object") continue;
    const m = monthVal as Record<string, unknown>;
    const hasNew =
      (m.actualIncomeByEventId &&
        Object.keys(m.actualIncomeByEventId as object).length > 0) ||
      (m.actualExpenseByEventId &&
        Object.keys(m.actualExpenseByEventId as object).length > 0);
    if (hasNew) {
      result[monthKey] = {
        actualIncomeByEventId: m.actualIncomeByEventId as
          | Record<string, number>
          | undefined,
        actualExpenseByEventId: m.actualExpenseByEventId as
          | Record<string, number>
          | undefined,
      };
    }
    // Old format (actualIncome, actualExpenses) cannot be migrated to per-event without event mapping;
    // we skip it rather than lose data silently. User would need to re-enter actuals.
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Migration v1 → v2: expenseSources → expenseDestinations, expenseSourceId → expenseDestinationId.
 */
function migrate1To2(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  if (
    Array.isArray(data.expenseSources) &&
    !Array.isArray(data.expenseDestinations)
  ) {
    out.expenseDestinations = data.expenseSources;
    delete out.expenseSources;
  }
  if (Array.isArray(data.expenseEvents)) {
    out.expenseEvents = (data.expenseEvents as Record<string, unknown>[]).map(
      (e) => {
        const ev = { ...e };
        if (
          ev.expenseSourceId !== undefined &&
          ev.expenseDestinationId === undefined
        ) {
          ev.expenseDestinationId = ev.expenseSourceId;
        }
        delete ev.expenseSourceId;
        return ev;
      },
    );
  }
  out.schemaVersion = 2;
  return out;
}

/**
 * Migration v2 → v3: remove expense destinations. Drop expenseDestinations and expenseDestinationId.
 */
function migrate2To3(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  delete out.expenseDestinations;
  delete out.expenseSources;
  if (Array.isArray(out.expenseEvents)) {
    out.expenseEvents = (out.expenseEvents as Record<string, unknown>[]).map(
      (e) => {
        const ev = { ...e };
        delete ev.expenseDestinationId;
        delete ev.expenseSourceId;
        return ev;
      },
    );
  }
  out.schemaVersion = 3;
  return out;
}

/** Convert dayOfMonth to daysOfMonth in recurring schedules. */
function convertScheduleDayToDays(s: unknown): unknown {
  if (!s || typeof s !== "object") return s;
  const o = s as Record<string, unknown>;
  if (o.type !== "recurring") return s;
  const days = o.daysOfMonth ?? o.days_of_month;
  if (Array.isArray(days) && days.length > 0) return s;
  const day = Number(o.dayOfMonth ?? o.day_of_month ?? 1);
  const d =
    Number.isNaN(day) || day < DAY_OF_MONTH_MIN || day > DAY_OF_MONTH_MAX
      ? DAY_OF_MONTH_MIN
      : Math.round(day);
  const rest = { ...o };
  delete rest.dayOfMonth;
  delete rest.day_of_month;
  delete rest.days_of_month;
  return { ...rest, type: "recurring", daysOfMonth: [d] };
}

/**
 * Migration v3 → v4: recurring dayOfMonth → daysOfMonth.
 */
function migrate3To4(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  if (Array.isArray(out.incomeEvents)) {
    out.incomeEvents = (out.incomeEvents as Record<string, unknown>[]).map(
      (e) => ({
        ...e,
        schedule: convertScheduleDayToDays(e.schedule),
      }),
    );
  }
  if (Array.isArray(out.expenseEvents)) {
    out.expenseEvents = (out.expenseEvents as Record<string, unknown>[]).map(
      (e) => ({
        ...e,
        schedule: convertScheduleDayToDays(e.schedule),
      }),
    );
  }
  out.schemaVersion = 4;
  return out;
}

/**
 * Migration v4 → v5: remove income sources. Drop incomeSources and incomeSourceId.
 */
function migrate4To5(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  delete out.incomeSources;
  if (Array.isArray(out.incomeEvents)) {
    out.incomeEvents = (out.incomeEvents as Record<string, unknown>[]).map(
      (e) => {
        const ev = { ...e };
        delete ev.incomeSourceId;
        return ev;
      },
    );
  }
  out.schemaVersion = 5;
  return out;
}

/**
 * Migrate raw budget data to current schema. Preserves all data.
 * Call this for both import (JSON) and load (decrypted storage).
 */
export function migrateBudget(
  data: unknown,
  currentBudgetId: string,
): BudgetState {
  const fallback: BudgetState = {
    budgetId: currentBudgetId,
    version: 1,
    updatedAt: new Date().toISOString(),
    incomeEvents: [],
    expenseEvents: [],
    actualsByMonth: {},
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };

  if (!data || typeof data !== "object") return fallback;
  let o = data as Record<string, unknown>;

  let schemaVersion = inferSchemaVersion(o);

  // Run migrations in sequence
  while (schemaVersion < CURRENT_SCHEMA_VERSION) {
    if (schemaVersion === 1) {
      o = migrate1To2(o) as Record<string, unknown>;
      schemaVersion = 2;
    } else if (schemaVersion === 2) {
      o = migrate2To3(o) as Record<string, unknown>;
      schemaVersion = 3;
    } else if (schemaVersion === 3) {
      o = migrate3To4(o) as Record<string, unknown>;
      schemaVersion = 4;
    } else if (schemaVersion === 4) {
      o = migrate4To5(o) as Record<string, unknown>;
      schemaVersion = 5;
    } else {
      break;
    }
  }

  const incomeEvents = Array.isArray(o.incomeEvents)
    ? parseIncomeEvents(o.incomeEvents)
    : [];
  const expenseEvents = Array.isArray(o.expenseEvents)
    ? parseExpenseEvents(o.expenseEvents)
    : [];
  const actualsByMonth =
    parseActualsByMonth(o.actualsByMonth) ?? o.actualsByMonth;

  return {
    budgetId: currentBudgetId,
    version: typeof o.version === "number" && o.version >= 1 ? o.version : 1,
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : new Date().toISOString(),
    incomeEvents,
    expenseEvents,
    actualsByMonth:
      actualsByMonth && typeof actualsByMonth === "object"
        ? (actualsByMonth as Record<string, MonthActuals>)
        : {},
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}
