import Image from "next/image";
import { Github, Linkedin, Mail } from "lucide-react";
import { CREATOR } from "@/lib/site-config";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

export function AppCreatorFooter() {
  return (
    <footer className="mt-10 border-t border-border/60 pt-6 pb-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src={CREATOR.avatarUrl}
            alt={CREATOR.name}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full ring-2 ring-border object-cover"
            unoptimized
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{CREATOR.name}</p>
            <p className="text-xs text-muted-foreground leading-snug">{CREATOR.role}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{CREATOR.contributionNote}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={CREATOR.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href={CREATOR.linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href={`mailto:${CREATOR.email}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Email"
          >
            <Mail className="h-4 w-4" />
          </a>
        </div>
      </div>
      <LegalFooterLinks className="mt-4" />
    </footer>
  );
}
