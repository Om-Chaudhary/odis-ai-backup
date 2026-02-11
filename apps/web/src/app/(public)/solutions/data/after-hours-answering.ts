import type { SolutionPageData } from "./types";

export const afterHoursAnswering: SolutionPageData = {
  metaTitle:
    "After-Hours Veterinary Answering Service | Night & Weekend Coverage | OdisAI",
  metaDescription:
    "Provide after-hours call coverage without the overhead. OdisAI's AI voice agents handle night and weekend calls, triage emergencies, and book next-day appointments automatically.",
  keywords: [
    "veterinary after hours answering service",
    "after hours vet phone service",
    "veterinary night answering",
    "weekend vet answering service",
    "after hours animal hospital calls",
    "overnight veterinary phone coverage",
  ],
  hero: {
    badge: "After-Hours Coverage",
    title: "After-Hours Answering That Actually Helps Callers",
    subtitle:
      "When your clinic closes, OdisAI takes over — triaging emergencies, booking next-day appointments, and giving pet parents peace of mind at 2 AM.",
    socialProofLine: "Protecting on-call staff at 50+ clinics",
  },
  problem: {
    title: "After Hours Is When You Lose the Most Clients",
    description:
      "70% of pet parent calls happen outside business hours. Most clinics send them to voicemail or a generic answering service — and those callers don't come back.",
    painPoints: [
      "Voicemail after hours means callers immediately try competitor clinics",
      "Generic answering services can't triage — every call becomes an 'emergency'",
      "On-call staff get woken up for non-urgent calls they can't do anything about",
      "Next-day appointment requests pile up as voicemails that staff manually return",
      "Weekend and holiday coverage is expensive with human answering services",
    ],
  },
  solution: {
    title: "Intelligent After-Hours Coverage, Zero Overhead",
    description:
      "OdisAI seamlessly takes over when your clinic closes. It answers calls naturally, determines urgency using your protocols, routes true emergencies to on-call staff, and books next-day appointments — all without human intervention.",
  },
  features: [
    {
      title: "Smart Emergency Triage",
      description:
        "AI follows your exact triage protocols to identify true emergencies and route them to on-call staff — everything else gets handled without waking anyone up.",
      highlights: [
        "Custom triage decision trees",
        "On-call staff SMS/call alerts",
        "Emergency hospital referrals",
      ],
    },
    {
      title: "Next-Day Appointment Booking",
      description:
        "Non-urgent callers get booked into the first available slot the next business day — no voicemails to return in the morning.",
      highlights: [
        "Real-time calendar access",
        "Automatic morning summaries",
        "Confirmation texts to clients",
      ],
    },
    {
      title: "Seamless Handoff",
      description:
        "When your clinic opens, staff get a complete briefing on every after-hours call — what happened, what was scheduled, and what needs follow-up.",
      highlights: [
        "Morning call summary report",
        "Calls logged in your PIMS",
        "Flagged items for review",
      ],
    },
    {
      title: "Holiday & Weekend Coverage",
      description:
        "Full coverage on holidays and weekends at no extra cost. OdisAI doesn't charge overtime.",
      highlights: [
        "Automatic schedule awareness",
        "Holiday-specific greetings",
        "No overtime charges",
      ],
    },
  ],
  benefits: [
    "Stop losing clients to voicemail after 5 PM",
    "Protect on-call staff from non-emergency interruptions",
    "Wake up to booked appointments, not piled-up voicemails",
    "Provide genuine emergency triage, not just message-taking",
    "Cover nights, weekends, and holidays without added cost",
    "Give pet parents peace of mind when they're worried at night",
  ],
  metrics: [
    {
      value: "70%",
      label: "After-Hours Calls",
      description: "Happen outside business hours",
    },
    {
      value: "85%",
      label: "Calls Resolved",
      description: "Without waking on-call staff",
    },
    {
      value: "$0",
      label: "Overtime Cost",
      description: "Nights, weekends, and holidays included",
    },
  ],
  faqs: [
    {
      question: "How does OdisAI know when our clinic is closed?",
      answer:
        "OdisAI syncs with your practice management system and knows your exact business hours, including holidays and special closures. The AI automatically adjusts its behavior for after-hours calls.",
    },
    {
      question: "What if there's a real emergency after hours?",
      answer:
        "OdisAI follows your custom triage protocols to identify true emergencies. When one is detected, it immediately contacts your on-call staff via phone or SMS and can refer callers to the nearest emergency hospital.",
    },
    {
      question: "Can we customize the after-hours greeting?",
      answer:
        "Absolutely. You can set custom greetings for after-hours, weekends, and specific holidays. The AI adapts its conversation style while maintaining your clinic's voice.",
    },
    {
      question:
        "How much does after-hours coverage cost compared to a traditional service?",
      answer:
        "OdisAI's after-hours coverage is included in your plan — no per-call fees, no overtime charges. Traditional answering services typically charge $1-3 per call plus setup fees, which adds up fast with high after-hours volume.",
    },
  ],
  cta: {
    title: "Never Send Another Caller to Voicemail",
    subtitle:
      "See how OdisAI handles after-hours calls for veterinary clinics.",
    urgencyLine: "Set up takes less than 48 hours — your next after-hours shift is covered",
    badge: "Zero Overtime Costs",
  },

  // New fields
  iconName: "Moon",
  cardDescription:
    "Night and weekend coverage that triages emergencies and books next-day appointments automatically.",
  heroStat: { value: "85%", label: "Calls Resolved Without Waking Staff" },
  socialProof: {
    quote:
      "Our on-call vet was getting woken up 4-5 times a night for non-emergencies. Now OdisAI handles 85% of after-hours calls without involving staff. The team is rested and our clients are happier.",
    attribution: "Dr. Michael R., Emergency Director",
    proofLine: "85% fewer after-hours staff interruptions",
  },
  howItWorks: [
    {
      step: 1,
      title: "Set Your Hours",
      description:
        "OdisAI syncs with your PIMS and knows exactly when your clinic opens and closes.",
      iconName: "Clock",
    },
    {
      step: 2,
      title: "AI Takes Over",
      description:
        "After hours, the AI triages emergencies, books next-day appointments, and provides care instructions.",
      iconName: "ShieldCheck",
    },
    {
      step: 3,
      title: "Morning Briefing",
      description:
        "Staff arrive to a complete summary of every overnight call, appointment, and flagged case.",
      iconName: "FileText",
    },
  ],
  relatedSolutions: [
    {
      slug: "veterinary-answering-service",
      label: "24/7 Answering",
      description: "Full-time AI phone coverage",
    },
    {
      slug: "emergency-call-center",
      label: "Emergency Triage",
      description: "AI-powered emergency routing",
    },
    {
      slug: "discharge-follow-up",
      label: "Discharge Follow-Up",
      description: "Automated post-visit care calls",
    },
  ],
  relatedComparisons: [
    { slug: "guardianvets", label: "OdisAI vs GuardianVets" },
    { slug: "ruby-receptionists", label: "OdisAI vs Ruby Receptionists" },
  ],
};
