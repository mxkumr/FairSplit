"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type GroupTab = "activity" | "settle" | "log" | "settings";

export function parseGroupTab(tabParam: string | null): GroupTab {
  if (tabParam === "settle" || tabParam === "log" || tabParam === "settings") {
    return tabParam;
  }
  return "activity";
}

type GroupTabContextValue = {
  activeTab: GroupTab;
  setActiveTab: (tab: GroupTab) => void;
  tabsRef: React.RefObject<HTMLDivElement | null>;
};

const GroupTabContext = createContext<GroupTabContextValue | null>(null);

export function GroupTabProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabFromUrl = parseGroupTab(searchParams.get("tab"));
  const [activeTab, setActiveTabState] = useState<GroupTab>(tabFromUrl);
  const prevTabRef = useRef<string | null>(null);

  useEffect(() => {
    setActiveTabState(tabFromUrl);
  }, [tabFromUrl]);

  const scrollToTabs = useCallback(() => {
    requestAnimationFrame(() => {
      tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const setActiveTab = useCallback(
    (tab: GroupTab) => {
      setActiveTabState(tab);

      const params = new URLSearchParams(searchParams.toString());
      if (tab === "activity") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

      if (tab !== "activity") {
        scrollToTabs();
      }
    },
    [pathname, router, scrollToTabs, searchParams],
  );

  useEffect(() => {
    if (prevTabRef.current === null) {
      prevTabRef.current = activeTab;
      if (activeTab !== "activity") {
        scrollToTabs();
      }
      return;
    }
    if (prevTabRef.current === activeTab) return;
    prevTabRef.current = activeTab;
    if (activeTab !== "activity") {
      scrollToTabs();
    }
  }, [activeTab, scrollToTabs]);

  return (
    <GroupTabContext.Provider value={{ activeTab, setActiveTab, tabsRef }}>
      {children}
    </GroupTabContext.Provider>
  );
}

export function useGroupTab() {
  const context = useContext(GroupTabContext);
  if (!context) {
    throw new Error("useGroupTab must be used within GroupTabProvider");
  }
  return context;
}

export function useGoToSettleUpTab() {
  const { setActiveTab } = useGroupTab();
  return useCallback(() => setActiveTab("settle"), [setActiveTab]);
}
