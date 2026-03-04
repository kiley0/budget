# Sunrise Budget — AI Agent Guide

Quick orientation for AI coding assistants working on this codebase.

## Project summary

Next.js 16 budget forecasting app. End-to-end encrypted; data stays local or syncs to Vercel Blob. React 19, TypeScript, Zustand, Tailwind, shadcn/ui, react-hook-form, Zod.

## Key paths

| Area                 | Path                                              |
| -------------------- | ------------------------------------------------- |
| Routes & pages       | `src/app/`                                        |
| Budget UI components | `src/components/budget/` (export from `index.ts`) |
| State (Zustand)      | `src/store/budget.ts`, `src/store/session.ts`     |
| Pure utilities       | `src/lib/` (no React, no store)                   |
| Hooks                | `src/hooks/`                                      |
| API routes           | `src/app/api/`                                    |

## Conventions

- **New budget UI** → `components/budget/`, add export to `components/budget/index.ts`
- **Constants, categories, labels** → `lib/constants.ts`
- **Schedule/date formatting** → `lib/schedule-format.ts`
- **Form → store model** → `lib/schedule-builders.ts` or new lib module
- **Shared derived state** → `src/hooks/`
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
