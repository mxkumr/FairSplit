import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { PRIVACY_POLICY_SECTIONS } from "@/lib/legal/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy - FairSplit",
  description: "How FairSplit collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      sections={PRIVACY_POLICY_SECTIONS}
      otherPage={{ href: "/terms", label: "Terms of Service" }}
    />
  );
}
