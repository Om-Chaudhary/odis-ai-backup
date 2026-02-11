import type { SolutionPageData } from "./types";

export const aiVeterinaryReceptionist: SolutionPageData = {
  metaTitle:
    "AI Veterinary Receptionist | Virtual Front Desk for Vet Clinics | OdisAI",
  metaDescription:
    "Replace hold times with instant AI-powered reception. OdisAI's virtual veterinary receptionist answers calls, books appointments, and handles client inquiries — like your best receptionist, available 24/7.",
  keywords: [
    "virtual veterinary receptionist",
    "AI vet receptionist",
    "veterinary virtual receptionist",
    "AI front desk veterinary",
    "automated vet receptionist",
    "virtual receptionist for vet clinic",
  ],
  hero: {
    badge: "AI Receptionist",
    title: "Your Best Receptionist, Available 24/7",
    subtitle:
      "An AI veterinary receptionist that answers calls instantly, books appointments, handles inquiries, and never takes a sick day — so your team can focus on patients.",
    socialProofLine: "Augmenting front desk teams at 50+ clinics",
  },
  problem: {
    title: "Your Front Desk Is a Bottleneck",
    description:
      "Veterinary receptionists are overwhelmed. They're checking in patients, processing payments, answering phones, and managing the lobby — all at once. Something always gives.",
    painPoints: [
      "Receptionists juggle in-person clients and ringing phones simultaneously",
      "Average hold time of 2+ minutes drives callers to competitors",
      "High turnover means constantly training new front desk staff",
      "Peak hours create bottlenecks that frustrate both clients and staff",
      "Hiring and training a receptionist costs $30,000-$45,000 per year",
    ],
  },
  solution: {
    title: "AI Reception That Augments Your Team",
    description:
      "OdisAI handles the phone so your team can handle the lobby. Our AI receptionist answers every call, books appointments, provides information, and routes complex issues to staff — all with the warmth and knowledge of a seasoned receptionist.",
  },
  features: [
    {
      title: "Instant Call Answering",
      description:
        "Every call is answered in under 3 seconds. No hold music, no 'please hold' — just immediate, helpful conversation.",
      highlights: [
        "Zero hold time",
        "Unlimited concurrent calls",
        "Natural conversation flow",
      ],
    },
    {
      title: "Full Appointment Management",
      description:
        "Book, reschedule, and cancel appointments. Check availability. Send confirmations. All during the call.",
      highlights: [
        "Real-time calendar sync",
        "Multi-provider scheduling",
        "Automatic reminders",
      ],
    },
    {
      title: "Client Information Hub",
      description:
        "OdisAI knows your clinic's hours, services, pricing, policies, and FAQs — answering common questions without involving staff.",
      highlights: [
        "Custom knowledge base",
        "Hours and directions",
        "Service and pricing info",
      ],
    },
    {
      title: "Smart Call Routing",
      description:
        "Complex cases, emotional callers, and specific requests are seamlessly transferred to the right team member.",
      highlights: [
        "Intent detection",
        "Department routing",
        "Warm transfer with context",
      ],
    },
  ],
  benefits: [
    "Answer every call in under 3 seconds — no hold queues",
    "Free your front desk team to focus on in-clinic clients",
    "Handle unlimited concurrent calls during peak hours",
    "Reduce receptionist turnover stress with AI support",
    "Provide consistent, professional service on every call",
    "Scale phone coverage without scaling headcount",
  ],
  metrics: [
    {
      value: "< 3s",
      label: "Answer Time",
      description: "Every call, every time",
    },
    {
      value: "60%",
      label: "Calls Resolved",
      description: "Without human involvement",
    },
    {
      value: "24/7",
      label: "Availability",
      description: "Nights, weekends, holidays",
    },
  ],
  faqs: [
    {
      question: "Does the AI receptionist replace our human receptionists?",
      answer:
        "No — it augments them. OdisAI handles phone calls so your human team can focus on in-clinic patients, check-ins, and complex issues that benefit from a personal touch.",
    },
    {
      question: "How does the AI know about our clinic's services and policies?",
      answer:
        "During onboarding, we configure OdisAI with your clinic's specific information: services, pricing, hours, policies, provider bios, and common FAQs. You can update this information anytime.",
    },
    {
      question: "Can the AI handle Spanish-speaking callers?",
      answer:
        "OdisAI supports multiple languages. If a caller speaks Spanish, the AI can switch to Spanish for the conversation.",
    },
    {
      question: "What happens when the AI can't handle a request?",
      answer:
        "OdisAI recognizes when a call needs human attention and transfers it to your team with full context — the caller never has to repeat themselves.",
    },
    {
      question: "How much does it cost compared to hiring a receptionist?",
      answer:
        "OdisAI costs a fraction of a full-time receptionist's salary and benefits, while providing 24/7 coverage and handling unlimited concurrent calls. Most clinics see ROI within the first month.",
    },
  ],
  cta: {
    title: "Give Your Front Desk the Backup It Deserves",
    subtitle:
      "See how OdisAI's AI receptionist transforms veterinary phone operations.",
    urgencyLine: "Your next missed call could be a new client choosing your competitor",
    badge: "No Hiring Required",
  },

  // New fields
  iconName: "Bot",
  cardDescription:
    "Virtual front desk that answers calls instantly, books appointments, and never takes a sick day.",
  heroStat: { value: "< 3s", label: "Average Answer Time" },
  socialProof: {
    quote:
      "We were about to hire a second receptionist at $40K/year. OdisAI handles 60% of our calls for a fraction of the cost, and our existing receptionist can finally focus on in-clinic patients.",
    attribution: "Lisa T., Practice Manager",
    proofLine: "Saved $40K/year in hiring costs",
  },
  howItWorks: [
    {
      step: 1,
      title: "Forward Your Calls",
      description:
        "Set up call forwarding to OdisAI — for overflow, after-hours, or all calls.",
      iconName: "PhoneForwarded",
    },
    {
      step: 2,
      title: "AI Handles Everything",
      description:
        "Books appointments, answers FAQs, provides directions, and routes complex cases to staff.",
      iconName: "MessageSquare",
    },
    {
      step: 3,
      title: "Staff Stays Focused",
      description:
        "Your team handles in-clinic patients while OdisAI handles the phones. Everyone wins.",
      iconName: "Users",
    },
  ],
  relatedSolutions: [
    {
      slug: "veterinary-answering-service",
      label: "24/7 Answering",
      description: "Full-time AI phone coverage",
    },
    {
      slug: "after-hours-answering",
      label: "After-Hours Coverage",
      description: "Seamless night and weekend call handling",
    },
    {
      slug: "discharge-follow-up",
      label: "Discharge Follow-Up",
      description: "Automated post-visit care calls",
    },
  ],
  relatedComparisons: [
    { slug: "smith-ai", label: "OdisAI vs Smith.ai" },
    { slug: "ruby-receptionists", label: "OdisAI vs Ruby Receptionists" },
    { slug: "dialzara", label: "OdisAI vs Dialzara" },
  ],
};
