/**
 * Budget feature — public API.
 * Domain-driven structure: domain, application, infrastructure, presentation.
 */
export {
  getDefaultState,
  type BudgetState,
  type ExpenseEvent,
  type ExpenseEventSchedule,
  type IncomeEvent,
  type IncomeEventSchedule,
  type MonthActuals,
  type PaycheckDetails,
  type PaycheckWithholdings,
  type StockSaleDetails,
} from "./domain/types";
