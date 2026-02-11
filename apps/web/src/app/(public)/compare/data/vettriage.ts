import type { ComparisonPageData } from "./types";

export const vettriage: ComparisonPageData = {
  competitorName: "VetTriage",
  metaTitle:
    "OdisAI vs VetTriage | AI Veterinary Answering Service Comparison",
  metaDescription:
    "Compare OdisAI and VetTriage for veterinary call handling. OdisAI offers AI-powered voice agents with PIMS integration, appointment booking, and flat pricing vs. VetTriage's telehealth model.",
  keywords: [
    "vettriage competitor",
    "vettriage alternative",
    "vettriage vs",
    "vettriage comparison",
    "veterinary telehealth alternative",
    "vet triage service comparison",
  ],
  hero: {
    badge: "Comparison",
    headline: "Your Callers Deserve More Than Just Triage",
    title: "OdisAI vs VetTriage",
    subtitle:
      "VetTriage focuses on telehealth triage with licensed vets. OdisAI handles the full phone experience — answering, booking, follow-ups, and triage — with AI that integrates into your workflow.",
  },
  comparisonTable: [
    { feature: "Answer Speed", odis: "< 3 seconds", competitor: "Variable" },
    { feature: "24/7 Availability", odis: true, competitor: true },
    { feature: "Appointment Booking", odis: true, competitor: false },
    { feature: "PIMS Integration", odis: true, competitor: false },
    { feature: "Discharge Follow-Up Calls", odis: true, competitor: false },
    { feature: "Emergency Triage", odis: true, competitor: true },
    { feature: "Telehealth Consultations", odis: false, competitor: true },
    { feature: "Call Recording & Transcripts", odis: true, competitor: false },
    { feature: "Unlimited Concurrent Calls", odis: true, competitor: false },
    { feature: "Flat Monthly Pricing", odis: true, competitor: false },
    { feature: "Outbound Call Campaigns", odis: true, competitor: false },
    { feature: "Client Satisfaction Surveys", odis: true, competitor: false },
  ],
  detailedSections: [
    {
      title: "Service Model",
      odis: "OdisAI is an AI voice agent that handles the full phone experience: answering calls, booking appointments, triaging emergencies, making follow-up calls, and logging everything in your PIMS.",
      competitor:
        "VetTriage connects callers with licensed veterinarians for telehealth consultations and triage. Their focus is clinical assessment, not practice operations.",
    },
    {
      title: "Practice Integration",
      odis: "Deep integration with practice management systems. Calls are logged, appointments sync automatically, and morning briefings summarize overnight activity.",
      competitor:
        "VetTriage operates independently from your practice systems. Triage outcomes are communicated via email or their portal.",
    },
    {
      title: "Use Case",
      odis: "Full phone automation — every call your clinic receives is handled by AI, from routine inquiries to emergency triage to follow-up calls.",
      competitor:
        "Clinical triage — best for practices that specifically need veterinary telehealth assessments for after-hours emergencies.",
    },
  ],
  differentiators: [
    {
      title: "Complete Phone Solution",
      description:
        "OdisAI handles all calls, not just emergencies. Routine questions, appointment requests, and follow-ups are all covered.",
    },
    {
      title: "Practice System Integration",
      description:
        "Everything flows into your PIMS automatically. No manual data entry, no switching between portals.",
    },
    {
      title: "Proactive Outreach",
      description:
        "OdisAI makes outbound calls too — discharge follow-ups, appointment reminders, and satisfaction surveys.",
    },
    {
      title: "Unlimited Scalability",
      description:
        "Handle 1 call or 100 simultaneously. No capacity limits, no wait times, no busy signals.",
    },
  ],
  faqs: [
    {
      question: "Does OdisAI offer telehealth like VetTriage?",
      answer:
        "OdisAI focuses on phone automation and triage, not video telehealth consultations. If you need telehealth, VetTriage may complement OdisAI — you can use both for different purposes.",
    },
    {
      question: "Is OdisAI\u2019s triage as thorough as a licensed vet\u2019s assessment?",
      answer:
        "OdisAI\u2019s triage is protocol-based and designed to identify urgency, not diagnose. For emergency triage (determining \u2018does this pet need to be seen now?\u2019), AI performs comparably. For clinical assessments, that\u2019s what your veterinary team is for.",
    },
    {
      question: "Can we use OdisAI and VetTriage together?",
      answer:
        "Absolutely. Some clinics use OdisAI for all inbound call handling and appointment booking, then route specific cases to VetTriage for in-depth telehealth consultations.",
    },
    {
      question: "Which service is better for a general practice?",
      answer:
        "For most general practices, OdisAI provides broader value — handling all phone calls, booking appointments, and making follow-up calls. VetTriage is best if your primary need is licensed-vet telehealth triage.",
    },
  ],
  cta: {
    title: "See the Full-Service Difference",
    subtitle:
      "Compare OdisAI's complete phone solution to VetTriage for your clinic.",
    urgencyLine:
      "See how OdisAI handles your full phone experience — not just triage",
    badge: "Complete Phone Solution",
  },

  cardDescription:
    "Full phone automation vs. telehealth triage — see which fits your practice.",
  competitorType: "vet-specific",
  keyAdvantages: [
    { value: "< 3s", label: "Answer Speed" },
    { value: "10+", label: "Features Beyond Triage" },
    { value: "$0", label: "Per-Call Fees" },
  ],
  verdict: {
    summary:
      "OdisAI wins for practices that need complete phone automation. VetTriage wins specifically for video telehealth consultations — but many clinics use both.",
    bestForOdis: [
      "Clinics wanting complete phone automation",
      "Practices needing appointment booking and PIMS integration",
      "Clinics wanting outbound follow-up calls",
      "Budget-conscious practices preferring flat pricing",
    ],
    bestForCompetitor: [
      "Practices specifically needing video telehealth",
      "Clinics wanting licensed-vet consultations for complex cases",
    ],
  },
  socialProof: {
    quote:
      "VetTriage was great for emergency triage, but we needed more. OdisAI handles everything — answering, booking, follow-ups, and triage — all in one platform.",
    attribution: "Dr. Amanda S., Practice Owner",
    proofLine: "One platform replaced three separate services",
  },
  switchingGuide: {
    title: "Adding OdisAI to Your Practice",
    description:
      "OdisAI can complement or replace VetTriage. Many clinics use OdisAI for call handling and keep VetTriage for telehealth.",
    steps: [
      "Schedule a 30-minute onboarding call",
      "Configure call handling, booking, and triage protocols",
      "Set up PIMS integration and follow-up automation",
      "Go live with OdisAI alongside or instead of VetTriage",
    ],
    timeline: "48 hours from first call to live service",
  },
  relatedSolutions: [
    { slug: "veterinary-answering-service", label: "24/7 Answering Service" },
    { slug: "discharge-follow-up", label: "Discharge Follow-Up" },
  ],
  relatedComparisons: [
    { slug: "guardianvets", label: "OdisAI vs GuardianVets" },
    { slug: "dialzara", label: "OdisAI vs Dialzara" },
  ],
};
