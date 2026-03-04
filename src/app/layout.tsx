import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const SITE_URL = "https://sunrisebudget.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Sunrise Budget",
  description: "The fastest way to forecast your income and expenses",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    url: SITE_URL,
    siteName: "Sunrise Budget",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <Toaster />
          <div className="flex min-h-screen flex-col">
            <div className="min-h-0 flex-1">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
            <footer className="px-12 py-4 text-center text-sm text-muted-foreground sm:px-16 lg:px-24">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                <span>© {new Date().getFullYear()} Sunrise Budget</span>
                <span aria-hidden>·</span>
                <Button
                  variant="link"
                  asChild
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                >
                  <Link href="https://github.com/kiley0/budget" target="_blank" rel="noopener noreferrer">
                    View on GitHub
                  </Link>
                </Button>
                <span aria-hidden>·</span>
                <Button
                  variant="link"
                  asChild
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                >
                  <Link href="/terms">Terms of Service</Link>
                </Button>
                <span aria-hidden>·</span>
                <Button
                  variant="link"
                  asChild
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                >
                  <Link href="/privacy">Privacy Policy</Link>
                </Button>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
