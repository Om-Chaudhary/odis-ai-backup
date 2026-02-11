import type { ComparisonPageData } from "./types";

export const smithAi: ComparisonPageData = {
  competitorName: "Smith.ai",
  metaTitle:
    "OdisAI vs Smith.ai for Veterinary Clinics | Purpose-Built vs General",
  metaDescription:
    "Compare OdisAI and Smith.ai for veterinary phone handling. See why a purpose-built veterinary AI outperforms generic virtual receptionist services for vet clinics.",
  keywords: [
    "smith ai veterinary",
    "smith ai alternative veterinary",
    "smith ai vet clinic",
    "smith.ai competitor",
    "virtual receptionist veterinary comparison",
    "smith ai vs",
  ],
  hero: {
    badge: "Comparison",
    headline: "Your Vet Clinic Deserves More Than a Generic Receptionist",
    title: "OdisAI vs Smith.ai",
    subtitle:
      "Smith.ai is a general-purpose virtual receptionist service. OdisAI is purpose-built for veterinary clinics — with PIMS integration, medical triage, and discharge follow-ups.",
  },
  comparisonTable: [
    { feature: "Veterinary-Specific AI", odis: true, competitor: false },
    { feature: "PIMS Integration", odis: true, competitor: false },
    { feature: "Emergency Triage Protocols", odis: true, competitor: false },
    { feature: "Discharge Follow-Up Calls", odis: true, competitor: false },
    { feature: "24/7 Availability", odis: true, competitor: true },
    { feature: "Appointment Booking", odis: true, competitor: "Basic" },
    { feature: "Call Recording & Transcripts", odis: true, competitor: true },
    { feature: "Per-Call Fees", odis: "None", competitor: "Per-call pricing" },
    { feature: "Unlimited Concurrent Calls", odis: true, competitor: false },
    { feature: "Medical Terminology Understanding", odis: true, competitor: false },
    { feature: "Outbound Calling", odis: true, competitor: "Limited" },
    { feature: "Multi-Industry Support", odis: "Veterinary only", competitor: "All industries" },
  ],
  detailedSections: [
    {
      title: "Industry Expertise",
      odis: "Built exclusively for veterinary clinics. OdisAI understands medical terminology, triage protocols, common procedures, and the specific workflows of vet practices.",
      competitor:
        "Smith.ai serves law firms, dentists, HVAC companies, and many other industries. Their receptionists follow general scripts without veterinary-specific training.",
    },
    {
      title: "Technology",
      odis: "AI voice agents powered by large language models with veterinary-specific training. Handles calls autonomously with natural conversation.",
      competitor:
        "Primarily human receptionists with AI-assist features. Quality depends on operator training and availability.",
    },
    {
      title: "Pricing Model",
      odis: "Flat monthly pricing with unlimited calls. No per-call fees, no overage charges.",
      competitor:
        "Per-call or per-minute pricing. Costs increase proportionally with volume. After-hours and complex calls may cost more.",
    },
  ],
  differentiators: [
    {
      title: "Veterinary-Native AI",
      description:
        "OdisAI isn\u2019t a general answering service with a vet script. It\u2019s built from the ground up for veterinary medicine.",
    },
    {
      title: "Real Practice Integration",
      description:
        "Smith.ai takes messages. OdisAI books appointments, logs calls in your PIMS, and triggers follow-up workflows.",
    },
    {
      title: "Medical Triage Capability",
      description:
        "OdisAI can triage emergencies using veterinary protocols. A general receptionist service can't assess medical urgency.",
    },
    {
      title: "Proactive Patient Care",
      description:
        "OdisAI makes outbound discharge follow-up calls — something no general virtual receptionist service offers.",
    },
  ],
  faqs: [
    {
      question: "We already use Smith.ai. Why switch to OdisAI?",
      answer:
        "Smith.ai is solid for general reception, but it can\u2019t triage veterinary emergencies, integrate with your PIMS, or make discharge follow-up calls. If you\u2019re a vet clinic, OdisAI handles everything Smith.ai does plus the veterinary-specific capabilities you need.",
    },
    {
      question: "Is Smith.ai cheaper than OdisAI?",
      answer:
        "Smith.ai\u2019s per-call pricing can be cheaper for very low call volumes (under 50 calls/month). But for most vet clinics with moderate to high volumes, OdisAI\u2019s flat pricing is significantly more cost-effective \u2014 and you get veterinary-specific features Smith.ai doesn\u2019t offer.",
    },
    {
      question:
        "Does Smith.ai integrate with veterinary practice management systems?",
      answer:
        "Smith.ai offers basic CRM integrations but doesn't integrate with veterinary PIMS like IDEXX Neo, ezyVet, or Cornerstone. OdisAI has purpose-built integrations for these systems.",
    },
    {
      question: "Can Smith.ai handle emergency triage?",
      answer:
        "No. Smith.ai receptionists follow general scripts and aren\u2019t trained to assess veterinary medical urgency. OdisAI uses veterinary-specific triage protocols to identify true emergencies.",
    },
  ],
  cta: {
    title: "Get a Receptionist That Speaks Veterinary",
    subtitle: "See how a purpose-built solution outperforms generic services.",
    urgencyLine:
      "Get a receptionist that knows the difference between a TPLO and a neuter",
    badge: "Built for Veterinary",
  },

  cardDescription:
    "Purpose-built veterinary AI vs. a general virtual receptionist. See the difference.",
  competitorType: "general-receptionist",
  keyAdvantages: [
    { value: "100%", label: "Vet-Specific AI" },
    { value: "< 3s", label: "Answer Speed" },
    { value: "$0", label: "Per-Call Fees" },
  ],
  verdict: {
    summary:
      "OdisAI is purpose-built for veterinary clinics. Smith.ai is a solid general receptionist service, but it can't triage emergencies, integrate with your PIMS, or make follow-up calls.",
    bestForOdis: [
      "Any veterinary clinic (OdisAI is purpose-built for vet)",
      "Practices needing emergency triage capability",
      "Clinics wanting PIMS integration",
      "Practices that want outbound discharge follow-ups",
    ],
    bestForCompetitor: [
      "Non-veterinary businesses needing general reception",
      "Multi-industry companies wanting one service across all locations",
    ],
  },
  socialProof: {
    quote:
      "We used Smith.ai for two years. They\u2019re professional, but they couldn\u2019t tell a splenic tumor from a splenectomy. OdisAI actually understands veterinary medicine.",
    attribution: "Dr. Robert M., Specialty Practice",
    proofLine: "Veterinary expertise that general services can't match",
  },
  switchingGuide: {
    title: "Switching from Smith.ai to OdisAI",
    description:
      "Moving from a general service to a veterinary-specific one is straightforward. We handle the heavy lifting.",
    steps: [
      "Schedule a 30-minute onboarding call",
      "We configure vet-specific protocols, PIMS integration, and triage",
      "Test calls to verify veterinary knowledge and workflows",
      "Cut over from Smith.ai to OdisAI",
    ],
    timeline: "48 hours from first call to live service",
  },
  relatedSolutions: [
    { slug: "ai-veterinary-receptionist", label: "AI Receptionist" },
    { slug: "veterinary-answering-service", label: "24/7 Answering Service" },
  ],
  relatedComparisons: [
    { slug: "ruby-receptionists", label: "OdisAI vs Ruby Receptionists" },
    { slug: "dialzara", label: "OdisAI vs Dialzara" },
  ],
};
