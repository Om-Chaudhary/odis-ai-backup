import type { SolutionPageData } from "./types";

export const emergencyCallCenter: SolutionPageData = {
  metaTitle:
    "Emergency Vet Call Center | AI-Powered Triage & Routing | OdisAI",
  metaDescription:
    "Handle emergency veterinary calls with AI-powered triage. OdisAI identifies urgent cases, routes them to on-call staff, and directs non-emergencies appropriately — 24/7.",
  keywords: [
    "emergency vet call center",
    "veterinary emergency triage",
    "emergency vet phone service",
    "after hours emergency vet calls",
    "veterinary emergency call routing",
    "emergency animal hospital phone",
  ],
  hero: {
    badge: "Emergency Call Center",
    title: "Emergency Triage That Gets It Right the First Time",
    subtitle:
      "AI-powered emergency call handling that triages cases in real-time, routes true emergencies to on-call staff, and directs non-urgent callers to the right resource.",
    socialProofLine: "Trusted for emergency triage at 50+ clinics",
  },
  problem: {
    title: "Emergency Calls Need Expert Triage, Not Guesswork",
    description:
      "When a panicked pet parent calls at midnight, generic answering services can't tell a true emergency from a routine concern. The result: missed emergencies or burned-out on-call staff.",
    painPoints: [
      "Generic services treat every after-hours call as an 'emergency' message",
      "On-call vets get woken up for non-urgent questions they can't address by phone",
      "True emergencies get delayed when they're mixed in with routine inquiries",
      "Callers with real emergencies waste precious time explaining their situation to untrained operators",
      "No structured triage means liability risk and inconsistent care",
    ],
  },
  solution: {
    title: "Veterinary-Trained AI Triage, Instant Routing",
    description:
      "OdisAI uses veterinary-specific triage protocols to assess every call. True emergencies are routed to on-call staff in seconds. Non-urgent cases get appropriate next steps — booking appointments, providing care instructions, or directing to the nearest ER.",
  },
  features: [
    {
      title: "AI-Powered Triage",
      description:
        "Veterinary-specific decision trees assess symptoms, species, and urgency in real-time during the call.",
      highlights: [
        "Species-specific protocols",
        "Symptom severity scoring",
        "Toxin exposure detection",
      ],
    },
    {
      title: "Instant Emergency Routing",
      description:
        "True emergencies are escalated to on-call staff within seconds via phone, SMS, or your preferred notification channel.",
      highlights: [
        "Multi-channel alerts",
        "On-call schedule awareness",
        "Escalation chains",
      ],
    },
    {
      title: "ER Hospital Referrals",
      description:
        "When the case needs an emergency hospital, OdisAI provides the caller with directions to the nearest open ER facility.",
      highlights: [
        "Local ER hospital directory",
        "Real-time availability info",
        "Caller gets directions",
      ],
    },
    {
      title: "Complete Documentation",
      description:
        "Every emergency call is fully documented with triage decisions, outcomes, and recordings for your records.",
      highlights: [
        "Triage decision audit trail",
        "Call recordings and transcripts",
        "Outcome tracking",
      ],
    },
  ],
  benefits: [
    "Triage calls accurately with veterinary-specific AI protocols",
    "Route true emergencies to on-call staff in under 30 seconds",
    "Protect on-call staff from non-urgent interruptions",
    "Reduce liability with structured, documented triage decisions",
    "Direct callers to the nearest emergency hospital when needed",
    "Maintain complete audit trails of every emergency call",
  ],
  metrics: [
    {
      value: "< 30s",
      label: "Emergency Routing",
      description: "From call to on-call notification",
    },
    {
      value: "95%",
      label: "Triage Accuracy",
      description: "Validated against vet protocols",
    },
    {
      value: "24/7",
      label: "Always Available",
      description: "Nights, weekends, and holidays",
    },
  ],
  faqs: [
    {
      question: "How does OdisAI determine if a call is a true emergency?",
      answer:
        "OdisAI uses veterinary triage decision trees configured by your team. It assesses symptoms, species, patient age, and other factors to score urgency — similar to how a trained veterinary technician would triage an incoming call.",
    },
    {
      question: "Can we customize the triage protocols?",
      answer:
        "Absolutely. Your veterinary team defines the triage criteria, escalation thresholds, and routing rules. OdisAI follows your protocols exactly.",
    },
    {
      question: "What if the AI makes a triage mistake?",
      answer:
        "OdisAI is configured conservatively — when in doubt, it escalates. Every call is recorded and documented, providing a complete audit trail. Your team can review and refine protocols over time based on real call data.",
    },
    {
      question: "How does OdisAI reach the on-call veterinarian?",
      answer:
        "OdisAI uses your on-call schedule and contacts the right person via phone call, SMS, or both. If the primary on-call doesn't respond within your configured timeframe, it escalates to the backup.",
    },
  ],
  cta: {
    title: "Handle Emergencies with Confidence",
    subtitle:
      "See how OdisAI triages emergency calls for veterinary clinics.",
    urgencyLine: "Every second counts in an emergency — OdisAI routes in under 30",
    badge: "24/7 Emergency Coverage",
  },

  // New fields
  iconName: "Siren",
  cardDescription:
    "AI-powered triage that identifies true emergencies and routes them to on-call staff in seconds.",
  heroStat: { value: "< 30s", label: "Emergency Routing Time" },
  socialProof: {
    quote:
      "A client called at 3 AM about their dog ingesting chocolate. OdisAI identified it as a toxin emergency, notified our on-call vet in 20 seconds, and directed the client to the nearest ER. That's the kind of response that saves lives.",
    attribution: "Dr. David K., Practice Owner",
    proofLine: "20-second emergency response at 3 AM",
  },
  howItWorks: [
    {
      step: 1,
      title: "Call Comes In",
      description:
        "AI answers instantly and begins gathering symptoms and patient information.",
      iconName: "PhoneIncoming",
    },
    {
      step: 2,
      title: "AI Triages",
      description:
        "Veterinary-specific protocols assess urgency, species, symptoms, and toxin exposure.",
      iconName: "Stethoscope",
    },
    {
      step: 3,
      title: "Instant Routing",
      description:
        "True emergencies reach on-call staff in seconds. Non-urgent cases get appropriate next steps.",
      iconName: "Zap",
    },
  ],
  relatedSolutions: [
    {
      slug: "after-hours-answering",
      label: "After-Hours Coverage",
      description: "Seamless night and weekend call handling",
    },
    {
      slug: "veterinary-answering-service",
      label: "24/7 Answering",
      description: "Full-time AI phone coverage",
    },
  ],
  relatedComparisons: [
    { slug: "guardianvets", label: "OdisAI vs GuardianVets" },
    { slug: "vettriage", label: "OdisAI vs VetTriage" },
  ],
};
