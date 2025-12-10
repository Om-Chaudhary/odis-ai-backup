/**
 * Cardiac Condition Knowledge Base
 *
 * Comprehensive knowledge base for heart conditions including heart murmurs,
 * CHF, arrhythmias, and other cardiovascular issues.
 */

import type { ConditionKnowledgeBase } from "../types";

export const cardiacKnowledge: ConditionKnowledgeBase = {
  conditionCategory: "cardiac",
  displayName: "Cardiac/Heart Issues",
  description:
    "Conditions affecting the cardiovascular system including heart murmurs, congestive heart failure, arrhythmias, and heart disease",

  keywords: [
    "heart",
    "cardiac",
    "murmur",
    "arrhythmia",
    "congestive",
    "chf",
    "heart failure",
    "cough",
    "fluid",
    "pulmonary edema",
    "mitral valve",
    "dcm",
    "cardiomyopathy",
  ],

  assessmentQuestions: [
    {
      question: `Has the coughing improved since starting the heart medication?`,
      context: "Coughing is a primary symptom of heart failure",
      expectedPositiveResponse: [
        "coughing less",
        "much better",
        "barely coughing",
        "improved",
        "stopped coughing",
      ],
      concerningResponses: [
        "still coughing a lot",
        "worse",
        "coughing more",
        "constant coughing",
        "no improvement",
      ],
      followUpIfConcerning: `Is the coughing worse at night or when {{petName}} is lying down? And is it a dry cough or does it sound wet?`,
      priority: 1,
      required: true,
    },
    {
      question: `How's {{petName}}'s breathing? Is it easier and more comfortable than before?`,
      context: "Breathing effort indicates heart function",
      expectedPositiveResponse: [
        "breathing easier",
        "more comfortable",
        "normal breathing",
        "improved",
      ],
      concerningResponses: [
        "labored breathing",
        "panting a lot",
        "struggling to breathe",
        "worse",
        "open mouth breathing",
      ],
      followUpIfConcerning: `Is {{petName}} breathing fast even at rest? Can you count how many breaths {{petName}} takes in one minute while sleeping? More than 30-40 is concerning.`,
      priority: 1,
      required: true,
    },
    {
      question: `How's {{petName}}'s energy level? Can {{petName}} walk or play without tiring quickly?`,
      context: "Exercise tolerance indicates cardiac output",
      expectedPositiveResponse: [
        "more energetic",
        "lasting longer",
        "playing more",
        "better stamina",
      ],
      concerningResponses: [
        "tires immediately",
        "can't walk far",
        "just wants to rest",
        "worse",
        "collapsing",
      ],
      followUpIfConcerning: `How far can {{petName}} walk before needing to stop? And does {{petName}} seem to struggle to catch {{petName}}'s breath afterward?`,
      priority: 2,
      required: true,
    },
    {
      question: `Is {{petName}} eating and drinking normally?`,
      context: "Appetite assessment for heart failure progression",
      expectedPositiveResponse: [
        "eating well",
        "good appetite",
        "drinking normally",
      ],
      concerningResponses: [
        "not eating",
        "refusing food",
        "only picks at food",
        "not drinking",
      ],
      followUpIfConcerning: `Has {{petName}}'s appetite been gradually declining, or did it suddenly stop? Loss of appetite can indicate worsening heart failure.`,
      priority: 2,
      required: false,
    },
    {
      question: `Have you noticed {{petName}} coughing more at night or early morning?`,
      context: "Nocturnal coughing is classic for heart disease",
      expectedPositiveResponse: [
        "no",
        "sleeping well",
        "not coughing at night",
      ],
      concerningResponses: [
        "yes",
        "wakes up coughing",
        "worst at night",
        "can't sleep",
      ],
      followUpIfConcerning: `Does {{petName}} need to change positions or get up to stop coughing?`,
      priority: 2,
      required: false,
    },
    {
      question: `Have you seen any fainting or collapsing episodes?`,
      context: "Syncope indicates arrhythmia or severe heart disease",
      expectedPositiveResponse: ["no", "no fainting", "hasn't collapsed"],
      concerningResponses: [
        "fainted",
        "collapsed",
        "fell over",
        "lost consciousness",
      ],
      followUpIfConcerning: `How long did the episode last? And did {{petName}} seem disoriented afterward? Fainting is an emergency with heart disease.`,
      priority: 1,
      required: false,
    },
    {
      question: `Are you giving the medications at the times we discussed?`,
      context: "Cardiac medication timing is critical",
      expectedPositiveResponse: [
        "yes",
        "on schedule",
        "following directions",
        "every dose",
      ],
      concerningResponses: [
        "missing doses",
        "not at the right times",
        "forgot",
      ],
      followUpIfConcerning: `Heart medications need to be given consistently at the same times each day. Can we help you set up a medication schedule or reminders?`,
      priority: 2,
      required: false,
    },
  ],

  normalPostTreatmentExpectations: [
    `Improvement in coughing within 3-5 days of starting medication`,
    `Increased urination is normal with diuretics (water pills)`,
    `Some decrease in energy is expected with heart disease`,
    `Gradual improvement in exercise tolerance over 1-2 weeks`,
    `Heart disease is managed, not cured - lifelong medication needed`,
    `Some coughing may persist even with treatment`,
  ],

  warningSignsToMonitor: [
    `Increased respiratory rate at rest (over 30-40 breaths per minute)`,
    `Labored or difficult breathing`,
    `Gums that are pale, blue, or purple`,
    `Fainting or collapse`,
    `Sudden inability to walk or stand`,
    `Refusing to lie down (may indicate fluid in lungs)`,
    `Coughing up pink, foamy fluid`,
    `No improvement in coughing after 5-7 days`,
    `Sudden loss of appetite`,
    `Weakness or lethargy`,
  ],

  emergencyCriteria: [
    `Severe difficulty breathing with blue gums`,
    `Coughing up pink, frothy fluid (pulmonary edema)`,
    `Collapse or fainting`,
    `Inability to breathe lying down`,
    `Open mouth breathing with severe distress`,
    `Respiratory rate over 60 breaths per minute`,
    `Loss of consciousness`,
  ],

  urgentCriteria: [
    `Increasing respiratory rate despite medication`,
    `Worsening cough despite treatment`,
    `New onset of fainting or weakness`,
    `Loss of appetite for more than 24 hours`,
    `Extreme lethargy`,
    `Pale or slightly blue gums`,
    `Coughing preventing sleep`,
    `No improvement after 7 days of medication`,
  ],

  typicalRecoveryDays: 7,

  commonMedications: [
    "furosemide",
    "lasix",
    "pimobendan",
    "vetmedin",
    "enalapril",
    "benazepril",
    "spironolactone",
    "atenolol",
    "diltiazem",
    "digoxin",
    "sildenafil",
  ],
};
