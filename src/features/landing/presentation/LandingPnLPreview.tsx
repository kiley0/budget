import { Separator } from "@/components/ui/separator";
import { ExamplePnLCard } from "./ExamplePnLCard";
import { EXAMPLE_MONTHS } from "../domain/example-data";

export function LandingPnLPreview() {
  return (
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
  );
}
