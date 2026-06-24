"use client";

import { createContext, useContext } from "react";
import { getCurrencySymbol } from "@/lib/currencies";

type GroupCurrency = {
  currency: string;
  currencySymbol: string;
};

const GroupCurrencyContext = createContext<GroupCurrency>({
  currency: "USD",
  currencySymbol: "$",
});

export function GroupCurrencyProvider({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <GroupCurrencyContext.Provider value={{ currency, currencySymbol }}>
      {children}
    </GroupCurrencyContext.Provider>
  );
}

export function useGroupCurrency() {
  return useContext(GroupCurrencyContext);
}
