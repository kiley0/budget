"use client";

import { useParams } from "next/navigation";
import {
  setBudgetMetadata,
  setNewerVersionCooldown,
  setPreferences,
} from "@/lib/constants";
import { loadRemoteVersionAndApply } from "@/features/budget/infrastructure/store";
import { slotToIsoDate } from "@/features/budget/domain/date-view";
import { toggleSetMember } from "@/lib/utils";
import { useBudgetPage } from "@/features/budget/presentation/hooks/useBudgetPage";
import {
  AddExpenseEventDialog,
  AddIncomeEventDialog,
  BudgetCommandPalette,
  BudgetDebugSection,
  BudgetHeader,
  BudgetSummaryAside,
  BudgetSummaryCardsMobile,
  BudgetTitleSection,
  BudgetUnlockForm,
  BudgetYearlySummaryFooter,
  EditExpenseEventDialog,
  EditIncomeEventDialog,
  ImportErrorBanner,
  KeyErrorDialog,
  ManageExpenseModal,
  ManageIncomeModal,
  MonthlyPnLSection,
  NewerVersionAvailableDialog,
  OnboardingFlow,
  YearlySummaryDialogContent,
} from "@/features/budget/presentation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function BudgetPage() {
  const params = useParams();
  const budgetId = Array.isArray(params?.budgetId)
    ? params.budgetId[0]
    : params?.budgetId;

  const p = useBudgetPage({ budgetId });

  if (!p.sessionRestored) {
    return <LoadingScreen />;
  }

  if (!p.isUnlocked) {
    if (p.fetchStatus === "found" && p.encryptedBlob && p.budgetId) {
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
            <BudgetUnlockForm
              encryptedBlob={p.encryptedBlob}
              budgetId={p.budgetId}
              onSuccess={p.handleUnlockSuccess}
              onCancel={p.handleUnlockCancel}
            />
          </div>
        </div>
      );
    }
    return (
      <LoadingScreen
        message={p.fetchStatus === "not_found" ? "Redirecting…" : "Loading…"}
      />
    );
  }

  if (!p.budgetId) {
    return <LoadingScreen />;
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
          importFileRef={p.importFileRef}
          onImportClick={p.handleImportClick}
          onImportFileChange={p.handleImportFileChange}
          onExportJson={p.handleExport}
          onExportCsv={p.handleExportCsv}
          onLogout={p.handleLogout}
        />
        {p.importError && (
          <ImportErrorBanner
            message={p.importError}
            onDismiss={() => p.setImportError(null)}
          />
        )}
        <main
          id="main-content"
          className="flex-1 px-6 py-8"
          aria-label="Budget details"
        >
          <div className="flex gap-8">
            <div className="min-w-0 flex-1">
              <section className="mb-6" aria-label="Budget name">
                <BudgetTitleSection
                  budgetName={p.budgetName}
                  isEditing={p.editingBudgetTitle}
                  onBudgetNameChange={p.setBudgetName}
                  onEditClick={() => p.setEditingBudgetTitle(true)}
                  onDoneEdit={() => {
                    if (p.budgetId) {
                      setBudgetMetadata(p.budgetId, {
                        name: p.budgetName.trim() || undefined,
                      });
                    }
                    p.setEditingBudgetTitle(false);
                  }}
                  onBlur={(value) => {
                    if (p.budgetId) {
                      setBudgetMetadata(p.budgetId, {
                        name: value || undefined,
                      });
                    }
                  }}
                  onManageIncome={() => p.setIncomeModalOpen(true)}
                  onManageExpenses={() => p.setExpenseModalOpen(true)}
                  onYearlySummary={() => p.setYearlySummaryDialogOpen(true)}
                />
              </section>

              <BudgetSummaryCardsMobile
                yearlyTotalGrossIncome={p.getYearlyTotalGrossIncome()}
                yearlyTotalIncome={p.getYearlyTotalIncome()}
                yearlyTotalExpenses={p.getYearlyTotalExpenses()}
                yearlyNetIncome={
                  p.getYearlyTotalIncome() - p.getYearlyTotalExpenses()
                }
                yearlyTotalSavings={p.getYearlyTotalSavings()}
                onIncomeClick={() => p.setIncomeModalOpen(true)}
                onExpenseClick={() => p.setExpenseModalOpen(true)}
              />

              <KeyErrorDialog
                open={p.keyErrorReason !== null}
                reason={p.keyErrorReason}
                onUnlockAgain={p.handleKeyErrorUnlockAgain}
              />

              <BudgetCommandPalette
                open={p.commandPaletteOpen}
                onOpenChange={p.onCommandPaletteOpenChange}
                commands={p.commandPaletteCommands}
                onExecute={p.executeCommand}
              />

              <Dialog
                open={p.yearlySummaryDialogOpen}
                onOpenChange={(open) => {
                  p.setYearlySummaryDialogOpen(open);
                  if (!open) p.setExpandedPaycheckEventIds(new Set());
                }}
              >
                <DialogContent className="sm:max-w-2xl lg:max-w-5xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Yearly Summary</DialogTitle>
                    <DialogDescription>
                      P&L for {p.periodLabel}
                    </DialogDescription>
                  </DialogHeader>
                  <YearlySummaryDialogContent
                    data={p.yearlySummaryData}
                    expandedEventIds={p.expandedPaycheckEventIds}
                    onToggleExpand={(eventId) =>
                      p.setExpandedPaycheckEventIds((prev) =>
                        toggleSetMember(prev, eventId),
                      )
                    }
                  />
                  <BudgetYearlySummaryFooter
                    netIncome={
                      p.getYearlyTotalIncome() - p.getYearlyTotalExpenses()
                    }
                    savings={p.getYearlyTotalSavings()}
                    debtRepayment={p.getYearlyTotalDebtRepayment()}
                  />
                </DialogContent>
              </Dialog>

              <OnboardingFlow
                open={p.showBlankState}
                step={p.onboardingStep}
                onStepChange={p.setOnboardingStep}
                onDismiss={() => {
                  p.setBlankStateDismissed(true);
                  p.setOnboardingStep(1);
                }}
                onStepReset={() => p.setOnboardingStep(1)}
              />

              <NewerVersionAvailableDialog
                open={p.newerVersionDialogOpen}
                onOpenChange={p.setNewerVersionDialogOpen}
                budgetId={p.budgetId}
                onUpdate={async (passphrase) =>
                  loadRemoteVersionAndApply(p.budgetId!, passphrase)
                }
                onDismissWithoutUpdate={() =>
                  setNewerVersionCooldown(p.budgetId!)
                }
              />

              <ManageIncomeModal
                open={p.incomeModalOpen}
                onOpenChange={p.setIncomeModalOpen}
                onAddClick={() => {
                  p.setIncomeModalOpen(false);
                  p.setAddEventDialogOpen(true);
                }}
              />

              <AddIncomeEventDialog
                open={p.addEventDialogOpen}
                onOpenChange={(open) => {
                  if (!open) p.setAddIncomeDefaultDate(null);
                  p.setAddEventDialogOpen(open);
                }}
                initialDate={p.addIncomeDefaultDate}
                minDate={p.minDate}
              />

              <AddExpenseEventDialog
                open={p.addExpenseEventDialogOpen}
                onOpenChange={(open) => {
                  if (!open) p.setAddExpenseDefaultDate(null);
                  p.setAddExpenseEventDialogOpen(open);
                }}
                initialDate={p.addExpenseDefaultDate}
                minDate={p.minDate}
              />

              <ManageExpenseModal
                open={p.expenseModalOpen}
                onOpenChange={p.setExpenseModalOpen}
                onAddClick={() => {
                  p.setExpenseModalOpen(false);
                  p.setAddExpenseEventDialogOpen(true);
                }}
              />

              <EditIncomeEventDialog
                open={p.editIncomeEventDialogOpen}
                onOpenChange={(open) => !open && p.closeEditIncomeEventDialog()}
                event={p.editingIncomeEvent}
              />

              <EditExpenseEventDialog
                open={p.editExpenseEventDialogOpen}
                onOpenChange={(open) =>
                  !open && p.closeEditExpenseEventDialog()
                }
                event={p.editingExpenseEvent}
              />

              <MonthlyPnLSection
                months={p.dateViewMonths}
                dateViewMode={p.dateViewMode}
                onDateViewModeChange={(mode) => p.setDateViewMode(mode)}
                onEditIncomeEvent={p.openEditIncomeEventDialog}
                onEditExpenseEvent={p.openEditExpenseEventDialog}
                onAddIncome={(slot) => {
                  p.setAddIncomeDefaultDate(slotToIsoDate(slot));
                  p.setAddEventDialogOpen(true);
                }}
                onAddExpense={(slot) => {
                  p.setAddExpenseDefaultDate(slotToIsoDate(slot));
                  p.setAddExpenseEventDialogOpen(true);
                }}
                addIncomeDisabled={false}
                addExpenseDisabled={false}
              />

              {p.showDebugSection && (
                <BudgetDebugSection
                  budgetState={p.budgetState}
                  rawEncrypted={p.rawEncrypted}
                />
              )}
            </div>

            <BudgetSummaryAside
              yearlyTotalGrossIncome={p.getYearlyTotalGrossIncome()}
              yearlyTotalIncome={p.getYearlyTotalIncome()}
              yearlyTotalExpenses={p.getYearlyTotalExpenses()}
              yearlyNetIncome={
                p.getYearlyTotalIncome() - p.getYearlyTotalExpenses()
              }
              yearlyTotalSavings={p.getYearlyTotalSavings()}
              yearlyTotalDebtRepayment={p.getYearlyTotalDebtRepayment()}
              hotkeysVisible={p.hotkeysVisible}
              onIncomeClick={() => p.setIncomeModalOpen(true)}
              onExpenseClick={() => p.setExpenseModalOpen(true)}
              onShowHotkeys={() => {
                p.setHotkeysVisible(true);
                setPreferences({ hotkeysVisible: true });
              }}
              onHideHotkeys={() => {
                p.setHotkeysVisible(false);
                setPreferences({ hotkeysVisible: false });
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
