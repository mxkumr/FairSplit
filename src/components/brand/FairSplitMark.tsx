import { cn } from "@/lib/utils";

/** Shared FairSplit icon mark - receipt split down the middle */
export function FairSplitMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d="M7 3h10a2 2 0 0 1 2 2v15.5a.75.75 0 0 1-1.085.67L12 18.5l-5.915 3.42A.75.75 0 0 1 5 21.5V5a2 2 0 0 1 2-2Z"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <path
        d="M7 3h10a2 2 0 0 1 2 2v15.5a.75.75 0 0 1-1.085.67L12 18.5l-5.915 3.42A.75.75 0 0 1 5 21.5V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 7.5v9" stroke="currentColor" strokeWidth="1.75" strokeDasharray="2.5 2.5" />
      <circle cx="9" cy="12" r="1.35" fill="currentColor" />
      <circle cx="15" cy="12" r="1.35" fill="currentColor" />
    </svg>
  );
}
