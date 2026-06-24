"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  LogOut,
  Plus,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle, ThemeToggleIcon } from "@/components/ui/theme-toggle";
import { useLogout, useMe } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const desktopNav = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/friends", label: "Friends", icon: UserRound },
] as const;

const mobileNav = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/friends", label: "Profile", icon: UserRound },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useMe();
  const logout = useLogout();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  async function handleLogout() {
    await logout.mutateAsync();
    router.push("/login");
  }

  const DiscoverIcon = mobileNav[0].icon;
  const ProfileIcon = mobileNav[1].icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/60 bg-sidebar px-4 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-brand-foreground shadow-soft">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">FairSplit</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {desktopNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive(href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
          <Link
            href="/groups/new"
            className={cn(
              "mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors",
              pathname === "/groups/new"
                ? "gradient-brand text-brand-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Plus className="h-5 w-5" />
            New Group
          </Link>
        </nav>

        <div className="mb-4 hidden md:block">
          <ThemeToggle className="w-full justify-center" />
        </div>

        {data?.user && (
          <div className="mt-auto flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {getInitials(data.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{data.user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{data.user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 glass px-4 md:hidden">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand text-brand-foreground">
              <Users className="h-4 w-4" />
            </div>
            FairSplit
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggleIcon />
            {data?.user && (
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(data.user.name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-8 md:pb-8">{children}</main>
      </div>

      {/* Mobile floating nav */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
        <div className="relative mx-auto max-w-md">
          <div className="flex items-center justify-between rounded-full bg-nav px-2 py-2 text-nav-foreground shadow-float">
            <Link
              href={mobileNav[0].href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-semibold transition-colors min-h-11",
                isActive(mobileNav[0].href) ? "text-nav-foreground" : "text-nav-foreground/50",
              )}
            >
              <DiscoverIcon className="h-5 w-5" />
              {mobileNav[0].label}
            </Link>

            <div className="w-14" />

            <Link
              href={mobileNav[1].href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-semibold transition-colors min-h-11",
                isActive(mobileNav[1].href) ? "text-nav-foreground" : "text-nav-foreground/50",
              )}
            >
              <ProfileIcon className="h-5 w-5" />
              {mobileNav[1].label}
            </Link>
          </div>

          <Link
            href="/groups/new"
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full gradient-brand text-brand-foreground shadow-float ring-4 ring-background"
            aria-label="Create new group"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>
      </nav>
    </div>
  );
}
