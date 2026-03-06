import Link from "next/link";
import { BarChart3, CalendarClock, Shield, Sunrise, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingFeatureCard } from "./LandingFeatureCard";

const FEATURE_BULLETS = [
  "No account required: just a passphrase",
  "Absolutely no tracking",
  "Open source — self-host or use sunrisebudget.com",
] as const;

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Plan by month",
    description:
      "Set expected income and expenses for each month. See profit and loss at a glance and adjust as life changes.",
  },
  {
    icon: Shield,
    title: "End-to-end encryption",
    description:
      "Your financial data stays private. Encrypted for sync and long-term storage; decrypted data exists only in your tab session. We never see your numbers.",
  },
  {
    icon: Users,
    title: "Share with partner",
    description:
      "Invite your spouse or financial planner to view and collaborate. As simple as sharing a link.",
  },
  {
    icon: BarChart3,
    title: "Year at a glance",
    description:
      "Annual income, expenses, and net totals. Not a transaction tracker, just a simple way to plan your near-term budget.",
  },
] as const;

export function LandingHero() {
  return (
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
          views. Securely share it with your partner or financial planner. Your
          data is protected with end-to-end encryption. Built with privacy,
          accessibility, keyboard hotkeys, and speed in mind.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-lg bg-primary/5 px-4 py-3 text-sm font-medium text-foreground">
          {FEATURE_BULLETS.map((text) => (
            <span key={text} className="flex items-center gap-2">
              <span
                className="size-2 rounded-full bg-emerald-500"
                aria-hidden
              />
              {text}
            </span>
          ))}
        </div>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link href="/get-started">Get started</Link>
          </Button>
        </div>
      </div>

      <div className="mt-16 lg:mt-24 grid w-full max-w-3xl gap-8 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-10 lg:gap-x-16 lg:gap-y-12">
        {FEATURES.map((f) => (
          <LandingFeatureCard
            key={f.title}
            icon={f.icon}
            title={f.title}
            description={f.description}
          />
        ))}
      </div>
    </section>
  );
}
