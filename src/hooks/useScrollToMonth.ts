"use client";

import { useCallback } from "react";

const MONTH_CARD_SELECTOR = "[data-month-index]";

/**
 * Scroll to the month card at index + delta from the current viewport.
 * Uses [data-month-index] on month cards.
 */
function scrollToAdjacentMonthImpl(delta: number): void {
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>(MONTH_CARD_SELECTOR),
  );
  if (cards.length === 0) return;

  let bestIndex = 0;
  let bestTop = Infinity;
  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
    const score = Math.abs(rect.top);
    if (score < bestTop) {
      bestTop = score;
      bestIndex = i;
    }
  }
  if (bestTop === Infinity) {
    const firstTop = cards[0].getBoundingClientRect().top;
    bestIndex = firstTop > 0 ? 0 : cards.length - 1;
  }
  const targetIndex = Math.max(
    0,
    Math.min(cards.length - 1, bestIndex + delta),
  );
  const target = cards[targetIndex];
  if (target) {
    const y =
      target.getBoundingClientRect().top +
      (window.scrollY || document.documentElement.scrollTop);
    window.scrollTo({ top: y - 16, behavior: "smooth" });
  }
}

/** Scroll to month card by index. */
function scrollToMonthByIndexImpl(index: number): void {
  const el = document.querySelector(
    `${MONTH_CARD_SELECTOR}[data-month-index="${index}"]`,
  );
  if (el) {
    const y =
      (el as HTMLElement).getBoundingClientRect().top +
      (window.scrollY || document.documentElement.scrollTop);
    window.scrollTo({ top: y - 16, behavior: "smooth" });
  }
}

/**
 * Hook for scrolling to month cards in the budget view.
 * Returns stable callbacks for scrollToAdjacentMonth and scrollToMonthByIndex.
 */
export function useScrollToMonth(): {
  scrollToAdjacentMonth: (delta: number) => void;
  scrollToMonthByIndex: (index: number) => void;
} {
  const scrollToAdjacentMonth = useCallback((delta: number) => {
    scrollToAdjacentMonthImpl(delta);
  }, []);

  const scrollToMonthByIndex = useCallback((index: number) => {
    scrollToMonthByIndexImpl(index);
  }, []);

  return { scrollToAdjacentMonth, scrollToMonthByIndex };
}
