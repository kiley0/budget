"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DAY_OF_MONTH_MIN, DAY_OF_MONTH_MAX } from "@/lib/constants";

export type ScheduleType = "one-time" | "recurring" | "whole-month";

export interface ScheduleFieldsProps {
  scheduleType: ScheduleType;
  onScheduleTypeChange: (v: ScheduleType) => void;
  /** Which schedule types to show. Default: one-time, recurring. Expense form may add "whole-month". */
  scheduleTypes?: ScheduleType[];
  date: string;
  onDateChange: (v: string) => void;
  dayOfMonth: string;
  onDayOfMonthChange: (v: string) => void;
  recurringStartDate: string;
  onRecurringStartDateChange: (v: string) => void;
  recurringEndDate: string;
  onRecurringEndDateChange: (v: string) => void;
  /** Unique prefix for form element ids (e.g. "event", "edit-event-123"). */
  idPrefix: string;
  /** Optional. Default: "When". */
  legend?: string;
  /** Optional. Default: "text-sm font-medium". Use "sr-only" for screen-reader-only legend. */
  legendClassName?: string;
  /** Optional. Default: "Schedule type". */
  ariaLabel?: string;
}

export function ScheduleFields({
  scheduleType,
  onScheduleTypeChange,
  date,
  onDateChange,
  dayOfMonth,
  onDayOfMonthChange,
  recurringStartDate,
  onRecurringStartDateChange,
  recurringEndDate,
  onRecurringEndDateChange,
  idPrefix,
  legend = "When",
  legendClassName = "text-sm font-medium",
  ariaLabel = "Schedule type",
  scheduleTypes = ["one-time", "recurring"],
}: ScheduleFieldsProps) {
  const oneTimeId = `${idPrefix}-schedule-one-time`;
  const recurringId = `${idPrefix}-schedule-recurring`;
  const wholeMonthId = `${idPrefix}-schedule-whole-month`;
  const dateId = `${idPrefix}-date`;
  const dayId = `${idPrefix}-day`;
  const startId = `${idPrefix}-recurring-start`;
  const endId = `${idPrefix}-recurring-end`;

  const baseRadioStyles = cn(
    "aspect-square size-4 shrink-0 appearance-none rounded-full border border-input text-primary shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "disabled:cursor-not-allowed disabled:opacity-50",
  );
  const radioName = `${idPrefix}-schedule-type`;
  const checkedBg =
    "radial-gradient(circle at center, var(--primary) 25%, transparent 26%)";

  return (
    <fieldset className="space-y-2">
      <legend className={legendClassName}>{legend}</legend>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="flex flex-col gap-2"
      >
        {scheduleTypes.includes("one-time") && (
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id={oneTimeId}
              name={radioName}
              value="one-time"
              checked={scheduleType === "one-time"}
              onChange={() => onScheduleTypeChange("one-time")}
              tabIndex={0}
              className={baseRadioStyles}
              style={{
                background:
                  scheduleType === "one-time" ? checkedBg : "transparent",
              }}
            />
            <Label
              htmlFor={oneTimeId}
              className="cursor-pointer text-sm font-normal"
            >
              Once on a specific date
            </Label>
          </div>
        )}
        {scheduleTypes.includes("recurring") && (
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id={recurringId}
              name={radioName}
              value="recurring"
              checked={scheduleType === "recurring"}
              onChange={() => onScheduleTypeChange("recurring")}
              tabIndex={0}
              className={baseRadioStyles}
              style={{
                background:
                  scheduleType === "recurring" ? checkedBg : "transparent",
              }}
            />
            <Label
              htmlFor={recurringId}
              className="cursor-pointer text-sm font-normal"
            >
              Recurring each month on specific day(s)
            </Label>
          </div>
        )}
        {scheduleTypes.includes("whole-month") && (
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id={wholeMonthId}
              name={radioName}
              value="whole-month"
              checked={scheduleType === "whole-month"}
              onChange={() => onScheduleTypeChange("whole-month")}
              tabIndex={0}
              className={baseRadioStyles}
              style={{
                background:
                  scheduleType === "whole-month" ? checkedBg : "transparent",
              }}
            />
            <Label
              htmlFor={wholeMonthId}
              className="cursor-pointer text-sm font-normal"
            >
              Over the course of the month
            </Label>
          </div>
        )}
      </div>
      {scheduleType === "one-time" && (
        <div className="mt-2">
          <Label htmlFor={dateId} className="sr-only">
            Date
          </Label>
          <Input
            id={dateId}
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            required={scheduleType === "one-time"}
          />
        </div>
      )}
      {(scheduleType === "recurring" || scheduleType === "whole-month") && (
        <div className="mt-2 space-y-2">
          {scheduleType === "recurring" && (
            <div className="space-y-2">
              <Label htmlFor={dayId}>
                Day(s) of month ({DAY_OF_MONTH_MIN}–{DAY_OF_MONTH_MAX})
              </Label>
              <Input
                id={dayId}
                type="text"
                value={dayOfMonth}
                onChange={(e) => onDayOfMonthChange(e.target.value)}
                placeholder="e.g. 1 or 1, 15, 23"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter one or more days separated by commas (e.g. 1, 15, 23, 29)
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor={startId}>
              Start month{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id={startId}
              type="month"
              value={
                recurringStartDate.length >= 7
                  ? recurringStartDate.slice(0, 7)
                  : recurringStartDate || ""
              }
              onChange={(e) => onRecurringStartDateChange(e.target.value || "")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={endId}>
              End month{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id={endId}
              type="month"
              value={
                recurringEndDate.length >= 7
                  ? recurringEndDate.slice(0, 7)
                  : recurringEndDate || ""
              }
              onChange={(e) => onRecurringEndDateChange(e.target.value || "")}
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
