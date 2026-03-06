import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const EXAMPLE_INCOME = 51400;
const EXAMPLE_EXPENSES = 34200;
const EXAMPLE_NET = 17200;

export function LandingYearlySummaryExample() {
  return (
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
                    {formatCurrency(EXAMPLE_INCOME)}
                  </dd>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-4 py-3">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Total expenses
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-foreground">
                    {formatCurrency(EXAMPLE_EXPENSES)}
                  </dd>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-4 py-3">
                  <dt className="text-sm font-medium text-muted-foreground">
                    Net income
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-foreground">
                    {formatCurrency(EXAMPLE_NET)}
                  </dd>
                </CardContent>
              </Card>
            </dl>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
