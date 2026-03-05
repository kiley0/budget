# Source structure

This doc expands on the [root README](../README.md) with folder layout, conventions, and where to add new code.

## Folders

- **`app/`** — Next.js routes and layouts. `app/page.tsx` (home), `get-started/`, `budget/` (redirect + `[budgetId]`). Heavy UI lives in `components/`.
- **`components/`** — React UI. `components/budget/` = header, yearly summary, monthly P&L (no dialogs; those are inline on the budget page).
- **`hooks/`** — React hooks for shared state/derived data: `useBudgetMonthData`.
- **`lib/`** — Pure utilities (no React, no store): crypto, constants, formatting, schedule builders, import normalizers.
- **`store/`** — Zustand: `budget.ts` (state + load/save/CRUD), `session.ts` (key, isUnlocked).
- **`app/api/`** — API routes; `api/sync` for Vercel Blob GET/POST.

## Conventions

- **Constants & config** — `lib/constants.ts`: `ENCRYPTED_STORAGE_KEY_PREFIX`, `BUDGET_ID_STORAGE_KEY`, `EXPENSE_CATEGORIES`, `getExpenseCategoryLabel`.
- **Formatting** — `lib/schedule-format.ts`: schedule/date strings, `formatDayOrdinal` ("11th"), `formatIncomeSchedule` / `formatExpenseSchedule`.
- **Form → model** — `lib/schedule-builders.ts`: form values → `IncomeEventSchedule` / `ExpenseEventSchedule` (null if invalid).
- **Import/export** — `lib/import-normalizers.ts`: `normalizeImportedBudget()` turns JSON into current `BudgetState` (handles old/missing fields).
- **Month/year data** — `hooks/useBudgetMonthData(currentYear)`: per-month event lists and yearly totals for P&L and summary.

## Adding features

- New constants or category labels → `lib/constants.ts`.
- New schedule or date formatting → `lib/schedule-format.ts`.
- New “form values → store model” logic → `lib/` (e.g. schedule-builders or a new module).
- New shared UI state or derived data → `hooks/`.
- New budget UI sections or shared pieces → `components/budget/`, export from `components/budget/index.ts`.
