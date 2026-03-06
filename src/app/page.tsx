import {
  LandingHero,
  LandingPnLPreview,
  LandingYearlySummaryExample,
} from "@/features/landing";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <LandingHero />
      <LandingYearlySummaryExample />
      <LandingPnLPreview />
    </div>
  );
}
