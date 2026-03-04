"use client";

import { useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface CommandItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BudgetCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: CommandItem[];
  onExecute: (value: string) => void;
}

export function BudgetCommandPalette({
  open,
  onOpenChange,
  commands,
  onExecute,
}: BudgetCommandPaletteProps) {
  const [value, setValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, value]);

  const clampedIndex = Math.min(
    selectedIndex,
    Math.max(0, filteredCommands.length - 1),
  );

  function handleExecute(valueToRun: string) {
    const cmd = filteredCommands.find((c) => c.value === valueToRun);
    if (cmd?.disabled) return;
    setValue("");
    onOpenChange(false);
    onExecute(valueToRun);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setValue("");
        else setSelectedIndex(0);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>Run a quick command</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-2">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) =>
                  Math.min(i + 1, filteredCommands.length - 1),
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const cmd = filteredCommands[clampedIndex];
                if (cmd && !cmd.disabled) handleExecute(cmd.value);
              }
            }}
            placeholder="Type to search…"
            aria-label="Search commands"
            className="w-full"
          />
          <div
            className="max-h-[200px] overflow-y-auto rounded-md border border-border"
            role="listbox"
            aria-label="Commands"
          >
            {filteredCommands.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No matching commands
              </div>
            ) : (
              filteredCommands.map((cmd, i) => (
                <button
                  key={cmd.value}
                  type="button"
                  role="option"
                  ref={(el) => {
                    if (el && i === clampedIndex) {
                      el.scrollIntoView({ block: "nearest" });
                    }
                  }}
                  aria-selected={i === clampedIndex}
                  disabled={cmd.disabled}
                  className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                    i === clampedIndex
                      ? "bg-muted text-foreground"
                      : "text-foreground hover:bg-muted/50"
                  } ${cmd.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                  onClick={() => {
                    if (!cmd.disabled) handleExecute(cmd.value);
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  {cmd.label}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
