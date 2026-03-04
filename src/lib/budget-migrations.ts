import { DAY_OF_MONTH_MIN, DAY_OF_MONTH_MAX } from "@/lib/constants";
import type {
  BudgetState,
  IncomeSource,
  IncomeEvent,
  ExpenseDestination,
  ExpenseEvent,
  MonthActuals,
  IncomeEventSchedule,
  StockSaleDetails,
  PaycheckDetails,
} from "@/store/budget";

/**
 * Schema version for budget data. Increment when making breaking changes.
 * Used for self-healing: old budgets are migrated to current schema on load/import.
 */
export const CURRENT_SCHEMA_VERSION = 2;

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

/** Parse schedule from unknown. Handles snake_case (day_of_month, start_date, end_date). */
function parseSchedule(s: unknown): IncomeEventSchedule {
  if (s && typeof s === "object") {
    const o = s as Record<string, unknown>;
    const t = o.type;
    const recur = t === "recurring";
    if (recur) {
      const day = Number(o.dayOfMonth ?? o.day_of_month ?? 1);
      const d =
        Number.isNaN(day) || day < DAY_OF_MONTH_MIN || day > DAY_OF_MONTH_MAX
          ? DAY_OF_MONTH_MIN
          : day;
      const start = o.startDate ?? o.start_date;
      const end = o.endDate ?? o.end_date;
      return {
        type: "recurring",
        dayOfMonth: d,
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

/** Parse income sources from array. */
function parseIncomeSources(arr: unknown[]): IncomeSource[] {
  return arr.map((item: unknown) => {
    if (!item || typeof item !== "object")
      return { id: generateId(), name: "", description: "" };
    const x = item as Record<string, unknown>;
    return {
      id: typeof x.id === "string" && x.id ? x.id : generateId(),
      name: String(x.name ?? ""),
      description: String(x.description ?? ""),
    };
  });
}

/** Parse expense destinations from array (v2 shape). */
function parseExpenseDestinations(arr: unknown[]): ExpenseDestination[] {
  return arr.map((item: unknown) => {
    if (!item || typeof item !== "object")
      return { id: generateId(), name: "", description: "" };
    const x = item as Record<string, unknown>;
    return {
      id: typeof x.id === "string" && x.id ? x.id : generateId(),
      name: String(x.name ?? ""),
      description: String(x.description ?? ""),
    };
  });
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
      incomeSourceId:
        typeof x.incomeSourceId === "string" ? x.incomeSourceId : undefined,
      incomeType: typeof x.incomeType === "string" ? x.incomeType : undefined,
      stockSaleDetails: parseStockSaleDetails(x.stockSaleDetails),
      paycheckDetails: parsePaycheckDetails(x.paycheckDetails),
      schedule: parseSchedule(x.schedule),
    };
  });
}

/** Parse expense events from array, with expenseDestinationId (v2) or expenseSourceId (v1). */
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
    const destId = x.expenseDestinationId ?? x.expenseSourceId;
    return {
      id: typeof x.id === "string" && x.id ? x.id : generateId(),
      label: String(x.label ?? x.name ?? ""),
      amount: Number.isNaN(amount) || amount < 0 ? 0 : amount,
      expenseDestinationId: typeof destId === "string" ? destId : undefined,
      category: typeof x.category === "string" ? x.category : undefined,
      schedule: parseSchedule(x.schedule),
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
    incomeSources: [],
    incomeEvents: [],
    expenseDestinations: [],
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
    } else {
      break;
    }
  }

  const incomeSources = Array.isArray(o.incomeSources)
    ? parseIncomeSources(o.incomeSources)
    : [];
  const destOrSrc = o.expenseDestinations ?? o.expenseSources;
  const expenseDestinations = Array.isArray(destOrSrc)
    ? parseExpenseDestinations(destOrSrc)
    : [];
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
    incomeSources,
    incomeEvents,
    expenseDestinations,
    expenseEvents,
    actualsByMonth:
      actualsByMonth && typeof actualsByMonth === "object"
        ? (actualsByMonth as Record<string, MonthActuals>)
        : {},
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}
