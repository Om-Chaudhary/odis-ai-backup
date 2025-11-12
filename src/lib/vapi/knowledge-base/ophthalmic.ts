/**
 * Ophthalmic Condition Knowledge Base
 *
 * Comprehensive knowledge base for eye conditions including conjunctivitis,
 * corneal ulcers, glaucoma, cataracts, and other eye issues.
 */

import type { ConditionKnowledgeBase } from '../types';

export const ophthalmicKnowledge: ConditionKnowledgeBase = {
  conditionCategory: 'ophthalmic',
  displayName: 'Eye/Vision Issues',
  description:
    'Conditions affecting the eyes including conjunctivitis, corneal ulcers, glaucoma, cataracts, and dry eye',

  keywords: [
    'eye',
    'eyes',
    'ophthalm',
    'vision',
    'cornea',
    'corneal',
    'conjunctivitis',
    'pink eye',
    'ulcer',
    'cataract',
    'glaucoma',
    'discharge',
    'squinting',
    'red eye',
    'cloudy eye',
    'blind',
    'vision loss',
    'dry eye',
  ],

  assessmentQuestions: [
    {
      question: `Is the redness in {{petName}}'s eye improving with the medication?`,
      context: 'Primary visual indicator of eye inflammation',
      expectedPositiveResponse: [
        'less red',
        'clearing up',
        'white now',
        'much better',
        'almost back to normal',
      ],
      concerningResponses: [
        'still very red',
        'worse',
        'bloodshot',
        'no improvement',
        'getting redder',
      ],
      followUpIfConcerning: `Is the entire white of the eye red, or is it just around the edges? And is there any bleeding visible in the eye?`,
      priority: 1,
      required: true,
    },
    {
      question: `Is there still discharge coming from the eye, or has that improved?`,
      context: 'Discharge indicates infection or irritation severity',
      expectedPositiveResponse: [
        'no more discharge',
        'much less',
        'clearing up',
        'almost gone',
        'clear discharge only',
      ],
      concerningResponses: [
        'thick green discharge',
        'yellow pus',
        'worse',
        'constant discharge',
        'crusty',
      ],
      followUpIfConcerning: `What color is the discharge - clear, white, yellow, or green? And do you have to wipe it away multiple times per day?`,
      priority: 1,
      required: true,
    },
    {
      question: `Is {{petName}} still squinting or keeping the eye closed?`,
      context: 'Squinting indicates pain in the eye',
      expectedPositiveResponse: [
        'eye is open',
        'not squinting',
        'both eyes open',
        'looks comfortable',
      ],
      concerningResponses: [
        'still squinting',
        'eye shut tight',
        'can\'t open it',
        'worse',
        'both eyes squinting now',
      ],
      followUpIfConcerning: `Is {{petName}} able to open the eye at all, or is it staying completely shut? Persistent squinting means the eye is painful.`,
      priority: 1,
      required: true,
    },
    {
      question: `Have you been able to get the eye drops or ointment in {{petName}}'s eye as directed?`,
      context: 'Medication compliance is critical for eye issues',
      expectedPositiveResponse: [
        'yes',
        'getting them in',
        'every dose',
        'following directions',
      ],
      concerningResponses: [
        'having trouble',
        'can\'t get them in',
        'pet won\'t let me',
        'missing doses',
      ],
      followUpIfConcerning: `Would it help if we showed you a technique for giving the drops? Or would you like to bring {{petName}} in for us to help?`,
      priority: 2,
      required: false,
    },
    {
      question: `Do you notice any cloudiness or haziness in the eye?`,
      context: 'Cloudiness can indicate corneal ulcer or glaucoma',
      expectedPositiveResponse: [
        'clear',
        'no cloudiness',
        'looks normal',
        'clearing up',
      ],
      concerningResponses: [
        'cloudy',
        'hazy',
        'blue-ish',
        'white spot',
        'getting cloudier',
      ],
      followUpIfConcerning: `Where is the cloudiness - across the entire eye or in one spot? And is it getting worse or better?`,
      priority: 2,
      required: false,
    },
    {
      question: `Is {{petName}} still rubbing or pawing at the eye?`,
      context: 'Self-trauma can worsen eye conditions',
      expectedPositiveResponse: [
        'not rubbing',
        'leaving it alone',
        'stopped',
      ],
      concerningResponses: [
        'constantly rubbing',
        'pawing at it',
        'rubbing on furniture',
        'can\'t stop',
      ],
      followUpIfConcerning: `Is {{petName}} causing more damage by rubbing? We might need to use an e-collar to protect the eye.`,
      priority: 3,
      required: false,
    },
    {
      question: `Does the eye appear to be the same size as the other eye, or does one look larger?`,
      context: 'Eye enlargement can indicate glaucoma',
      expectedPositiveResponse: [
        'same size',
        'normal',
        'both look the same',
      ],
      concerningResponses: [
        'one looks bigger',
        'bulging',
        'swollen',
        'different sizes',
      ],
      followUpIfConcerning: `A bulging or enlarged eye can be a sign of glaucoma, which is an emergency. Which eye looks larger?`,
      priority: 1,
      required: false,
    },
  ],

  normalPostTreatmentExpectations: [
    `Redness should improve within 24-48 hours of starting medication`,
    `Some mild discharge during healing is normal`,
    `Complete resolution of conjunctivitis takes 5-7 days`,
    `Corneal ulcers may take 7-14 days to fully heal`,
    `Some cloudiness may persist during healing`,
    `Squinting should improve within 24 hours if medication is working`,
    `Dry eye is a chronic condition requiring lifelong treatment`,
  ],

  warningSignsToMonitor: [
    `Persistent squinting despite medication`,
    `Eye becoming more cloudy or hazy`,
    `Thick yellow or green discharge not improving`,
    `Eye appearing to bulge or enlarge`,
    `Development of a blue or white film over the eye`,
    `No improvement after 48-72 hours of medication`,
    `Both eyes becoming affected`,
    `Loss of vision (bumping into things)`,
    `Extreme sensitivity to light`,
  ],

  emergencyCriteria: [
    `Sudden onset of a very large, bulging eye (acute glaucoma)`,
    `Obvious penetrating injury to the eye`,
    `Eye prolapsed out of socket (proptosis)`,
    `Severe pain with inability to open eye despite medication`,
    `Rapid vision loss in both eyes`,
    `Chemical burn to the eye`,
  ],

  urgentCriteria: [
    `Corneal ulcer not healing after 5-7 days`,
    `New cloudiness developing`,
    `Persistent squinting despite 48 hours of medication`,
    `Thick discharge worsening`,
    `Eye remaining shut tight`,
    `Development of blood in the eye`,
    `Vision changes (bumping into things)`,
    `Both eyes now affected when it was only one`,
  ],

  typicalRecoveryDays: 7,

  commonMedications: [
    'neopolybac',
    'triple antibiotic ointment',
    'gentamicin',
    'ciprofloxacin',
    'ofloxacin',
    'erythromycin',
    'terramycin',
    'optixcare',
    'tacrolimus',
    'cyclosporine',
    'artificial tears',
    'dorzolamide',
    'timolol',
    'atropine',
  ],
};
