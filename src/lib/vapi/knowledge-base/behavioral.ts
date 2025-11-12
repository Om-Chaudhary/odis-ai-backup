/**
 * Behavioral Condition Knowledge Base
 *
 * Comprehensive knowledge base for behavioral issues including anxiety,
 * aggression, fear, separation anxiety, and compulsive behaviors.
 */

import type { ConditionKnowledgeBase } from '../types';

export const behavioralKnowledge: ConditionKnowledgeBase = {
  conditionCategory: 'behavioral',
  displayName: 'Behavioral Issues',
  description:
    'Behavioral concerns including anxiety, aggression, fear, separation anxiety, and compulsive behaviors',

  keywords: [
    'behavior',
    'behavioral',
    'anxiety',
    'anxious',
    'aggression',
    'aggressive',
    'fear',
    'fearful',
    'separation',
    'stress',
    'compulsive',
    'obsessive',
    'barking',
    'destructive',
    'pacing',
  ],

  assessmentQuestions: [
    {
      question: `Have you noticed any improvement in {{petName}}'s anxiety or stress behaviors since starting the medication?`,
      context: 'Primary indicator of anxiety medication effectiveness',
      expectedPositiveResponse: [
        'calmer',
        'less anxious',
        'more relaxed',
        'improved',
        'less stressed',
      ],
      concerningResponses: [
        'worse',
        'no improvement',
        'more anxious',
        'still very stressed',
        'no change',
      ],
      followUpIfConcerning: `What specific behaviors are you still seeing? And are they happening more or less frequently than before?`,
      priority: 1,
      required: true,
    },
    {
      question: `How's {{petName}} doing when left alone? Less destructive or still having issues?`,
      context: 'Separation anxiety assessment',
      expectedPositiveResponse: [
        'doing better',
        'less destructive',
        'calmer',
        'not destroying things',
      ],
      concerningResponses: [
        'still destroying things',
        'worse',
        'scratching at doors',
        'constant barking',
        'hurting self',
      ],
      followUpIfConcerning: `Is {{petName}} injuring themselves (broken nails, bloody mouth from chewing)? This would be severe separation anxiety.`,
      priority: 1,
      required: true,
    },
    {
      question: `Is {{petName}} eating and drinking normally?`,
      context: 'Appetite indicates stress levels and medication tolerance',
      expectedPositiveResponse: [
        'yes',
        'eating well',
        'normal appetite',
      ],
      concerningResponses: [
        'not eating',
        'refusing food',
        'only eating sometimes',
        'lost appetite',
      ],
      followUpIfConcerning: `Has {{petName}} lost interest in favorite foods or treats? Severe stress can cause appetite loss.`,
      priority: 2,
      required: false,
    },
    {
      question: `Are there any side effects from the medication you've noticed - like sedation, wobbliness, or changes in personality?`,
      context: 'Behavioral medication side effects monitoring',
      expectedPositiveResponse: [
        'no side effects',
        'seems normal',
        'tolerating well',
      ],
      concerningResponses: [
        'very sedated',
        'zombie-like',
        'wobbly',
        'personality changed',
        'aggressive',
      ],
      followUpIfConcerning: `Can you describe the personality change? We may need to adjust the dosage if {{petName}} is too sedated.`,
      priority: 2,
      required: false,
    },
    {
      question: `Have you been able to work on the behavior modification techniques we discussed?`,
      context: 'Compliance with behavioral training',
      expectedPositiveResponse: [
        'yes',
        'working on it',
        'practicing daily',
      ],
      concerningResponses: [
        'haven\'t had time',
        'too difficult',
        'not sure how',
      ],
      followUpIfConcerning: `Medication works best when combined with training. Would it help to connect you with a trainer or behaviorist?`,
      priority: 3,
      required: false,
    },
    {
      question: `How's {{petName}}'s sleep? Resting normally or still restless and pacing?`,
      context: 'Sleep quality indicates anxiety levels',
      expectedPositiveResponse: [
        'sleeping well',
        'resting',
        'calm at night',
      ],
      concerningResponses: [
        'pacing all night',
        'can\'t settle',
        'constant restlessness',
        'not sleeping',
      ],
      followUpIfConcerning: `Is this keeping you awake as well? Poor sleep makes anxiety worse.`,
      priority: 2,
      required: false,
    },
  ],

  normalPostTreatmentExpectations: [
    `Behavioral medications can take 4-6 weeks to show full effect`,
    `Some initial sedation or lethargy is normal in first week`,
    `Behaviors will improve gradually, not overnight`,
    `Combination of medication and training gives best results`,
    `Some behaviors may persist even with treatment`,
    `Long-term treatment may be needed for chronic anxiety`,
  ],

  warningSignsToMonitor: [
    `Extreme sedation or difficulty walking`,
    `Aggressive behavior developing or worsening`,
    `Complete loss of appetite`,
    `Self-injurious behavior (chewing to point of injury)`,
    `No improvement after 6-8 weeks of treatment`,
    `Personality changes that are concerning`,
    `Seizures (rare side effect of some medications)`,
  ],

  emergencyCriteria: [
    `Seizures`,
    `Severe aggression toward people or other pets`,
    `Self-mutilation causing serious injury`,
    `Complete inability to function (extreme sedation)`,
    `Collapse or loss of consciousness`,
  ],

  urgentCriteria: [
    `Worsening aggression despite treatment`,
    `Self-injurious behavior`,
    `Not eating for 24+ hours`,
    `Extreme sedation interfering with normal activities`,
    `Development of new concerning behaviors`,
    `No improvement after 8 weeks of treatment`,
  ],

  typicalRecoveryDays: 28,

  commonMedications: [
    'fluoxetine',
    'prozac',
    'trazodone',
    'clomicalm',
    'clomipramine',
    'alprazolam',
    'xanax',
    'gabapentin',
    'sileo',
    'acepromazine',
    'clonidine',
  ],
};
