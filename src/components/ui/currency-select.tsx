"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currencies";

export function CurrencySelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (code: string, symbol: string) => void;
  id?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(code) => {
        const currency = CURRENCIES.find((c) => c.code === code);
        onChange(code, currency?.symbol ?? code);
      }}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.code} - {c.name} ({c.symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
