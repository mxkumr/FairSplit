import Link from "next/link";
import { FairSplitMark } from "@/components/brand/FairSplitMark";
import { cn } from "@/lib/utils";

const sizeStyles = {
  sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4", wordmark: "text-base" },
  md: { box: "h-9 w-9 rounded-xl", icon: "h-5 w-5", wordmark: "text-lg" },
  lg: { box: "h-12 w-12 rounded-2xl", icon: "h-6 w-6", wordmark: "text-xl" },
  xl: { box: "h-14 w-14 rounded-2xl", icon: "h-7 w-7", wordmark: "text-2xl" },
} as const;

type FairSplitLogoProps = {
  size?: keyof typeof sizeStyles;
  showWordmark?: boolean;
  href?: string;
  className?: string;
  wordmarkClassName?: string;
};

export function FairSplitLogo({
  size = "md",
  showWordmark = true,
  href,
  className,
  wordmarkClassName,
}: FairSplitLogoProps) {
  const styles = sizeStyles[size];

  const content = (
    <>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center gradient-brand text-brand-foreground shadow-soft",
          styles.box,
        )}
      >
        <FairSplitMark className={styles.icon} />
      </div>
      {showWordmark && (
        <span
          className={cn("font-bold tracking-tight truncate text-foreground", styles.wordmark, wordmarkClassName)}
        >
          FairSplit
        </span>
      )}
    </>
  );

  const wrapperClass = cn("flex items-center gap-2.5 min-w-0", className);

  if (href) {
    return (
      <Link href={href} className={wrapperClass} aria-label="FairSplit home">
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}

/** Icon-only mark for invite pages, FAB contexts, etc. */
export function FairSplitLogoMark({
  size = "lg",
  className,
}: {
  size?: keyof typeof sizeStyles;
  className?: string;
}) {
  const styles = sizeStyles[size];
  return (
    <div
      className={cn(
        "flex items-center justify-center gradient-brand text-brand-foreground shadow-soft",
        styles.box,
        className,
      )}
    >
      <FairSplitMark className={styles.icon} />
    </div>
  );
}
