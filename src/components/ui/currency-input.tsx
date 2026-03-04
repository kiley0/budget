"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/** Strip to a raw number string: digits and at most one decimal point (max 2 decimal places). */
function toRawNumberString(s: string): string {
  const noCommas = s.replace(/,/g, "");
  let result = "";
  let seenDot = false;
  for (const c of noCommas) {
    if (c >= "0" && c <= "9") result += c;
    else if (c === "." && !seenDot) {
      seenDot = true;
      result += c;
    }
  }
  if (result.includes(".")) {
    const [int, dec] = result.split(".");
    return (int ?? "") + "." + (dec ?? "").slice(0, 2);
  }
  return result;
}

/** Format raw number string for display: add thousands separators, fixed 2 decimals when has decimal. */
function formatForDisplay(raw: string): string {
  if (raw === "" || raw === ".") return "";
  const parts = raw.split(".");
  const integer = parts[0] ?? "";
  const decimal = parts[1];
  const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (decimal === undefined || decimal === "") return withCommas;
  return `${withCommas}.${decimal.slice(0, 2)}`;
}

export interface CurrencyInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> {
  value: string;
  onChange: (value: string) => void;
  /** Currency symbol to show (default "$") */
  symbol?: string;
  /** Minimum value (default 0). Input is clamped on blur. */
  min?: number;
  /** Maximum value. Input is clamped on blur. */
  max?: number;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      value,
      onChange,
      symbol = "$",
      min = 0,
      max,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const handleRef = React.useCallback(
      (el: HTMLInputElement | null) => {
        inputRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref],
    );

    const displayValue = focused ? value : formatForDisplay(value);
    const isEmpty = value === "" || value === ".";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = toRawNumberString(e.target.value);
      if (min !== undefined && min >= 0 && raw !== "" && raw !== ".") {
        const n = parseFloat(raw);
        if (!Number.isNaN(n) && n < min) return;
      }
      onChange(raw);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      if (value !== "" && value !== ".") {
        const n = parseFloat(value);
        if (!Number.isNaN(n)) {
          let clamped = n;
          if (min !== undefined && clamped < min) clamped = min;
          if (max !== undefined && clamped > max) clamped = max;
          if (clamped !== n) onChange(String(clamped));
        }
      }
      onBlur?.(e);
    };

    return (
      <div className={cn("relative", className)}>
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground md:text-sm"
          aria-hidden
        >
          {symbol}
        </span>
        <Input
          ref={handleRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={isEmpty && !focused ? "" : displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-7 tabular-nums"
          placeholder={focused ? "0" : "0.00"}
          aria-label={props["aria-label"] ?? "Amount"}
          {...props}
        />
      </div>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
