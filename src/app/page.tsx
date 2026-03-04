import Link from "next/link";
import { BarChart3, CalendarClock, Shield, Sunrise, Users } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const EXAMPLE_MONTHS = [
  {
    month: "January",
    income: [
      { day: "1st", label: "Salary", amount: 2100 },
      { day: "15th", label: "Salary", amount: 2100 },
      { day: "22nd", label: "Freelance", amount: 350 },
    ],
    expenses: [
      { day: "1st", label: "Rent", amount: 1850 },
      { day: "5th", label: "Utilities", amount: 120 },
      { day: "15th", label: "Groceries", amount: 420 },
      { day: "1st", label: "Subscriptions", amount: 45 },
      { day: "8th", label: "Dining out", amount: 95 },
      { day: "22nd", label: "Transportation", amount: 180 },
      { day: "18th", label: "Auto maintenance", amount: 320 },
    ],
  },
  {
    month: "February",
    income: [
      { day: "1st", label: "Salary", amount: 2100 },
      { day: "15th", label: "Salary", amount: 2100 },
    ],
    expenses: [
      { day: "1st", label: "Rent", amount: 1850 },
      { day: "5th", label: "Utilities", amount: 135 },
      { day: "14th", label: "Insurance", amount: 220 },
      { day: "1st", label: "Subscriptions", amount: 45 },
      { day: "12th", label: "Groceries", amount: 390 },
      { day: "18th", label: "Personal care", amount: 65 },
      { day: "6th", label: "Doctor visit", amount: 45 },
    ],
  },
  {
    month: "March",
    income: [
      { day: "1st", label: "Salary", amount: 2100 },
      { day: "15th", label: "Salary", amount: 2100 },
      { day: "20th", label: "Bonus", amount: 500 },
    ],
    expenses: [
      { day: "1st", label: "Rent", amount: 1850 },
      { day: "5th", label: "Utilities", amount: 118 },
      { day: "12th", label: "Groceries", amount: 380 },
      { day: "1st", label: "Subscriptions", amount: 45 },
      { day: "15th", label: "Entertainment", amount: 120 },
      { day: "25th", label: "Dining out", amount: 78 },
      { day: "10th", label: "Beach trip", amount: 420 },
    ],
  },
] as const;

/** Parse ordinal day string to number (e.g. "1st" -> 1, "22nd" -> 22) for sorting. */
function parseDayOrdinal(day: string): number {
  const n = parseInt(day.replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

function ExamplePnLCard({
  month,
  income,
  expenses,
}: {
  month: string;
  income: readonly { day: string; label: string; amount: number }[];
  expenses: readonly { day: string; label: string; amount: number }[];
}) {
  const sortedIncome = [...income].sort((a, b) => {
    const dayA = parseDayOrdinal(a.day);
    const dayB = parseDayOrdinal(b.day);
    if (dayA !== dayB) return dayA - dayB;
    return b.amount - a.amount;
  });
  const sortedExpenses = [...expenses].sort((a, b) => {
    const dayA = parseDayOrdinal(a.day);
    const dayB = parseDayOrdinal(b.day);
    if (dayA !== dayB) return dayA - dayB;
    return b.amount - a.amount;
  });
  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpenses;
  return (
    <li>
      <Card className="px-4 py-4">
        <CardHeader className="space-y-0 pb-2 px-0">
          <CardTitle className="text-base">{month}</CardTitle>
        </CardHeader>
        <Separator className="mb-3" />
        <CardContent className="grid gap-4 sm:grid-cols-2 px-0">
          <div className="flex min-h-0 flex-col">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Income (take home)
            </h4>
            <ul className="mt-1 list-none space-y-1">
              {sortedIncome.map((event, i) => (
                <li
                  key={i}
                  className="flex min-h-5 items-center justify-between gap-2 text-sm"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="w-7 shrink-0 text-left text-[10px] font-semibold text-muted-foreground">
                      {event.day}
                    </span>
                    <span className="min-w-0 truncate text-foreground">
                      {event.label}
                    </span>
                  </div>
                  <span className="shrink-0 tabular-nums text-foreground">
                    {formatCurrency(event.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <Separator className="my-2" />
            <p className="mt-auto pt-2 text-sm font-medium text-foreground">
              Total income (take home): {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="flex min-h-0 flex-col">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Expenses
            </h4>
            <ul className="mt-1 list-none space-y-1">
              {sortedExpenses.map((event, i) => (
                <li
                  key={i}
                  className="flex min-h-5 items-center justify-between gap-2 text-sm"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="w-7 shrink-0 text-left text-[10px] font-semibold text-muted-foreground">
                      {event.day}
                    </span>
                    <span className="min-w-0 truncate text-foreground">
                      {event.label}
                    </span>
                  </div>
                  <span className="shrink-0 tabular-nums text-foreground">
                    {formatCurrency(event.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <Separator className="my-2" />
            <p className="mt-auto pt-2 text-sm font-medium text-foreground">
              Total expenses: {formatCurrency(totalExpenses)}
            </p>
          </div>
        </CardContent>
        <Separator className="my-4" />
        <CardFooter className="flex items-center justify-between pt-0 px-0">
          <span className="text-sm font-semibold text-foreground">
            {net >= 0 ? "Net profit" : "Net loss"}
          </span>
          <span
            className={`tabular-nums font-semibold ${
              net > 0
                ? "text-emerald-600"
                : net < 0
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          >
            {formatCurrency(net)}
          </span>
        </CardFooter>
      </Card>
    </li>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* Hero */}
      <section className="flex flex-1 w-full flex-col items-center px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="flex w-full max-w-3xl flex-col items-center text-center">
          <span className="flex items-center justify-center gap-2 text-sm font-medium text-accent dark:text-primary">
            <Sunrise className="size-5 shrink-0" aria-hidden />
            Sunrise Budget
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            The fastest way to forecast your income and expenses
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Quickly create a budget forecast for the year, with month-by-month
            views. Securely share it with your partner or financial planner.
            Your data is protected with end-to-end encryption. Built with
            privacy, accessibility, keyboard hotkeys, and speed in mind.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-lg bg-primary/5 px-4 py-3 text-sm font-medium text-foreground">
            <span className="flex items-center gap-2">
              <span
                className="size-2 rounded-full bg-emerald-500"
                aria-hidden
              />
              No account required: just a passphrase
            </span>
            <span className="flex items-center gap-2">
              <span
                className="size-2 rounded-full bg-emerald-500"
                aria-hidden
              />
              Absolutely no tracking
            </span>
            <span className="flex items-center gap-2">
              <span
                className="size-2 rounded-full bg-emerald-500"
                aria-hidden
              />
              Open source — self-host or use sunrisebudget.com
            </span>
          </div>
          <div className="mt-10">
            <Button asChild size="lg">
              <Link href="/get-started">Get started</Link>
            </Button>
          </div>
        </div>

        {/* Feature cards grid */}
        <div className="mt-16 lg:mt-24 grid w-full max-w-3xl gap-8 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-10 lg:gap-x-16 lg:gap-y-12">
          <div className="flex gap-4 text-left">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">Plan by month</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Set expected income and expenses for each month. See profit and
                loss at a glance and adjust as life changes.
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-left">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">
                End-to-end encryption
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Your financial data stays private. Encrypted for sync and
                long-term storage; decrypted data exists only in your tab
                session. We never see your numbers.
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-left">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">
                Share with partner
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Invite your spouse or financial planner to view and collaborate.
                As simple as sharing a link.
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-left">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">
                Year at a glance
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Annual income, expenses, and net totals. Not a transaction
                tracker, just a simple way to plan your near-term budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Yearly summary example */}
      <section className="w-full">
        <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8 lg:px-12">
          <Card className="bg-muted/30 px-4 py-4">
            <CardHeader className="px-0 pb-0">
              <CardTitle className="text-lg">
                Yearly income and expenses summary: {new Date().getFullYear()}
              </CardTitle>
              <CardDescription>
                Totals for the year based on expected income (after tax) and
                expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-4 px-0">
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Card>
                  <CardContent className="px-4 py-3">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Income (take home)
                    </dt>
                    <dd className="mt-1 text-xl font-semibold text-foreground">
                      {formatCurrency(51400)}
                    </dd>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="px-4 py-3">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Total expenses
                    </dt>
                    <dd className="mt-1 text-xl font-semibold text-foreground">
                      {formatCurrency(34200)}
                    </dd>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="px-4 py-3">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Net income
                    </dt>
                    <dd className="mt-1 text-xl font-semibold text-foreground">
                      {formatCurrency(17200)}
                    </dd>
                  </CardContent>
                </Card>
              </dl>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* P&L preview section with fade */}
      <section className="relative w-full overflow-hidden bg-muted/30">
        <Separator />
        <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8 lg:px-12">
          <h2 className="text-lg font-semibold text-foreground">
            Profit and loss by month
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan income and expenses for every month of the year
          </p>
          <ul className="mt-4 list-none space-y-4">
            {EXAMPLE_MONTHS.map((m) => (
              <ExamplePnLCard
                key={m.month}
                month={m.month}
                income={m.income}
                expenses={m.expenses}
              />
            ))}
          </ul>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent"
          aria-hidden
        />
      </section>
    </div>
  );
}
