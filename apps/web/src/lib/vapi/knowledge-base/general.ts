/**
 * General Condition Knowledge Base
 *
 * Fallback knowledge base for conditions that don't fit into specific categories.
 * Provides general wellness and recovery assessment questions.
 */

import type { ConditionKnowledgeBase } from "../types";

export const generalKnowledge: ConditionKnowledgeBase = {
  conditionCategory: "general",
  displayName: "General Follow-Up",
  description:
    "General wellness follow-up for conditions not fitting specific categories or multi-system issues",

  keywords: [],

  assessmentQuestions: [
    {
      question: `Overall, how is {{petName}} doing compared to when we first saw {{petName}}?`,
      context: "General progress assessment",
      expectedPositiveResponse: [
        "better",
        "improved",
        "doing well",
        "much better",
        "back to normal",
      ],
      concerningResponses: [
        "worse",
        "no improvement",
        "declining",
        "same",
        "getting worse",
      ],
      followUpIfConcerning: `Can you describe what's concerning you most about {{petName}}'s condition?`,
      priority: 1,
      required: true,
    },
    {
      question: `How's {{petName}}'s appetite and energy level?`,
      context: "Basic wellness indicators",
      expectedPositiveResponse: [
        "eating well",
        "good energy",
        "active",
        "normal",
      ],
      concerningResponses: [
        "not eating",
        "lethargic",
        "weak",
        "no appetite",
        "no energy",
      ],
      followUpIfConcerning: `Is this a sudden change or gradual? And is {{petName}} drinking water normally?`,
      priority: 1,
      required: true,
    },
    {
      question: `Have you been able to give the medications as prescribed?`,
      context: "Medication compliance",
      expectedPositiveResponse: [
        "yes",
        "every dose",
        "no problems",
        "following directions",
      ],
      concerningResponses: [
        "missing doses",
        "having trouble",
        "pet won't take it",
        "ran out",
      ],
      followUpIfConcerning: `What's making it difficult to give the medication? We can help with techniques or different formulations.`,
      priority: 2,
      required: true,
    },
    {
      question: `Are there any new symptoms or concerns that have developed since the visit?`,
      context: "Identify new issues or complications",
      expectedPositiveResponse: [
        "no",
        "nothing new",
        "everything else is fine",
      ],
      concerningResponses: ["yes", "new symptoms", "something else wrong"],
      followUpIfConcerning: `Can you describe the new symptoms you're seeing? When did they start?`,
      priority: 2,
      required: true,
    },
    {
      question: `Is {{petName}} eating and drinking normally?`,
      context: "Basic physiological function",
      expectedPositiveResponse: ["yes", "normally", "good intake"],
      concerningResponses: [
        "not eating",
        "not drinking",
        "very little",
        "refusing",
      ],
      followUpIfConcerning: `How long has it been since {{petName}} ate or drank? Prolonged refusal needs evaluation.`,
      priority: 2,
      required: false,
    },
    {
      question: `Are {{petName}}'s bathroom habits normal - urinating and defecating regularly?`,
      context: "Elimination assessment",
      expectedPositiveResponse: ["yes", "normal", "regular", "no problems"],
      concerningResponses: [
        "not urinating",
        "not defecating",
        "straining",
        "diarrhea",
        "accidents",
      ],
      followUpIfConcerning: `Which is the issue - urination or defecation? And for how long has this been a problem?`,
      priority: 3,
      required: false,
    },
    {
      question: `Do you have any questions or concerns about {{petName}}'s recovery?`,
      context: "Open-ended owner concerns",
      expectedPositiveResponse: ["no", "everything seems fine", "no concerns"],
      concerningResponses: ["yes", "worried about", "concerned"],
      followUpIfConcerning: `What are you most concerned about? Let's discuss that.`,
      priority: 3,
      required: false,
    },
  ],

  normalPostTreatmentExpectations: [
    `Gradual improvement over several days is typical`,
    `Some ups and downs during recovery are normal`,
    `Full recovery timeline varies by condition`,
    `Appetite may take a day or two to normalize`,
    `Energy levels improve as condition resolves`,
    `Some residual symptoms may persist briefly after treatment ends`,
  ],

  warningSignsToMonitor: [
    `Worsening of original symptoms`,
    `Development of new concerning symptoms`,
    `Loss of appetite for more than 24 hours`,
    `Extreme lethargy or weakness`,
    `Vomiting or diarrhea`,
    `Difficulty breathing`,
    `Pain or discomfort`,
    `No improvement after several days of treatment`,
  ],

  emergencyCriteria: [
    `Collapse or inability to stand`,
    `Difficulty breathing`,
    `Seizures`,
    `Uncontrolled bleeding`,
    `Severe pain`,
    `Loss of consciousness`,
    `Blue or white gums`,
    `Inability to urinate (especially male cats)`,
  ],

  urgentCriteria: [
    `Persistent vomiting or diarrhea`,
    `Not eating or drinking for 24+ hours`,
    `Significant lethargy`,
    `New or worsening symptoms`,
    `Signs of pain`,
    `No improvement after 5-7 days of treatment`,
    `Difficulty with elimination (urination or defecation)`,
  ],

  typicalRecoveryDays: 7,

  commonMedications: [
    // General medications that could apply across conditions
    "antibiotics",
    "pain medication",
    "anti-inflammatory",
    "supportive care",
  ],
};
