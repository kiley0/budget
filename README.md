# Sunrise Budget

The fastest way to forecast your income and expenses. Quickly create a budget for the year with month-by-month views—like a profit-and-loss statement—and securely share it with your partner or financial planner. Built with privacy, accessibility, keyboard hotkeys, and speed in mind.

## What it does

- **Plan by month** — Set expected income and expenses for each month. See profit and loss at a glance and adjust as life changes.
- **End-to-end encryption** — Your financial data stays private. Encrypted for sync and long-term storage; decrypted data exists only in your tab session. We never see your numbers.
- **Share with partner** — Invite your spouse or financial planner to view and collaborate. As simple as sharing a link.
- **Year at a glance** — Annual income, expenses, and net totals. Not a transaction tracker—just a simple way to plan your near-term budget.

## How it works

### Budget creation

1. **Get started** — You land on the get-started page. Create a new passphrase (8+ chars) or enter an existing one to unlock a budget.
2. **Key derivation** — The app derives an encryption key from your passphrase (PBKDF2 + salt in localStorage). The key lives in memory (Zustand session store) and in sessionStorage (so you don't re-enter the passphrase on tab reload). The key is never sent to the server.
3. **First budget** — On first use, the app generates a UUID (`budgetId`) and stores it in the URL (`/budget/[budgetId]`). `budgetId` is also saved in localStorage so `/budget` can redirect to your budget. Share the link to collaborate.
4. **Empty state** — A new budget starts with no income sources or expenses. You add them from the budget page.

### Saving (persistence order)

On every change (first change saves immediately; rapid edits debounce 400ms), the app persists in this order:

1. **Session storage** — Decrypted JSON + encryption key. Enables fast reload in the same tab without re-entering the passphrase.
2. **Local storage** — Encrypted payload. Device-persistent backup.
3. **Vercel Blob** — Portable encrypted payload (salt + ciphertext) plus metadata (`updatedAt`) for version comparison. Synced via `POST /api/sync`.

The server never sees the passphrase or plaintext. Only encrypted data is stored and transmitted.

### Loading (priority order)

1. **Session storage (fast path)** — If decrypted data and key exist, load from session. No passphrase needed on reload.
2. **Local storage** — If no session, try encrypted data in localStorage. Decrypt, populate session, then load.
3. **Vercel Blob** — If local is empty, fetch from `GET /api/sync?budgetId=...`. The sync payload is portable (includes salt) so any device can decrypt with just the passphrase.
4. **Newer version check** — After loading from session or local, the app fetches remote metadata (`GET /api/sync?budgetId=...&meta=1`) to compare `updatedAt`. If a newer version exists in the cloud (e.g., from another device), a dialog prompts you to enter your passphrase and update. Dismissing triggers a 15‑minute cooldown.

### Background sync polling

While the budget page is open and the tab is active, the app polls for newer versions: starting at 1 second, then doubling each poll (exponential backoff) up to 30 seconds. Polling stops when the tab is hidden or after 10 minutes of inactivity, and resumes from 1 second when you become active again.

### Flow

Home → Get started (create/enter passphrase) → Budget page. From there you manage income sources, expense destinations, and events; import/export JSON; and view monthly P&L and yearly summary. Logout clears the in-memory key and session data, then returns to home.

## Getting started

```bash
npm install
npm run dev
```

**Local:** Open [http://localhost:3421](http://localhost:3421). **Production:** [https://sunrisebudget.com](https://sunrisebudget.com). Use "Get started" to create a passphrase and open your budget.

**Scripts:** `npm run build` / `npm run start` (port 3421), `npm run lint`, `npm run typecheck`, `npm run check-all`, `npm run format`, `npm run test` / `npm run test:run`.

## Where to find things

All app code lives under **`src/`**.

| What                   | Where                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Routes**             | `src/app/` — `page.tsx` (home), `get-started/page.tsx`, `budget/page.tsx` (redirect), `budget/[budgetId]/page.tsx` (main budget UI).                       |
| **API**                | `src/app/api/sync/` — GET (blob or metadata with `?meta=1`) and POST (save blob + metadata) for Vercel Blob. `api/stock-price/` for live stock quotes.     |
| **State**              | `src/store/` — `budget.ts` (Zustand budget state, load/save, CRUD, sync), `session.ts` (in-memory key, unlock state).                                      |
| **Persistence**        | `src/lib/budget-persistence/` — Orchestrates save order (session → local → sync). Testable adapters.                                                       |
| **Crypto**             | `src/lib/crypto.ts` — key derivation, encrypt/decrypt, verify passphrase.                                                                                  |
| **Constants & config** | `src/lib/constants.ts` — storage key prefixes, expense categories, labels.                                                                                 |
| **Budget UI**          | `src/components/budget/` — header (export/import/logout), yearly summary, monthly P&L, dialogs for adding sources/destinations.                            |
| **Hooks**              | `src/hooks/` — `useBudgetMonthData`, `useBudgetSourceNames`, `useBudgetHotkeys`, `useStockPriceFetch`, `useSyncVersionPolling` (polls for newer versions). |
| **Utilities**          | `src/lib/` — `schedule-format.ts` (dates, ordinals), `schedule-builders.ts` (form → schedule), `import-normalizers.ts` (JSON → BudgetState).               |

More detail on conventions and adding features: **[src/README.md](src/README.md)**.

## Sync (Vercel Blob)

Encrypted budget data is synced to Vercel Blob so it can be loaded on other devices. The server never sees the passphrase or plaintext.

- **Blob** — Main data at `sync/{budgetId}` (encrypted, portable format).
- **Metadata** — Version info at `sync/{budgetId}.meta` (`updatedAt`) for lightweight "newer version?" checks without fetching the full blob.
- **API** — `GET /api/sync?budgetId=...` (blob) or `?meta=1` (metadata only). `POST /api/sync` with `{ budgetId, data, updatedAt? }` writes the blob and metadata.
- **Deploy:** Create a [Vercel Blob store](https://vercel.com/docs/storage/vercel-blob) in your project; `BLOB_READ_WRITE_TOKEN` is set automatically.
- **Local:** Run `vercel env pull` to use the same env (including the blob token) as your deployed project.

## Deploy on Vercel

Deploy via the [Vercel Platform](https://vercel.com/new). See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.

## License

Sunrise Budget is open source. You are free to copy, modify, and run it yourself at no charge. If you prefer a managed, hosted version, you can use it at [sunrisebudget.com](https://sunrisebudget.com).
