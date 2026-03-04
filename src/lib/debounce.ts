/**
 * Debounce a function. The function will be called after `ms` milliseconds
 * of no further invocations. Uses `setTimeout`; resets on each call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, ms);
  };
}

/**
 * Debounce with leading + trailing. Runs immediately on the first call,
 * then again 400ms after the last call to capture batched changes.
 * Ensures the first user action triggers an immediate save.
 */
export function debounceLeadingTrailing<
  T extends (...args: unknown[]) => unknown,
>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T>;
  let hasRunLeading = false;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (!hasRunLeading) {
      hasRunLeading = true;
      fn(...args);
    }

    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      hasRunLeading = false;
      fn(...lastArgs);
    }, ms);
  };
}
