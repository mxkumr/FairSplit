import Link from "next/link";
import { FairSplitLogo, FairSplitLogoMark } from "@/components/brand/FairSplitLogo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Hero */}
      <div className="relative hidden min-h-screen overflow-hidden lg:block">
        <div className="absolute inset-0 gradient-auth" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative flex h-full flex-col justify-end p-12">
          <FairSplitLogoMark size="lg" className="mb-6 shadow-float" />
          <h1 className="max-w-md text-4xl font-bold leading-tight text-balance-tight text-foreground">
            Share expenses instantly with friends
          </h1>
          <p className="mt-4 max-w-sm text-lg text-muted-foreground">
            Split bills without the hassle. Track group expenses, settle up, and stay fair.
          </p>
        </div>
      </div>

      {/* Mobile hero strip */}
      <div className="relative h-48 overflow-hidden lg:hidden">
        <div className="absolute inset-0 gradient-auth" />
        <div className="relative flex h-full items-end p-6">
          <FairSplitLogo size="md" showWordmark wordmarkClassName="text-sm font-semibold text-foreground/80" />
        </div>
      </div>

      {/* Form card */}
      <div className="flex flex-col justify-center bg-background px-6 py-8 lg:px-16 lg:py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-4 flex justify-end">
            <ThemeToggle />
          </div>
          <div className="surface p-6 lg:p-8">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export function AuthFooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-foreground hover:underline">
      {children}
    </Link>
  );
}
