import type { CaseStudy } from "~/types/case-study";

/**
 * Case Studies Data
 *
 * To add a new case study:
 * 1. Copy an existing case study object below
 * 2. Update all fields with the new case study information
 * 3. Ensure the slug is unique and URL-friendly
 * 4. Add appropriate tags and category
 * 5. Fill in challenges, solutions, and results
 */

export const caseStudies: CaseStudy[] = [
  {
    id: "1",
    slug: "riverside-veterinary-clinic",
    title: "How Riverside Veterinary Clinic Reduced Admin Time by 60%",
    subtitle: "Streamlining operations for a busy multi-location practice",
    client: {
      name: "Riverside Veterinary Clinic",
      industry: "Veterinary Medicine",
      location: "Portland, OR",
      size: "3 locations, 25 staff members",
    },
    summary:
      "Riverside Veterinary Clinic transformed their practice management by implementing OdisAI, reducing administrative overhead by 60% and improving client satisfaction scores by 45%.",
    image:
      "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=400&fit=crop&crop=center&auto=format&q=80",
    category: "Practice Management",
    tags: ["Multi-Location", "Efficiency", "Client Satisfaction"],
    publishedAt: "2024-03-15",
    readTime: "5 min read",

    overview:
      "Riverside Veterinary Clinic operates three busy locations across Portland, serving over 5,000 active clients. Before implementing OdisAI, the practice struggled with manual data entry, appointment scheduling conflicts, and inconsistent record-keeping across locations. The administrative burden was overwhelming, taking valuable time away from patient care.",

    challenges: [
      {
        title: "Manual Data Entry Overload",
        description:
          "Staff spent 4-5 hours daily entering patient information, treatment notes, and billing data across three different systems, leading to errors and delays.",
      },
      {
        title: "Scheduling Inefficiencies",
        description:
          "Coordinating appointments across three locations was chaotic, resulting in double bookings, long wait times, and frustrated clients.",
      },
      {
        title: "Inconsistent Record Keeping",
        description:
          "Each location had slightly different processes, making it difficult to maintain consistent patient records and provide seamless care when clients visited different locations.",
      },
    ],

    solutions: [
      {
        title: "Automated Data Entry",
        description:
          "OdisAI's intelligent automation system eliminated manual data entry by automatically extracting and organizing patient information from voice conversations and digital forms.",
        features: [
          "Real-time voice-to-text conversion",
          "Automatic patient record updates",
          "Integration with existing practice management software",
        ],
      },
      {
        title: "Unified Scheduling System",
        description:
          "Implemented a centralized scheduling platform that synchronized appointments across all three locations in real-time.",
        features: [
          "Multi-location calendar view",
          "Automated appointment reminders",
          "Smart conflict detection and resolution",
        ],
      },
      {
        title: "Standardized Workflows",
        description:
          "Created consistent processes and protocols across all locations while maintaining the flexibility each clinic needed.",
        features: [
          "Customizable templates for common procedures",
          "Standardized patient intake forms",
          "Cross-location patient history access",
        ],
      },
    ],

    results: {
      overview:
        "Within six months of implementing OdisAI, Riverside Veterinary Clinic saw dramatic improvements across all key performance indicators.",
      metrics: [
        {
          label: "Admin Time Reduction",
          value: "60%",
          description: "Less time spent on manual administrative tasks",
        },
        {
          label: "Client Satisfaction",
          value: "+45%",
          description: "Improvement in client satisfaction scores",
        },
        {
          label: "Appointment Efficiency",
          value: "30%",
          description: "More appointments handled with same staff",
        },
        {
          label: "Data Accuracy",
          value: "99.5%",
          description: "Patient record accuracy rate",
        },
      ],
    },

    testimonial: {
      quote:
        "OdisAI has been transformative for our practice. We've gone from drowning in paperwork to focusing on what really matters—providing exceptional care to our patients. Our team is happier, our clients are happier, and our business is thriving.",
      author: "Dr. Sarah Mitchell",
      role: "Owner & Head Veterinarian, Riverside Veterinary Clinic",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face&auto=format&q=80",
    },

    metaTitle:
      "Case Study: Riverside Veterinary Clinic Reduces Admin Time by 60% | OdisAI",
    metaDescription:
      "Discover how Riverside Veterinary Clinic transformed their multi-location practice with OdisAI, reducing administrative overhead by 60% and improving client satisfaction by 45%.",
    keywords: [
      "veterinary practice management",
      "case study",
      "practice automation",
      "multi-location veterinary",
      "OdisAI success story",
    ],
  },
  {
    id: "2",
    slug: "mountain-view-animal-hospital",
    title: "Scaling Excellence: Mountain View Animal Hospital's Growth Story",
    subtitle: "From single clinic to regional leader in 18 months",
    client: {
      name: "Mountain View Animal Hospital",
      industry: "Veterinary Medicine",
      location: "Denver, CO",
      size: "5 locations, 60 staff members",
    },
    summary:
      "Mountain View Animal Hospital leveraged OdisAI to scale from a single clinic to five locations while maintaining exceptional care quality and improving operational efficiency by 55%.",
    image:
      "https://images.unsplash.com/photo-1581594549595-35f6edc7b762?w=800&h=400&fit=crop&crop=center&auto=format&q=80",
    category: "Growth & Scaling",
    tags: ["Expansion", "Multi-Location", "Operational Excellence"],
    publishedAt: "2024-02-28",
    readTime: "6 min read",

    overview:
      "Mountain View Animal Hospital had built a strong reputation in their community, but growth was hampered by operational constraints. Their manual processes couldn't scale, and opening new locations seemed impossible without sacrificing quality or profit margins.",

    challenges: [
      {
        title: "Scalability Limitations",
        description:
          "Manual processes that worked for one location became bottlenecks when attempting to expand. Each new location required duplicating inefficient workflows.",
      },
      {
        title: "Quality Consistency",
        description:
          "Maintaining the same high standard of care across multiple locations was challenging without a unified system and standardized processes.",
      },
      {
        title: "Training and Onboarding",
        description:
          "Training new staff at each location took months due to complex, location-specific procedures and lack of standardized documentation.",
      },
    ],

    solutions: [
      {
        title: "Centralized Practice Management",
        description:
          "Implemented OdisAI as the central nervous system for all locations, providing real-time visibility and control across the entire practice network.",
        features: [
          "Unified patient database across all locations",
          "Centralized reporting and analytics",
          "Cloud-based access from anywhere",
        ],
      },
      {
        title: "Standardized Care Protocols",
        description:
          "Created and deployed consistent care protocols and workflows that could be easily replicated at new locations while allowing for local customization.",
        features: [
          "Digital care protocol templates",
          "Automated quality assurance checks",
          "Best practice sharing across locations",
        ],
      },
      {
        title: "Accelerated Training Platform",
        description:
          "Built a comprehensive training system within OdisAI that reduced onboarding time from months to weeks.",
        features: [
          "Interactive training modules",
          "Role-based learning paths",
          "Performance tracking and certification",
        ],
      },
    ],

    results: {
      overview:
        "OdisAI enabled Mountain View Animal Hospital to achieve aggressive growth targets while actually improving both quality metrics and profit margins.",
      metrics: [
        {
          label: "Locations Opened",
          value: "4 New",
          description: "In just 18 months",
        },
        {
          label: "Operational Efficiency",
          value: "+55%",
          description: "Improvement across all locations",
        },
        {
          label: "Training Time",
          value: "-70%",
          description: "Reduction in new staff onboarding time",
        },
        {
          label: "Revenue Growth",
          value: "+180%",
          description: "Year-over-year revenue increase",
        },
      ],
    },

    testimonial: {
      quote:
        "We wouldn't have been able to grow this fast without OdisAI. It's not just about automation—it's about having a system that scales with you while maintaining the quality and personal touch that makes our practice special.",
      author: "Dr. James Chen",
      role: "CEO, Mountain View Animal Hospital",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face&auto=format&q=80",
    },

    metaTitle:
      "Case Study: Mountain View Animal Hospital Scales to 5 Locations | OdisAI",
    metaDescription:
      "Learn how Mountain View Animal Hospital used OdisAI to scale from one clinic to five locations in 18 months, improving efficiency by 55% and revenue by 180%.",
    keywords: [
      "veterinary practice growth",
      "scaling veterinary business",
      "multi-location expansion",
      "practice management software",
      "OdisAI case study",
    ],
  },
  {
    id: "3",
    slug: "coastal-pet-care-center",
    title: "Improving Client Experience at Coastal Pet Care Center",
    subtitle: "How technology transformed client relationships and retention",
    client: {
      name: "Coastal Pet Care Center",
      industry: "Veterinary Medicine",
      location: "San Diego, CA",
      size: "2 locations, 18 staff members",
    },
    summary:
      "Coastal Pet Care Center used OdisAI to revolutionize their client experience, achieving a 92% client retention rate and increasing positive reviews by 300%.",
    image:
      "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&h=400&fit=crop&crop=center&auto=format&q=80",
    category: "Client Experience",
    tags: ["Client Satisfaction", "Retention", "Communication"],
    publishedAt: "2024-01-20",
    readTime: "4 min read",

    overview:
      "Coastal Pet Care Center recognized that in today's competitive market, excellent medical care alone isn't enough. Clients expect seamless communication, convenient access to information, and personalized service. They needed to modernize their client experience without increasing workload.",

    challenges: [
      {
        title: "Communication Gaps",
        description:
          "Clients often missed appointment reminders, follow-up instructions were lost, and staff spent hours on phone tag trying to reach pet owners.",
      },
      {
        title: "Limited Access to Records",
        description:
          "Pet owners had no way to access their pet's medical history, vaccination records, or upcoming appointments without calling the clinic during business hours.",
      },
      {
        title: "Generic Service Experience",
        description:
          "With hundreds of active clients, providing personalized service was nearly impossible. Each interaction felt transactional rather than relationship-building.",
      },
    ],

    solutions: [
      {
        title: "Automated Client Communication",
        description:
          "Implemented intelligent communication workflows that kept clients informed and engaged without adding staff workload.",
        features: [
          "Automated appointment reminders via SMS and email",
          "Post-visit follow-up messages",
          "Birthday and anniversary messages for pets",
        ],
      },
      {
        title: "Client Portal",
        description:
          "Launched a self-service portal where clients could access records, book appointments, and communicate with the practice 24/7.",
        features: [
          "Online appointment booking",
          "Access to medical records and test results",
          "Secure messaging with veterinary team",
        ],
      },
      {
        title: "Personalization Engine",
        description:
          "Used OdisAI's data insights to provide personalized care recommendations and communications based on each pet's history and needs.",
        features: [
          "Customized wellness reminders",
          "Breed-specific care tips",
          "Personalized service recommendations",
        ],
      },
    ],

    results: {
      overview:
        "By focusing on client experience, Coastal Pet Care Center not only improved satisfaction but also saw significant business growth.",
      metrics: [
        {
          label: "Client Retention",
          value: "92%",
          description: "Annual client retention rate",
        },
        {
          label: "Positive Reviews",
          value: "+300%",
          description: "Increase in 5-star reviews",
        },
        {
          label: "No-Show Rate",
          value: "-85%",
          description: "Reduction in missed appointments",
        },
        {
          label: "Client Referrals",
          value: "+120%",
          description: "Increase in word-of-mouth referrals",
        },
      ],
    },

    testimonial: {
      quote:
        "Our clients love the new experience. They can book appointments at midnight, check their pet's records from vacation, and they always know exactly when to come in for preventive care. It's made our practice more accessible while actually reducing our workload.",
      author: "Dr. Maria Rodriguez",
      role: "Practice Manager, Coastal Pet Care Center",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face&auto=format&q=80",
    },

    metaTitle:
      "Case Study: Coastal Pet Care Center Achieves 92% Client Retention | OdisAI",
    metaDescription:
      "See how Coastal Pet Care Center transformed their client experience with OdisAI, achieving 92% retention and increasing positive reviews by 300%.",
    keywords: [
      "veterinary client experience",
      "client retention",
      "practice management",
      "veterinary communication",
      "OdisAI success story",
    ],
  },
];

/**
 * Helper function to get a case study by slug
 */
export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}

/**
 * Helper function to get all case studies sorted by date
 */
export function getAllCaseStudies(): CaseStudy[] {
  return [...caseStudies].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/**
 * Helper function to get case studies by category
 */
export function getCaseStudiesByCategory(category: string): CaseStudy[] {
  return caseStudies.filter((study) => study.category === category);
}

/**
 * Helper function to get all unique categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(caseStudies.map((study) => study.category)));
}
