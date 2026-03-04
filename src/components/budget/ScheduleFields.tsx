"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DAY_OF_MONTH_MIN, DAY_OF_MONTH_MAX } from "@/lib/constants";

export interface ScheduleFieldsProps {
  scheduleType: "one-time" | "recurring";
  onScheduleTypeChange: (v: "one-time" | "recurring") => void;
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
  legendClassName = "text-sm font-medium",
  ariaLabel = "Schedule type",
}: ScheduleFieldsProps) {
  const oneTimeId = `${idPrefix}-schedule-one-time`;
  const recurringId = `${idPrefix}-schedule-recurring`;
  const dateId = `${idPrefix}-date`;
  const dayId = `${idPrefix}-day`;
  const startId = `${idPrefix}-recurring-start`;
  const endId = `${idPrefix}-recurring-end`;

  return (
    <fieldset className="space-y-2">
      <legend className={legendClassName}>When</legend>
      <RadioGroup
        value={scheduleType}
        onValueChange={(v) =>
          onScheduleTypeChange(v as "one-time" | "recurring")
        }
        className="flex gap-6"
        aria-label={ariaLabel}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="one-time" id={oneTimeId} />
          <Label
            htmlFor={oneTimeId}
            className="cursor-pointer text-sm font-normal"
          >
            Specific date
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="recurring" id={recurringId} />
          <Label
            htmlFor={recurringId}
            className="cursor-pointer text-sm font-normal"
          >
            Recurring
          </Label>
        </div>
      </RadioGroup>
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
      {scheduleType === "recurring" && (
        <div className="mt-2 space-y-2">
          <div className="space-y-2">
            <Label htmlFor={dayId}>
              Day of month ({DAY_OF_MONTH_MIN}–{DAY_OF_MONTH_MAX})
            </Label>
            <Input
              id={dayId}
              type="number"
              min={DAY_OF_MONTH_MIN}
              max={DAY_OF_MONTH_MAX}
              value={dayOfMonth}
              onChange={(e) => onDayOfMonthChange(e.target.value)}
              placeholder={`e.g. ${DAY_OF_MONTH_MIN} or 15`}
              required={scheduleType === "recurring"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={startId}>
              Start date{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id={startId}
              type="date"
              value={recurringStartDate}
              onChange={(e) => onRecurringStartDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={endId}>
              End date{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id={endId}
              type="date"
              value={recurringEndDate}
              onChange={(e) => onRecurringEndDateChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
