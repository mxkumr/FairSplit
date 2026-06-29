"use client";

import { cn } from "@/lib/utils";
import type { SettlementModeKey } from "@/lib/debt-simplification";

export function SimplifyDebtsSwitch({
  enabled,
  onChange,
  className,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Simplify debts"
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        enabled ? "bg-brand" : "bg-muted-foreground/30",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

export function settlementModeFromSwitch(enabled: boolean): SettlementModeKey {
  return enabled ? "simplified" : "direct";
}

export function settlementModeDescription(mode: SettlementModeKey): string {
  if (mode === "direct") {
    return "Pay each person who covered your share from the expenses.";
  }
  return "Combine balances into fewer payments for the whole group.";
}

export function prismaSettlementModeToKey(
  mode: "SIMPLIFIED" | "DIRECT",
): SettlementModeKey {
  return mode === "DIRECT" ? "direct" : "simplified";
}

export function settlementModeToPrisma(mode: SettlementModeKey): "SIMPLIFIED" | "DIRECT" {
  return mode === "direct" ? "DIRECT" : "SIMPLIFIED";
}
