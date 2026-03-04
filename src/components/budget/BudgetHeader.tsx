"use client";

import { type RefObject } from "react";
import { ChevronDownIcon, Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface BudgetHeaderProps {
  importFileRef: RefObject<HTMLInputElement | null>;
  onImportClick: () => void;
  onImportFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onLogout: () => void;
}

export function BudgetHeader({
  importFileRef,
  onImportClick,
  onImportFileChange,
  onExportJson,
  onExportCsv,
  onLogout,
}: BudgetHeaderProps) {
  return (
    <header className="flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <span className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Sunrise className="size-6 shrink-0" aria-hidden />
          Budget Forecaster
        </span>
        <div className="flex items-center gap-2">
          <input
            ref={importFileRef}
            type="file"
            accept=".json,application/json"
            aria-hidden
            className="sr-only"
            onChange={onImportFileChange}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                Import/Export
                <ChevronDownIcon className="ml-1 size-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              <DropdownMenuItem onSelect={() => onImportClick()}>
                Import data
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onExportJson()}>
                Export to JSON (for importing)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onExportCsv()}>
                Export to CSV (for spreadsheets)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" variant="outline" size="sm" onClick={onLogout}>
            Log out
          </Button>
        </div>
      </div>
      <Separator />
    </header>
  );
}
