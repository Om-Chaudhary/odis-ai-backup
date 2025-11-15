/**
 * Dental Condition Knowledge Base
 *
 * Comprehensive knowledge base for dental conditions including periodontal disease,
 * tooth extractions, broken teeth, and oral infections.
 */

import type { ConditionKnowledgeBase } from '../types';

export const dentalKnowledge: ConditionKnowledgeBase = {
  conditionCategory: 'dental',
  displayName: 'Dental/Oral Issues',
  description:
    'Conditions affecting teeth and mouth including periodontal disease, tooth extractions, broken teeth, oral infections, and gum disease',

  keywords: [
    'dental',
    'tooth',
    'teeth',
    'gum',
    'gums',
    'periodontal',
    'extraction',
    'broken tooth',
    'bad breath',
    'mouth',
    'oral',
    'jaw',
  ],

  assessmentQuestions: [
    {
      question: `How's {{petName}}'s appetite? Is {{petName}} eating normally now?`,
      context: 'Appetite indicates oral pain level',
      expectedPositiveResponse: [
        'eating well',
        'back to normal',
        'good appetite',
        'eating everything',
      ],
      concerningResponses: [
        'not eating',
        'only eating soft food',
        'dropping food',
        'refusing to eat',
        'chewing on one side',
      ],
      followUpIfConcerning: `Is {{petName}} interested in food but unable to eat it, or showing no interest at all? And does {{petName}} cry when trying to eat?`,
      priority: 1,
      required: true,
    },
    {
      question: `Is there any bleeding from the mouth, or has that stopped?`,
      context: 'Bleeding assessment for healing progress',
      expectedPositiveResponse: [
        'no bleeding',
        'stopped bleeding',
        'all healed',
      ],
      concerningResponses: [
        'still bleeding',
        'blood in water bowl',
        'blood on toys',
        'worse',
      ],
      followUpIfConcerning: `Is it fresh red blood or just a little pink tinge? And is it constant or just occasionally?`,
      priority: 1,
      required: true,
    },
    {
      question: `How do {{petName}}'s gums look where we did the procedure? Pink and healing, or red and swollen?`,
      context: 'Visual assessment of healing',
      expectedPositiveResponse: [
        'pink',
        'healing well',
        'looks good',
        'normal color',
      ],
      concerningResponses: [
        'very red',
        'swollen',
        'white or pale',
        'black',
        'oozing',
      ],
      followUpIfConcerning: `Is there any pus or discharge from the gums? And does it have an odor?`,
      priority: 2,
      required: true,
    },
    {
      question: `Is {{petName}} pawing at the mouth or face?`,
      context: 'Self-trauma indicates pain or discomfort',
      expectedPositiveResponse: [
        'no',
        'leaving it alone',
        'not bothered',
      ],
      concerningResponses: [
        'constantly pawing',
        'rubbing face',
        'scratching at mouth',
      ],
      followUpIfConcerning: `Is this preventing {{petName}} from eating or sleeping? We may need to adjust pain medication.`,
      priority: 2,
      required: false,
    },
    {
      question: `Is the bad breath improving, or does {{petName}}'s mouth still have a strong odor?`,
      context: 'Odor indicates infection or poor healing',
      expectedPositiveResponse: [
        'much better',
        'no odor',
        'normal breath',
        'improved',
      ],
      concerningResponses: [
        'terrible smell',
        'worse',
        'rotten odor',
        'very strong smell',
      ],
      followUpIfConcerning: `A foul odor can mean infection. Has this gotten worse since the procedure?`,
      priority: 2,
      required: false,
    },
    {
      question: `Are you able to give the pain medication and antibiotics as prescribed?`,
      context: 'Medication compliance for dental procedures',
      expectedPositiveResponse: [
        'yes',
        'every dose',
        'no problems',
        'taking well',
      ],
      concerningResponses: [
        'won\'t take it',
        'missing doses',
        'vomiting it up',
      ],
      followUpIfConcerning: `Would different medication flavoring or form help? We want to make sure {{petName}} gets pain control.`,
      priority: 2,
      required: false,
    },
    {
      question: `Is {{petName}} drinking water normally?`,
      context: 'Hydration assessment',
      expectedPositiveResponse: [
        'yes',
        'drinking normally',
        'good water intake',
      ],
      concerningResponses: [
        'not drinking',
        'refusing water',
        'messy drinking',
      ],
      followUpIfConcerning: `Is {{petName}} trying to drink but unable, or showing no interest? Dehydration can happen quickly.`,
      priority: 2,
      required: false,
    },
  ],

  normalPostTreatmentExpectations: [
    `Some bleeding for 12-24 hours after extractions is normal`,
    `Decreased appetite for 1-2 days post-procedure is expected`,
    `Mild swelling of gums for 2-3 days`,
    `Some discomfort when eating for first few days`,
    `Bad breath may worsen initially as mouth heals`,
    `Soft food diet may be needed for 5-7 days`,
    `Full healing of extraction sites takes 2-3 weeks`,
  ],

  warningSignsToMonitor: [
    `Refusing to eat for more than 24 hours`,
    `Continuous bleeding from mouth`,
    `Severe swelling of face or jaw`,
    `Foul odor from mouth worsening`,
    `Discharge or pus from extraction sites`,
    `Extreme lethargy`,
    `Difficulty breathing (rare but serious)`,
    `Fever (panting, warm to touch)`,
  ],

  emergencyCriteria: [
    `Severe facial swelling compromising breathing`,
    `Uncontrolled bleeding from mouth`,
    `Inability to close mouth (jaw fracture)`,
    `Extreme pain uncontrolled by medication`,
    `Collapse or severe weakness`,
    `Blue gums or difficulty breathing`,
  ],

  urgentCriteria: [
    `Not eating or drinking for 24+ hours`,
    `Persistent bleeding not stopping`,
    `Increasing facial swelling`,
    `Fever with lethargy`,
    `Foul discharge from extraction sites`,
    `Extreme pain despite medication`,
    `Vomiting after taking medications`,
  ],

  typicalRecoveryDays: 7,

  commonMedications: [
    'carprofen',
    'meloxicam',
    'gabapentin',
    'tramadol',
    'buprenorphine',
    'clavamox',
    'clindamycin',
    'metronidazole',
    'chlorhexidine rinse',
  ],
};
