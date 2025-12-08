/**
 * Endocrine Condition Knowledge Base
 *
 * Comprehensive knowledge base for endocrine/hormonal conditions including
 * diabetes, Cushing's, Addison's, thyroid disease, and other hormonal imbalances.
 */

import type { ConditionKnowledgeBase } from "../types";

export const endocrineKnowledge: ConditionKnowledgeBase = {
  conditionCategory: "endocrine",
  displayName: "Endocrine/Hormonal Issues",
  description:
    "Conditions affecting hormones and endocrine glands including diabetes, Cushing's disease, Addison's disease, and thyroid disorders",

  keywords: [
    "diabetes",
    "diabetic",
    "insulin",
    "blood sugar",
    "glucose",
    "cushing",
    "addison",
    "thyroid",
    "hypothyroid",
    "hyperthyroid",
    "endocrine",
    "hormone",
    "hormonal",
  ],

  assessmentQuestions: [
    {
      question: `How's {{petName}}'s water drinking - is it back to normal or still excessive?`,
      context: "Water intake is key indicator for diabetes and Cushing's",
      expectedPositiveResponse: [
        "back to normal",
        "drinking normal amounts",
        "much better",
        "not excessive",
      ],
      concerningResponses: [
        "still drinking a lot",
        "constantly at the bowl",
        "worse",
        "excessive",
        "won't stop drinking",
      ],
      followUpIfConcerning: `About how many times are you refilling the water bowl each day?`,
      priority: 1,
      required: true,
    },
    {
      question: `Is {{petName}} urinating more frequently, or has that improved?`,
      context:
        "Urination frequency correlates with water intake and disease control",
      expectedPositiveResponse: [
        "normal now",
        "back to usual",
        "much better",
        "not as often",
      ],
      concerningResponses: [
        "still going constantly",
        "accidents in the house",
        "every hour",
        "worse",
      ],
      followUpIfConcerning: `Is {{petName}} having accidents in the house, or needing to go out much more often than usual?`,
      priority: 1,
      required: true,
    },
    {
      question: `How's {{petName}}'s appetite - eating normally, more than usual, or less?`,
      context: "Appetite changes indicate hormone level control",
      expectedPositiveResponse: [
        "normal appetite",
        "eating normally",
        "back to usual",
      ],
      concerningResponses: [
        "ravenous",
        "constantly hungry",
        "not eating",
        "acting starved",
      ],
      followUpIfConcerning: `Is {{petName}} acting like {{petName}} is starving even right after eating?`,
      priority: 2,
      required: true,
    },
    {
      question: `How's {{petName}}'s energy level? More active or still lethargic?`,
      context: "Energy indicates thyroid and adrenal function",
      expectedPositiveResponse: [
        "more energetic",
        "back to normal",
        "active",
        "playful again",
      ],
      concerningResponses: [
        "very lethargic",
        "no energy",
        "just sleeping",
        "weak",
        "won't move",
      ],
      followUpIfConcerning: `Is this a sudden change in energy, or has it been gradual?`,
      priority: 2,
      required: false,
    },
    {
      question: `If {{petName}} is diabetic, are you able to give the insulin injections consistently?`,
      context: "Insulin compliance critical for diabetes management",
      expectedPositiveResponse: [
        "yes",
        "every dose",
        "same time each day",
        "no problems",
      ],
      concerningResponses: [
        "missing doses",
        "having trouble",
        "pet won't let me",
        "inconsistent",
      ],
      followUpIfConcerning: `Would it help if we showed you a different injection technique? Consistent dosing is really important for diabetes.`,
      priority: 1,
      required: false,
    },
    {
      question: `Have you noticed any changes in {{petName}}'s weight?`,
      context: "Weight changes common with endocrine diseases",
      expectedPositiveResponse: [
        "stable",
        "maintaining weight",
        "gaining appropriately",
      ],
      concerningResponses: [
        "losing weight",
        "gaining too much",
        "pot-bellied",
        "getting thin",
      ],
      followUpIfConcerning: `About how much weight has {{petName}} gained or lost? Rapid changes need evaluation.`,
      priority: 3,
      required: false,
    },
  ],

  normalPostTreatmentExpectations: [
    `Diabetes regulation can take 2-4 weeks`,
    `Thyroid medication takes 4-6 weeks to see full effect`,
    `Some increased drinking/urination may persist initially`,
    `Energy levels improve gradually over weeks`,
    `Cushing's treatment can take months to show full improvement`,
    `Weight changes occur slowly over weeks to months`,
    `Hair regrowth (if there was loss) can take 3-6 months`,
  ],

  warningSignsToMonitor: [
    `Sudden extreme weakness or collapse`,
    `Vomiting and refusing to eat (diabetic emergency)`,
    `Disorientation or seizures (blood sugar issues)`,
    `No improvement in drinking/urinating after 2-3 weeks`,
    `Progressive weakness`,
    `Rapid weight loss`,
    `Development of panting or restlessness (Cushing's)`,
  ],

  emergencyCriteria: [
    `Diabetic seizures or loss of consciousness`,
    `Addisonian crisis (collapse, vomiting, severe lethargy)`,
    `Extreme weakness with inability to stand`,
    `Disorientation or altered mental state`,
    `Severe vomiting with inability to give medications`,
    `Hypoglycemic seizure (especially in diabetics)`,
  ],

  urgentCriteria: [
    `Persistent vomiting preventing medication`,
    `Sudden increase in lethargy`,
    `Not eating for more than 24 hours (especially diabetics)`,
    `Significant increase in drinking/urinating despite treatment`,
    `Weight loss despite good appetite`,
    `Development of neurological signs (weakness, seizures)`,
  ],

  typicalRecoveryDays: 14,

  commonMedications: [
    "insulin",
    "vetsulin",
    "levothyroxine",
    "soloxine",
    "trilostane",
    "vetoryl",
    "methimazole",
    "prednisone",
    "fludrocortisone",
    "florinef",
  ],
};
