# Source structure

This doc expands on the [root README](../README.md) with folder layout, conventions, and where to add new code.

## Domain-Driven Design (DDD)

The app uses a feature-based DDD structure. Each feature in `src/features/` is organized by layer:

| Layer               | Purpose                                        | Contents                                                    |
| ------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| **domain/**         | Core business logic (pure, no React/store/I/O) | Entities, value objects, types, pure functions              |
| **infrastructure/** | External I/O and side effects                  | Zustand store, persistence, API clients, file export/import |
| **presentation/**   | UI and user interaction                        | React components, hooks, form logic                         |

**Dependency direction:** Domain has no dependencies on infrastructure or presentation. Infrastructure and presentation depend on domain types. Presentation may use infrastructure (e.g. store).

## Folders

- **`app/`** — Next.js routes and layouts. `app/page.tsx` (home), `get-started/`, `budget/` (redirect + `[budgetId]`). Pages compose features; no business logic in route files.
- **`features/`** — Feature modules with DDD layers:
  - **budget** — `domain/` (types, schedule-format, schedule-builders, date-view, event-form-mappers, yearly-summary, etc.), `infrastructure/` (store, persistence, export/import), `presentation/` (components, hooks).
  - **landing** — `domain/example-data.ts`, `presentation/` (LandingHero, ExamplePnLCard, etc.).
  - **session** — `infrastructure/store.ts`, `presentation/` (CreatePassphraseCard, UnlockExistingCard).
  - **legal** — `presentation/` (LegalPageLayout, LegalSection).
- **`components/`** — Shared UI only: `ui/` (shadcn primitives), `theme-provider`, `ErrorBoundary`. Feature-specific UI lives in `features/*/presentation/`.
- **`hooks/`** — Shared hooks (e.g. from shadcn). Feature-specific hooks in `features/*/presentation/hooks/`.
- **`lib/`** — Cross-cutting pure utilities (no React, no store): crypto, constants, format, utils, debounce. Feature-specific domain logic lives in `features/*/domain/`.
- **`store/`** — Removed. State lives in `features/budget/infrastructure/store.ts` and `features/session/infrastructure/store.ts`.
- **`app/api/`** — API routes; `api/sync` for Vercel Blob GET/POST.

## Conventions

- **Domain vs lib** — Feature-specific business logic → `features/<name>/domain/`. Cross-cutting utilities (crypto, constants, format) → `lib/`.
- **Constants & config** — `lib/constants.ts`: `ENCRYPTED_STORAGE_KEY_PREFIX`, `BUDGET_ID_STORAGE_KEY`, `EXPENSE_CATEGORIES`, `getExpenseCategoryLabel`.
- **Formatting** — `lib/format.ts`: `formatCurrency`, `parseCurrency`, `getAmountVariant`, `budgetDisplayName`, `formatMetaDate`, `formatLastOpened`. Schedule/date logic (`formatDayOrdinal`, etc.) → `features/budget/domain/schedule-format.ts`.
- **Form → model** — `features/budget/domain/schedule-builders.ts`: form values → `IncomeEventSchedule` / `ExpenseEventSchedule` (null if invalid).
- **Import/export** — `features/budget/infrastructure/budget-import.ts` and store `replaceBudgetFromExport`; migration via `features/budget/domain/budget-migrations.ts`.
- **Month/year data** — `features/budget/presentation/hooks/useBudgetMonthData(months)`: per-month event lists and yearly totals for P&L and summary.

## Adding features

- **New feature** → Create `features/<name>/` with `domain/`, `infrastructure/`, `presentation/` as needed. Add `index.ts` to export the public API. Domain stays pure (no React, store, or I/O).
- New constants or category labels → `lib/constants.ts`.
- New schedule or date formatting → `features/budget/domain/schedule-format.ts`.
- New “form values → store model” logic → `features/budget/domain/schedule-builders.ts`.
- New shared UI state or derived data → `features/<name>/presentation/hooks/`.
- New budget UI sections or shared pieces → `features/budget/presentation/`, export from `index.ts`.
