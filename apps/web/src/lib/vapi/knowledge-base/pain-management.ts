/**
 * Pain Management Knowledge Base
 *
 * Comprehensive knowledge base for pain management across various conditions,
 * focusing on pain assessment and medication effectiveness.
 */

import type { ConditionKnowledgeBase } from "../types";

export const painManagementKnowledge: ConditionKnowledgeBase = {
  conditionCategory: "pain-management",
  displayName: "Pain Management",
  description:
    "Pain management and assessment for various conditions, including chronic pain, acute pain, and post-operative pain",

  keywords: [
    "pain",
    "painful",
    "discomfort",
    "sore",
    "aching",
    "analgesic",
    "painkiller",
    "pain relief",
    "hurting",
  ],

  assessmentQuestions: [
    {
      question: `On a scale of how {{petName}} was before, would you say the pain seems better, about the same, or worse?`,
      context: "Subjective pain assessment",
      expectedPositiveResponse: [
        "better",
        "much improved",
        "seems comfortable",
        "way better",
      ],
      concerningResponses: [
        "worse",
        "same",
        "no improvement",
        "still in pain",
        "screaming",
      ],
      followUpIfConcerning: `Can you describe the signs of pain you're seeing? Like whining, reluctance to move, panting, or aggression when touched?`,
      priority: 1,
      required: true,
    },
    {
      question: `Is {{petName}} able to rest and sleep comfortably, or is pain keeping {{petName}} awake?`,
      context: "Sleep quality indicates pain control",
      expectedPositiveResponse: [
        "sleeping well",
        "resting comfortably",
        "able to sleep",
      ],
      concerningResponses: [
        "can't sleep",
        "restless",
        "pacing",
        "whining at night",
        "can't get comfortable",
      ],
      followUpIfConcerning: `Is {{petName}} unable to settle down at all, or just waking up frequently? Inability to rest means pain isn't controlled.`,
      priority: 1,
      required: true,
    },
    {
      question: `How's {{petName}}'s appetite? Eating normally or reluctant to eat?`,
      context: "Appetite is sensitive indicator of pain levels",
      expectedPositiveResponse: [
        "eating well",
        "good appetite",
        "finishing meals",
      ],
      concerningResponses: [
        "not eating",
        "only picking at food",
        "refuses to eat",
        "lost appetite",
      ],
      followUpIfConcerning: `Is {{petName}} interested in food but unable to eat, or showing no interest at all? Pain often causes loss of appetite.`,
      priority: 2,
      required: true,
    },
    {
      question: `Is {{petName}} more willing to move around and be active, or still reluctant?`,
      context: "Activity level indicates pain control",
      expectedPositiveResponse: [
        "more active",
        "moving around",
        "wanting to walk",
        "playing a bit",
      ],
      concerningResponses: [
        "won't move",
        "stays in one spot",
        "yelps when moving",
        "very reluctant",
      ],
      followUpIfConcerning: `Does {{petName}} cry or yelp when trying to move? This indicates significant pain.`,
      priority: 2,
      required: true,
    },
    {
      question: `Have you noticed any side effects from the pain medication like vomiting, diarrhea, or extreme sedation?`,
      context: "Monitoring for medication side effects",
      expectedPositiveResponse: ["no", "tolerating well", "no side effects"],
      concerningResponses: [
        "vomiting",
        "diarrhea",
        "black stool",
        "too sedated",
        "wobbly",
      ],
      followUpIfConcerning: `Black, tarry stools can indicate GI bleeding from NSAIDs - this is serious. Have you seen this?`,
      priority: 1,
      required: false,
    },
    {
      question: `Are you giving the pain medication with food as directed?`,
      context: "NSAIDs must be given with food",
      expectedPositiveResponse: ["yes", "with meals", "always with food"],
      concerningResponses: ["on empty stomach", "sometimes", "forgot"],
      followUpIfConcerning: `Pain medications, especially NSAIDs, must be given with food to protect the stomach. Can you make sure to do that from now on?`,
      priority: 2,
      required: false,
    },
    {
      question: `Is {{petName}} showing any behavioral changes like aggression or wanting to be left alone?`,
      context: "Behavioral changes indicate uncontrolled pain",
      expectedPositiveResponse: ["no", "acting normal", "same personality"],
      concerningResponses: [
        "aggressive",
        "snapping",
        "hiding",
        "won't let us touch",
      ],
      followUpIfConcerning: `Pain can make pets act aggressively when approached. Is this happening when you try to touch a specific area?`,
      priority: 2,
      required: false,
    },
  ],

  normalPostTreatmentExpectations: [
    `Pain relief should begin within 1-2 hours of medication`,
    `Full effect may take 24-48 hours`,
    `Some discomfort during healing is normal`,
    `Activity levels improve gradually as pain decreases`,
    `Appetite usually returns within 24 hours of good pain control`,
    `Some sedation from pain medications is expected`,
  ],

  warningSignsToMonitor: [
    `No improvement in pain after 24-48 hours of medication`,
    `Crying or screaming when touched`,
    `Complete refusal to move`,
    `Not eating or drinking for 24+ hours`,
    `Vomiting (especially if coffee-ground appearance)`,
    `Black, tarry stools (GI bleeding)`,
    `Extreme sedation or difficulty walking`,
    `Aggression when approached`,
  ],

  emergencyCriteria: [
    `Severe, uncontrollable pain despite maximum medication`,
    `Vomiting blood or coffee-ground material`,
    `Collapse or inability to stand`,
    `Seizures`,
    `Extreme distress with screaming`,
    `Blue or pale gums`,
  ],

  urgentCriteria: [
    `Pain not improving after 48 hours of medication`,
    `Persistent vomiting on pain medication`,
    `Black, tarry stools indicating GI bleeding`,
    `Unable to eat or drink for 24+ hours`,
    `Extreme lethargy`,
    `New onset of aggression`,
    `Signs of worsening pain`,
  ],

  typicalRecoveryDays: 5,

  commonMedications: [
    "carprofen",
    "rimadyl",
    "meloxicam",
    "galliprant",
    "onsior",
    "gabapentin",
    "tramadol",
    "buprenorphine",
    "fentanyl patch",
    "amantadine",
  ],
};
