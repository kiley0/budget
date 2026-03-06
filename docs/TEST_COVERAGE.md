# Test coverage

## What is tested

- **`src/lib/constants.test.ts`** — Category labels, storage keys, `getStoredBudgetIds`, `clearAllBudgetsFromStorage`, `getBudgetMetadata` / `setBudgetMetadata`, `parseMetadataFromExport`
- **`src/features/budget/infrastructure/store.test.ts`** — `replaceBudgetFromExport` (import shape, null/invalid, sources and events)
- **`src/features/budget/infrastructure/budget-storage.test.ts`** — Storage adapters, fingerprint, persist flow
- **`src/features/budget/infrastructure/budget-persistence/serialize.test.ts`** — `serializeBudgetForPersistence`
- **`src/features/budget/infrastructure/budget-persistence/persist.test.ts`** — `persistToStoresInOrder`, `preparePersistPayloads`
- **`src/lib/format.test.ts`**, **`src/lib/debounce.test.ts`**, **`src/lib/utils.test.ts`**, **`src/lib/crypto.test.ts`** — Cross-cutting utilities
- **Presentation** — `BudgetCommandPalette`, `PaycheckIncomeForm`, `StockIncomeForm`, `YearlySummaryDialogContent`, `YearlySummarySection`, `NewerVersionAvailableDialog` (React Testing Library)

## Important code without unit tests

1. **`src/features/budget/presentation/hooks/useBudgetMonthData.ts`** — Month filtering for income/expense events (one-time by date, recurring by `startDate`/`endDate`). Critical for correct monthly P&amp;L; would benefit from tests if the filter logic is extracted into a pure function (e.g. `getIncomeEventsForMonth(events, year, month)`).

2. **`src/lib/crypto.ts`** — `encrypt`/`decrypt` round-trip, `deriveKey`, `verifyPassphrase`, `hasStoredSalt`/`clearStoredSalt`. Depends on `crypto.subtle` and (optionally) `localStorage`; best covered by integration or E2E tests, or with mocks for `crypto.subtle` and `localStorage`.

3. **`src/features/budget/infrastructure/store.ts`** — `loadBudget`, `saveBudget`, and mutators (`addIncomeEvent`, `updateIncomeEvent`, etc.) are not unit tested. `replaceBudgetFromExport` is. Load/save involve network and encryption; mutators are simple and could be tested if desired.

4. **`src/features/session/infrastructure/store.ts`** — Session/key state; typically tested via integration or E2E.

5. **UI components** (e.g. `MonthlyPnLSection`, `BudgetHeader`, pages) — Not covered by unit tests; could add React Testing Library tests for key flows or visual regression.
