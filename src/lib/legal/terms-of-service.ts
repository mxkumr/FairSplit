import type { LegalSection } from "@/lib/legal/types";

export const TERMS_OF_SERVICE_SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of terms",
    paragraphs: [
      'These Terms of Service ("Terms") govern your access to and use of FairSplit, available at fairsplit.thecrudstudio.com and related services (the "Service").',
      "By registering for, accessing, or using the Service, you agree to these Terms and our Privacy Policy. If you do not agree, do not use FairSplit.",
    ],
  },
  {
    id: "operator",
    title: "2. Operator",
    paragraphs: [
      "FairSplit is operated by Manish Kumar as an independent open-source project. References to \"we\", \"us\", or \"our\" mean the operator of FairSplit unless otherwise stated.",
      "Contact: mxkumr@gmail.com",
    ],
  },
  {
    id: "description",
    title: "3. Description of the service",
    paragraphs: [
      "FairSplit lets users create groups, record shared expenses, split costs among members, view balances, and track informal settlements between people. The Service is provided free of charge in its current form.",
      "We may add, change, or remove features at any time without notice. The Service is offered on an \"as available\" basis.",
    ],
  },
  {
    id: "not-financial",
    title: "4. Not a financial or payment service",
    paragraphs: [
      "FairSplit is a record-keeping tool only. We do not move money, hold funds, provide banking services, or guarantee that users will pay debts shown in the app. Balances displayed are informational calculations based on data entered by users.",
      "You are solely responsible for actual payments between yourself and other users outside the Service.",
    ],
  },
  {
    id: "accounts",
    title: "5. Accounts and eligibility",
    paragraphs: [
      "You must provide accurate registration information and keep your credentials secure. You are responsible for all activity under your account.",
      "You must be old enough to form a binding contract where you live (typically at least 13, or higher where required). You must verify your email address before using most features.",
      "We may suspend or terminate accounts that violate these Terms or that we reasonably believe pose a security or abuse risk.",
    ],
  },
  {
    id: "conduct",
    title: "6. Acceptable use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "Use the Service for unlawful, fraudulent, or harmful purposes.",
      "Upload malware, illegal content, or files you do not have the right to share.",
      "Attempt to access other users' accounts or data without authorization.",
      "Reverse engineer, scrape, or overload the Service in ways that impair others.",
      "Impersonate another person or misrepresent your affiliation with any entity.",
      "Use FairSplit branding to imply endorsement by Splitwise or any other third party.",
    ],
  },
  {
    id: "user-content",
    title: "7. User content",
    paragraphs: [
      "You retain ownership of content you submit (such as expense descriptions, notes, and receipt uploads). You grant us a limited license to host, store, display, and process that content solely to operate the Service.",
      "You are responsible for the accuracy of expense data you enter and for having permission to share any receipts or personal information you upload.",
      "Other group members may see information you add to shared groups.",
    ],
  },
  {
    id: "intellectual-property",
    title: "8. Intellectual property",
    paragraphs: [
      "The FairSplit name, logo, and original application design are owned by the project operator. Third-party trademarks (such as Splitwise) belong to their respective owners; FairSplit is not affiliated with or endorsed by them.",
      "Source code for FairSplit is released under the MIT License unless otherwise noted in the repository. See the LICENSE file at https://github.com/mxkumr/FairSplit.",
    ],
  },
  {
    id: "open-source",
    title: "9. Open-source software",
    paragraphs: [
      "FairSplit includes open-source components subject to their own licenses. The application source code is provided \"as is\" under the MIT License without warranty. Contributions may be accepted via GitHub subject to the project's contribution practices.",
    ],
  },
  {
    id: "third-party",
    title: "10. Third-party services",
    paragraphs: [
      "The Service relies on third-party infrastructure and providers (such as hosting, database, and email services). Your use of those providers may be subject to their terms. We are not responsible for third-party outages or actions outside our reasonable control.",
    ],
  },
  {
    id: "disclaimer",
    title: "11. Disclaimer of warranties",
    paragraphs: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
      "We do not warrant that the Service will be uninterrupted, error-free, secure, or that balance calculations will always match your expectations. You use FairSplit at your own risk.",
    ],
  },
  {
    id: "liability",
    title: "12. Limitation of liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, MANISH KUMAR AND FAIRSPLIT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.",
      "OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE MONTHS BEFORE THE CLAIM (TYPICALLY ZERO) OR (B) ONE HUNDRED U.S. DOLLARS (USD $100).",
      "Some jurisdictions do not allow certain limitations, so some of the above may not apply to you.",
    ],
  },
  {
    id: "indemnity",
    title: "13. Indemnification",
    paragraphs: [
      "You agree to indemnify and hold harmless the operator of FairSplit from claims, damages, and expenses (including reasonable legal fees) arising from your use of the Service, your content, or your violation of these Terms or applicable law.",
    ],
  },
  {
    id: "termination",
    title: "14. Termination",
    paragraphs: [
      "You may stop using the Service at any time. We may suspend or terminate access if you breach these Terms or if we discontinue the Service.",
      "Sections that by their nature should survive termination (including disclaimers, limitations of liability, and indemnification) will survive.",
    ],
  },
  {
    id: "changes",
    title: "15. Changes to these Terms",
    paragraphs: [
      "We may update these Terms from time to time. The updated version will be posted on this page with a revised \"Last updated\" date. Material changes may also be communicated through the Service or by email where appropriate. Continued use after changes take effect constitutes acceptance.",
    ],
  },
  {
    id: "governing-law",
    title: "16. Governing law",
    paragraphs: [
      "These Terms are governed by the laws of India, without regard to conflict-of-law principles. Any disputes shall be subject to the exclusive jurisdiction of the courts located in India, unless mandatory consumer protection laws in your country require otherwise.",
      "Nothing in this section limits your rights as a consumer under laws that cannot be waived in your jurisdiction.",
    ],
  },
  {
    id: "contact",
    title: "17. Contact",
    paragraphs: [
      "Questions about these Terms:",
      "Manish Kumar — mxkumr@gmail.com",
      "GitHub: https://github.com/mxkumr/FairSplit",
    ],
  },
];
