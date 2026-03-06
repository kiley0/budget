# Sunrise Budget — AI Agent Guide

Quick orientation for AI coding assistants working on this codebase.

## Project summary

Next.js 16 budget forecasting app. End-to-end encrypted; data stays local or syncs to Vercel Blob. React 19, TypeScript, Zustand, Tailwind, shadcn/ui, react-hook-form, Zod.

## Key paths

| Area               | Path                                              |
| ------------------ | ------------------------------------------------- |
| Routes & pages     | `src/app/`                                        |
| **Features (DDD)** | `src/features/` — budget, landing, session, legal |
| State              | `src/features/budget/infrastructure/store.ts`, `src/features/session/infrastructure/store.ts` |
| Pure utilities     | `src/lib/` (no React, no store)                   |
| Hooks              | `features/*/presentation/hooks/`                   |
| API routes         | `src/app/api/`                                    |

## Feature structure (DDD)

Features use domain-driven layers. **Dependency direction:** domain ← infrastructure, domain ← presentation.

| Feature     | domain/                                                                                                                  | infrastructure/                                    | presentation/                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------- |
| **budget**  | types, schedule-format, schedule-builders, date-view, event-form-mappers, yearly-summary, stock-utils, budget-migrations | store, budget-persistence, export/import, download | components, hooks (useBudgetPage, useBudgetMonthData, etc.) |
| **landing** | example-data.ts                                                                                                          | —                                                  | LandingHero, ExamplePnLCard, etc.                           |
| **session** | —                                                                                                                        | store.ts                                           | CreatePassphraseCard, UnlockExistingCard                    |
| **legal**   | —                                                                                                                        | —                                                  | LegalPageLayout, LegalSection                               |

## Conventions

- **New budget UI** → `features/budget/presentation/`, add export to `index.ts`
- **Constants, categories, labels** → `lib/constants.ts`
- **Schedule/date formatting** → `features/budget/domain/schedule-format.ts`
- **Form → store model** → `features/budget/domain/schedule-builders.ts` or new domain module
- **Shared derived state** → `features/*/presentation/hooks/`
- **Tests** → Vitest, co-located `*.test.ts` / `*.test.tsx`

## Commands

```bash
npm run dev        # dev server on :3421
npm run check-all  # lint + typecheck + test
npm run format     # Prettier
```

## Important details

- Budget data is encrypted; never log or expose plaintext in UI/logs
- `budgetId` is a UUID in the URL; shareable for collaboration
- Persistence order: sessionStorage → localStorage → Vercel Blob
- See `README.md` and `src/README.md` for full architecture
