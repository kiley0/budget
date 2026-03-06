"use client";

import { Button } from "@/components/ui/button";

interface ImportErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ImportErrorBanner({
  message,
  onDismiss,
}: ImportErrorBannerProps) {
  return (
    <div
      className="bg-destructive/10 px-6 py-2 text-sm text-destructive"
      role="alert"
    >
      {message}
      <Button
        type="button"
        variant="link"
        size="sm"
        className="ml-2 h-auto p-0 font-medium text-destructive hover:text-destructive/90"
        onClick={onDismiss}
      >
        Dismiss
      </Button>
    </div>
  );
}
