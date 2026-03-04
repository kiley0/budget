# Test coverage

## What is tested

- **`src/lib/constants.test.ts`** — Category labels, storage keys, `getStoredBudgetIds`, `clearAllBudgetsFromStorage`, `getBudgetMetadata` / `setBudgetMetadata`, `parseMetadataFromExport`
- **`src/lib/schedule-builders.test.ts`** — Building income/expense schedules from form values
- **`src/lib/schedule-format.test.ts`** — `formatDayOrdinal`, `formatIncomeSchedule`, `formatExpenseSchedule`, `getDayForSort`, `sortEventsByDayThenAmount` (day then amount)
- **`src/lib/import-normalizers.test.ts`** — `normalizeImportedBudget` (sources, events, one-time/recurring and snake_case schedules, self-healing preserves invalid data with defaults)
- **`src/lib/budget-migrations.test.ts`** — `migrateBudget` (v1→v2 migration, actualsByMonth preservation, snake_case handling)
- **`src/lib/export-csv.test.ts`** — CSV export shape and content
- **`src/lib/export-json.test.ts`** — JSON export shape and content
- **`src/store/budget.test.ts`** — `replaceBudgetFromExport` (import shape, null/invalid, sources and events)

## Important code without unit tests

1. **`src/hooks/useBudgetMonthData.ts`** — Month filtering for income/expense events (one-time by date, recurring by `startDate`/`endDate`). Critical for correct monthly P&amp;L; would benefit from tests if the filter logic is extracted into a pure function (e.g. `getIncomeEventsForMonth(events, year, month)`).

2. **`src/lib/crypto.ts`** — `encrypt`/`decrypt` round-trip, `deriveKey`, `verifyPassphrase`, `hasStoredSalt`/`clearStoredSalt`. Depends on `crypto.subtle` and (optionally) `localStorage`; best covered by integration or E2E tests, or with mocks for `crypto.subtle` and `localStorage`.

3. **`src/store/budget.ts`** — `loadBudget`, `saveBudget`, and mutators (`addIncomeSource`, `updateIncomeEvent`, etc.) are not unit tested. `replaceBudgetFromExport` is. Load/save involve network and encryption; mutators are simple and could be tested if desired.

4. **`src/store/session.ts`** — Session/key state; typically tested via integration or E2E.

5. **UI components** (e.g. `MonthlyPnLSection`, `BudgetHeader`, pages) — Not covered by unit tests; could add React Testing Library tests for key flows or visual regression.
