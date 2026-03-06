"use client";

import {
  formatCurrency,
  getAmountVariant,
  parseDayOrdinal,
} from "@/lib/format";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function sortByDayThenAmount<T extends { day: string; amount: number }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) => {
    const dayA = parseDayOrdinal(a.day);
    const dayB = parseDayOrdinal(b.day);
    if (dayA !== dayB) return dayA - dayB;
    return b.amount - a.amount;
  });
}

interface ExamplePnLCardProps {
  month: string;
  income: readonly { day: string; label: string; amount: number }[];
  expenses: readonly { day: string; label: string; amount: number }[];
}

export function ExamplePnLCard({
  month,
  income,
  expenses,
}: ExamplePnLCardProps) {
  const sortedIncome = sortByDayThenAmount(income);
  const sortedExpenses = sortByDayThenAmount(expenses);
  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpenses;
  const variant = getAmountVariant(net);

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
              variant === "positive"
                ? "text-emerald-600"
                : variant === "negative"
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
