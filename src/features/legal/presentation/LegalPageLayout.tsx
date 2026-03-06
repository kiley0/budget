import Link from "next/link";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16 sm:px-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          ← Back to Sunrise Budget
        </Link>
        <h1 className="mt-8 text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
        <div className="mt-10 space-y-6 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
