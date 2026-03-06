"use client";

import { useEffect, useRef } from "react";

/** Dialog/modal states that should suppress hotkeys when open. */
export interface BudgetHotkeysDialogState {
  commandPaletteOpen: boolean;
  addEventDialogOpen: boolean;
  addExpenseEventDialogOpen: boolean;
  incomeModalOpen: boolean;
  expenseModalOpen: boolean;
  yearlySummaryDialogOpen: boolean;
  editIncomeEventDialogOpen?: boolean;
  editExpenseEventDialogOpen?: boolean;
  newerVersionDialogOpen?: boolean;
  showBlankState?: boolean;
}

export interface BudgetHotkeysCallbacks {
  setCommandPaletteOpen: (open: boolean) => void;
  setShowDebugSection: (show: boolean) => void;
  setIncomeModalOpen: (open: boolean) => void;
  setExpenseModalOpen: (open: boolean) => void;
  setAddEventDialogOpen: (open: boolean) => void;
  setAddExpenseEventDialogOpen: (open: boolean) => void;
  setYearlySummaryDialogOpen: (open: boolean) => void;
  setDateViewMode: (mode: "next-12-months" | "next-year") => void;
  scrollToAdjacentMonth: (delta: number) => void;
}

export interface BudgetHotkeysDeps {
  dateViewMode: string;
}

/**
 * Consolidates global hotkey handling for the budget page.
 * Uses a ref for command palette state to avoid stale closures when typing.
 */
export function useBudgetHotkeys(
  dialogState: BudgetHotkeysDialogState,
  callbacks: BudgetHotkeysCallbacks,
  deps: BudgetHotkeysDeps,
) {
  const commandPaletteOpenRef = useRef(false);
  const callbacksRef = useRef(callbacks);
  const depsRef = useRef(deps);

  useEffect(() => {
    callbacksRef.current = callbacks;
    depsRef.current = deps;
  });

  useEffect(() => {
    commandPaletteOpenRef.current = dialogState.commandPaletteOpen;
  }, [dialogState.commandPaletteOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function onKeyDown(e: KeyboardEvent) {
      if (commandPaletteOpenRef.current) return;

      const target = e.target as HTMLElement;
      const inInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;
      if (inInput) return;

      const anyDialogOpen =
        dialogState.addEventDialogOpen ||
        dialogState.addExpenseEventDialogOpen ||
        dialogState.incomeModalOpen ||
        dialogState.expenseModalOpen ||
        dialogState.yearlySummaryDialogOpen ||
        dialogState.editIncomeEventDialogOpen ||
        dialogState.editExpenseEventDialogOpen ||
        dialogState.newerVersionDialogOpen ||
        dialogState.showBlankState;
      if (anyDialogOpen) return;

      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && key === "d") {
        e.preventDefault();
        callbacksRef.current.setShowDebugSection(true);
      } else if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        commandPaletteOpenRef.current = true;
        callbacksRef.current.setCommandPaletteOpen(true);
      } else if (key === "i") {
        e.preventDefault();
        if (mod) {
          callbacksRef.current.setIncomeModalOpen(true);
        } else {
          callbacksRef.current.setAddEventDialogOpen(true);
        }
      } else if (key === "e") {
        e.preventDefault();
        if (mod) {
          callbacksRef.current.setExpenseModalOpen(true);
        } else {
          callbacksRef.current.setAddExpenseEventDialogOpen(true);
        }
      } else if (key === "t") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (key === "y") {
        e.preventDefault();
        callbacksRef.current.setYearlySummaryDialogOpen(true);
      } else if (key === "c") {
        e.preventDefault();
        if (depsRef.current.dateViewMode === "next-year") {
          callbacksRef.current.setDateViewMode("next-12-months");
        }
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
      } else if (key === "j") {
        e.preventDefault();
        callbacksRef.current.scrollToAdjacentMonth(-1);
      } else if (key === "k") {
        e.preventDefault();
        callbacksRef.current.scrollToAdjacentMonth(1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    dialogState.addEventDialogOpen,
    dialogState.addExpenseEventDialogOpen,
    dialogState.incomeModalOpen,
    dialogState.expenseModalOpen,
    dialogState.yearlySummaryDialogOpen,
    dialogState.editIncomeEventDialogOpen,
    dialogState.editExpenseEventDialogOpen,
    dialogState.newerVersionDialogOpen,
    dialogState.showBlankState,
  ]);

  return { commandPaletteOpenRef };
}
