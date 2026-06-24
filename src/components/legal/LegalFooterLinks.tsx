import Link from "next/link";
import { cn } from "@/lib/utils";

export function LegalFooterLinks({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      <Link href="/privacy" className="hover:text-foreground hover:underline">
        Privacy
      </Link>
      <span className="mx-2 text-border">·</span>
      <Link href="/terms" className="hover:text-foreground hover:underline">
        Terms
      </Link>
    </p>
  );
}
