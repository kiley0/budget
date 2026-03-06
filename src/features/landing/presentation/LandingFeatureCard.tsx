import type { LucideIcon } from "lucide-react";

interface LandingFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function LandingFeatureCard({
  icon: Icon,
  title,
  description,
}: LandingFeatureCardProps) {
  return (
    <div className="flex gap-4 text-left">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
