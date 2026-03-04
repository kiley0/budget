"use client";

import { type ReactNode } from "react";

export interface SummaryStatProps {
  label: string;
  value: string;
  icon?: ReactNode;
  /** "muted" = default gray, "positive" = emerald, "negative" = destructive */
  variant?: "muted" | "positive" | "negative";
  onClick?: () => void;
}

const variantClasses = {
  muted: "text-muted-foreground",
  positive: "text-emerald-600",
  negative: "text-destructive",
};

export function SummaryStat({
  label,
  value,
  icon,
  variant = "muted",
  onClick,
}: SummaryStatProps) {
  const valueClassName = variantClasses[variant];
  const content = (
    <>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1 text-sm ${valueClassName}`}>
        {icon}
        {value}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col rounded px-1 -mx-1 py-0.5 text-left hover:bg-muted/50 cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return <div className="flex flex-col">{content}</div>;
}
