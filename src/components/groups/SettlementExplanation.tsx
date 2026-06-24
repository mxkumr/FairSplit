"use client";

import { useState } from "react";
import { ChevronDown, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SettlementExplanationLine } from "@/lib/api-client";

const kindStyles: Record<SettlementExplanationLine["kind"], string> = {
  borrowed: "text-brand",
  lent: "text-success-foreground",
  payment_out: "text-muted-foreground",
  payment_in: "text-success-foreground",
};

export function SettlementExplanation({
  lines,
  summary,
  payerName,
  defaultOpen = false,
}: {
  lines: SettlementExplanationLine[];
  summary: string;
  payerName: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-2xl border border-border/60 bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold hover:bg-muted/40 rounded-2xl transition-colors"
      >
        <span className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-brand shrink-0" />
          How {payerName}&apos;s balance adds up
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border/60 px-4 py-3">
          <ol className="space-y-2">
            {lines.map((line, index) => (
              <li
                key={`${line.kind}-${line.expenseId ?? line.paymentId ?? index}`}
                className="flex gap-2 text-sm leading-relaxed"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <span className={kindStyles[line.kind]}>{line.text}</span>
              </li>
            ))}
          </ol>
          <p className="rounded-xl bg-background/80 px-3 py-2 text-sm leading-relaxed text-foreground border border-border/50">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}
