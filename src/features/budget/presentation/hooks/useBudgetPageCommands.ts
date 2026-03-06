"use client";

import { useCallback } from "react";
import type { DateViewMode } from "@/features/budget/domain/date-view";

export interface BudgetPageCommandsDeps {
  onClosePalette: () => void;
  dateViewMode: DateViewMode;
  setDateViewMode: (mode: DateViewMode) => void;
  setAddEventDialogOpen: (open: boolean) => void;
  setAddExpenseEventDialogOpen: (open: boolean) => void;
  setIncomeModalOpen: (open: boolean) => void;
  setExpenseModalOpen: (open: boolean) => void;
  setYearlySummaryDialogOpen: (open: boolean) => void;
  scrollToMonthByIndex: (index: number) => void;
  scrollToAdjacentMonth: (delta: number) => void;
}

/** Encapsulates command palette execution for the budget page. */
export function useBudgetPageCommands(deps: BudgetPageCommandsDeps) {
  const {
    onClosePalette,
    dateViewMode,
    setDateViewMode,
    setAddEventDialogOpen,
    setAddExpenseEventDialogOpen,
    setIncomeModalOpen,
    setExpenseModalOpen,
    setYearlySummaryDialogOpen,
    scrollToMonthByIndex,
    scrollToAdjacentMonth,
  } = deps;

  return useCallback(
    (value: string) => {
      onClosePalette();

      if (value === "back-to-top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (value === "jump-current") {
        if (dateViewMode === "next-year") setDateViewMode("next-12-months");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const el = document.getElementById("current-month-card");
            if (el) {
              const y =
                el.getBoundingClientRect().top +
                (window.scrollY || document.documentElement.scrollTop);
              window.scrollTo({ top: y - 16, behavior: "smooth" });
            }
          });
        });
      } else if (value.startsWith("jump-")) {
        const index = parseInt(value.slice(5), 10);
        scrollToMonthByIndex(index);
      } else if (value === "prev-month") {
        scrollToAdjacentMonth(-1);
      } else if (value === "next-month") {
        scrollToAdjacentMonth(1);
      } else if (value === "add-income") {
        setAddEventDialogOpen(true);
      } else if (value === "add-expense") {
        setAddExpenseEventDialogOpen(true);
      } else if (value === "manage-income") {
        setIncomeModalOpen(true);
      } else if (value === "manage-expenses") {
        setExpenseModalOpen(true);
      } else if (value === "yearly-summary") {
        setYearlySummaryDialogOpen(true);
      }
    },
    [
      onClosePalette,
      dateViewMode,
      setDateViewMode,
      setAddEventDialogOpen,
      setAddExpenseEventDialogOpen,
      setIncomeModalOpen,
      setExpenseModalOpen,
      setYearlySummaryDialogOpen,
      scrollToMonthByIndex,
      scrollToAdjacentMonth,
    ],
  );
}
