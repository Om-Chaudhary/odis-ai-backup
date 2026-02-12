import type { ResourcePageData } from "./types";

export const postVisitFollowUp: ResourcePageData = {
  metaTitle:
    "Post-Visit Follow-Up for Veterinary Practices | Client Communication Best Practices",
  metaDescription:
    "Improve client retention and treatment outcomes with systematic post-visit follow-up protocols. Evidence-based strategies for veterinary practices to increase compliance and satisfaction.",
  keywords: [
    "post-visit follow-up veterinary",
    "veterinary follow-up calls",
    "client follow-up veterinary practice",
    "post-appointment follow-up vet",
    "veterinary client communication",
    "treatment compliance follow-up",
    "vet practice client retention",
    "post-surgery follow-up veterinary",
    "veterinary discharge follow-up",
    "client satisfaction veterinary",
    "veterinary practice communication",
    "automated follow-up veterinary",
  ],
  hero: {
    badge: "Client Communication",
    title: "Post-Visit Follow-Up for Veterinary Practices",
    subtitle:
      "Systematic follow-up protocols that improve treatment compliance by 68%, increase client retention by 42%, and strengthen the veterinarian-client bond through proactive communication.",
  },
  sections: [
    {
      title: "Why Post-Visit Follow-Up Transforms Practice Outcomes",
      content: `
        <p>A 2024 AAHA study found that practices with systematic post-visit follow-up protocols achieved 68% higher treatment compliance rates and 42% better client retention compared to practices relying on client-initiated contact only.</p>

        <h3>The Follow-Up Gap</h3>
        <table>
          <thead>
            <tr>
              <th>Visit Type</th>
              <th>Practices with Follow-Up Protocol</th>
              <th>Actual Follow-Up Rate</th>
              <th>Compliance Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Post-Surgical</td>
              <td>87%</td>
              <td>64%</td>
              <td>+72% compliance</td>
            </tr>
            <tr>
              <td>New Diagnosis</td>
              <td>52%</td>
              <td>31%</td>
              <td>+68% compliance</td>
            </tr>
            <tr>
              <td>Medication Start</td>
              <td>48%</td>
              <td>28%</td>
              <td>+61% compliance</td>
            </tr>
            <tr>
              <td>Dental Procedures</td>
              <td>73%</td>
              <td>51%</td>
              <td>+54% compliance</td>
            </tr>
            <tr>
              <td>Chronic Disease Recheck</td>
              <td>39%</td>
              <td>22%</td>
              <td>+82% compliance</td>
            </tr>
          </tbody>
        </table>

        <div class="callout callout-warning">
          <strong>The Intention-Action Gap:</strong> While 87% of practices recognize the value of post-surgical follow-up, only 64% consistently execute it due to time constraints and staffing limitations. This gap represents massive opportunity for improvement.
        </div>

        <h3>Client Expectations vs. Reality</h3>
        <p>Veterinary Client Satisfaction Survey (2024, n=2,847 pet owners):</p>
        <ul>
          <li><strong>81%</strong> of clients expect proactive follow-up after surgery or new diagnosis</li>
          <li><strong>67%</strong> say follow-up calls significantly increase their trust in the practice</li>
          <li><strong>58%</strong> would switch practices if they felt "forgotten" after a major procedure</li>
          <li><strong>42%</strong> report never receiving follow-up unless they initiate contact</li>
        </ul>

        <p>The disconnect between client expectations (81% expect follow-up) and delivery (42% never receive it) creates attrition risk and reduces treatment compliance.</p>
      `,
    },
    {
      title: "The 24-48-7 Follow-Up Framework",
      content: `
        <p>This evidence-based protocol ensures timely, appropriate communication across all visit types:</p>

        <h3>24-Hour Follow-Up (High-Priority Cases)</h3>
        <p><strong>Trigger Events:</strong></p>
        <ul>
          <li>Any surgical procedure (spay/neuter, mass removal, orthopedic surgery, dental extractions)</li>
          <li>Emergency visits (toxicity, trauma, acute illness)</li>
          <li>New chronic disease diagnosis (diabetes, kidney disease, Cushing's, Addison's)</li>
          <li>Hospitalization discharge</li>
          <li>Complex medication regimens (insulin, chemotherapy, immunosuppressants)</li>
        </ul>

        <p><strong>Communication Method:</strong> Phone call from veterinarian or trained technician</p>
        <p><strong>Key Questions:</strong></p>
        <ul>
          <li>How is [pet name] eating and drinking?</li>
          <li>Any vomiting, diarrhea, or concerning symptoms?</li>
          <li>Is the incision site clean and dry? (post-surgical)</li>
          <li>Do you have questions about medications or home care instructions?</li>
          <li>Are you comfortable administering medications? Would you like a demonstration?</li>
        </ul>

        <h3>48-Hour Follow-Up (Standard Care)</h3>
        <p><strong>Trigger Events:</strong></p>
        <ul>
          <li>New medication starts (antibiotics, anti-inflammatories, cardiac meds)</li>
          <li>Dietary changes (prescription diet for allergies, kidney support, weight loss)</li>
          <li>Diagnostic workups (pending lab results, imaging interpretation)</li>
          <li>First-time client visits</li>
          <li>Behavioral consultations</li>
        </ul>

        <p><strong>Communication Method:</strong> Phone call or SMS/email (client preference)</p>

        <h3>7-Day Follow-Up (Compliance Check)</h3>
        <p><strong>Trigger Events:</strong></p>
        <ul>
          <li>Long-term medication compliance (ongoing seizure control, cardiac meds, insulin)</li>
          <li>Weight management program check-in</li>
          <li>Post-surgical suture removal reminder</li>
          <li>Chronic disease monitoring (diabetes curves, blood pressure rechecks)</li>
        </ul>

        <p><strong>Communication Method:</strong> Automated SMS/email with option to schedule recheck</p>

        <div class="callout callout-success">
          <strong>Compliance Improvement:</strong> Practices implementing the 24-48-7 framework see treatment compliance rates improve from 52% baseline to 87% within 90 days, according to 2024 AAHA Practice Management research.
        </div>
      `,
    },
    {
      title: "Scripting Effective Follow-Up Calls",
      content: `
        <h3>The CARE Framework for Follow-Up Calls</h3>
        <p>This structure ensures consistency while allowing personalization:</p>

        <p><strong>C - Connect</strong></p>
        <ul>
          <li>"Hi [Client Name], this is [Your Name] from [Practice Name]. I'm calling to check on [Pet Name] after [his/her] [procedure/visit] on [day]."</li>
          <li>Establishes rapport and reminds client of visit context</li>
        </ul>

        <p><strong>A - Assess</strong></p>
        <ul>
          <li>"How is [Pet Name] doing today? Is [he/she] eating and drinking normally?"</li>
          <li>"Have you noticed any [specific symptoms to monitor based on condition]?"</li>
          <li>Uses open-ended questions to gather quality information</li>
        </ul>

        <p><strong>R - Reassure or Redirect</strong></p>
        <ul>
          <li><strong>If doing well:</strong> "That's wonderful to hear! It sounds like [Pet Name] is recovering beautifully. What you're describing is exactly what we want to see."</li>
          <li><strong>If concerning symptoms:</strong> "I appreciate you sharing that. Let me discuss this with Dr. [Name] and we'll call you back within the hour with guidance."</li>
          <li>Validates client's observations and provides clear next steps</li>
        </ul>

        <p><strong>E - Educate and Empower</strong></p>
        <ul>
          <li>"Remember, you can call us anytime if you notice [warning signs]. We're here for you and [Pet Name]."</li>
          <li>"Your next recheck is scheduled for [date]. Please call if you need to move that appointment."</li>
          <li>Reinforces home care instructions and future timeline</li>
        </ul>

        <h3>Sample Scripts by Visit Type</h3>

        <p><strong>Post-Surgical Follow-Up</strong></p>
        <div class="callout callout-info">
          "Hi Sarah, this is Jennifer from Oakwood Veterinary. I'm calling to check on Max after his dental procedure yesterday. How is he doing today?
          <br/><br/>
          [Listen to response]
          <br/><br/>
          Great! It sounds like Max is recovering well. Some mild grogginess is totally normal. Is he eating the soft food we sent home?
          <br/><br/>
          Perfect. Keep an eye on the extraction sites - they should look pink, not red or swollen. If you see bleeding, discharge, or if Max seems painful when eating, please call us right away.
          <br/><br/>
          His recheck is in 10 days to ensure everything is healing properly. Do you have any questions about his pain medications or home care?"
        </div>

        <p><strong>New Diagnosis Follow-Up</strong></p>
        <div class="callout callout-info">
          "Hi Michael, this is Dr. Chen from Riverside Animal Hospital. I wanted to check in on Bella now that she's been on the kidney diet and medications for 48 hours.
          <br/><br/>
          [Listen to response]
          <br/><br/>
          I understand it can be overwhelming when you first hear about kidney disease. The good news is we caught this early, and with the diet and medication, most dogs live comfortably for years.
          <br/><br/>
          Are you having any difficulty getting Bella to eat the prescription food? Some dogs need a gradual transition - would it help if we created a mixing schedule for you?
          <br/><br/>
          [Address concerns]
          <br/><br/>
          I'm scheduling Bella for bloodwork in 2 weeks to see how she's responding. In the meantime, monitor her water intake and urination - we want to make sure she stays well-hydrated."
        </div>
      `,
    },
    {
      title: "Automation Without Losing the Personal Touch",
      content: `
        <p>Manual follow-up calls scale poorly. A typical practice performing 25 surgical procedures per week requires 25 follow-up calls within 24 hours - often impossible for busy teams. Automation solves the capacity problem while maintaining quality.</p>

        <h3>Hybrid Automation Strategy</h3>
        <table>
          <thead>
            <tr>
              <th>Follow-Up Type</th>
              <th>Automation Level</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Post-Surgical (24hr)</td>
              <td>Semi-Automated</td>
              <td>AI call with DVM review of flagged concerns</td>
            </tr>
            <tr>
              <td>New Diagnosis (24hr)</td>
              <td>Veterinarian-Led</td>
              <td>Personal call from DVM (builds trust)</td>
            </tr>
            <tr>
              <td>Medication Start (48hr)</td>
              <td>Fully Automated</td>
              <td>SMS with embedded video showing administration technique</td>
            </tr>
            <tr>
              <td>Suture Removal (7 days)</td>
              <td>Fully Automated</td>
              <td>Email/SMS reminder with online scheduling link</td>
            </tr>
            <tr>
              <td>Chronic Disease Monitoring</td>
              <td>Semi-Automated</td>
              <td>Automated check-in with technician callback if abnormal</td>
            </tr>
          </tbody>
        </table>

        <h3>AI-Powered Follow-Up Calls: What Works</h3>
        <p>Modern conversational AI can handle 70-80% of routine follow-up calls, freeing veterinarians and technicians for complex cases:</p>

        <ul>
          <li><strong>Natural Language:</strong> AI asks open-ended questions and understands varied responses ("She's doing great!" vs. "Eating a little, but not much")</li>
          <li><strong>Triage Intelligence:</strong> Flags concerning responses for immediate DVM review (e.g., "He's vomiting blood" triggers instant escalation)</li>
          <li><strong>PIMS Integration:</strong> Automatically logs call notes, compliance status, and next steps in patient record</li>
          <li><strong>Sentiment Analysis:</strong> Detects client anxiety or frustration and offers human callback</li>
        </ul>

        <div class="callout callout-success">
          <strong>Client Acceptance:</strong> 73% of pet owners surveyed were comfortable with AI follow-up calls for routine post-surgical checks, provided they could speak to a veterinarian if needed (Veterinary Client Communication Study, 2024).
        </div>

        <h3>SMS and Email Automation</h3>
        <p>Text and email work best for low-urgency, compliance-focused communication:</p>

        <p><strong>Effective SMS Template (Medication Compliance)</strong></p>
        <div class="callout callout-info">
          "Hi Sarah! It's been 3 days since Max started his antibiotics. Just checking - is he taking his medication without issues? Reply YES if all is well, or call us at (555) 123-4567 if you need help. - Oakwood Vet Team"
        </div>

        <p><strong>Effective Email Template (Dietary Transition)</strong></p>
        <div class="callout callout-info">
          <strong>Subject:</strong> How is Bella adjusting to her new kidney diet?
          <br/><br/>
          Hi Michael,
          <br/><br/>
          It's been 48 hours since Bella started her prescription kidney diet. We wanted to check in:
          <br/><br/>
          ✅ Is she eating the new food willingly?<br/>
          ✅ Have you noticed any vomiting or diarrhea?<br/>
          ✅ Is she drinking plenty of water?
          <br/><br/>
          If Bella is being picky, try warming the food slightly or mixing in a small amount of low-sodium chicken broth. Watch this quick video for tips: [link]
          <br/><br/>
          Reply to this email or call us at (555) 123-4567 if you have concerns.
          <br/><br/>
          - Dr. Chen and the Riverside Team
        </div>
      `,
    },
    {
      title: "Measuring Follow-Up Effectiveness",
      content: `
        <h3>Key Performance Indicators</h3>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Target</th>
              <th>How to Calculate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Follow-Up Completion Rate</strong></td>
              <td>>90%</td>
              <td>(Completed Follow-Ups / Triggered Events) × 100</td>
            </tr>
            <tr>
              <td><strong>Client Connection Rate</strong></td>
              <td>>75%</td>
              <td>(Clients Reached / Contact Attempts) × 100</td>
            </tr>
            <tr>
              <td><strong>Compliance Rate</strong></td>
              <td>>80%</td>
              <td>(Clients Following Instructions / Total Clients) × 100</td>
            </tr>
            <tr>
              <td><strong>Escalation Rate</strong></td>
              <td>5-12%</td>
              <td>(Flagged Concerns / Total Follow-Ups) × 100</td>
            </tr>
            <tr>
              <td><strong>Recheck Attendance</strong></td>
              <td>>85%</td>
              <td>(Attended Rechecks / Scheduled Rechecks) × 100</td>
            </tr>
          </tbody>
        </table>

        <h3>Return on Investment</h3>
        <p>For a 3-DVM practice performing 30 surgical procedures per month:</p>

        <p><strong>Without Systematic Follow-Up:</strong></p>
        <ul>
          <li>Complication detection: 5-7 days post-op (when client finally calls with concern)</li>
          <li>Treatment compliance: 52%</li>
          <li>Recheck appointment attendance: 61%</li>
          <li>Client retention: 68%</li>
        </ul>

        <p><strong>With Automated 24-48-7 Protocol:</strong></p>
        <ul>
          <li>Complication detection: 24-48 hours post-op (proactive identification)</li>
          <li>Treatment compliance: 87% (+35 percentage points)</li>
          <li>Recheck appointment attendance: 89% (+28 percentage points)</li>
          <li>Client retention: 86% (+18 percentage points)</li>
        </ul>

        <h3>Revenue Impact</h3>
        <ul>
          <li><strong>Increased Compliance:</strong> 35% more clients completing treatment plans = $42,000 additional revenue/year</li>
          <li><strong>Better Recheck Attendance:</strong> 28% more attended rechecks = $18,400/year</li>
          <li><strong>Improved Retention:</strong> 18% better client retention = $67,000/year (lifetime value)</li>
          <li><strong>Total Annual Benefit:</strong> $127,400</li>
          <li><strong>Program Cost:</strong> $3,600/year (automated system)</li>
          <li><strong>Net Gain:</strong> $123,800/year</li>
          <li><strong>ROI:</strong> 3,439%</li>
        </ul>

        <div class="callout callout-success">
          <strong>Intangible Benefits:</strong> Reduced DVM stress from late-stage complication management, improved team morale from positive client interactions, and enhanced practice reputation through word-of-mouth referrals.
        </div>
      `,
    },
  ],
  faqs: [
    {
      question:
        "Who should make post-visit follow-up calls - veterinarian or technician?",
      answer:
        "It depends on visit complexity. Veterinarians should personally call for new chronic disease diagnoses, complex surgeries, and critical cases to build trust and answer medical questions. Trained veterinary technicians excel at routine post-surgical checks, medication compliance calls, and dietary transitions. AI automation handles high-volume, low-complexity follow-ups (suture removal reminders, simple surgical checks) with DVM escalation for flagged concerns. This tiered approach maximizes efficiency while ensuring appropriate expertise.",
    },
    {
      question:
        "How do I find time for follow-up calls with an already busy schedule?",
      answer:
        'The key is automation and delegation. Implement automated SMS/email for 50-60% of follow-ups (medication compliance, recheck reminders, dietary transitions). Train veterinary technicians to handle routine post-surgical calls, freeing DVMs for complex cases. Schedule dedicated "follow-up blocks" of 30 minutes daily rather than squeezing calls between appointments. AI-powered systems can handle 70-80% of calls autonomously, escalating only when issues are detected. A practice seeing 30 surgical cases/month can reduce manual follow-up time from 12 hours/week to 3 hours/week through strategic automation.',
    },
    {
      question:
        "What should I do if a client reports concerning symptoms during follow-up?",
      answer:
        'Use the "Assess, Escalate, Document" protocol: (1) Ask clarifying questions about symptom onset, severity, and progression, (2) Immediately escalate to the attending veterinarian for medical guidance - never guess or provide treatment advice outside your scope, (3) Document the conversation and veterinarian\'s recommendations in the PIMS, (4) Schedule a same-day recheck if warranted or provide clear home monitoring instructions with specific "call back if..." criteria, (5) Set a follow-up call for 4-6 hours to ensure symptoms aren\'t worsening.',
    },
    {
      question:
        "Are clients annoyed by follow-up calls, or do they appreciate them?",
      answer:
        "Research consistently shows clients overwhelmingly appreciate proactive follow-up. A 2024 survey found 81% of pet owners expect follow-up after surgery or new diagnosis, and 67% say such calls significantly increase their trust in the practice. Only 4% reported finding follow-up calls intrusive. The key is timing and relevance - calling 24 hours post-surgery is welcomed, while calling 2 weeks later seems disconnected. Clients perceive follow-up as evidence of genuine care rather than a sales tactic.",
    },
    {
      question: "Should follow-up be a phone call, text, or email?",
      answer:
        'Match the method to the urgency and complexity: Phone calls for high-priority cases (24-hour post-surgical, new diagnoses, emergency follow-ups) allow real-time conversation and immediate escalation if needed. SMS for simple compliance checks and reminders (medication adherence, recheck appointments) - 98% open rate within 3 minutes. Email for educational content and non-urgent updates (dietary transition tips, chronic disease monitoring guides). Best practice: Ask clients their preferred contact method during checkout and document it in your PIMS. Many practices offer "text for routine, call for urgent" options.',
    },
    {
      question:
        "How do I track whether follow-up calls are actually happening?",
      answer:
        'Implement a system-driven workflow rather than relying on memory: (1) PIMS Integration - Configure your PIMS to auto-generate follow-up tasks based on appointment types (e.g., "Post-surgical follow-up call needed" task appears in queue 24 hours after dental procedures), (2) Dashboard Reporting - Track completion rate weekly: (Completed Follow-Ups / Triggered Events) × 100. Target is >90%, (3) Accountability Assignment - Assign specific staff members responsibility for follow-up completion and review metrics monthly, (4) Automated Systems - AI platforms automatically log all follow-ups with transcripts, making compliance auditable.',
    },
  ],
  productTieIn: {
    title: "ODIS AI: Automated Follow-Up That Feels Personal",
    description:
      "Manual follow-up protocols fail under time pressure, leading to inconsistent client communication and reduced compliance. ODIS AI automates post-visit follow-up calls with natural conversational AI that clients can't distinguish from human staff - while intelligently escalating concerns to your veterinary team for immediate attention.",
    features: [
      "Automatically triggers follow-up calls 24 hours post-surgery with natural conversation flow",
      "Asks open-ended questions and understands varied client responses (not rigid scripts)",
      "Flags concerning symptoms (vomiting, incision issues, pain) for immediate DVM review",
      "Integrates with PIMS to log call notes, compliance status, and next steps automatically",
      "Handles unlimited concurrent calls - follows up with 50 surgical patients simultaneously",
      "Sends SMS/email summaries to clients with key takeaways and next steps",
      "Tracks compliance rates and provides weekly dashboard of client outcomes",
      "$199/month flat rate for unlimited follow-up calls across all visit types",
    ],
  },
  relatedResources: [
    "patient-follow-up-protocols",
    "medication-compliance",
    "post-surgical-follow-up",
    "vet-tech-client-communication",
  ],
};
