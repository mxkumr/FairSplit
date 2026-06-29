import type { LegalSection } from "@/lib/legal/types";

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    title: "1. Introduction",
    paragraphs: [
      'FairSplit ("we", "us", or "our") is a free expense-sharing web application that helps groups track shared costs and settle balances. This Privacy Policy explains what information we collect, how we use it, and the choices you have.',
      "By creating an account or using FairSplit, you agree to this Privacy Policy. If you do not agree, please do not use the service.",
    ],
  },
  {
    id: "operator",
    title: "2. Who operates FairSplit",
    paragraphs: [
      "FairSplit is operated by Manish Kumar as an independent open-source project. FairSplit is not a registered company unless stated otherwise on the website.",
      "For privacy questions or requests, contact us at mxkumr@gmail.com.",
    ],
  },
  {
    id: "information-we-collect",
    title: "3. Information we collect",
    paragraphs: ["We collect the following categories of information when you use FairSplit:"],
    bullets: [
      "Account information: your name, email address, and a hashed password. We may store whether your email has been verified.",
      "Expense and group data: group names, member relationships, expense descriptions, amounts, dates, split details, notes, categories, payment records between members, and activity logs related to those actions.",
      "Optional uploads: receipt images or PDFs you attach to expenses (JPEG, PNG, WebP, GIF, or PDF, up to 5 MB per file).",
      "Invite and friend data: invite tokens, friend connections, and email addresses you use to invite others to groups or add friends.",
      "Technical data: session cookies required to keep you signed in, and standard server logs (such as IP address, browser type, and request timestamps) that our hosting provider may record.",
    ],
  },
  {
    id: "how-we-use",
    title: "4. How we use your information",
    paragraphs: ["We use your information to:"],
    bullets: [
      "Create and manage your account and authenticate you.",
      "Send one-time verification codes and service-related emails (such as email verification).",
      "Provide expense tracking, balance calculation, debt simplification, and settlement features.",
      "Let you invite friends and add members to groups.",
      "Operate, secure, debug, and improve the application.",
      "Respond to support requests and legal obligations.",
    ],
  },
  {
    id: "legal-basis",
    title: "5. Legal basis (where applicable)",
    paragraphs: [
      "If you are in the European Economic Area, United Kingdom, or another region with similar laws, we process your data based on: (a) performance of our contract with you to provide the service; (b) your consent where required (such as optional receipt uploads); and (c) our legitimate interests in operating, securing, and improving FairSplit, provided those interests are not overridden by your rights.",
    ],
  },
  {
    id: "sharing",
    title: "6. How information is shared",
    paragraphs: [
      "We do not sell your personal information. We share information only as described below:",
    ],
    bullets: [
      "With other FairSplit users you interact with: group members can see your name, email (where shown in the app), expenses, balances, and payments within shared groups.",
      "With service providers that help us run FairSplit: hosting (Vercel), database hosting (Supabase/PostgreSQL), and transactional email delivery (Resend). These providers process data on our behalf to deliver the service.",
      "When required by law, regulation, legal process, or to protect the rights, safety, and security of users or the public.",
      "In connection with a merger, acquisition, or asset sale, if FairSplit is transferred to another operator (you would be notified where required by law).",
    ],
  },
  {
    id: "payments",
    title: "7. We do not process money",
    paragraphs: [
      "FairSplit records expenses and balances between users for informational purposes only. We do not process bank transfers, credit card payments, or other real-money transactions. Any actual payments happen outside the app between you and other users.",
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies and similar technologies",
    paragraphs: [
      'We use a strictly necessary HTTP-only session cookie ("fairsplit_session") to keep you signed in for up to 7 days. This cookie is required for authentication. We do not use third-party advertising cookies.',
      "You can remove cookies through your browser settings, but you may need to sign in again.",
    ],
  },
  {
    id: "retention",
    title: "9. Data retention",
    paragraphs: [
      "We retain your account and expense data for as long as your account is active or as needed to provide the service. Email verification codes are short-lived and deleted after use or expiry.",
      "Receipt files may be stored on the application server or associated storage while linked to an expense. On some hosting environments, uploaded files may not persist permanently unless object storage is configured.",
      "You may request deletion of your account and associated personal data by emailing mxkumr@gmail.com. We will process reasonable requests unless we must retain certain data for legal or security reasons.",
    ],
  },
  {
    id: "security",
    title: "10. Security",
    paragraphs: [
      "We use reasonable technical measures to protect your data, including password hashing, HTTPS in production, and HTTP-only session cookies. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    id: "your-rights",
    title: "11. Your rights",
    paragraphs: [
      "Depending on where you live, you may have rights to access, correct, delete, or export your personal data, or to object to or restrict certain processing. To exercise these rights, contact mxkumr@gmail.com. You may also lodge a complaint with your local data protection authority.",
    ],
  },
  {
    id: "children",
    title: "12. Children's privacy",
    paragraphs: [
      "FairSplit is not directed at children under 13 (or the minimum age required in your country). We do not knowingly collect personal information from children. If you believe a child has provided us data, contact us and we will take appropriate steps to delete it.",
    ],
  },
  {
    id: "international",
    title: "13. International transfers",
    paragraphs: [
      "FairSplit may be hosted on infrastructure located outside your country (for example, the United States or European Union). By using the service, you understand your information may be processed in those locations, which may have different data protection laws than your jurisdiction.",
    ],
  },
  {
    id: "changes",
    title: "14. Changes to this policy",
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the "Last updated" date. Continued use of FairSplit after changes become effective means you accept the updated policy.',
    ],
  },
  {
    id: "contact",
    title: "15. Contact",
    paragraphs: [
      "Questions about this Privacy Policy or your data:",
      "Manish Kumar - mxkumr@gmail.com",
      "GitHub: https://github.com/mxkumr/FairSplit",
    ],
  },
];
