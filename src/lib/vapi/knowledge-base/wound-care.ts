/**
 * Wound Care Knowledge Base
 *
 * Comprehensive knowledge base for wound management including lacerations,
 * abscesses, bite wounds, and traumatic injuries.
 */

import type { ConditionKnowledgeBase } from '../types';

export const woundCareKnowledge: ConditionKnowledgeBase = {
  conditionCategory: 'wound-care',
  displayName: 'Wound Care/Trauma',
  description:
    'Management of wounds including lacerations, punctures, abscesses, bite wounds, and traumatic injuries',

  keywords: [
    'wound',
    'laceration',
    'cut',
    'abscess',
    'bite',
    'puncture',
    'injury',
    'trauma',
    'drain',
    'stitches',
    'sutures',
  ],

  assessmentQuestions: [
    {
      question: `How's the wound looking? Is it healing well or does it look red and swollen?`,
      context: 'Visual assessment of wound healing',
      expectedPositiveResponse: [
        'healing well',
        'looks good',
        'getting better',
        'closing up',
        'pink and healthy',
      ],
      concerningResponses: [
        'very red',
        'swollen',
        'oozing',
        'pus',
        'opening up',
        'getting worse',
        'black edges',
      ],
      followUpIfConcerning: `Is there any discharge from the wound? What color is it - clear, yellow, green, or bloody?`,
      priority: 1,
      required: true,
    },
    {
      question: `Is there any discharge or drainage from the wound?`,
      context: 'Discharge indicates infection or abscess',
      expectedPositiveResponse: [
        'no',
        'dried up',
        'maybe a little clear fluid',
        'almost stopped',
      ],
      concerningResponses: [
        'yes',
        'pus',
        'green discharge',
        'yellow discharge',
        'bloody',
        'foul smell',
      ],
      followUpIfConcerning: `Does the discharge have an odor? And about how much - a little or a lot?`,
      priority: 1,
      required: true,
    },
    {
      question: `Is {{petName}} leaving the wound alone, or trying to lick or chew at it?`,
      context: 'Self-trauma can prevent healing and cause infection',
      expectedPositiveResponse: [
        'leaving it alone',
        'e-collar working',
        'not bothered by it',
      ],
      concerningResponses: [
        'constantly licking',
        'chewing at it',
        'removed stitches',
        'took off bandage',
      ],
      followUpIfConcerning: `Has {{petName}} been able to damage the wound or remove any stitches? We may need a better e-collar.`,
      priority: 1,
      required: true,
    },
    {
      question: `If there's a drain in place, is it still producing fluid?`,
      context: 'Drain assessment for abscess management',
      expectedPositiveResponse: [
        'less drainage',
        'almost dry',
        'minimal',
      ],
      concerningResponses: [
        'lots of drainage',
        'drain fell out',
        'same amount',
        'more than before',
      ],
      followUpIfConcerning: `If the drain fell out, when did that happen? And is the area swelling up where the drain was?`,
      priority: 2,
      required: false,
    },
    {
      question: `How's {{petName}}'s appetite and energy level?`,
      context: 'Systemic signs of infection',
      expectedPositiveResponse: [
        'eating well',
        'normal energy',
        'active',
      ],
      concerningResponses: [
        'not eating',
        'very lethargic',
        'weak',
        'won\'t get up',
      ],
      followUpIfConcerning: `Is this a sudden change, or has it been gradual? Sudden lethargy with wounds can mean infection is spreading.`,
      priority: 2,
      required: false,
    },
    {
      question: `Are you able to keep the wound clean and do the bandage changes as directed?`,
      context: 'Wound care compliance',
      expectedPositiveResponse: [
        'yes',
        'doing the changes',
        'keeping it clean',
      ],
      concerningResponses: [
        'having trouble',
        'pet won\'t let me',
        'not changing bandage',
      ],
      followUpIfConcerning: `Would it help if we scheduled appointments for bandage changes here at the clinic?`,
      priority: 3,
      required: false,
    },
    {
      question: `Is the area around the wound warm to the touch or does it feel normal temperature?`,
      context: 'Heat indicates inflammation or infection',
      expectedPositiveResponse: [
        'normal temperature',
        'not hot',
        'feels normal',
      ],
      concerningResponses: [
        'very warm',
        'hot',
        'warmer than other areas',
      ],
      followUpIfConcerning: `Is the warm area spreading or staying in one spot?`,
      priority: 2,
      required: false,
    },
  ],

  normalPostTreatmentExpectations: [
    `Some clear fluid drainage for first 24-48 hours is normal`,
    `Mild swelling and redness around wound edges initially`,
    `Small amount of bruising may develop`,
    `Scab formation is normal part of healing`,
    `Some discomfort for first few days`,
    `Full healing of wounds takes 10-14 days`,
    `Hair may not grow back over scars`,
  ],

  warningSignsToMonitor: [
    `Increasing redness spreading from wound`,
    `Green or yellow discharge (pus)`,
    `Foul odor from wound`,
    `Wound opening or stitches coming apart`,
    `Significant swelling`,
    `Hot to touch`,
    `Drain falling out prematurely`,
    `Fever (panting, lethargy)`,
    `Loss of appetite`,
    `Spreading red streaks from wound`,
  ],

  emergencyCriteria: [
    `Large amounts of bleeding that won't stop`,
    `Wound completely opening with tissue exposure`,
    `Signs of shock (pale gums, weakness, rapid breathing)`,
    `Severe systemic infection (fever, collapse, extreme lethargy)`,
    `Extensive swelling compromising circulation`,
  ],

  urgentCriteria: [
    `Persistent oozing of pus`,
    `Wound opening partially`,
    `Increasing pain despite medication`,
    `Fever with lethargy`,
    `Not eating for 24+ hours`,
    `Drain falling out before scheduled removal`,
    `Foul smell developing`,
    `Rapid spreading of redness`,
  ],

  typicalRecoveryDays: 10,

  commonMedications: [
    'cephalexin',
    'clavamox',
    'clindamycin',
    'metronidazole',
    'carprofen',
    'meloxicam',
    'gabapentin',
    'tramadol',
    'chlorhexidine',
    'silver sulfadiazine',
  ],
};
