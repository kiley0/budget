"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { useSessionStore } from "@/store/session";
import {
  useBudgetStore,
  loadBudget,
  saveBudget,
  replaceBudgetFromExport,
  fetchEncryptedFromSync,
  loadRemoteVersionAndApply,
  addIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
  addExpenseDestination,
  updateExpenseDestination,
  deleteExpenseDestination,
  addIncomeEvent,
  updateIncomeEvent,
  deleteIncomeEvent,
  addExpenseEvent,
  updateExpenseEvent,
  deleteExpenseEvent,
  type IncomeEvent,
  type ExpenseEvent,
} from "@/store/budget";
import {
  decryptSyncPayloadWithPassphrase,
  isPortableFormat,
  persistKeyToSession,
  importKeyFromSession,
  clearAllSessionBudgetData,
} from "@/lib/crypto";
import {
  BUDGET_ID_STORAGE_KEY,
  ENCRYPTED_STORAGE_KEY_PREFIX,
  SELECT_NONE,
  getPreferences,
  setPreferences,
  setNewerVersionCooldown,
  PAYCHECK_WITHHOLDINGS,
  STOCK_INCOME_TYPES,
  getExpenseCategoryLabel,
  getIncomeTypeLabel,
  getBudgetMetadata,
  parseMetadataFromExport,
  setBudgetMetadata,
} from "@/lib/constants";
import { parseIncomeFormFromInputs } from "@/lib/income-form-utils";
import type { PaycheckWithholdings } from "@/store/budget";
import {
  formatIncomeSchedule,
  formatExpenseSchedule,
} from "@/lib/schedule-format";
import { budgetStateToCsv } from "@/lib/export-csv";
import { buildBudgetExportData } from "@/lib/export-json";
import { buildYearlySummaryData } from "@/lib/yearly-summary";
import {
  type DateViewMode,
  getMonthsForViewMode,
  getPeriodLabel,
} from "@/lib/date-view";
import {
  buildIncomeScheduleFromForm,
  buildExpenseScheduleFromForm,
} from "@/lib/schedule-builders";
import { formatCurrency, parseCurrency } from "@/lib/format";
import { downloadBlob } from "@/lib/download";
import { useBudgetMonthData } from "@/hooks/useBudgetMonthData";
import { useBudgetSourceNames } from "@/hooks/useBudgetSourceNames";
import { useBudgetHotkeys } from "@/hooks/useBudgetHotkeys";
import { useStockPriceFetch } from "@/hooks/useStockPriceFetch";
import { useSyncVersionPolling } from "@/hooks/useSyncVersionPolling";
import {
  AddExpenseDestinationDialog,
  AddIncomeSourceDialog,
  BudgetCommandPalette,
  BudgetDebugSection,
  BudgetHeader,
  ExpenseEventFormFields,
  IncomeEventFormFields,
  MonthlyPnLSection,
  NewerVersionAvailableDialog,
  SummaryStat,
  OnboardingFlow,
  YearlySummaryDialogContent,
} from "@/components/budget";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Banknote, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function BudgetPage() {
  const router = useRouter();
  const params = useParams();
  const budgetId = Array.isArray(params?.budgetId)
    ? params.budgetId[0]
    : params?.budgetId;
  const isUnlocked = useSessionStore((s) => s.isUnlocked());
  const budgetState = useBudgetStore((s) => s);
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    importKeyFromSession()
      .then((key) => {
        if (key) useSessionStore.getState().setKey(key);
      })
      .finally(() => setSessionRestored(true));
  }, []);
  const [rawEncrypted, setRawEncrypted] = useState<string | null>(null);
  const [showDebugSection, setShowDebugSection] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [addSourceDialogOpen, setAddSourceDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [addExpenseDestinationDialogOpen, setAddExpenseDestinationDialogOpen] =
    useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseName, setEditExpenseName] = useState("");
  const [editExpenseDescription, setEditExpenseDescription] = useState("");

  const [addExpenseEventDialogOpen, setAddExpenseEventDialogOpen] =
    useState(false);
  const [expEventName, setExpEventName] = useState("");
  const [expEventAmount, setExpEventAmount] = useState("");
  const [expEventDestinationId, setExpEventDestinationId] = useState("");
  const [expEventCategory, setExpEventCategory] = useState("");
  const [expEventScheduleType, setExpEventScheduleType] = useState<
    "one-time" | "recurring"
  >("one-time");
  const [expEventDate, setExpEventDate] = useState("");
  const [expEventDayOfMonth, setExpEventDayOfMonth] = useState("");
  const [expEventRecurringStartDate, setExpEventRecurringStartDate] =
    useState("");
  const [expEventRecurringEndDate, setExpEventRecurringEndDate] = useState("");
  const [editingExpenseEventId, setEditingExpenseEventId] = useState<
    string | null
  >(null);
  const [editExpEventName, setEditExpEventName] = useState("");
  const [editExpEventAmount, setEditExpEventAmount] = useState("");
  const [editExpEventDestinationId, setEditExpEventDestinationId] =
    useState("");
  const [editExpEventCategory, setEditExpEventCategory] = useState("");
  const [editExpEventScheduleType, setEditExpEventScheduleType] = useState<
    "one-time" | "recurring"
  >("one-time");
  const [editExpEventDate, setEditExpEventDate] = useState("");
  const [editExpEventDayOfMonth, setEditExpEventDayOfMonth] = useState("");
  const [editExpEventRecurringStartDate, setEditExpEventRecurringStartDate] =
    useState("");
  const [editExpEventRecurringEndDate, setEditExpEventRecurringEndDate] =
    useState("");

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
  const [eventLabel, setEventLabel] = useState("");
  const [eventAmount, setEventAmount] = useState("");
  const [eventIncomeSourceId, setEventIncomeSourceId] = useState("");
  const [eventIncomeType, setEventIncomeType] = useState("");
  const [eventStockSymbol, setEventStockSymbol] = useState("");
  const [eventShares, setEventShares] = useState("");
  const [eventStockTaxRate, setEventStockTaxRate] = useState("");
  const addStockFetch = useStockPriceFetch({
    onAmountComputed: setEventAmount,
  });
  const [eventPaycheckGross, setEventPaycheckGross] = useState("");
  const [eventPaycheckWithholdings, setEventPaycheckWithholdings] = useState<
    Record<string, string>
  >({});
  const [eventScheduleType, setEventScheduleType] = useState<
    "one-time" | "recurring"
  >("one-time");
  const [eventDate, setEventDate] = useState("");
  const [eventDayOfMonth, setEventDayOfMonth] = useState("");
  const [eventRecurringStartDate, setEventRecurringStartDate] = useState("");
  const [eventRecurringEndDate, setEventRecurringEndDate] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventLabel, setEditEventLabel] = useState("");
  const [editEventAmount, setEditEventAmount] = useState("");
  const [editEventIncomeSourceId, setEditEventIncomeSourceId] = useState("");
  const [editEventIncomeType, setEditEventIncomeType] = useState("");
  const [editEventStockSymbol, setEditEventStockSymbol] = useState("");
  const [editEventShares, setEditEventShares] = useState("");
  const [editEventStockTaxRate, setEditEventStockTaxRate] = useState("");
  const editStockFetch = useStockPriceFetch({
    onAmountComputed: setEditEventAmount,
  });
  const [editEventPaycheckGross, setEditEventPaycheckGross] = useState("");
  const [editEventPaycheckWithholdings, setEditEventPaycheckWithholdings] =
    useState<Record<string, string>>({});
  const [editEventScheduleType, setEditEventScheduleType] = useState<
    "one-time" | "recurring"
  >("one-time");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventDayOfMonth, setEditEventDayOfMonth] = useState("");
  const [editEventRecurringStartDate, setEditEventRecurringStartDate] =
    useState("");
  const [editEventRecurringEndDate, setEditEventRecurringEndDate] =
    useState("");
  const importFileRef = useRef<HTMLInputElement>(null);
  const [keyErrorReason, setKeyErrorReason] = useState<
    "no_key" | "decrypt_failed" | null
  >(null);
  const [encryptedBlob, setEncryptedBlob] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<
    "idle" | "fetching" | "found" | "not_found"
  >("idle");
  const [urlPassphrase, setUrlPassphrase] = useState("");
  const [urlPassphraseError, setUrlPassphraseError] = useState("");
  const [urlUnlockLoading, setUrlUnlockLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [budgetName, setBudgetName] = useState("");
  const [editingBudgetTitle, setEditingBudgetTitle] = useState(false);
  const [blankStateDismissed, setBlankStateDismissed] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4 | "done">(
    1,
  );

  const incomeSources = useBudgetStore((s) => s.incomeSources);
  const incomeEvents = useBudgetStore((s) => s.incomeEvents);
  const expenseDestinations = useBudgetStore((s) => s.expenseDestinations);
  const expenseEvents = useBudgetStore((s) => s.expenseEvents);

  const isBudgetEmpty =
    incomeSources.length === 0 &&
    expenseDestinations.length === 0 &&
    incomeEvents.length === 0 &&
    expenseEvents.length === 0;
  /** Show blank state when budget is empty OR user is mid-onboarding (steps 2–done). */
  const showBlankState =
    (isBudgetEmpty || onboardingStep !== 1) &&
    !blankStateDismissed &&
    keyErrorReason === null &&
    budgetId !== undefined;

  const [dateViewMode, setDateViewMode] =
    useState<DateViewMode>("current-year");
  const dateViewMonths = useMemo(
    () => getMonthsForViewMode(dateViewMode),
    [dateViewMode],
  );
  const periodLabel = getPeriodLabel(dateViewMode);
  const minDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const {
    getYearlyTotalIncome,
    getYearlyTotalGrossIncome,
    getYearlyTotalExpenses,
    getYearlyTotalSavings,
    getYearlyTotalDebtRepayment,
  } = useBudgetMonthData(dateViewMonths);
  const { getIncomeSourceName, getExpenseDestinationName } =
    useBudgetSourceNames();
  const actualsByMonth = useBudgetStore((s) => s.actualsByMonth ?? {});
  const yearlySummaryData = useMemo(
    () =>
      buildYearlySummaryData(
        incomeEvents,
        expenseEvents,
        dateViewMonths,
        actualsByMonth,
        incomeSources,
        expenseDestinations,
      ),
    [
      incomeEvents,
      expenseEvents,
      dateViewMonths,
      actualsByMonth,
      incomeSources,
      expenseDestinations,
    ],
  );

  function handleAddExpenseEvent(e: React.FormEvent) {
    e.preventDefault();
    const name = expEventName.trim();
    if (!name) return;
    const amount = parseCurrency(expEventAmount);
    if (Number.isNaN(amount) || amount < 0) return;
    if (!expEventDestinationId) return;
    const schedule = buildExpenseScheduleFromForm(
      expEventScheduleType,
      expEventDate,
      expEventDayOfMonth,
      expEventRecurringStartDate,
      expEventRecurringEndDate,
    );
    if (!schedule) return;
    addExpenseEvent({
      label: name,
      amount,
      expenseDestinationId: expEventDestinationId,
      category: expEventCategory || undefined,
      schedule,
    });
    useSessionStore
      .getState()
      .setLastUsedExpenseDestinationId(expEventDestinationId);
    setExpEventName("");
    setExpEventAmount("");
    setExpEventDestinationId("");
    setExpEventCategory("");
    setExpEventDate("");
    setExpEventDayOfMonth("");
    setExpEventRecurringStartDate("");
    setExpEventRecurringEndDate("");
    setAddExpenseEventDialogOpen(false);
  }

  function closeAddExpenseEventDialog() {
    setAddExpenseEventDialogOpen(false);
    setAddExpenseDefaultDate(null);
  }

  function startEditingExpenseEvent(event: ExpenseEvent) {
    setEditingExpenseEventId(event.id);
    setEditExpEventName(event.label);
    setEditExpEventAmount(String(event.amount));
    setEditExpEventDestinationId(event.expenseDestinationId ?? "");
    setEditExpEventCategory(event.category ?? "");
    setEditExpEventScheduleType(event.schedule.type);
    setEditExpEventDate(
      event.schedule.type === "one-time" ? event.schedule.date : "",
    );
    setEditExpEventDayOfMonth(
      event.schedule.type === "recurring"
        ? String(event.schedule.dayOfMonth)
        : "",
    );
    setEditExpEventRecurringStartDate(
      event.schedule.type === "recurring" && event.schedule.startDate
        ? event.schedule.startDate
        : "",
    );
    setEditExpEventRecurringEndDate(
      event.schedule.type === "recurring" && event.schedule.endDate
        ? event.schedule.endDate
        : "",
    );
  }

  function cancelEditingExpenseEvent() {
    setEditingExpenseEventId(null);
    setEditExpenseEventDialogOpen(false);
    setEditExpEventName("");
    setEditExpEventAmount("");
    setEditExpEventDestinationId("");
    setEditExpEventCategory("");
    setEditExpEventDate("");
    setEditExpEventDayOfMonth("");
    setEditExpEventRecurringStartDate("");
    setEditExpEventRecurringEndDate("");
  }

  function handleSaveExpenseEventEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExpenseEventId) return;
    const name = editExpEventName.trim();
    if (!name) return;
    const amount = parseCurrency(editExpEventAmount);
    if (Number.isNaN(amount) || amount < 0) return;
    const schedule = buildExpenseScheduleFromForm(
      editExpEventScheduleType,
      editExpEventDate,
      editExpEventDayOfMonth,
      editExpEventRecurringStartDate,
      editExpEventRecurringEndDate,
    );
    if (!schedule) return;
    updateExpenseEvent(editingExpenseEventId, {
      label: name,
      amount,
      expenseDestinationId: editExpEventDestinationId || undefined,
      category: editExpEventCategory || undefined,
      schedule,
    });
    cancelEditingExpenseEvent();
  }

  function handleDeleteExpenseEvent(id: string) {
    deleteExpenseEvent(id);
    if (editingExpenseEventId === id) cancelEditingExpenseEvent();
  }

  function startEditingExpense(source: {
    id: string;
    name: string;
    description: string;
  }) {
    setEditingExpenseId(source.id);
    setEditExpenseName(source.name);
    setEditExpenseDescription(source.description);
  }

  function cancelEditingExpense() {
    setEditingExpenseId(null);
    setEditExpenseName("");
    setEditExpenseDescription("");
  }

  function handleSaveExpenseEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExpenseId) return;
    const name = editExpenseName.trim();
    if (!name) return;
    updateExpenseDestination(editingExpenseId, {
      name,
      description: editExpenseDescription.trim(),
    });
    cancelEditingExpense();
  }

  function handleDeleteExpense(id: string) {
    deleteExpenseDestination(id);
    if (editingExpenseId === id) cancelEditingExpense();
  }

  function startEditing(source: {
    id: string;
    name: string;
    description: string;
  }) {
    setEditingId(source.id);
    setEditName(source.name);
    setEditDescription(source.description);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    updateIncomeSource(editingId, {
      name,
      description: editDescription.trim(),
    });
    cancelEditing();
  }

  function handleDelete(id: string) {
    deleteIncomeSource(id);
    if (editingId === id) cancelEditing();
  }

  function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    const label = eventLabel.trim();
    if (!label) return;
    if (!eventIncomeSourceId) return;
    const schedule = buildIncomeScheduleFromForm(
      eventScheduleType,
      eventDate,
      eventDayOfMonth,
      eventRecurringStartDate,
      eventRecurringEndDate,
    );
    if (!schedule) return;

    const parsed = parseIncomeFormFromInputs(
      eventIncomeType,
      eventAmount,
      eventIncomeType === "paycheck"
        ? { gross: eventPaycheckGross, withholdings: eventPaycheckWithholdings }
        : null,
      STOCK_INCOME_TYPES.includes(
        eventIncomeType as (typeof STOCK_INCOME_TYPES)[number],
      )
        ? {
            symbol: eventStockSymbol,
            shares: eventShares,
            taxRate: eventStockTaxRate,
          }
        : null,
    );
    if (!parsed) return;

    addIncomeEvent({
      label,
      amount: parsed.amount,
      incomeSourceId: eventIncomeSourceId,
      incomeType: eventIncomeType || undefined,
      stockSaleDetails: parsed.stockSaleDetails,
      paycheckDetails: parsed.paycheckDetails,
      schedule,
    });
    useSessionStore.getState().setLastUsedIncomeSourceId(eventIncomeSourceId);
    setEventLabel("");
    setEventAmount("");
    setEventIncomeSourceId("");
    setEventIncomeType("");
    setEventStockSymbol("");
    setEventShares("");
    setEventStockTaxRate("");
    addStockFetch.reset();
    setEventPaycheckGross("");
    setEventPaycheckWithholdings({});
    setEventDate("");
    setEventDayOfMonth("");
    setEventRecurringStartDate("");
    setEventRecurringEndDate("");
    setAddEventDialogOpen(false);
  }

  function closeAddEventDialog() {
    setAddEventDialogOpen(false);
    setAddIncomeDefaultDate(null);
    setEventStockSymbol("");
    setEventShares("");
    setEventStockTaxRate("");
    addStockFetch.reset();
    setEventPaycheckGross("");
    setEventPaycheckWithholdings({});
  }

  function openEditIncomeEventDialog(event: IncomeEvent) {
    startEditingEvent(event);
    setEditIncomeEventDialogOpen(true);
  }

  function closeEditIncomeEventDialog() {
    setEditIncomeEventDialogOpen(false);
    cancelEditingEvent();
  }

  function openEditExpenseEventDialog(event: ExpenseEvent) {
    startEditingExpenseEvent(event);
    setEditExpenseEventDialogOpen(true);
  }

  function closeEditExpenseEventDialog() {
    setEditExpenseEventDialogOpen(false);
    cancelEditingExpenseEvent();
  }

  function startEditingEvent(event: IncomeEvent) {
    setEditingEventId(event.id);
    setEditEventLabel(event.label);
    setEditEventAmount(String(event.amount));
    setEditEventIncomeSourceId(event.incomeSourceId ?? "");
    const inferredType =
      event.incomeType ??
      (event.paycheckDetails ? "paycheck" : null) ??
      (event.stockSaleDetails ? "stock_sale_proceeds" : null) ??
      "";
    setEditEventIncomeType(inferredType);
    setEditEventStockSymbol(event.stockSaleDetails?.symbol ?? "");
    setEditEventShares(
      event.stockSaleDetails?.shares
        ? String(event.stockSaleDetails.shares)
        : "",
    );
    setEditEventStockTaxRate(
      event.stockSaleDetails?.taxRate != null
        ? String(event.stockSaleDetails.taxRate)
        : "",
    );
    editStockFetch.reset();
    setEditEventPaycheckGross(
      event.paycheckDetails ? String(event.paycheckDetails.grossAmount) : "",
    );
    const pd = event.paycheckDetails?.withholdings;
    setEditEventPaycheckWithholdings(
      pd
        ? Object.fromEntries(
            PAYCHECK_WITHHOLDINGS.map(({ key }) => {
              const v = pd[key as keyof PaycheckWithholdings];
              return [key, v != null ? String(v) : ""];
            }),
          )
        : {},
    );
    setEditEventScheduleType(event.schedule.type);
    setEditEventDate(
      event.schedule.type === "one-time" ? event.schedule.date : "",
    );
    setEditEventDayOfMonth(
      event.schedule.type === "recurring"
        ? String(event.schedule.dayOfMonth)
        : "",
    );
    setEditEventRecurringStartDate(
      event.schedule.type === "recurring" && event.schedule.startDate
        ? event.schedule.startDate
        : "",
    );
    setEditEventRecurringEndDate(
      event.schedule.type === "recurring" && event.schedule.endDate
        ? event.schedule.endDate
        : "",
    );
  }

  function cancelEditingEvent() {
    setEditingEventId(null);
    setEditIncomeEventDialogOpen(false);
    setEditEventLabel("");
    setEditEventAmount("");
    setEditEventIncomeSourceId("");
    setEditEventIncomeType("");
    setEditEventStockSymbol("");
    setEditEventShares("");
    setEditEventStockTaxRate("");
    editStockFetch.reset();
    setEditEventPaycheckGross("");
    setEditEventPaycheckWithholdings({});
    setEditEventDate("");
    setEditEventDayOfMonth("");
    setEditEventRecurringStartDate("");
    setEditEventRecurringEndDate("");
  }

  function handleSaveEventEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEventId) return;
    const name = editEventLabel.trim();
    if (!name) return;
    const schedule = buildIncomeScheduleFromForm(
      editEventScheduleType,
      editEventDate,
      editEventDayOfMonth,
      editEventRecurringStartDate,
      editEventRecurringEndDate,
    );
    if (!schedule) return;

    const parsed = parseIncomeFormFromInputs(
      editEventIncomeType,
      editEventAmount,
      editEventIncomeType === "paycheck"
        ? {
            gross: editEventPaycheckGross,
            withholdings: editEventPaycheckWithholdings,
          }
        : null,
      STOCK_INCOME_TYPES.includes(
        editEventIncomeType as (typeof STOCK_INCOME_TYPES)[number],
      )
        ? {
            symbol: editEventStockSymbol,
            shares: editEventShares,
            taxRate: editEventStockTaxRate,
          }
        : null,
    );
    if (!parsed) return;

    updateIncomeEvent(editingEventId, {
      label: name,
      amount: parsed.amount,
      incomeSourceId: editEventIncomeSourceId || undefined,
      incomeType: editEventIncomeType || undefined,
      stockSaleDetails: parsed.stockSaleDetails,
      paycheckDetails: parsed.paycheckDetails,
      schedule,
    });
    cancelEditingEvent();
  }

  function handleDeleteEvent(id: string) {
    deleteIncomeEvent(id);
    if (editingEventId === id) cancelEditingEvent();
  }

  function handleExport() {
    const state = useBudgetStore.getState();
    const metadata = state.budgetId
      ? getBudgetMetadata(state.budgetId)
      : undefined;
    const exportData = buildBudgetExportData(state, metadata);
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", "-")
      .replace(/:/g, "-");
    downloadBlob(blob, `budget-export-${timestamp}.json`);
  }

  function handleExportCsv() {
    const state = useBudgetStore.getState();
    const csv = budgetStateToCsv(state);
    const blob = new Blob([csv], { type: "text/csv; charset=utf-8" });
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", "-")
      .replace(/:/g, "-");
    downloadBlob(blob, `budget-export-${timestamp}.csv`);
  }

  function handleImportClick() {
    importFileRef.current?.click();
  }

  function scrollToAdjacentMonth(delta: number) {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-month-index]"),
    );
    if (cards.length === 0) return;
    // Find the card closest to the top of the viewport (most "current")
    let bestIndex = 0;
    let bestTop = Infinity;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      // Card is visible if any part is in viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
      const score = Math.abs(rect.top);
      if (score < bestTop) {
        bestTop = score;
        bestIndex = i;
      }
    }
    // If no card visible, use first or last based on scroll position
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

  function formatMonthLabel(slot: { year: number; monthIndex: number }) {
    return new Date(slot.year, slot.monthIndex, 1).toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
  }

  const commandPaletteCommands = useMemo(
    () => [
      { value: "back-to-top", label: "Back to top" },
      { value: "prev-month", label: "Previous month" },
      { value: "next-month", label: "Next month" },
      {
        value: "add-income",
        label: "Add expected income",
        disabled: incomeSources.length === 0,
      },
      {
        value: "add-expense",
        label: "Add expected expense",
        disabled: expenseDestinations.length === 0,
      },
      { value: "manage-income", label: "Manage income" },
      { value: "manage-expenses", label: "Manage expenses" },
      { value: "yearly-summary", label: "Yearly summary" },
      { value: "jump-current", label: "Jump to current month" },
      ...dateViewMonths.map((slot, i) => ({
        value: `jump-${i}`,
        label: `Jump to ${formatMonthLabel(slot)}`,
      })),
    ],
    [dateViewMonths, incomeSources.length, expenseDestinations.length],
  );

  function executeCommand(value: string) {
    setCommandPaletteOpen(false);
    commandPaletteOpenRef.current = false;
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
      const el = document.querySelector(`[data-month-index="${index}"]`);
      if (el) {
        const y =
          (el as HTMLElement).getBoundingClientRect().top +
          (window.scrollY || document.documentElement.scrollTop);
        window.scrollTo({ top: y - 16, behavior: "smooth" });
      }
    } else if (value === "prev-month") {
      scrollToAdjacentMonth(-1);
    } else if (value === "next-month") {
      scrollToAdjacentMonth(1);
    } else if (value === "add-income") {
      if (incomeSources.length > 0) setAddEventDialogOpen(true);
    } else if (value === "add-expense") {
      if (expenseDestinations.length > 0) setAddExpenseEventDialogOpen(true);
    } else if (value === "manage-income") {
      setIncomeModalOpen(true);
    } else if (value === "manage-expenses") {
      setExpenseModalOpen(true);
    } else if (value === "yearly-summary") {
      setYearlySummaryDialogOpen(true);
    }
  }

  async function handleImportFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setImportError(null);
    const confirmed = window.confirm(
      "Import this data? It will replace all existing budget data.",
    );
    if (!confirmed) {
      input.value = "";
      return;
    }
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const currentBudgetId =
        budgetId ?? useBudgetStore.getState().budgetId ?? "";
      replaceBudgetFromExport(raw, currentBudgetId);
      if (
        currentBudgetId &&
        raw &&
        typeof raw === "object" &&
        "metadata" in raw
      ) {
        const meta = parseMetadataFromExport(raw.metadata);
        setBudgetMetadata(currentBudgetId, meta);
        setBudgetName(meta.name ?? "My Budget");
      }
      await saveBudget();
      toast.success("Import successful.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid or unsupported file.";
      setImportError(`Import failed: ${message}`);
      toast.error("Import failed. " + message);
    } finally {
      input.value = "";
    }
  }

  async function handleLogout() {
    await saveBudget();
    useSessionStore.getState().clearKey();
    clearAllSessionBudgetData();
    router.push("/");
  }

  const handleKeyErrorUnlockAgain = useCallback(() => {
    setKeyErrorReason(null);
    useSessionStore.getState().clearKey();
    clearAllSessionBudgetData();
    router.replace("/get-started");
  }, [router]);

  useEffect(() => {
    if (!isUnlocked && !budgetId) {
      router.replace("/get-started");
      return;
    }
  }, [isUnlocked, budgetId, router]);

  useEffect(() => {
    if (!isUnlocked && budgetId) {
      setFetchStatus("fetching");
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
    setBudgetName(meta.name ?? "My Budget");
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
    if (addEventDialogOpen && incomeSources.length > 0) {
      const lastUsed = useSessionStore.getState().lastUsedIncomeSourceId;
      if (lastUsed && incomeSources.some((s) => s.id === lastUsed)) {
        setEventIncomeSourceId(lastUsed);
      }
      if (addIncomeDefaultDate) {
        setEventDate(addIncomeDefaultDate);
      } else {
        setEventDate((prev) => prev || minDate);
      }
    }
  }, [addEventDialogOpen, incomeSources, minDate, addIncomeDefaultDate]);

  useEffect(() => {
    if (addExpenseEventDialogOpen && expenseDestinations.length > 0) {
      const lastUsed = useSessionStore.getState().lastUsedExpenseDestinationId;
      if (lastUsed && expenseDestinations.some((s) => s.id === lastUsed)) {
        setExpEventDestinationId(lastUsed);
      }
      if (addExpenseDefaultDate) {
        setExpEventDate(addExpenseDefaultDate);
      } else {
        setExpEventDate((prev) => prev || minDate);
      }
    }
  }, [
    addExpenseEventDialogOpen,
    expenseDestinations,
    minDate,
    addExpenseDefaultDate,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hostname === "localhost") {
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
      addSourceDialogOpen,
      addExpenseDestinationDialogOpen,
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
    {
      incomeSourcesCount: incomeSources.length,
      expenseDestinationsCount: expenseDestinations.length,
      dateViewMode,
    },
  );

  if (!sessionRestored) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <p className="text-muted-foreground" role="status" aria-live="polite">
          Loading…
        </p>
      </div>
    );
  }

  if (!isUnlocked) {
    if (fetchStatus === "found" && encryptedBlob) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
          <div className="w-full max-w-sm space-y-5">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Open budget
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your passphrase to view this budget.
              </p>
            </div>
            {!isPortableFormat(encryptedBlob) && (
              <div className="space-y-3">
                <p className="text-sm text-destructive" role="alert">
                  This budget was created before link sharing. Open it on the
                  device where you created it.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.replace("/get-started")}
                >
                  Go back
                </Button>
              </div>
            )}
            {isPortableFormat(encryptedBlob) && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setUrlPassphraseError("");
                  if (!urlPassphrase.trim()) {
                    setUrlPassphraseError("Enter your passphrase.");
                    return;
                  }
                  setUrlUnlockLoading(true);
                  try {
                    const { plaintext, key } =
                      await decryptSyncPayloadWithPassphrase(
                        encryptedBlob,
                        urlPassphrase,
                      );
                    useSessionStore.getState().setKey(key);
                    await persistKeyToSession(key);
                    if (typeof window !== "undefined") {
                      localStorage.setItem(
                        BUDGET_ID_STORAGE_KEY,
                        budgetId as string,
                      );
                    }
                    const parsed = JSON.parse(plaintext) as unknown;
                    replaceBudgetFromExport(parsed, budgetId as string);
                    const meta = parseMetadataFromExport(
                      parsed &&
                        typeof parsed === "object" &&
                        "metadata" in parsed
                        ? (parsed as { metadata: unknown }).metadata
                        : undefined,
                    );
                    setBudgetMetadata(budgetId as string, meta);
                    setBudgetName(meta.name ?? "My Budget");
                    setEncryptedBlob(null);
                    setFetchStatus("idle");
                  } catch {
                    setUrlPassphraseError(
                      "Incorrect passphrase. Please try again.",
                    );
                  } finally {
                    setUrlUnlockLoading(false);
                  }
                }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="url-passphrase">Passphrase</Label>
                  <Input
                    id="url-passphrase"
                    type="password"
                    autoComplete="current-password"
                    value={urlPassphrase}
                    onChange={(e) => {
                      setUrlPassphrase(e.target.value);
                      setUrlPassphraseError("");
                    }}
                    placeholder="Your passphrase"
                    disabled={urlUnlockLoading}
                    aria-invalid={!!urlPassphraseError}
                  />
                </div>
                {urlPassphraseError && (
                  <p
                    className="text-sm text-destructive"
                    role="alert"
                    id="url-passphrase-error"
                  >
                    {urlPassphraseError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={urlUnlockLoading}
                  >
                    {urlUnlockLoading ? "Unlocking…" : "Unlock"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEncryptedBlob(null);
                      setFetchStatus("idle");
                      router.replace("/get-started");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground" role="status" aria-live="polite">
          {fetchStatus === "not_found" ? "Redirecting…" : "Loading…"}
        </p>
      </div>
    );
  }

  if (!budgetId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground" role="status" aria-live="polite">
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-0 z-[100] -translate-y-[calc(100%+1rem)] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-none transition-[transform,top,box-shadow] duration-200 focus-visible:top-4 focus-visible:translate-y-0 focus-visible:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <BudgetHeader
          importFileRef={importFileRef}
          onImportClick={handleImportClick}
          onImportFileChange={handleImportFileChange}
          onExportJson={handleExport}
          onExportCsv={handleExportCsv}
          onLogout={handleLogout}
        />
        {importError && (
          <div
            className="bg-destructive/10 px-6 py-2 text-sm text-destructive"
            role="alert"
          >
            {importError}
            <Button
              type="button"
              variant="link"
              size="sm"
              className="ml-2 h-auto p-0 font-medium text-destructive hover:text-destructive/90"
              onClick={() => setImportError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}
        <main
          id="main-content"
          className="flex-1 px-6 py-8"
          aria-label="Budget details"
        >
          <div className="flex gap-8">
            <div className="min-w-0 flex-1">
              <section className="mb-6" aria-label="Budget name">
                {editingBudgetTitle ? (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="budget-name"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        Budget name
                      </Label>
                      <Input
                        id="budget-name"
                        type="text"
                        value={budgetName}
                        onChange={(e) => setBudgetName(e.target.value)}
                        onBlur={(e) => {
                          if (budgetId) {
                            const value =
                              (e.target as HTMLInputElement).value.trim() ||
                              undefined;
                            setBudgetMetadata(budgetId, { name: value });
                          }
                        }}
                        placeholder="e.g. Personal, Household"
                        className="text-lg font-semibold"
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (budgetId) {
                            setBudgetMetadata(budgetId, {
                              name: budgetName.trim() || undefined,
                            });
                          }
                          setEditingBudgetTitle(false);
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h1 className="text-2xl font-semibold text-foreground">
                            {budgetName || "My Budget"}
                          </h1>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-primary"
                            onClick={() => setEditingBudgetTitle(true)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIncomeModalOpen(true)}
                        >
                          Manage income
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setExpenseModalOpen(true)}
                        >
                          Manage expenses
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setYearlySummaryDialogOpen(true)}
                        >
                          View Yearly Summary
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <Card className="mb-6 md:hidden">
                <CardContent className="px-4 py-4">
                  <div className="flex flex-wrap items-end gap-x-6 gap-y-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setIncomeModalOpen(true)}
                      className="flex flex-col rounded px-1 -mx-1 py-0.5 text-left hover:bg-muted/50 cursor-pointer"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        Income (gross)
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Banknote className="size-3.5 shrink-0" aria-hidden />
                        {formatCurrency(getYearlyTotalGrossIncome())}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncomeModalOpen(true)}
                      className="flex flex-col rounded px-1 -mx-1 py-0.5 text-left hover:bg-muted/50 cursor-pointer"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        Income (take home)
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Banknote className="size-3.5 shrink-0" aria-hidden />
                        {formatCurrency(getYearlyTotalIncome())}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpenseModalOpen(true)}
                      className="flex flex-col rounded px-1 -mx-1 py-0.5 text-left hover:bg-muted/50 cursor-pointer"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        Expenses
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CreditCard className="size-3.5 shrink-0" aria-hidden />
                        {formatCurrency(getYearlyTotalExpenses())}
                      </span>
                    </button>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground">
                        Net income
                      </span>
                      <span
                        className={`${
                          getYearlyTotalIncome() - getYearlyTotalExpenses() >= 0
                            ? "text-emerald-600"
                            : "text-destructive"
                        }`}
                      >
                        {formatCurrency(
                          getYearlyTotalIncome() - getYearlyTotalExpenses(),
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground">
                        Savings & investments
                      </span>
                      <span
                        className={`${
                          getYearlyTotalSavings() >= 0
                            ? "text-emerald-600"
                            : "text-destructive"
                        }`}
                      >
                        {formatCurrency(getYearlyTotalSavings())}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Dialog
                open={keyErrorReason !== null}
                onOpenChange={(open) => !open && handleKeyErrorUnlockAgain()}
              >
                <DialogContent className="sm:max-w-md" showCloseButton={false}>
                  <DialogHeader>
                    <DialogTitle>Couldn’t unlock your budget</DialogTitle>
                    <DialogDescription>
                      {keyErrorReason === "no_key"
                        ? "Your session key is missing. Please unlock again with your passphrase."
                        : "Your passphrase may be wrong or the data may be corrupted. Please unlock again with your passphrase."}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4">
                    <Button onClick={handleKeyErrorUnlockAgain}>
                      Unlock again
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <BudgetCommandPalette
                open={commandPaletteOpen}
                onOpenChange={(open) => {
                  commandPaletteOpenRef.current = open;
                  setCommandPaletteOpen(open);
                }}
                commands={commandPaletteCommands}
                onExecute={executeCommand}
              />

              <Dialog
                open={yearlySummaryDialogOpen}
                onOpenChange={(open) => {
                  setYearlySummaryDialogOpen(open);
                  if (!open) setExpandedPaycheckEventIds(new Set());
                }}
              >
                <DialogContent className="sm:max-w-2xl lg:max-w-5xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Yearly Summary</DialogTitle>
                    <DialogDescription>P&L for {periodLabel}</DialogDescription>
                  </DialogHeader>
                  <YearlySummaryDialogContent
                    data={yearlySummaryData}
                    expandedEventIds={expandedPaycheckEventIds}
                    onToggleExpand={(eventId) => {
                      setExpandedPaycheckEventIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(eventId)) next.delete(eventId);
                        else next.add(eventId);
                        return next;
                      });
                    }}
                  />
                  <div className="flex-shrink-0 mt-6 pt-4 border-t border-border -mx-6 px-6">
                    <table className="ml-auto text-sm border-collapse">
                      <tbody>
                        <tr className="font-semibold">
                          <td className="py-0.5 pr-3 text-right">Net income</td>
                          <td
                            className={`py-0.5 text-right whitespace-nowrap ${
                              getYearlyTotalIncome() -
                                getYearlyTotalExpenses() >=
                              0
                                ? "text-emerald-600"
                                : "text-destructive"
                            }`}
                          >
                            <span className="tabular-nums">
                              {formatCurrency(
                                getYearlyTotalIncome() -
                                  getYearlyTotalExpenses(),
                              )}
                            </span>
                          </td>
                        </tr>
                        <tr className="font-semibold">
                          <td className="py-0.5 pr-3 text-right">
                            Savings & investments
                          </td>
                          <td
                            className={`py-0.5 text-right whitespace-nowrap ${
                              getYearlyTotalSavings() >= 0
                                ? "text-emerald-600"
                                : "text-destructive"
                            }`}
                          >
                            <span className="tabular-nums">
                              {formatCurrency(getYearlyTotalSavings())}
                            </span>
                          </td>
                        </tr>
                        <tr className="font-semibold">
                          <td className="py-0.5 pr-3 text-right">
                            Debt repayment
                          </td>
                          <td
                            className={`py-0.5 text-right whitespace-nowrap ${
                              getYearlyTotalDebtRepayment() >= 0
                                ? "text-emerald-600"
                                : "text-destructive"
                            }`}
                          >
                            <span className="tabular-nums">
                              {formatCurrency(getYearlyTotalDebtRepayment())}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </DialogContent>
              </Dialog>

              <OnboardingFlow
                open={showBlankState}
                step={onboardingStep}
                onStepChange={setOnboardingStep}
                onDismiss={() => {
                  setBlankStateDismissed(true);
                  setOnboardingStep(1);
                }}
                onStepReset={() => setOnboardingStep(1)}
              />

              <AddIncomeSourceDialog
                open={addSourceDialogOpen}
                onOpenChange={setAddSourceDialogOpen}
                onAdd={(name, description) =>
                  addIncomeSource(name, description)
                }
              />

              {budgetId && (
                <NewerVersionAvailableDialog
                  open={newerVersionDialogOpen}
                  onOpenChange={setNewerVersionDialogOpen}
                  budgetId={budgetId}
                  onUpdate={async (passphrase) =>
                    loadRemoteVersionAndApply(budgetId, passphrase)
                  }
                  onDismissWithoutUpdate={() =>
                    setNewerVersionCooldown(budgetId)
                  }
                />
              )}

              <Dialog open={incomeModalOpen} onOpenChange={setIncomeModalOpen}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Income</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-4 py-2">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-semibold text-foreground">
                            Income sources
                          </h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIncomeModalOpen(false);
                              setAddSourceDialogOpen(true);
                            }}
                          >
                            Add income source
                          </Button>
                        </div>
                        {incomeSources.length > 0 ? (
                          <ul className="mt-2 list-none space-y-2">
                            {incomeSources.map((source) => (
                              <li key={source.id}>
                                <Card className="bg-muted/50 px-4 py-3">
                                  <CardContent className="p-0">
                                    {editingId === source.id ? (
                                      <form
                                        onSubmit={handleSaveEdit}
                                        className="space-y-3"
                                      >
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`edit-name-${source.id}`}
                                            className="sr-only"
                                          >
                                            Name
                                          </Label>
                                          <Input
                                            id={`edit-name-${source.id}`}
                                            type="text"
                                            value={editName}
                                            onChange={(e) =>
                                              setEditName(e.target.value)
                                            }
                                            placeholder="Name"
                                            required
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`edit-desc-${source.id}`}
                                            className="sr-only"
                                          >
                                            Description
                                          </Label>
                                          <Textarea
                                            id={`edit-desc-${source.id}`}
                                            value={editDescription}
                                            onChange={(e) =>
                                              setEditDescription(e.target.value)
                                            }
                                            rows={2}
                                            placeholder="Description"
                                          />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <Button type="submit" size="sm">
                                            Save
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={cancelEditing}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </form>
                                    ) : (
                                      <>
                                        <p className="font-medium text-foreground">
                                          {source.name}
                                        </p>
                                        {source.description ? (
                                          <p className="mt-1 text-sm text-muted-foreground">
                                            {source.description}
                                          </p>
                                        ) : null}
                                        <div className="mt-3 flex gap-2">
                                          <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-primary"
                                            onClick={() => startEditing(source)}
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-destructive hover:text-destructive/90"
                                            onClick={() =>
                                              handleDelete(source.id)
                                            }
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </CardContent>
                                </Card>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">
                            No income sources yet.
                          </p>
                        )}
                      </div>
                      <div className="mt-6">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-semibold text-foreground">
                            Expected income
                          </h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIncomeModalOpen(false);
                              setAddEventDialogOpen(true);
                            }}
                            disabled={incomeSources.length === 0}
                          >
                            Add expected income
                          </Button>
                        </div>
                        {incomeEvents.length > 0 ? (
                          <>
                            {[
                              {
                                label: "Recurring",
                                events: incomeEvents.filter(
                                  (e) => e.schedule.type === "recurring",
                                ),
                              },
                              {
                                label: "One-off",
                                events: incomeEvents.filter(
                                  (e) => e.schedule.type === "one-time",
                                ),
                              },
                            ]
                              .filter((g) => g.events.length > 0)
                              .map(({ label, events }) => (
                                <div key={label} className="mt-4 first:mt-3">
                                  <h4 className="text-sm font-medium text-muted-foreground">
                                    {label}
                                  </h4>
                                  <ul className="mt-2 list-none space-y-2">
                                    {events.map((event) => (
                                      <li key={event.id}>
                                        <Card className="bg-muted/50 px-4 py-3">
                                          <CardContent className="p-0">
                                            {editingEventId === event.id ? (
                                              <form
                                                onSubmit={handleSaveEventEdit}
                                                className="space-y-3"
                                              >
                                                <IncomeEventFormFields
                                                  idPrefix={`edit-event-${event.id}`}
                                                  incomeSources={incomeSources}
                                                  incomeSourceId={
                                                    editEventIncomeSourceId
                                                  }
                                                  onIncomeSourceIdChange={
                                                    setEditEventIncomeSourceId
                                                  }
                                                  incomeType={
                                                    editEventIncomeType
                                                  }
                                                  onIncomeTypeChange={(v) => {
                                                    const next =
                                                      v === SELECT_NONE
                                                        ? ""
                                                        : v;
                                                    setEditEventIncomeType(
                                                      next,
                                                    );
                                                    if (
                                                      !STOCK_INCOME_TYPES.includes(
                                                        next as (typeof STOCK_INCOME_TYPES)[number],
                                                      )
                                                    ) {
                                                      setEditEventStockSymbol(
                                                        "",
                                                      );
                                                      setEditEventShares("");
                                                      setEditEventStockTaxRate(
                                                        "",
                                                      );
                                                      editStockFetch.reset();
                                                    }
                                                    if (next !== "paycheck") {
                                                      setEditEventPaycheckGross(
                                                        "",
                                                      );
                                                      setEditEventPaycheckWithholdings(
                                                        {},
                                                      );
                                                    }
                                                  }}
                                                  stockSymbol={
                                                    editEventStockSymbol
                                                  }
                                                  stockShares={editEventShares}
                                                  stockTaxRate={
                                                    editEventStockTaxRate
                                                  }
                                                  onStockSymbolChange={
                                                    setEditEventStockSymbol
                                                  }
                                                  onStockSharesChange={
                                                    setEditEventShares
                                                  }
                                                  onStockTaxRateChange={
                                                    setEditEventStockTaxRate
                                                  }
                                                  stockFetch={editStockFetch}
                                                  paycheckGross={
                                                    editEventPaycheckGross
                                                  }
                                                  paycheckWithholdings={
                                                    editEventPaycheckWithholdings
                                                  }
                                                  onPaycheckGrossChange={
                                                    setEditEventPaycheckGross
                                                  }
                                                  onPaycheckWithholdingChange={(
                                                    key,
                                                    v,
                                                  ) =>
                                                    setEditEventPaycheckWithholdings(
                                                      (prev) => ({
                                                        ...prev,
                                                        [key]: v,
                                                      }),
                                                    )
                                                  }
                                                  label={editEventLabel}
                                                  onLabelChange={
                                                    setEditEventLabel
                                                  }
                                                  amount={editEventAmount}
                                                  onAmountChange={
                                                    setEditEventAmount
                                                  }
                                                  scheduleType={
                                                    editEventScheduleType
                                                  }
                                                  onScheduleTypeChange={
                                                    setEditEventScheduleType
                                                  }
                                                  date={editEventDate}
                                                  onDateChange={
                                                    setEditEventDate
                                                  }
                                                  dayOfMonth={
                                                    editEventDayOfMonth
                                                  }
                                                  onDayOfMonthChange={
                                                    setEditEventDayOfMonth
                                                  }
                                                  recurringStartDate={
                                                    editEventRecurringStartDate
                                                  }
                                                  onRecurringStartDateChange={
                                                    setEditEventRecurringStartDate
                                                  }
                                                  recurringEndDate={
                                                    editEventRecurringEndDate
                                                  }
                                                  onRecurringEndDateChange={
                                                    setEditEventRecurringEndDate
                                                  }
                                                  selectNoneValue={SELECT_NONE}
                                                  labelClassName="sr-only"
                                                  amountLabelClassName="sr-only"
                                                  scheduleLegendClassName="sr-only"
                                                  scheduleAriaLabel="Schedule type"
                                                />
                                                <div className="flex gap-2">
                                                  <Button
                                                    type="submit"
                                                    size="sm"
                                                  >
                                                    Save
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={cancelEditingEvent}
                                                  >
                                                    Cancel
                                                  </Button>
                                                </div>
                                              </form>
                                            ) : (
                                              <>
                                                <p className="font-medium text-foreground">
                                                  {event.label}
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                  {new Intl.NumberFormat(
                                                    undefined,
                                                    {
                                                      style: "currency",
                                                      currency: "USD",
                                                    },
                                                  ).format(event.amount)}{" "}
                                                  ·{" "}
                                                  {formatIncomeSchedule(
                                                    event.schedule,
                                                  )}{" "}
                                                  ·{" "}
                                                  {getIncomeTypeLabel(
                                                    event.incomeType,
                                                  )}
                                                  {event.stockSaleDetails !=
                                                    null && (
                                                    <>
                                                      {" "}
                                                      ·{" "}
                                                      {
                                                        event.stockSaleDetails
                                                          .shares
                                                      }{" "}
                                                      shares{" "}
                                                      {
                                                        event.stockSaleDetails
                                                          .symbol
                                                      }
                                                      {event.stockSaleDetails
                                                        .taxRate != null
                                                        ? ` · ${event.stockSaleDetails.taxRate}% tax`
                                                        : ""}
                                                    </>
                                                  )}
                                                  {event.paycheckDetails !=
                                                    null && (
                                                    <>
                                                      {" "}
                                                      · Gross:{" "}
                                                      {formatCurrency(
                                                        event.paycheckDetails
                                                          .grossAmount,
                                                      )}
                                                    </>
                                                  )}
                                                  {" · "}
                                                  {getIncomeSourceName(
                                                    event.incomeSourceId,
                                                  )}
                                                </p>
                                                <div className="mt-3 flex gap-2">
                                                  <Button
                                                    type="button"
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-primary"
                                                    onClick={() =>
                                                      startEditingEvent(event)
                                                    }
                                                  >
                                                    Edit
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-destructive hover:text-destructive/90"
                                                    onClick={() =>
                                                      handleDeleteEvent(
                                                        event.id,
                                                      )
                                                    }
                                                  >
                                                    Delete
                                                  </Button>
                                                </div>
                                              </>
                                            )}
                                          </CardContent>
                                        </Card>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">
                            No expected income yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <Dialog
                open={addEventDialogOpen}
                onOpenChange={(open) => !open && closeAddEventDialog()}
              >
                <DialogContent
                  className="sm:max-w-md"
                  aria-describedby={
                    incomeSources.length === 0
                      ? "add-event-dialog-desc"
                      : undefined
                  }
                >
                  <DialogHeader>
                    <DialogTitle>Add expected income</DialogTitle>
                    {incomeSources.length === 0 && (
                      <DialogDescription id="add-event-dialog-desc">
                        Add at least one income source before creating an income
                        event.
                      </DialogDescription>
                    )}
                  </DialogHeader>
                  {incomeSources.length === 0 ? (
                    <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={closeAddEventDialog}>
                        Close
                      </Button>
                    </DialogFooter>
                  ) : (
                    <form onSubmit={handleAddEvent} className="mt-4 space-y-3">
                      <IncomeEventFormFields
                        idPrefix="event"
                        incomeSources={incomeSources}
                        incomeSourceId={eventIncomeSourceId}
                        onIncomeSourceIdChange={setEventIncomeSourceId}
                        incomeType={eventIncomeType}
                        onIncomeTypeChange={(v) => {
                          const next = v === SELECT_NONE ? "" : v;
                          setEventIncomeType(next);
                          if (
                            !STOCK_INCOME_TYPES.includes(
                              next as (typeof STOCK_INCOME_TYPES)[number],
                            )
                          ) {
                            setEventStockSymbol("");
                            setEventShares("");
                            setEventStockTaxRate("");
                            addStockFetch.reset();
                          }
                          if (next !== "paycheck") {
                            setEventPaycheckGross("");
                            setEventPaycheckWithholdings({});
                          }
                        }}
                        stockSymbol={eventStockSymbol}
                        stockShares={eventShares}
                        stockTaxRate={eventStockTaxRate}
                        onStockSymbolChange={setEventStockSymbol}
                        onStockSharesChange={setEventShares}
                        onStockTaxRateChange={setEventStockTaxRate}
                        stockFetch={addStockFetch}
                        paycheckGross={eventPaycheckGross}
                        paycheckWithholdings={eventPaycheckWithholdings}
                        onPaycheckGrossChange={setEventPaycheckGross}
                        onPaycheckWithholdingChange={(key, v) =>
                          setEventPaycheckWithholdings((prev) => ({
                            ...prev,
                            [key]: v,
                          }))
                        }
                        label={eventLabel}
                        onLabelChange={setEventLabel}
                        amount={eventAmount}
                        onAmountChange={setEventAmount}
                        scheduleType={eventScheduleType}
                        onScheduleTypeChange={setEventScheduleType}
                        date={eventDate}
                        onDateChange={setEventDate}
                        dayOfMonth={eventDayOfMonth}
                        onDayOfMonthChange={setEventDayOfMonth}
                        recurringStartDate={eventRecurringStartDate}
                        onRecurringStartDateChange={setEventRecurringStartDate}
                        recurringEndDate={eventRecurringEndDate}
                        onRecurringEndDateChange={setEventRecurringEndDate}
                        selectNoneValue={SELECT_NONE}
                      />
                      <DialogFooter className="gap-2 pt-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeAddEventDialog}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Add expected income</Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              <AddExpenseDestinationDialog
                open={addExpenseDestinationDialogOpen}
                onOpenChange={setAddExpenseDestinationDialogOpen}
                onAdd={(name, description) =>
                  addExpenseDestination(name, description)
                }
              />

              <Dialog
                open={addExpenseEventDialogOpen}
                onOpenChange={(open) => !open && closeAddExpenseEventDialog()}
              >
                <DialogContent
                  className="sm:max-w-md"
                  aria-describedby={
                    expenseDestinations.length === 0
                      ? "add-expense-event-dialog-desc"
                      : undefined
                  }
                >
                  <DialogHeader>
                    <DialogTitle>Add expected expense</DialogTitle>
                    {expenseDestinations.length === 0 && (
                      <DialogDescription id="add-expense-event-dialog-desc">
                        Add at least one destination before creating an expected
                        expense.
                      </DialogDescription>
                    )}
                  </DialogHeader>
                  {expenseDestinations.length === 0 ? (
                    <DialogFooter className="mt-4">
                      <Button
                        variant="outline"
                        onClick={closeAddExpenseEventDialog}
                      >
                        Close
                      </Button>
                    </DialogFooter>
                  ) : (
                    <form
                      onSubmit={handleAddExpenseEvent}
                      className="mt-4 space-y-3"
                    >
                      <ExpenseEventFormFields
                        idPrefix="exp-event"
                        destinations={expenseDestinations}
                        destinationId={expEventDestinationId}
                        onDestinationIdChange={setExpEventDestinationId}
                        category={expEventCategory}
                        onCategoryChange={setExpEventCategory}
                        label={expEventName}
                        onLabelChange={setExpEventName}
                        amount={expEventAmount}
                        onAmountChange={setExpEventAmount}
                        scheduleType={expEventScheduleType}
                        onScheduleTypeChange={setExpEventScheduleType}
                        date={expEventDate}
                        onDateChange={setExpEventDate}
                        dayOfMonth={expEventDayOfMonth}
                        onDayOfMonthChange={setExpEventDayOfMonth}
                        recurringStartDate={expEventRecurringStartDate}
                        onRecurringStartDateChange={
                          setExpEventRecurringStartDate
                        }
                        recurringEndDate={expEventRecurringEndDate}
                        onRecurringEndDateChange={setExpEventRecurringEndDate}
                        selectNoneValue={SELECT_NONE}
                      />
                      <DialogFooter className="gap-2 pt-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeAddExpenseEventDialog}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Add expected expense</Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog
                open={expenseModalOpen}
                onOpenChange={setExpenseModalOpen}
              >
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Expenses</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-4 py-2">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-semibold text-foreground">
                            Destinations
                          </h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setExpenseModalOpen(false);
                              setAddExpenseDestinationDialogOpen(true);
                            }}
                          >
                            Add expense destination
                          </Button>
                        </div>
                        {expenseDestinations.length > 0 ? (
                          <ul className="mt-2 list-none space-y-2">
                            {expenseDestinations.map((dest) => (
                              <li key={dest.id}>
                                <Card className="bg-muted/50 px-4 py-3">
                                  <CardContent className="p-0">
                                    {editingExpenseId === dest.id ? (
                                      <form
                                        onSubmit={handleSaveExpenseEdit}
                                        className="space-y-3"
                                      >
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`edit-expense-name-${dest.id}`}
                                            className="sr-only"
                                          >
                                            Name
                                          </Label>
                                          <Input
                                            id={`edit-expense-name-${dest.id}`}
                                            type="text"
                                            value={editExpenseName}
                                            onChange={(e) =>
                                              setEditExpenseName(e.target.value)
                                            }
                                            placeholder="Name"
                                            required
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`edit-expense-desc-${dest.id}`}
                                            className="sr-only"
                                          >
                                            Description
                                          </Label>
                                          <Textarea
                                            id={`edit-expense-desc-${dest.id}`}
                                            value={editExpenseDescription}
                                            onChange={(e) =>
                                              setEditExpenseDescription(
                                                e.target.value,
                                              )
                                            }
                                            rows={2}
                                            placeholder="Description"
                                          />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <Button type="submit" size="sm">
                                            Save
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={cancelEditingExpense}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </form>
                                    ) : (
                                      <>
                                        <p className="font-medium text-foreground">
                                          {dest.name}
                                        </p>
                                        {dest.description ? (
                                          <p className="mt-1 text-sm text-muted-foreground">
                                            {dest.description}
                                          </p>
                                        ) : null}
                                        <div className="mt-3 flex gap-2">
                                          <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-primary"
                                            onClick={() =>
                                              startEditingExpense(dest)
                                            }
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-destructive hover:text-destructive/90"
                                            onClick={() =>
                                              handleDeleteExpense(dest.id)
                                            }
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </CardContent>
                                </Card>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">
                            No expense destinations yet.
                          </p>
                        )}
                      </div>
                      <div className="mt-6">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-semibold text-foreground">
                            Expected expenses
                          </h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setExpenseModalOpen(false);
                              setAddExpenseEventDialogOpen(true);
                            }}
                            disabled={expenseDestinations.length === 0}
                          >
                            Add expected expense
                          </Button>
                        </div>
                        {expenseEvents.length > 0 ? (
                          <>
                            {[
                              {
                                label: "Recurring",
                                events: expenseEvents.filter(
                                  (e) => e.schedule.type === "recurring",
                                ),
                              },
                              {
                                label: "One-off",
                                events: expenseEvents.filter(
                                  (e) => e.schedule.type === "one-time",
                                ),
                              },
                            ]
                              .filter((g) => g.events.length > 0)
                              .map(({ label, events }) => (
                                <div key={label} className="mt-4 first:mt-3">
                                  <h4 className="text-sm font-medium text-muted-foreground">
                                    {label}
                                  </h4>
                                  <ul className="mt-2 list-none space-y-2">
                                    {events.map((event) => (
                                      <li key={event.id}>
                                        <Card className="bg-muted/50 px-4 py-3">
                                          <CardContent className="p-0">
                                            {editingExpenseEventId ===
                                            event.id ? (
                                              <form
                                                onSubmit={
                                                  handleSaveExpenseEventEdit
                                                }
                                                className="space-y-3"
                                              >
                                                <ExpenseEventFormFields
                                                  idPrefix={`edit-exp-event-${event.id}`}
                                                  destinations={
                                                    expenseDestinations
                                                  }
                                                  destinationId={
                                                    editExpEventDestinationId
                                                  }
                                                  onDestinationIdChange={
                                                    setEditExpEventDestinationId
                                                  }
                                                  category={
                                                    editExpEventCategory
                                                  }
                                                  onCategoryChange={
                                                    setEditExpEventCategory
                                                  }
                                                  label={editExpEventName}
                                                  onLabelChange={
                                                    setEditExpEventName
                                                  }
                                                  amount={editExpEventAmount}
                                                  onAmountChange={
                                                    setEditExpEventAmount
                                                  }
                                                  scheduleType={
                                                    editExpEventScheduleType
                                                  }
                                                  onScheduleTypeChange={
                                                    setEditExpEventScheduleType
                                                  }
                                                  date={editExpEventDate}
                                                  onDateChange={
                                                    setEditExpEventDate
                                                  }
                                                  dayOfMonth={
                                                    editExpEventDayOfMonth
                                                  }
                                                  onDayOfMonthChange={
                                                    setEditExpEventDayOfMonth
                                                  }
                                                  recurringStartDate={
                                                    editExpEventRecurringStartDate
                                                  }
                                                  onRecurringStartDateChange={
                                                    setEditExpEventRecurringStartDate
                                                  }
                                                  recurringEndDate={
                                                    editExpEventRecurringEndDate
                                                  }
                                                  onRecurringEndDateChange={
                                                    setEditExpEventRecurringEndDate
                                                  }
                                                  labelClassName="sr-only"
                                                  amountLabelClassName="sr-only"
                                                  selectNoneValue={SELECT_NONE}
                                                  scheduleLegendClassName="sr-only"
                                                  scheduleAriaLabel="Schedule type"
                                                />
                                                <div className="flex gap-2">
                                                  <Button
                                                    type="submit"
                                                    size="sm"
                                                  >
                                                    Save
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={
                                                      cancelEditingExpenseEvent
                                                    }
                                                  >
                                                    Cancel
                                                  </Button>
                                                </div>
                                              </form>
                                            ) : (
                                              <>
                                                <p className="font-medium text-foreground">
                                                  {event.label}
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                  {new Intl.NumberFormat(
                                                    undefined,
                                                    {
                                                      style: "currency",
                                                      currency: "USD",
                                                    },
                                                  ).format(event.amount)}{" "}
                                                  ·{" "}
                                                  {formatExpenseSchedule(
                                                    event.schedule,
                                                  )}{" "}
                                                  ·{" "}
                                                  {getExpenseDestinationName(
                                                    event.expenseDestinationId,
                                                  )}{" "}
                                                  ·{" "}
                                                  {getExpenseCategoryLabel(
                                                    event.category,
                                                  )}
                                                </p>
                                                <div className="mt-3 flex gap-2">
                                                  <Button
                                                    type="button"
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-primary"
                                                    onClick={() =>
                                                      startEditingExpenseEvent(
                                                        event,
                                                      )
                                                    }
                                                  >
                                                    Edit
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto p-0 text-destructive hover:text-destructive/90"
                                                    onClick={() =>
                                                      handleDeleteExpenseEvent(
                                                        event.id,
                                                      )
                                                    }
                                                  >
                                                    Delete
                                                  </Button>
                                                </div>
                                              </>
                                            )}
                                          </CardContent>
                                        </Card>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">
                            No expected expenses yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <Dialog
                open={editIncomeEventDialogOpen}
                onOpenChange={(open) => !open && closeEditIncomeEventDialog()}
              >
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit expected income</DialogTitle>
                  </DialogHeader>
                  {editingEventId && (
                    <form
                      onSubmit={handleSaveEventEdit}
                      className="mt-4 space-y-3"
                    >
                      <IncomeEventFormFields
                        idPrefix={`edit-dialog-income-${editingEventId}`}
                        incomeSources={incomeSources}
                        incomeSourceId={editEventIncomeSourceId}
                        onIncomeSourceIdChange={setEditEventIncomeSourceId}
                        incomeType={editEventIncomeType}
                        onIncomeTypeChange={(v) => {
                          const next = v === SELECT_NONE ? "" : v;
                          setEditEventIncomeType(next);
                          if (
                            !STOCK_INCOME_TYPES.includes(
                              next as (typeof STOCK_INCOME_TYPES)[number],
                            )
                          ) {
                            setEditEventStockSymbol("");
                            setEditEventShares("");
                            setEditEventStockTaxRate("");
                            editStockFetch.reset();
                          }
                          if (next !== "paycheck") {
                            setEditEventPaycheckGross("");
                            setEditEventPaycheckWithholdings({});
                          }
                        }}
                        stockSymbol={editEventStockSymbol}
                        stockShares={editEventShares}
                        stockTaxRate={editEventStockTaxRate}
                        onStockSymbolChange={setEditEventStockSymbol}
                        onStockSharesChange={setEditEventShares}
                        onStockTaxRateChange={setEditEventStockTaxRate}
                        stockFetch={editStockFetch}
                        paycheckGross={editEventPaycheckGross}
                        paycheckWithholdings={editEventPaycheckWithholdings}
                        onPaycheckGrossChange={setEditEventPaycheckGross}
                        onPaycheckWithholdingChange={(key, v) =>
                          setEditEventPaycheckWithholdings((prev) => ({
                            ...prev,
                            [key]: v,
                          }))
                        }
                        label={editEventLabel}
                        onLabelChange={setEditEventLabel}
                        amount={editEventAmount}
                        onAmountChange={setEditEventAmount}
                        scheduleType={editEventScheduleType}
                        onScheduleTypeChange={setEditEventScheduleType}
                        date={editEventDate}
                        onDateChange={setEditEventDate}
                        dayOfMonth={editEventDayOfMonth}
                        onDayOfMonthChange={setEditEventDayOfMonth}
                        recurringStartDate={editEventRecurringStartDate}
                        onRecurringStartDateChange={
                          setEditEventRecurringStartDate
                        }
                        recurringEndDate={editEventRecurringEndDate}
                        onRecurringEndDateChange={setEditEventRecurringEndDate}
                        selectNoneValue={SELECT_NONE}
                        scheduleLegendClassName="sr-only"
                        scheduleAriaLabel="Schedule type"
                      />
                      <DialogFooter className="gap-2 pt-4 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeEditIncomeEventDialog}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Save</Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog
                open={editExpenseEventDialogOpen}
                onOpenChange={(open) => !open && closeEditExpenseEventDialog()}
              >
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit expected expense</DialogTitle>
                  </DialogHeader>
                  {editingExpenseEventId && (
                    <form
                      onSubmit={handleSaveExpenseEventEdit}
                      className="mt-4 space-y-3"
                    >
                      <ExpenseEventFormFields
                        idPrefix={`edit-dialog-exp-${editingExpenseEventId}`}
                        destinations={expenseDestinations}
                        destinationId={editExpEventDestinationId}
                        onDestinationIdChange={setEditExpEventDestinationId}
                        category={editExpEventCategory}
                        onCategoryChange={setEditExpEventCategory}
                        label={editExpEventName}
                        onLabelChange={setEditExpEventName}
                        amount={editExpEventAmount}
                        onAmountChange={setEditExpEventAmount}
                        scheduleType={editExpEventScheduleType}
                        onScheduleTypeChange={setEditExpEventScheduleType}
                        date={editExpEventDate}
                        onDateChange={setEditExpEventDate}
                        dayOfMonth={editExpEventDayOfMonth}
                        onDayOfMonthChange={setEditExpEventDayOfMonth}
                        recurringStartDate={editExpEventRecurringStartDate}
                        onRecurringStartDateChange={
                          setEditExpEventRecurringStartDate
                        }
                        recurringEndDate={editExpEventRecurringEndDate}
                        onRecurringEndDateChange={
                          setEditExpEventRecurringEndDate
                        }
                        selectNoneValue={SELECT_NONE}
                        scheduleLegendClassName="sr-only"
                        scheduleAriaLabel="Schedule type"
                      />
                      <DialogFooter className="gap-2 pt-4 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeEditExpenseEventDialog}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Save</Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              <MonthlyPnLSection
                months={dateViewMonths}
                dateViewMode={dateViewMode}
                onDateViewModeChange={(mode) => setDateViewMode(mode)}
                onEditIncomeEvent={openEditIncomeEventDialog}
                onEditExpenseEvent={openEditExpenseEventDialog}
                onAddIncome={(slot) => {
                  setAddIncomeDefaultDate(
                    `${slot.year}-${String(slot.monthIndex + 1).padStart(2, "0")}-01`,
                  );
                  setAddEventDialogOpen(true);
                }}
                onAddExpense={(slot) => {
                  setAddExpenseDefaultDate(
                    `${slot.year}-${String(slot.monthIndex + 1).padStart(2, "0")}-01`,
                  );
                  setAddExpenseEventDialogOpen(true);
                }}
                addIncomeDisabled={incomeSources.length === 0}
                addExpenseDisabled={expenseDestinations.length === 0}
              />

              {/* Debug section: only on localhost or after Cmd+Shift+D / Ctrl+Shift+D */}
              {showDebugSection && (
                <BudgetDebugSection
                  budgetState={budgetState}
                  rawEncrypted={rawEncrypted}
                />
              )}
            </div>

            <aside
              className="hidden md:block w-52 shrink-0"
              aria-label="Yearly summary and keyboard shortcuts"
            >
              <div className="sticky top-8 space-y-4 pt-1">
                <div className="space-y-2">
                  <SummaryStat
                    label="Income (gross)"
                    value={formatCurrency(getYearlyTotalGrossIncome())}
                    icon={
                      <Banknote className="size-3.5 shrink-0" aria-hidden />
                    }
                    onClick={() => setIncomeModalOpen(true)}
                  />
                  <SummaryStat
                    label="Income (take home)"
                    value={formatCurrency(getYearlyTotalIncome())}
                    icon={
                      <Banknote className="size-3.5 shrink-0" aria-hidden />
                    }
                    onClick={() => setIncomeModalOpen(true)}
                  />
                  <SummaryStat
                    label="Expenses"
                    value={formatCurrency(getYearlyTotalExpenses())}
                    icon={
                      <CreditCard className="size-3.5 shrink-0" aria-hidden />
                    }
                    onClick={() => setExpenseModalOpen(true)}
                  />
                  <SummaryStat
                    label="Net income"
                    value={formatCurrency(
                      getYearlyTotalIncome() - getYearlyTotalExpenses(),
                    )}
                    variant={
                      getYearlyTotalIncome() - getYearlyTotalExpenses() >= 0
                        ? "positive"
                        : "negative"
                    }
                  />
                  <SummaryStat
                    label="Savings & investments"
                    value={formatCurrency(getYearlyTotalSavings())}
                    variant={
                      getYearlyTotalSavings() >= 0 ? "positive" : "negative"
                    }
                  />
                  <SummaryStat
                    label="Debt repayment"
                    value={formatCurrency(getYearlyTotalDebtRepayment())}
                    variant={
                      getYearlyTotalDebtRepayment() >= 0
                        ? "positive"
                        : "negative"
                    }
                  />
                  <span className="sr-only">
                    Income (gross) {formatCurrency(getYearlyTotalGrossIncome())}
                    , Income (take home){" "}
                    {formatCurrency(getYearlyTotalIncome())}, expenses{" "}
                    {formatCurrency(getYearlyTotalExpenses())}, net income{" "}
                    {formatCurrency(
                      getYearlyTotalIncome() - getYearlyTotalExpenses(),
                    )}
                    , savings & investments{" "}
                    {formatCurrency(getYearlyTotalSavings())}, debt repayment{" "}
                    {formatCurrency(getYearlyTotalDebtRepayment())}
                  </span>
                </div>
                <Separator />
                {hotkeysVisible ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground" role="status">
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        ⌘K
                      </kbd>{" "}
                      Command palette
                    </p>
                    <p className="text-xs text-muted-foreground" role="status">
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        Y
                      </kbd>{" "}
                      Yearly summary
                    </p>
                    <p className="text-xs text-muted-foreground" role="status">
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        I
                      </kbd>{" "}
                      Add expected income
                    </p>
                    <p className="text-xs text-muted-foreground" role="status">
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        E
                      </kbd>{" "}
                      Add expected expense
                    </p>
                    <p className="text-xs text-muted-foreground" role="status">
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        C
                      </kbd>{" "}
                      Jump to current month
                    </p>
                    <p className="text-xs text-muted-foreground" role="status">
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        J
                      </kbd>{" "}
                      Previous month
                    </p>
                    <p className="text-xs text-muted-foreground" role="status">
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        K
                      </kbd>{" "}
                      Next month
                    </p>
                    <p className="text-xs text-muted-foreground" role="status">
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        T
                      </kbd>{" "}
                      Back to top
                    </p>
                    <p className="text-xs text-muted-foreground" role="status">
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        ⌘I
                      </kbd>{" "}
                      Manage income
                    </p>
                    <p className="text-xs text-muted-foreground" role="status">
                      <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                        ⌘E
                      </kbd>{" "}
                      Manage expenses
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setHotkeysVisible(false);
                        setPreferences({ hotkeysVisible: false });
                      }}
                    >
                      Hide
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setHotkeysVisible(true);
                      setPreferences({ hotkeysVisible: true });
                    }}
                  >
                    Show Hotkeys
                  </Button>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
