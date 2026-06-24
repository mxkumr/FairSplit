import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { TERMS_OF_SERVICE_SECTIONS } from "@/lib/legal/terms-of-service";

export const metadata: Metadata = {
  title: "Terms of Service — FairSplit",
  description: "Terms governing your use of FairSplit.",
};

export default function TermsPage() {
  return (
    <LegalDocumentPage
      title="Terms of Service"
      sections={TERMS_OF_SERVICE_SECTIONS}
      otherPage={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
