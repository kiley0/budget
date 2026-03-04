"use client";

import { formatCurrency } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface YearlySummarySectionProps {
  periodLabel: string;
  yearlyIncome: number;
  yearlyExpenses: number;
  yearlySavings?: number;
}

export function YearlySummarySection({
  periodLabel,
  yearlyIncome,
  yearlyExpenses,
  yearlySavings = 0,
}: YearlySummarySectionProps) {
  const net = yearlyIncome - yearlyExpenses;

  return (
    <section className="mt-10" aria-labelledby="yearly-summary-heading">
      <Card className="bg-muted/30 px-4 py-4">
        <CardHeader className="px-0 pb-0">
          <CardTitle id="yearly-summary-heading" className="text-lg">
            Income and Expenses Summary — {periodLabel}
          </CardTitle>
          <CardDescription>
            Totals for the selected period based on expected income (take home)
            and expenses
          </CardDescription>
        </CardHeader>
        <Separator className="my-4" />
        <CardContent className="px-0">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="px-4 py-3">
                <dt className="text-sm font-medium text-muted-foreground">
                  Income (take home)
                </dt>
                <dd className="mt-1 text-xl font-semibold text-foreground">
                  {formatCurrency(yearlyIncome)}
                </dd>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-4 py-3">
                <dt className="text-sm font-medium text-muted-foreground">
                  Total expenses
                </dt>
                <dd className="mt-1 text-xl font-semibold text-foreground">
                  {formatCurrency(yearlyExpenses)}
                </dd>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-4 py-3">
                <dt className="text-sm font-medium text-muted-foreground">
                  Savings & investments
                </dt>
                <dd className="mt-1 text-xl font-semibold text-foreground">
                  {formatCurrency(yearlySavings)}
                </dd>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-4 py-3">
                <dt className="text-sm font-medium text-muted-foreground">
                  Net income
                </dt>
                <dd
                  className={`mt-1 text-xl font-semibold ${net >= 0 ? "text-foreground" : "text-destructive"}`}
                >
                  {formatCurrency(net)}
                </dd>
              </CardContent>
            </Card>
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}
