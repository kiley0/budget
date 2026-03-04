"use client";

import React from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { YearlySummaryData } from "@/lib/yearly-summary";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface YearlySummaryDialogContentProps {
  data: YearlySummaryData;
  expandedEventIds: Set<string>;
  onToggleExpand: (eventId: string) => void;
}

export function YearlySummaryDialogContent({
  data,
  expandedEventIds,
  onToggleExpand,
}: YearlySummaryDialogContentProps) {
  return (
    <ScrollArea className="flex-1 min-h-0 -mx-6 px-6 pr-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">
                  Income (after taxes and withholdings)
                </th>
                <th className="text-right py-2 font-medium text-muted-foreground tabular-nums">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.incomeRows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-2 text-muted-foreground">
                    —
                  </td>
                </tr>
              ) : (
                data.incomeRows.map((row, i) => {
                  const isExpandable =
                    !!row.paycheckBreakdown || !!row.stockBreakdown;
                  const isExpanded =
                    row.eventId && expandedEventIds.has(row.eventId);
                  const toggleExpand = () => {
                    if (row.eventId) onToggleExpand(row.eventId);
                  };
                  return (
                    <React.Fragment key={`income-${i}`}>
                      <tr
                        className={`border-b border-border/50 ${
                          isExpandable ? "cursor-pointer hover:bg-muted/50" : ""
                        }`}
                        onClick={isExpandable ? toggleExpand : undefined}
                        role={isExpandable ? "button" : undefined}
                        tabIndex={isExpandable ? 0 : undefined}
                        onKeyDown={
                          isExpandable
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  toggleExpand();
                                }
                              }
                            : undefined
                        }
                      >
                        <td className="py-1.5">
                          {isExpandable && (
                            <span className="mr-1 inline-block w-4">
                              {isExpanded ? (
                                <ChevronDownIcon
                                  className="size-3.5 text-muted-foreground"
                                  aria-hidden
                                />
                              ) : (
                                <ChevronRightIcon
                                  className="size-3.5 text-muted-foreground"
                                  aria-hidden
                                />
                              )}
                            </span>
                          )}
                          {row.label}
                          {(row.sublabel || row.date) && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              {[row.sublabel, row.date && `(${row.date})`]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-foreground">
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                      {isExpanded && row.paycheckBreakdown && (
                        <>
                          <tr className="border-b border-border/50 bg-muted/30">
                            <td className="py-1 pl-8 text-muted-foreground">
                              Gross pay
                            </td>
                            <td className="py-1 text-right tabular-nums text-muted-foreground">
                              {formatCurrency(
                                row.paycheckBreakdown.grossAmount,
                              )}
                            </td>
                          </tr>
                          {row.paycheckBreakdown.withholdings.map((wh, j) => (
                            <tr
                              key={`income-${i}-wh-${j}`}
                              className="border-b border-border/50 bg-muted/30"
                            >
                              <td className="py-1 pl-8 text-muted-foreground">
                                {wh.label}
                              </td>
                              <td className="py-1 text-right tabular-nums text-muted-foreground">
                                {formatCurrency(wh.amount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-b border-border/50 bg-muted/30">
                            <td className="py-1 pl-8 font-medium text-foreground">
                              Net take-home
                            </td>
                            <td className="py-1 text-right tabular-nums font-medium text-foreground">
                              {formatCurrency(row.amount)}
                            </td>
                          </tr>
                        </>
                      )}
                      {isExpanded && row.stockBreakdown && (
                        <>
                          <tr className="border-b border-border/50 bg-muted/30">
                            <td className="py-1 pl-8 text-muted-foreground">
                              Gross proceeds
                              {row.stockBreakdown.shares > 0 && (
                                <span className="ml-1 text-xs text-muted-foreground/80">
                                  ({row.stockBreakdown.shares.toLocaleString()}{" "}
                                  shares @{" "}
                                  {formatCurrency(
                                    row.stockBreakdown.grossAmount /
                                      row.stockBreakdown.shares,
                                  )}
                                  /share)
                                </span>
                              )}
                            </td>
                            <td className="py-1 text-right tabular-nums text-muted-foreground">
                              {formatCurrency(row.stockBreakdown.grossAmount)}
                            </td>
                          </tr>
                          <tr className="border-b border-border/50 bg-muted/30">
                            <td className="py-1 pl-8 text-muted-foreground">
                              Taxes withheld
                            </td>
                            <td className="py-1 text-right tabular-nums text-muted-foreground">
                              {formatCurrency(row.stockBreakdown.taxesWithheld)}
                            </td>
                          </tr>
                          <tr className="border-b border-border/50 bg-muted/30">
                            <td className="py-1 pl-8 font-medium text-foreground">
                              Net take-home
                            </td>
                            <td className="py-1 text-right tabular-nums font-medium text-foreground">
                              {formatCurrency(row.stockBreakdown.netAmount)}
                            </td>
                          </tr>
                        </>
                      )}
                    </React.Fragment>
                  );
                })
              )}
              <tr className="border-b-2 border-border font-medium">
                <td className="py-2">Total income (take home)</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(data.totalIncome)}
                </td>
              </tr>
            </tbody>
          </table>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">
                  Savings & investments
                </th>
                <th className="text-right py-2 font-medium text-muted-foreground tabular-nums">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.savingsRows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-2 text-muted-foreground">
                    —
                  </td>
                </tr>
              ) : (
                data.savingsRows.map((row, i) => (
                  <tr
                    key={`savings-${i}`}
                    className="border-b border-border/50"
                  >
                    <td className="py-1.5">
                      {row.label}
                      {(row.sublabel || row.date) && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {[row.sublabel, row.date && `(${row.date})`]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-foreground">
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))
              )}
              <tr className="border-b-2 border-border font-medium">
                <td className="py-2">Total savings & investments</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(data.totalSavings)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">
                  Expenses
                </th>
                <th className="text-right py-2 font-medium text-muted-foreground tabular-nums">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.expenseRows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-2 text-muted-foreground">
                    —
                  </td>
                </tr>
              ) : (
                data.expenseRows.map((row, i) => (
                  <tr
                    key={`expense-${i}`}
                    className="border-b border-border/50"
                  >
                    <td className="py-1.5">
                      {row.label}
                      {(row.sublabel || row.date) && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {[row.sublabel, row.date && `(${row.date})`]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-foreground">
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))
              )}
              <tr className="border-b-2 border-border font-medium">
                <td className="py-2">Total expenses</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(data.totalExpenses)}
                </td>
              </tr>
            </tbody>
          </table>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">
                  Debt repayment
                </th>
                <th className="text-right py-2 font-medium text-muted-foreground tabular-nums">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.debtRepaymentRows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-2 text-muted-foreground">
                    —
                  </td>
                </tr>
              ) : (
                data.debtRepaymentRows.map((row, i) => (
                  <tr key={`debt-${i}`} className="border-b border-border/50">
                    <td className="py-1.5">
                      {row.label}
                      {(row.sublabel || row.date) && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {[row.sublabel, row.date && `(${row.date})`]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-foreground">
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))
              )}
              <tr className="border-b-2 border-border font-medium">
                <td className="py-2">Total debt repayment</td>
                <td className="py-2 text-right tabular-nums">
                  {formatCurrency(data.totalDebtRepayment)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ScrollArea>
  );
}
