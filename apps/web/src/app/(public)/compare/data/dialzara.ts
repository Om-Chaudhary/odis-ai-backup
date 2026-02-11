import type { ComparisonPageData } from "./types";

export const dialzara: ComparisonPageData = {
  competitorName: "Dialzara",
  metaTitle:
    "OdisAI vs Dialzara | AI Answering Service for Veterinary Clinics",
  metaDescription:
    "Compare OdisAI and Dialzara for AI-powered call handling. See why veterinary-specific AI outperforms general AI answering services for vet clinics.",
  keywords: [
    "dialzara veterinary",
    "dialzara alternative",
    "dialzara competitor",
    "dialzara vs",
    "AI answering service veterinary comparison",
    "dialzara review",
  ],
  hero: {
    badge: "Comparison",
    headline: "Generic AI Doesn't Know a Labrador from a Lab Result",
    title: "OdisAI vs Dialzara",
    subtitle:
      "Dialzara is a general AI answering service for small businesses. OdisAI is purpose-built for veterinary clinics with PIMS integration, medical triage, and discharge automation.",
  },
  comparisonTable: [
    { feature: "Veterinary-Specific AI", odis: true, competitor: false },
    { feature: "PIMS Integration", odis: true, competitor: false },
    { feature: "Emergency Triage", odis: true, competitor: false },
    { feature: "Discharge Follow-Up Calls", odis: true, competitor: false },
    { feature: "Appointment Booking", odis: true, competitor: "Basic" },
    { feature: "24/7 AI Answering", odis: true, competitor: true },
    { feature: "Call Recording", odis: true, competitor: true },
    { feature: "Custom Workflows", odis: "Veterinary workflows", competitor: "General workflows" },
    { feature: "Medical Terminology", odis: true, competitor: false },
    { feature: "Outbound Calling", odis: true, competitor: false },
    { feature: "Multi-Location Support", odis: true, competitor: "Limited" },
    { feature: "Dedicated Onboarding", odis: true, competitor: "Self-service" },
  ],
  detailedSections: [
    {
      title: "AI Specialization",
      odis: "OdisAI's AI is trained specifically for veterinary interactions. It understands breeds, procedures, medications, symptoms, and the unique workflows of vet practices.",
      competitor:
        "Dialzara's AI is a general-purpose answering service that works across industries. It follows basic scripts without veterinary domain knowledge.",
    },
    {
      title: "Practice Management",
      odis: "Deep integration with IDEXX Neo, ezyVet, and other veterinary PIMS. Appointments are booked, calls are logged, and workflows are triggered automatically.",
      competitor:
        "Basic integrations with CRMs and general business tools. No veterinary-specific practice management system integrations.",
    },
    {
      title: "Beyond Inbound Calls",
      odis: "OdisAI handles inbound calls and makes outbound calls — discharge follow-ups, appointment reminders, and proactive outreach campaigns.",
      competitor:
        "Dialzara focuses on inbound call answering. No outbound calling or proactive patient outreach capabilities.",
    },
  ],
  differentiators: [
    {
      title: "Veterinary Domain Expertise",
      description:
        "OdisAI doesn't just answer calls — it understands veterinary medicine. Breed-specific questions, medication inquiries, and symptom descriptions are handled naturally.",
    },
    {
      title: "Real Practice Integration",
      description:
        "Calendar sync, call logging, appointment booking, and workflow triggers — all connected to your PIMS automatically.",
    },
    {
      title: "Outbound Capabilities",
      description:
        "OdisAI proactively calls pet parents for discharge follow-ups, reminders, and surveys. Dialzara only handles incoming calls.",
    },
    {
      title: "Enterprise Onboarding",
      description:
        "Dedicated setup support, custom protocol configuration, and hands-on training — not a self-service portal.",
    },
  ],
  faqs: [
    {
      question: "Is OdisAI more expensive than Dialzara?",
      answer:
        "OdisAI's pricing reflects its veterinary-specific capabilities, PIMS integration, and outbound calling features. For vet clinics, the ROI from fewer missed appointments, better follow-up care, and reduced staff workload typically far exceeds the price difference.",
    },
    {
      question: "Dialzara is easy to set up. Is OdisAI complicated?",
      answer:
        "OdisAI's setup is more thorough because we configure veterinary-specific protocols, connect to your PIMS, and customize the AI for your practice. Most clinics are live within 48 hours, with dedicated support throughout.",
    },
    {
      question: "Can Dialzara handle veterinary calls?",
      answer:
        "Dialzara can answer calls and take messages for any business, but it lacks veterinary training. It can't triage emergencies, understand medical terminology, or integrate with veterinary practice management systems.",
    },
    {
      question: "We're a small clinic. Is Dialzara sufficient for us?",
      answer:
        "If you just need basic call answering and message-taking, Dialzara may work. But if you want emergency triage, appointment booking, PIMS integration, and discharge follow-ups, OdisAI provides significantly more value — even for small clinics.",
    },
  ],
  cta: {
    title: "Get AI Built for Veterinary Medicine",
    subtitle: "See how specialized AI outperforms generic solutions.",
    urgencyLine:
      "Your callers' pets deserve AI that understands veterinary medicine",
    badge: "Veterinary AI Specialist",
  },

  cardDescription:
    "General AI answering vs. veterinary-specific AI. The difference matters.",
  competitorType: "general-ai",
  keyAdvantages: [
    { value: "100%", label: "Vet-Specific" },
    { value: "Deep", label: "PIMS Integration" },
    { value: "2-Way", label: "Outbound + Inbound" },
  ],
  verdict: {
    summary:
      "Dialzara is a decent general AI answering service. But for veterinary clinics, the lack of medical knowledge, PIMS integration, and triage capability makes it the wrong tool for the job.",
    bestForOdis: [
      "Any veterinary clinic",
      "Practices needing emergency triage",
      "Clinics wanting PIMS integration and appointment booking",
      "Practices that need outbound calling capabilities",
    ],
    bestForCompetitor: [
      "Non-veterinary small businesses on a tight budget",
      "Businesses needing only basic AI call answering",
    ],
  },
  socialProof: {
    quote:
      "We tried Dialzara first because it was cheaper. But when a client called about their dog vomiting blood, it didn't know how to triage. We switched to OdisAI the next day.",
    attribution: "Dr. Rachel T., Emergency Clinic",
    proofLine: "Switched after one critical triage failure",
  },
  switchingGuide: {
    title: "Switching from Dialzara to OdisAI",
    description:
      "Upgrading from generic AI to veterinary-specific AI is fast and painless.",
    steps: [
      "Schedule a 30-minute onboarding call",
      "We configure veterinary protocols, triage decision trees, and PIMS integration",
      "Verify emergency triage accuracy with test scenarios",
      "Switch your call forwarding from Dialzara to OdisAI",
    ],
    timeline: "48 hours from first call to live service",
  },
  relatedSolutions: [
    { slug: "veterinary-answering-service", label: "24/7 Answering Service" },
    { slug: "emergency-call-center", label: "Emergency Triage" },
  ],
  relatedComparisons: [
    { slug: "smith-ai", label: "OdisAI vs Smith.ai" },
    { slug: "guardianvets", label: "OdisAI vs GuardianVets" },
  ],
};
