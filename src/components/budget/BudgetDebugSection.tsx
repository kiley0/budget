"use client";

import { useState } from "react";
import type { BudgetState } from "@/store/budget";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronDownIcon } from "lucide-react";

interface BudgetDebugSectionProps {
  budgetState: BudgetState;
  rawEncrypted: string | null;
}

export function BudgetDebugSection({
  budgetState,
  rawEncrypted,
}: BudgetDebugSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <section
      className="mt-10 rounded-lg border border-border bg-muted/50"
      aria-label="Debug"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Debug: localStorage sync
            <ChevronDownIcon
              className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div id="debug-section-content" className="space-y-4 p-4">
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Decrypted store state (in memory)
              </p>
              <ScrollArea className="mt-1 h-48 rounded border border-border bg-background">
                <pre className="p-3 text-xs text-foreground">
                  {JSON.stringify(budgetState, null, 2)}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Raw encrypted value in localStorage
              </p>
              <ScrollArea className="mt-1 h-32 rounded border border-border bg-background">
                <pre className="break-all p-3 text-xs text-foreground">
                  {rawEncrypted ?? "(none yet)"}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
