import Link from "next/link";
import { cn } from "@/lib/utils";
import { GITHUB_ISSUES } from "@/lib/github-links";

export function LegalFooterLinks({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground hover:underline">
          Privacy
        </Link>
        <span className="mx-2 text-border">·</span>
        <Link href="/terms" className="hover:text-foreground hover:underline">
          Terms
        </Link>
        <span className="mx-2 text-border">·</span>
        <a
          href={GITHUB_ISSUES.bugReport}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          Report a bug
        </a>
        <span className="mx-2 text-border">·</span>
        <a
          href={GITHUB_ISSUES.feedback}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          Feedback
        </a>
      </p>
    </div>
  );
}
