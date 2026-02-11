import type { SolutionPageData } from "./types";

export const dischargeFollowUp: SolutionPageData = {
  metaTitle:
    "Veterinary Discharge Follow-Up Calls | Automated Post-Visit Care | OdisAI",
  metaDescription:
    "Automate discharge follow-up calls to improve patient outcomes and client retention. OdisAI calls pet parents after visits to check on recovery, answer medication questions, and catch complications early.",
  keywords: [
    "veterinary discharge follow up",
    "vet discharge call",
    "post visit follow up veterinary",
    "veterinary patient follow up",
    "discharge call automation",
    "post-surgical follow up calls",
  ],
  hero: {
    badge: "Discharge Follow-Up",
    title: "The Follow-Up Call That Saves Lives and Prevents Lawsuits",
    subtitle:
      "OdisAI automatically calls pet parents after visits to check on recovery, answer questions, and catch complications early — because the best care doesn't end at checkout.",
    socialProofLine: "Powering proactive care at 50+ clinics",
  },
  problem: {
    title: "Follow-Up Calls Fall Through the Cracks",
    description:
      "Every veterinarian knows discharge follow-ups improve outcomes. But with packed schedules and phone lines ringing, they rarely happen consistently.",
    painPoints: [
      "Staff are too busy during the day to make outbound follow-up calls",
      "Post-surgical patients go unchecked until the client calls back with a problem",
      "Medication non-compliance goes undetected until the next visit",
      "Missed follow-ups lead to complications that could have been prevented",
      "Clients feel forgotten after big procedures — hurting retention and reviews",
    ],
  },
  solution: {
    title: "Automated Follow-Ups, Better Outcomes",
    description:
      "OdisAI automatically calls pet parents after discharge — on your schedule, following your protocols. The AI checks on recovery, asks about medications, answers common questions, and flags any concerns for your team to review.",
  },
  features: [
    {
      title: "Automatic Call Scheduling",
      description:
        "Follow-up calls are triggered automatically from discharge events in your PIMS. No manual scheduling needed.",
      highlights: [
        "PIMS-triggered automation",
        "Custom timing per procedure",
        "Multi-call sequences",
      ],
    },
    {
      title: "Protocol-Driven Conversations",
      description:
        "The AI follows your specific post-discharge protocols — asking the right questions based on the procedure performed.",
      highlights: [
        "Procedure-specific scripts",
        "Medication compliance checks",
        "Recovery milestone tracking",
      ],
    },
    {
      title: "Escalation Alerts",
      description:
        "If a pet parent reports concerning symptoms, the AI flags the case for immediate veterinary review.",
      highlights: [
        "Symptom detection alerts",
        "Priority case flagging",
        "Direct vet notifications",
      ],
    },
    {
      title: "Outcome Tracking",
      description:
        "Every follow-up call is documented with structured outcomes — giving you data on recovery rates, compliance, and satisfaction.",
      highlights: [
        "Structured call outcomes",
        "Recovery trend reports",
        "Client satisfaction scores",
      ],
    },
  ],
  benefits: [
    "Ensure every patient gets a follow-up call — automatically",
    "Catch post-surgical complications early before they escalate",
    "Improve medication compliance with proactive check-ins",
    "Boost client satisfaction and online reviews with caring outreach",
    "Free veterinary staff from outbound call duties",
    "Build data-driven insights on patient outcomes",
  ],
  metrics: [
    {
      value: "100%",
      label: "Follow-Up Rate",
      description: "Every discharge gets a call",
    },
    {
      value: "3x",
      label: "More Follow-Ups",
      description: "Compared to manual calling",
    },
    {
      value: "24hrs",
      label: "Response Time",
      description: "First follow-up within a day",
    },
  ],
  faqs: [
    {
      question: "How does OdisAI know when to make follow-up calls?",
      answer:
        "OdisAI integrates with your practice management system and automatically detects discharge events. You configure the timing — for example, call 24 hours after surgery, then again at 72 hours.",
    },
    {
      question: "Can we customize the follow-up questions?",
      answer:
        "Yes. You can create procedure-specific follow-up protocols. Post-dental calls ask different questions than post-surgical calls. The AI adapts based on what the patient came in for.",
    },
    {
      question: "What if the pet parent has a concern during the call?",
      answer:
        "The AI is trained to recognize concerning symptoms and responses. When something needs veterinary attention, it immediately flags the case for your team and can transfer the call or schedule an urgent appointment.",
    },
    {
      question: "Does this replace our veterinary team's follow-up?",
      answer:
        "No — it augments it. OdisAI handles the initial outreach and screening, then escalates cases that need professional attention. Your team focuses on the cases that actually need them.",
    },
  ],
  cta: {
    title: "Make Follow-Up Calls Automatic, Not Optional",
    subtitle:
      "See how OdisAI automates discharge follow-ups for veterinary clinics.",
    urgencyLine: "Every day without follow-ups is a day complications go undetected",
    badge: "Better Outcomes, Fewer Callbacks",
  },

  // New fields
  iconName: "Heart",
  cardDescription:
    "Automated post-visit calls that check recovery, catch complications, and boost client retention.",
  heroStat: { value: "100%", label: "Follow-Up Completion Rate" },
  socialProof: {
    quote:
      "We caught a post-surgical complication on a follow-up call that the owner hadn't noticed yet. That one call probably saved the pet's life — and it happened automatically.",
    attribution: "Dr. Jennifer L., Veterinary Surgeon",
    proofLine: "Life-saving complication caught automatically",
  },
  howItWorks: [
    {
      step: 1,
      title: "Discharge Triggers Call",
      description:
        "When a patient is discharged from your PIMS, a follow-up call is automatically scheduled.",
      iconName: "ClipboardCheck",
    },
    {
      step: 2,
      title: "AI Checks In",
      description:
        "The AI calls the pet parent, asks about recovery, checks medication compliance, and answers questions.",
      iconName: "Phone",
    },
    {
      step: 3,
      title: "Issues Flagged",
      description:
        "Concerning responses are flagged for immediate veterinary review with full call details.",
      iconName: "AlertTriangle",
    },
  ],
  relatedSolutions: [
    {
      slug: "veterinary-answering-service",
      label: "24/7 Answering",
      description: "Full-time AI phone coverage",
    },
    {
      slug: "ai-veterinary-receptionist",
      label: "AI Receptionist",
      description: "Virtual front desk support",
    },
  ],
  relatedComparisons: [
    { slug: "vettriage", label: "OdisAI vs VetTriage" },
  ],
};
