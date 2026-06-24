import Link from "next/link";
import { FairSplitLogo } from "@/components/brand/FairSplitLogo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LEGAL } from "@/lib/legal/config";
import type { LegalSection } from "@/lib/legal/types";

export function LegalDocumentPage({
  title,
  sections,
  otherPage,
}: {
  title: string;
  sections: LegalSection[];
  otherPage: { href: string; label: string };
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <FairSplitLogo size="sm" href="/" />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-muted-foreground">
          Last updated: {LEGAL.effectiveDate}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          This document is provided for transparency. It is not legal advice. For
          questions, contact{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-foreground underline">
            {LEGAL.contactEmail}
          </a>
          .
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets && (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-14 border-t border-border/60 pt-6 text-sm text-muted-foreground">
          <p>
            See also{" "}
            <Link href={otherPage.href} className="text-foreground underline">
              {otherPage.label}
            </Link>
            .
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} {LEGAL.operatorName}. FairSplit source code
            is licensed under the{" "}
            <a
              href={LEGAL.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline"
            >
              MIT License
            </a>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
