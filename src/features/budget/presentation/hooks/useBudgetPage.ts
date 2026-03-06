"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/features/session";
import {
  useBudgetStore,
  loadBudget,
  saveBudget,
  fetchEncryptedFromSync,
  type IncomeEvent,
  type ExpenseEvent,
} from "@/features/budget/infrastructure/store";
import { importKeyFromSession, clearAllSessionBudgetData } from "@/lib/crypto";
import {
  ENCRYPTED_STORAGE_KEY_PREFIX,
  getPreferences,
  getBudgetMetadata,
} from "@/lib/constants";
import { buildYearlySummaryData } from "@/features/budget/domain/yearly-summary";
import {
  type DateViewMode,
  getMonthsForViewMode,
  getPeriodLabel,
  getTodayIsoDate,
} from "@/features/budget/domain/date-view";
import { buildBudgetCommandPaletteCommands } from "@/features/budget/infrastructure/budget-command-palette";
import { useBudgetMonthData } from "./useBudgetMonthData";
import { useBudgetHotkeys } from "./useBudgetHotkeys";
import { useScrollToMonth } from "./useScrollToMonth";
import { useBudgetPageExport } from "./useBudgetPageExport";
import { useBudgetPageCommands } from "./useBudgetPageCommands";
import { useBudgetPageImport } from "./useBudgetPageImport";
import { useSyncVersionPolling } from "./useSyncVersionPolling";

export interface UseBudgetPageParams {
  budgetId: string | undefined;
}

export function useBudgetPage({ budgetId }: UseBudgetPageParams) {
  const router = useRouter();
  const isUnlocked = useSessionStore((s) => s.isUnlocked());
  const budgetState = useBudgetStore((s) => s);

  const [sessionRestored, setSessionRestored] = useState(false);
  const [rawEncrypted, setRawEncrypted] = useState<string | null>(null);
  const [showDebugSection, setShowDebugSection] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [addExpenseEventDialogOpen, setAddExpenseEventDialogOpen] =
    useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [yearlySummaryDialogOpen, setYearlySummaryDialogOpen] = useState(false);
  const [newerVersionDialogOpen, setNewerVersionDialogOpen] = useState(false);
  const [expandedPaycheckEventIds, setExpandedPaycheckEventIds] = useState<
    Set<string>
  >(new Set());
  const [hotkeysVisible, setHotkeysVisible] = useState(
    () => getPreferences().hotkeysVisible !== false,
  );
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [addIncomeDefaultDate, setAddIncomeDefaultDate] = useState<
    string | null
  >(null);
  const [addExpenseDefaultDate, setAddExpenseDefaultDate] = useState<
    string | null
  >(null);
  const [editIncomeEventDialogOpen, setEditIncomeEventDialogOpen] =
    useState(false);
  const [editExpenseEventDialogOpen, setEditExpenseEventDialogOpen] =
    useState(false);
  const [editingIncomeEvent, setEditingIncomeEvent] =
    useState<IncomeEvent | null>(null);
  const [editingExpenseEvent, setEditingExpenseEvent] =
    useState<ExpenseEvent | null>(null);
  const [keyErrorReason, setKeyErrorReason] = useState<
    "no_key" | "decrypt_failed" | null
  >(null);
  const [encryptedBlob, setEncryptedBlob] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<
    "idle" | "fetching" | "found" | "not_found"
  >("idle");
  const [budgetName, setBudgetName] = useState("");
  const [editingBudgetTitle, setEditingBudgetTitle] = useState(false);
  const [blankStateDismissed, setBlankStateDismissed] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | "done">(1);
  const [dateViewMode, setDateViewMode] =
    useState<DateViewMode>("current-year");

  const incomeEvents = useBudgetStore((s) => s.incomeEvents);
  const expenseEvents = useBudgetStore((s) => s.expenseEvents);
  const actualsByMonth = useBudgetStore((s) => s.actualsByMonth ?? {});

  const dateViewMonths = useMemo(
    () => getMonthsForViewMode(dateViewMode),
    [dateViewMode],
  );
  const periodLabel = getPeriodLabel(dateViewMode);
  const minDate = getTodayIsoDate();

  const {
    getYearlyTotalIncome,
    getYearlyTotalGrossIncome,
    getYearlyTotalExpenses,
    getYearlyTotalSavings,
    getYearlyTotalDebtRepayment,
  } = useBudgetMonthData(dateViewMonths);

  const { scrollToAdjacentMonth, scrollToMonthByIndex } = useScrollToMonth();
  const { handleExport, handleExportCsv } = useBudgetPageExport();
  const handleImportSuccess = useCallback((meta: { name?: string }) => {
    setBudgetName(meta.name ?? "My Budget");
  }, []);

  const {
    importFileRef,
    importError,
    setImportError,
    handleImportClick,
    handleImportFileChange,
  } = useBudgetPageImport({
    budgetId,
    onImportSuccess: handleImportSuccess,
  });

  const yearlySummaryData = useMemo(
    () =>
      buildYearlySummaryData(
        incomeEvents,
        expenseEvents,
        dateViewMonths,
        actualsByMonth,
      ),
    [incomeEvents, expenseEvents, dateViewMonths, actualsByMonth],
  );

  const commandPaletteCommands = useMemo(
    () => buildBudgetCommandPaletteCommands(dateViewMonths),
    [dateViewMonths],
  );

  const isBudgetEmpty = incomeEvents.length === 0 && expenseEvents.length === 0;
  const showBlankState =
    (isBudgetEmpty || onboardingStep !== 1) &&
    !blankStateDismissed &&
    keyErrorReason === null &&
    budgetId !== undefined;

  const openEditIncomeEventDialog = useCallback((event: IncomeEvent) => {
    setEditingIncomeEvent(event);
    setEditIncomeEventDialogOpen(true);
  }, []);

  const closeEditIncomeEventDialog = useCallback(() => {
    setEditIncomeEventDialogOpen(false);
    setEditingIncomeEvent(null);
  }, []);

  const openEditExpenseEventDialog = useCallback((event: ExpenseEvent) => {
    setEditingExpenseEvent(event);
    setEditExpenseEventDialogOpen(true);
  }, []);

  const closeEditExpenseEventDialog = useCallback(() => {
    setEditExpenseEventDialogOpen(false);
    setEditingExpenseEvent(null);
  }, []);

  const handleLogout = useCallback(async () => {
    await saveBudget();
    useSessionStore.getState().clearKey();
    clearAllSessionBudgetData();
    router.push("/");
  }, [router]);

  const handleKeyErrorUnlockAgain = useCallback(() => {
    setKeyErrorReason(null);
    useSessionStore.getState().clearKey();
    clearAllSessionBudgetData();
    router.replace("/get-started");
  }, [router]);

  const handleUnlockSuccess = useCallback((meta: { name?: string }) => {
    setBudgetName(meta.name ?? "My Budget");
    setEncryptedBlob(null);
    setFetchStatus("idle");
  }, []);

  const handleUnlockCancel = useCallback(() => {
    setEncryptedBlob(null);
    setFetchStatus("idle");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    importKeyFromSession()
      .then((key) => {
        if (key) useSessionStore.getState().setKey(key);
      })
      .finally(() => setSessionRestored(true));
  }, []);

  useEffect(() => {
    if (!isUnlocked && !budgetId) {
      router.replace("/get-started");
      return;
    }
  }, [isUnlocked, budgetId, router]);

  useEffect(() => {
    if (!isUnlocked && budgetId) {
      /* eslint-disable react-hooks/set-state-in-effect -- loading state before async fetch */
      setFetchStatus("fetching");
      /* eslint-enable react-hooks/set-state-in-effect */
      let cancelled = false;
      fetchEncryptedFromSync(budgetId).then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setFetchStatus("not_found");
          router.replace("/get-started");
          return;
        }
        setEncryptedBlob(blob);
        setFetchStatus("found");
      });
      return () => {
        cancelled = true;
      };
    } else {
      setEncryptedBlob(null);
      setFetchStatus("idle");
    }
  }, [isUnlocked, budgetId, router]);

  useEffect(() => {
    if (!isUnlocked || !budgetId) return;
    let cancelled = false;
    loadBudget(budgetId).then((result) => {
      if (cancelled) return;
      if (!result.ok) setKeyErrorReason(result.reason);
      else if (
        "newerVersionAvailable" in result &&
        result.newerVersionAvailable
      )
        setNewerVersionDialogOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isUnlocked, budgetId]);

  useEffect(() => {
    if (!budgetId || typeof window === "undefined") return;
    const meta = getBudgetMetadata(budgetId);
    /* eslint-disable react-hooks/set-state-in-effect -- sync metadata from storage */
    setBudgetName(meta.name ?? "My Budget");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [budgetId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = budgetState.budgetId
      ? `${ENCRYPTED_STORAGE_KEY_PREFIX}${budgetState.budgetId}`
      : null;
    const stored = storageKey ? localStorage.getItem(storageKey) : null;
    const id = setTimeout(() => setRawEncrypted(stored), 0);
    return () => clearTimeout(id);
  }, [budgetState, budgetState.budgetId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hostname === "localhost") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time debug init
      setShowDebugSection(true);
    }
  }, []);

  useSyncVersionPolling({
    enabled: isUnlocked && !!budgetId && !newerVersionDialogOpen,
    budgetId: budgetId ?? undefined,
    onNewerVersion: () => setNewerVersionDialogOpen(true),
  });

  const { commandPaletteOpenRef } = useBudgetHotkeys(
    {
      commandPaletteOpen,
      addEventDialogOpen,
      addExpenseEventDialogOpen,
      incomeModalOpen,
      expenseModalOpen,
      yearlySummaryDialogOpen,
      editIncomeEventDialogOpen,
      editExpenseEventDialogOpen,
      newerVersionDialogOpen,
      showBlankState,
    },
    {
      setCommandPaletteOpen,
      setShowDebugSection,
      setIncomeModalOpen,
      setExpenseModalOpen,
      setAddEventDialogOpen,
      setAddExpenseEventDialogOpen,
      setYearlySummaryDialogOpen,
      setDateViewMode,
      scrollToAdjacentMonth,
    },
    { dateViewMode },
  );

  const onCommandPaletteOpenChange = useCallback(
    (open: boolean) => {
      commandPaletteOpenRef.current = open;
      setCommandPaletteOpen(open);
    },
    [setCommandPaletteOpen, commandPaletteOpenRef],
  );

  const closeCommandPalette = useCallback(() => {
    commandPaletteOpenRef.current = false;
    setCommandPaletteOpen(false);
  }, [setCommandPaletteOpen, commandPaletteOpenRef]);

  const executeCommand = useBudgetPageCommands({
    onClosePalette: closeCommandPalette,
    dateViewMode,
    setDateViewMode,
    setAddEventDialogOpen,
    setAddExpenseEventDialogOpen,
    setIncomeModalOpen,
    setExpenseModalOpen,
    setYearlySummaryDialogOpen,
    scrollToMonthByIndex,
    scrollToAdjacentMonth,
  });

  return {
    // Loading gates
    sessionRestored,
    isUnlocked,
    fetchStatus,
    encryptedBlob,
    budgetId,

    // Header
    importFileRef,
    importError,
    setImportError,
    handleImportClick,
    handleImportFileChange,
    handleExport,
    handleExportCsv,
    handleLogout,

    // Budget title
    budgetName,
    setBudgetName,
    editingBudgetTitle,
    setEditingBudgetTitle,

    // Modals & dialogs
    incomeModalOpen,
    setIncomeModalOpen,
    expenseModalOpen,
    setExpenseModalOpen,
    addEventDialogOpen,
    setAddEventDialogOpen,
    addExpenseEventDialogOpen,
    setAddExpenseEventDialogOpen,
    addIncomeDefaultDate,
    setAddIncomeDefaultDate,
    addExpenseDefaultDate,
    setAddExpenseDefaultDate,
    commandPaletteOpen,
    setCommandPaletteOpen,
    commandPaletteOpenRef,
    onCommandPaletteOpenChange,
    commandPaletteCommands,
    executeCommand,
    yearlySummaryDialogOpen,
    setYearlySummaryDialogOpen,
    expandedPaycheckEventIds,
    setExpandedPaycheckEventIds,
    newerVersionDialogOpen,
    setNewerVersionDialogOpen,
    editIncomeEventDialogOpen,
    editExpenseEventDialogOpen,
    editingIncomeEvent,
    editingExpenseEvent,

    // Unlock / key error
    keyErrorReason,
    handleKeyErrorUnlockAgain,
    handleUnlockSuccess,
    handleUnlockCancel,

    // Onboarding
    showBlankState,
    onboardingStep,
    setOnboardingStep,
    setBlankStateDismissed,

    // Date view & data
    dateViewMode,
    setDateViewMode,
    dateViewMonths,
    periodLabel,
    minDate,
    yearlySummaryData,
    getYearlyTotalIncome,
    getYearlyTotalGrossIncome,
    getYearlyTotalExpenses,
    getYearlyTotalSavings,
    getYearlyTotalDebtRepayment,

    // Edit handlers
    openEditIncomeEventDialog,
    closeEditIncomeEventDialog,
    openEditExpenseEventDialog,
    closeEditExpenseEventDialog,

    // Sidebar
    hotkeysVisible,
    setHotkeysVisible,

    // Debug
    showDebugSection,
    budgetState,
    rawEncrypted,
  };
}
