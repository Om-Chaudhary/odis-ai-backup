/**
 * Urinary Condition Knowledge Base
 *
 * Comprehensive knowledge base for urinary tract conditions including UTIs,
 * bladder stones, crystals, incontinence, and kidney issues.
 */

import type { ConditionKnowledgeBase } from '../types';

export const urinaryKnowledge: ConditionKnowledgeBase = {
  conditionCategory: 'urinary',
  displayName: 'Urinary Tract Issues',
  description:
    'Conditions affecting the urinary system including UTIs, bladder stones, crystals, incontinence, and kidney disease',

  keywords: [
    'urin',
    'urinary',
    'bladder',
    'uti',
    'urinary tract infection',
    'kidney',
    'renal',
    'crystals',
    'stones',
    'incontinence',
    'leaking urine',
    'blood in urine',
    'hematuria',
    'straining',
    'frequent urination',
    'cystitis',
  ],

  assessmentQuestions: [
    {
      question: `Has the frequent urination improved since starting the medication?`,
      context: 'Primary symptom of UTI or bladder issues',
      expectedPositiveResponse: [
        'urinating normally now',
        'back to normal frequency',
        'much better',
        'not going as often',
        'improved',
      ],
      concerningResponses: [
        'still going constantly',
        'worse',
        'every few minutes',
        'no improvement',
        'accidents in the house',
      ],
      followUpIfConcerning: `About how often is {{petName}} trying to urinate? And is {{petName}} able to produce urine each time or just straining?`,
      priority: 1,
      required: true,
    },
    {
      question: `Is there still blood in the urine, or has that cleared up?`,
      context: 'Blood in urine indicates inflammation or infection severity',
      expectedPositiveResponse: [
        'no more blood',
        'clear urine',
        'back to normal color',
        'cleared up',
        'yellow now',
      ],
      concerningResponses: [
        'still bloody',
        'bright red',
        'dark red',
        'blood clots',
        'worse',
        'very dark',
      ],
      followUpIfConcerning: `Is the urine bright red, dark red, or just slightly pink? And is {{petName}} producing a good amount of urine or just drops?`,
      priority: 1,
      required: true,
    },
    {
      question: `Have you noticed {{petName}} straining or crying when trying to urinate?`,
      context: 'Pain/difficulty assessment - critical for obstruction detection',
      expectedPositiveResponse: [
        'no straining',
        'urin ating easily',
        'no pain',
        'going normally',
      ],
      concerningResponses: [
        'straining',
        'crying',
        'squatting but nothing comes out',
        'can\'t urinate',
        'only drips',
        'painful',
      ],
      followUpIfConcerning: `This is very important - is {{petName}} able to produce a steady stream of urine, or is it just drops or nothing at all? And when was the last time you saw {{petName}} urinate?`,
      priority: 1,
      required: true,
    },
    {
      question: `Is {{petName}} drinking more or less water than usual?`,
      context: 'Water intake changes indicate kidney function and hydration',
      expectedPositiveResponse: [
        'normal',
        'drinking normally',
        'back to usual',
      ],
      concerningResponses: [
        'drinking excessively',
        'constantly at the water bowl',
        'not drinking',
        'refusing water',
        'way more than normal',
      ],
      followUpIfConcerning: `Has the water bowl been needing to be refilled much more often than usual?`,
      priority: 2,
      required: true,
    },
    {
      question: `How's {{petName}}'s appetite and energy level?`,
      context: 'Systemic symptoms assessment',
      expectedPositiveResponse: [
        'eating well',
        'good energy',
        'active',
        'normal',
      ],
      concerningResponses: [
        'not eating',
        'very lethargic',
        'vomiting',
        'weak',
        'won\'t get up',
      ],
      followUpIfConcerning: `Has {{petName}} vomited at all? Kidney issues can sometimes cause nausea and vomiting.`,
      priority: 2,
      required: false,
    },
    {
      question: `Are you still seeing accidents in the house, or has {{petName}} been able to hold it better?`,
      context: 'Incontinence/urgency assessment',
      expectedPositiveResponse: [
        'no more accidents',
        'back to normal',
        'holding it fine',
        'housebroken again',
      ],
      concerningResponses: [
        'still having accidents',
        'can\'t hold it',
        'leaking constantly',
        'puddles while sleeping',
      ],
      followUpIfConcerning: `Is {{petName}} aware of the accidents, or is urine leaking out without {{petName}} seeming to notice?`,
      priority: 3,
      required: false,
    },
    {
      question: `Have you been giving the full course of antibiotics even if {{petName}} seems better?`,
      context: 'Medication compliance critical for UTIs',
      expectedPositiveResponse: [
        'yes',
        'every dose',
        'following instructions',
        'not missing any',
      ],
      concerningResponses: [
        'stopped',
        'missing doses',
        'seemed better so stopped',
        'ran out',
      ],
      followUpIfConcerning: `It's really important to finish the full course of antibiotics, even if {{petName}} seems better. UTIs can come back if we stop too early. How many days of medication do you have left?`,
      priority: 2,
      required: false,
    },
  ],

  normalPostTreatmentExpectations: [
    `Improvement in urination frequency within 24-48 hours of starting antibiotics`,
    `Blood in urine may take 3-5 days to completely resolve`,
    `Some urgency may persist for a few days even with improvement`,
    `Increased water drinking is normal initially as the body clears infection`,
    `Full resolution typically takes 5-7 days`,
    `Some pets may have dilute (very pale yellow) urine during treatment`,
  ],

  warningSignsToMonitor: [
    `Straining to urinate with little or no urine production`,
    `Inability to urinate for more than 12 hours`,
    `Blood clots in urine`,
    `Crying or severe pain when urinating`,
    `Vomiting (may indicate kidney involvement)`,
    `Extreme lethargy or weakness`,
    `Back pain or hunched posture`,
    `No improvement after 48-72 hours of antibiotics`,
    `Loss of appetite`,
    `Excessive water drinking (refilling bowl multiple times daily)`,
  ],

  emergencyCriteria: [
    `Complete inability to urinate (ESPECIALLY IN MALE CATS - life-threatening emergency)`,
    `Severe straining with no urine production for 6-12 hours`,
    `Vomiting with extreme lethargy (possible kidney failure)`,
    `Collapse or inability to stand`,
    `Severe abdominal pain with distended bladder`,
    `Large amounts of blood clots in urine`,
    `Seizures (rare but can occur with severe kidney disease)`,
  ],

  urgentCriteria: [
    `Persistent straining despite medication`,
    `Blood in urine not improving after 3-4 days of treatment`,
    `No improvement in urination frequency after 48 hours of antibiotics`,
    `Development of vomiting or diarrhea`,
    `Refusing to eat for more than 24 hours`,
    `Significantly increased water drinking`,
    `Accidents in the house getting worse instead of better`,
    `Signs of pain or discomfort`,
  ],

  typicalRecoveryDays: 5,

  commonMedications: [
    'amoxicillin',
    'clavamox',
    'cephalexin',
    'enrofloxacin',
    'baytril',
    'trimethoprim-sulfa',
    'phenoxybenzamine',
    'proin',
    'incurin',
    'prescription diet c/d',
    'prescription diet s/d',
    'cranberry supplements',
  ],
};
