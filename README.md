# Sunrise Budget

The fastest way to forecast your income and expenses. Quickly create a budget for the year with month-by-month views—like a profit-and-loss statement—and securely share it with your partner or financial planner. Built with privacy, accessibility, keyboard hotkeys, and speed in mind.

## What it does

- **Plan by month** — Define expected income sources and expenses (one-time or recurring by day-of-month). See profit and loss for each month and the full year.
- **Share easily** — Share your budget by sending a link. No passwords to exchange, no exporting spreadsheets.
- **Private by default** — End-to-end encryption. Your data is encrypted with a passphrase you choose; decrypted data exists only in your browser session. The server never sees your numbers.
- **Not a transaction tracker** — This app plans expected income and expenses. It doesn't connect to banks or log transactions; it’s for near-term budget forecasting.

## How it works

- **Passphrase & key** — You create or enter a passphrase on the get-started screen. The app derives an encryption key from it (PBKDF2 + salt in localStorage). The key is kept in memory only (Zustand session store) and is never sent to the server.
- **Encryption** — Budget state is encrypted with AES-GCM (client-side) before being written to localStorage or sent to the sync API. Only you can decrypt it.
- **Budget ID** — Each budget has a UUID (`budgetId`) in the URL (`/budget/[budgetId]`). It's created on first use and stored in localStorage so `/budget` can redirect to your budget. Share the link to collaborate.
- **Persistence** — On every change, the app saves encrypted data to localStorage and (if configured) to Vercel Blob via `POST /api/sync`. Load order: try sync first, then fall back to localStorage.
- **Flow** — Home → Get started (create/enter passphrase) → Budget page. From there you manage income sources, expense destinations, and events; import/export JSON; and view monthly P&L and yearly summary. Logout clears the in-memory key and returns to home.

## Getting started

```bash
npm install
npm run dev
```

**Local:** Open [http://localhost:3421](http://localhost:3421). **Production:** [https://sunrisebudget.com](https://sunrisebudget.com). Use "Get started" to create a passphrase and open your budget.

**Scripts:** `npm run build` / `npm run start` (port 3421), `npm run lint`, `npm run typecheck`, `npm run check-all`, `npm run format`, `npm run test` / `npm run test:run`.

## Where to find things

All app code lives under **`src/`**.

| What                   | Where                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Routes**             | `src/app/` — `page.tsx` (home), `get-started/page.tsx`, `budget/page.tsx` (redirect), `budget/[budgetId]/page.tsx` (main budget UI).                 |
| **API**                | `src/app/api/sync/` — GET (fetch blob) and POST (save blob) for Vercel Blob. `api/stock-price/` for live stock quotes.                               |
| **State**              | `src/store/` — `budget.ts` (Zustand budget state, load/save, CRUD), `session.ts` (in-memory key, unlock state).                                      |
| **Crypto**             | `src/lib/crypto.ts` — key derivation, encrypt/decrypt, verify passphrase.                                                                            |
| **Constants & config** | `src/lib/constants.ts` — storage key prefixes, expense categories, labels.                                                                           |
| **Budget UI**          | `src/components/budget/` — header (export/import/logout), yearly summary, monthly P&L, dialogs for adding sources/destinations.                      |
| **Hooks**              | `src/hooks/` — `useBudgetMonthData` (per-month events, yearly totals), `useBudgetSourceNames` (ID → name), `useBudgetHotkeys`, `useStockPriceFetch`. |
| **Utilities**          | `src/lib/` — `schedule-format.ts` (dates, ordinals), `schedule-builders.ts` (form → schedule), `import-normalizers.ts` (JSON → BudgetState).         |

More detail on conventions and adding features: **[src/README.md](src/README.md)**.

## Sync (Vercel Blob)

Encrypted budget data is synced to Vercel Blob at `sync/{budgetId}` so it can be loaded on other devices. The server never sees the passphrase or plaintext.

- **Deploy:** Create a [Vercel Blob store](https://vercel.com/docs/storage/vercel-blob) in your project; `BLOB_READ_WRITE_TOKEN` is set automatically.
- **Local:** Run `vercel env pull` to use the same env (including the blob token) as your deployed project.

## Deploy on Vercel

Deploy via the [Vercel Platform](https://vercel.com/new). See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.
