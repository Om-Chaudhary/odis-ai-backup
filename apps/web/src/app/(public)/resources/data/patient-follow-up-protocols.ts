import type { ResourcePageData } from "./types";

export const patientFollowUpProtocols: ResourcePageData = {
  metaTitle:
    "Patient Follow-Up Protocols for Veterinary Practices | Systematic Care Management",
  metaDescription:
    "Implement systematic patient follow-up protocols that improve clinical outcomes, boost compliance by 68%, and increase client retention. Evidence-based frameworks for veterinary practices.",
  keywords: [
    "patient follow-up protocols veterinary",
    "veterinary follow-up procedures",
    "systematic patient care veterinary",
    "follow-up protocol development",
    "veterinary care continuity",
    "patient management protocols",
    "follow-up best practices veterinary",
    "clinical protocol development",
    "veterinary standard operating procedures",
    "patient care workflows",
    "follow-up automation veterinary",
    "protocol implementation veterinary",
  ],
  hero: {
    badge: "Clinical Protocols",
    title: "Patient Follow-Up Protocols for Veterinary Practices",
    subtitle:
      "Transform ad-hoc follow-up into systematic care pathways. Proven protocols that reduce treatment failure by 64%, improve compliance by 68%, and enhance patient outcomes across all service lines.",
  },
  sections: [
    {
      title: "Why Systematic Follow-Up Protocols Matter",
      content: `
        <p>A 2024 AAHA study comparing practices with documented follow-up protocols vs. those relying on DVM memory found dramatic differences in clinical outcomes and practice performance:</p>

        <table>
          <thead>
            <tr>
              <th>Outcome Metric</th>
              <th>Protocol-Driven Practices</th>
              <th>Ad-Hoc Approach</th>
              <th>Improvement</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Treatment Compliance Rate</td>
              <td>87%</td>
              <td>52%</td>
              <td>+67%</td>
            </tr>
            <tr>
              <td>Post-Surgical Complication Detection</td>
              <td>24-48 hours</td>
              <td>5-7 days</td>
              <td>-71% time</td>
            </tr>
            <tr>
              <td>Chronic Disease Monitoring Consistency</td>
              <td>94%</td>
              <td>38%</td>
              <td>+147%</td>
            </tr>
            <tr>
              <td>Treatment Failure Requiring Retreatment</td>
              <td>6%</td>
              <td>17%</td>
              <td>-65%</td>
            </tr>
            <tr>
              <td>Client Retention (1-Year)</td>
              <td>86%</td>
              <td>68%</td>
              <td>+26%</td>
            </tr>
          </tbody>
        </table>

        <div class="callout callout-warning">
          <strong>The Ad-Hoc Approach Fails Under Volume:</strong> When follow-up depends on DVM memory rather than system triggers, 40-60% of patients requiring follow-up slip through the cracks. This failure rate increases directly with practice volume - busier practices have worse compliance.
        </div>

        <h3>Clinical Impact of Missed Follow-Up</h3>
        <p>AVMA Veterinary Care Outcomes Study (2024, n=12,400 cases):</p>
        <ul>
          <li><strong>Post-Surgical Infections:</strong> 42% could have been prevented with timely 24-48 hour follow-up detecting early warning signs</li>
          <li><strong>Diabetic Crises:</strong> 68% of DKA hospitalizations occurred in pets with >14-day gaps in glucose monitoring</li>
          <li><strong>Chronic Kidney Disease Progression:</strong> Patients with quarterly monitoring lived 22% longer than those monitored "as needed"</li>
          <li><strong>Medication Non-Compliance:</strong> 73% of clients who stopped medications early would have continued with Day 5-7 reinforcement calls</li>
        </ul>
      `,
    },
    {
      title: "The Tiered Protocol Framework",
      content: `
        <p>Effective follow-up protocols match intensity to clinical risk. This three-tier system optimizes staff time while ensuring appropriate care:</p>

        <h3>Tier 1: High-Touch Protocols (Phone Call Required)</h3>
        <p><strong>Trigger Conditions:</strong></p>
        <ul>
          <li>All surgical procedures (spay/neuter, mass removal, orthopedic, dental extractions)</li>
          <li>New chronic disease diagnosis (diabetes, kidney disease, hyperthyroidism, heart disease)</li>
          <li>Emergency visits (toxicity, trauma, GDV, urinary obstruction)</li>
          <li>Hospitalization discharge</li>
          <li>Injectable medication starts (insulin, immunosuppressants, chemotherapy)</li>
        </ul>

        <p><strong>Protocol Timeline:</strong></p>
        <table>
          <thead>
            <tr>
              <th>Timepoint</th>
              <th>Action</th>
              <th>Responsible</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>24 Hours Post-Visit</td>
              <td>Phone call to assess recovery, answer questions</td>
              <td>Veterinarian or Lead Technician</td>
            </tr>
            <tr>
              <td>48-72 Hours</td>
              <td>Follow-up call if Day 1 revealed concerns</td>
              <td>Same person who made initial call</td>
            </tr>
            <tr>
              <td>7-10 Days</td>
              <td>Suture removal, recheck, or compliance verification</td>
              <td>Technician (clinic visit)</td>
            </tr>
            <tr>
              <td>30 Days</td>
              <td>Long-term outcome assessment (surgical healing, medication tolerance)</td>
              <td>Automated survey + technician review</td>
            </tr>
          </tbody>
        </table>

        <h3>Tier 2: Automated Protocols (SMS/Email with Escalation)</h3>
        <p><strong>Trigger Conditions:</strong></p>
        <ul>
          <li>Oral medication starts (antibiotics, NSAIDs, steroids)</li>
          <li>Dietary transitions (prescription diets)</li>
          <li>Diagnostic testing with pending results</li>
          <li>Wellness visits (vaccines, examinations)</li>
        </ul>

        <p><strong>Protocol Timeline:</strong></p>
        <ul>
          <li><strong>48 Hours:</strong> Automated SMS: "How is [Pet] adjusting to [medication/diet]? Reply GOOD or call us at [phone] if you have concerns."</li>
          <li><strong>7 Days:</strong> Medication compliance check: "You should be halfway through [Pet]'s medication. Any issues?"</li>
          <li><strong>14 Days:</strong> Treatment completion verification: "Time for [Pet]'s recheck! Click here to schedule: [link]"</li>
        </ul>

        <p><strong>Escalation Triggers:</strong> Client replies with keywords indicating problems ("vomiting," "not eating," "worse," "stopped giving") automatically flag for technician phone call within 2 hours.</p>

        <h3>Tier 3: Passive Monitoring (System Alerts, No Outbound Contact)</h3>
        <p><strong>Trigger Conditions:</strong></p>
        <ul>
          <li>Chronic disease refill monitoring (thyroid, heart, seizure medications)</li>
          <li>Overdue preventive care (annual exams, vaccines, dental prophylaxis)</li>
          <li>Laboratory recheck monitoring (6-month bloodwork for chronic kidney disease)</li>
        </ul>

        <p><strong>Protocol Mechanism:</strong> PIMS generates alerts when:</p>
        <ul>
          <li>Refill is 5+ days overdue</li>
          <li>Annual exam is 30+ days past due</li>
          <li>Scheduled recheck lab not completed within 7 days of target date</li>
        </ul>

        <p>CSR sees alert during client-initiated contact and addresses: "I see Fluffy is due for her thyroid recheck. Would you like to schedule that today?"</p>

        <div class="callout callout-info">
          <strong>Tiering Rationale:</strong> This framework allocates limited staff resources (phone calls) to highest-risk cases while using automation for routine follow-up. Practices save 15-20 hours/week on manual follow-up while improving overall contact rates from 42% to 91%.
        </div>
      `,
    },
    {
      title: "Building Follow-Up Protocols: Step-by-Step",
      content: `
        <h3>Phase 1: Protocol Design (Week 1-2)</h3>

        <p><strong>Step 1: Map Current Workflows</strong></p>
        <ul>
          <li>Audit last 100 surgeries - what % received 24-hour follow-up call?</li>
          <li>Review chronic disease patients - how many have documented monitoring schedules?</li>
          <li>Interview DVMs - what follow-up do you intend vs. what actually happens?</li>
        </ul>

        <p><strong>Step 2: Define Trigger Conditions</strong></p>
        <p>Create exhaustive list of clinical scenarios requiring follow-up:</p>

        <table>
          <thead>
            <tr>
              <th>Clinical Scenario</th>
              <th>Tier</th>
              <th>Follow-Up Timeline</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Spay/Neuter</td>
              <td>1 (High-Touch)</td>
              <td>24hr call, 10-day suture check</td>
            </tr>
            <tr>
              <td>Dental with Extractions</td>
              <td>1</td>
              <td>24hr call, 7-day recheck</td>
            </tr>
            <tr>
              <td>New Diabetes Diagnosis</td>
              <td>1</td>
              <td>24hr call, 7-day glucose curve, 30-day recheck</td>
            </tr>
            <tr>
              <td>Antibiotic Prescription</td>
              <td>2 (Automated)</td>
              <td>48hr SMS, Day 7 compliance check</td>
            </tr>
            <tr>
              <td>Annual Wellness Exam</td>
              <td>2</td>
              <td>48hr satisfaction survey</td>
            </tr>
            <tr>
              <td>Thyroid Medication Refill</td>
              <td>3 (Passive)</td>
              <td>Alert if 5+ days overdue</td>
            </tr>
          </tbody>
        </table>

        <p><strong>Step 3: Standardize Scripts and Talking Points</strong></p>
        <p>Create templates for each protocol type:</p>

        <div class="callout callout-info">
          <strong>24-Hour Post-Surgical Script Template:</strong>
          <br/><br/>
          "Hi [Client Name], this is [Your Name] from [Practice]. I'm calling to check on [Pet Name] after [his/her] [procedure] yesterday.
          <br/><br/>
          • How is [Pet] eating and drinking?<br/>
          • Any vomiting or diarrhea?<br/>
          • Is the incision site clean and dry?<br/>
          • Do you have questions about medications or home care?
          <br/><br/>
          [Address concerns or reassure]
          <br/><br/>
          [Pet]'s suture removal is scheduled for [date]. Please call if you notice redness, swelling, discharge, or if [Pet] is licking the incision excessively."
        </div>

        <h3>Phase 2: PIMS Integration (Week 3-4)</h3>

        <p><strong>Configure Automated Triggers:</strong></p>
        <ul>
          <li>Link follow-up tasks to appointment types (e.g., "Spay" appointment auto-generates "24hr follow-up call" task for next business day)</li>
          <li>Set medication dispensing to trigger SMS reminders 48 hours post-visit</li>
          <li>Create alerts for overdue refills, exams, and rechecks</li>
        </ul>

        <p><strong>Build Compliance Dashboard:</strong></p>
        <ul>
          <li>Daily view of pending follow-up tasks by tier and priority</li>
          <li>Weekly metrics: completion rate, escalation volume, client satisfaction</li>
          <li>Monthly trends: protocol adherence by DVM, tier distribution changes</li>
        </ul>

        <h3>Phase 3: Team Training (Week 5-6)</h3>

        <p><strong>Role Assignment:</strong></p>
        <ul>
          <li><strong>Veterinarians:</strong> New chronic disease diagnoses, complex surgical follow-ups, flagged concerns from automated systems</li>
          <li><strong>Lead Technicians:</strong> Routine post-surgical calls, medication compliance troubleshooting</li>
          <li><strong>CSRs:</strong> Monitor passive alerts during client interactions, schedule rechecks</li>
          <li><strong>Practice Manager:</strong> Weekly protocol compliance review, identify bottlenecks</li>
        </ul>

        <p><strong>Training Modules:</strong></p>
        <ol>
          <li>Understanding the three-tier framework and clinical rationale</li>
          <li>Navigating the PIMS follow-up dashboard and task management</li>
          <li>Using standardized scripts while personalizing communication</li>
          <li>Escalation procedures when clients report concerning symptoms</li>
          <li>Documenting follow-up conversations in medical records</li>
        </ol>

        <div class="callout callout-success">
          <strong>Implementation Timeline:</strong> Best practices suggest 6-8 week gradual rollout rather than "big bang" launch. Start with Tier 1 protocols (highest impact), refine workflows, then add Tier 2 automation, and finally integrate Tier 3 passive monitoring. This phased approach prevents staff overwhelm and allows course correction.
        </div>
      `,
    },
    {
      title: "Measuring Protocol Effectiveness",
      content: `
        <h3>Primary KPIs for Follow-Up Protocols</h3>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Target</th>
              <th>Calculation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Protocol Completion Rate</strong></td>
              <td>>90%</td>
              <td>(Completed Follow-Ups / Triggered Protocols) × 100</td>
            </tr>
            <tr>
              <td><strong>Client Contact Success Rate</strong></td>
              <td>>75%</td>
              <td>(Clients Reached / Contact Attempts) × 100</td>
            </tr>
            <tr>
              <td><strong>Early Complication Detection</strong></td>
              <td>>85%</td>
              <td>(Issues Caught at 24-48hr / Total Complications) × 100</td>
            </tr>
            <tr>
              <td><strong>Treatment Compliance Rate</strong></td>
              <td>>80%</td>
              <td>(Clients Completing Treatment / Prescriptions) × 100</td>
            </tr>
            <tr>
              <td><strong>Recheck Attendance</strong></td>
              <td>>85%</td>
              <td>(Attended Rechecks / Scheduled Rechecks) × 100</td>
            </tr>
            <tr>
              <td><strong>Client Satisfaction (NPS)</strong></td>
              <td>>75</td>
              <td>% Promoters - % Detractors</td>
            </tr>
          </tbody>
        </table>

        <h3>Secondary Outcome Metrics</h3>
        <ul>
          <li><strong>Treatment Failure Rate:</strong> % of cases requiring retreatment for same condition (target: <8%)</li>
          <li><strong>Emergency Visit Prevention:</strong> # of potential emergencies caught during routine follow-up (track monthly)</li>
          <li><strong>Staff Efficiency:</strong> Average time per follow-up call, automation rate (target: 60-70% automated)</li>
          <li><strong>Revenue Impact:</strong> Increased compliance revenue, reduced retreatment costs, improved retention value</li>
        </ul>

        <h3>ROI Calculation Example</h3>
        <p>For a typical 3-DVM practice implementing systematic protocols:</p>

        <p><strong>Costs:</strong></p>
        <ul>
          <li>Protocol development and PIMS configuration: $2,400 (one-time)</li>
          <li>Staff training (24 hours total across team): $1,600 (one-time)</li>
          <li>Automated SMS/email system: $149/month ($1,788/year)</li>
          <li>Ongoing staff time (5 hours/week at $35/hour): $9,100/year</li>
          <li><strong>Total Year 1 Investment:</strong> $14,888</li>
        </ul>

        <p><strong>Benefits:</strong></p>
        <ul>
          <li>Improved medication compliance (35% increase) = $42,000 additional treatment revenue</li>
          <li>Reduced retreatment costs (11% reduction) = $28,000 saved</li>
          <li>Better recheck attendance (28% increase) = $18,400 additional revenue</li>
          <li>Enhanced retention (18% improvement) = $67,000 lifetime value increase</li>
          <li><strong>Total Annual Benefit:</strong> $155,400</li>
        </ul>

        <p><strong>Net Gain:</strong> $140,512 (Year 1) | <strong>ROI:</strong> 944%</p>

        <div class="callout callout-info">
          <strong>Intangible Benefits:</strong> Reduced DVM stress from late-stage complication management, improved team morale from proactive client interactions, enhanced practice reputation ("They actually care about my pet after the visit"), and better clinical outcomes driving word-of-mouth referrals.
        </div>
      `,
    },
  ],
  faqs: [
    {
      question:
        "How do I get DVMs to follow protocols instead of relying on their own judgment?",
      answer:
        'Frame protocols as clinical support, not mandates. Emphasize that protocols ensure "minimum standard of care" while DVMs can always exceed them for complex cases. Use data to demonstrate impact: show DVMs their complication detection rates before/after protocol implementation. Assign a DVM champion who helps design protocols and advocates for adoption. Build protocols WITH the team, not FOR them - collaborative design increases buy-in. Finally, make protocols easy: PIMS auto-generates tasks, not DVMs remembering to create them manually.',
    },
    {
      question:
        "What if we don't have staff capacity for all these follow-up calls?",
      answer:
        "This is exactly why the three-tier framework exists. Tier 1 (high-touch phone calls) applies to only 20-30% of cases - the highest-risk situations. Tier 2 (automated SMS/email) handles 50-60% of follow-up with minimal staff time. Tier 3 (passive monitoring) requires zero outbound effort. A typical practice completing 200 appointments/week needs approximately 5-7 hours of dedicated follow-up time using this tiered approach - far less than attempting to call every patient. The key is using automation strategically to preserve human touchpoints for cases where they matter most clinically.",
    },
    {
      question: "Should veterinary technicians or DVMs make follow-up calls?",
      answer:
        'Assign based on clinical complexity and relationship building. DVMs should call for: new chronic disease diagnoses (builds trust in long-term relationship), complex surgeries (orthopedic, oncologic), and any case where medical judgment may be required during the call. Technicians excel at routine post-surgical checks (spay/neuter, dental), medication compliance troubleshooting, and wound care assessments. Train technicians to recognize escalation triggers ("This needs DVM review") and transfer calls or schedule callbacks. Most practices find 70% of follow-up calls can be safely handled by well-trained technicians, freeing DVMs for complex cases.',
    },
    {
      question:
        "How do I integrate follow-up protocols with our existing PIMS?",
      answer:
        'Modern PIMS platforms (Cornerstone, eVetPractice, AVImark, Impromed) support automated task generation: (1) Configure appointment types to auto-create follow-up tasks (e.g., "Spay" appointment triggers "24hr post-op call" task for next business day), (2) Set medication dispensing to generate compliance check reminders, (3) Build recurring task templates for chronic disease monitoring (e.g., every 90 days for diabetes rechecks), (4) Create alerts for overdue rechecks and refills. If your PIMS lacks built-in automation, use third-party tools like VetCheck, PetDesk, or ODIS AI that integrate via API to manage follow-up workflows and sync notes back to your primary system.',
    },
    {
      question:
        "What should I do if a client reports concerning symptoms during follow-up?",
      answer:
        'Use the "Assess, Escalate, Document, Act" protocol: (1) Ask clarifying questions about symptom onset, severity, and progression without providing treatment advice, (2) Immediately escalate to the attending veterinarian for medical judgment - never diagnose over the phone, (3) Document the conversation verbatim in PIMS including exact client quotes about symptoms, (4) Follow veterinarian guidance to either schedule same-day recheck, provide specific home monitoring instructions, or direct to emergency clinic if severe, (5) Set follow-up call for 4-6 hours to reassess. Train all staff on "red flag" symptoms requiring immediate DVM escalation: bleeding, respiratory distress, seizures, inability to urinate, severe vomiting/diarrhea.',
    },
    {
      question:
        "How often should we review and update our follow-up protocols?",
      answer:
        "Conduct quarterly protocol audits: (1) Review completion rate metrics - are specific protocols consistently missed? Adjust timing or responsibility, (2) Analyze escalation volume - if >20% of automated follow-ups escalate to phone calls, the automation may be poorly designed, (3) Gather team feedback - which protocols feel burdensome? Can they be streamlined? (4) Assess clinical outcomes - track complication rates, retreatment frequency, and client satisfaction by protocol type. Make incremental updates quarterly rather than annual overhauls. Major protocol revision should occur when: adding new services (e.g., launching dental program requires new follow-up protocols), significant PIMS platform changes, or practice growth/staffing shifts.",
    },
  ],
  productTieIn: {
    title: "ODIS AI: Intelligent Follow-Up Protocols on Autopilot",
    description:
      "Manual follow-up protocols fail when staff are busy, resulting in inconsistent care and missed opportunities. ODIS AI executes your follow-up protocols automatically through conversational AI that sounds human, escalates intelligently, and integrates seamlessly with your PIMS.",
    features: [
      "Automatically executes tiered follow-up protocols based on visit type and clinical risk",
      "Natural phone conversations that ask open-ended questions and understand varied client responses",
      "Intelligent escalation: flags concerning symptoms for immediate veterinarian review",
      "PIMS integration: logs all call notes, compliance status, and next steps automatically",
      "Handles multiple concurrent calls - follows up with 50+ surgical patients simultaneously",
      "SMS/email automation for medication reminders, recheck scheduling, and satisfaction surveys",
      "Real-time dashboard showing protocol completion rates, compliance metrics, and escalated cases",
      "$199/month flat rate for unlimited follow-up across all three protocol tiers",
    ],
  },
  relatedResources: [
    "post-visit-follow-up",
    "medication-compliance",
    "post-surgical-follow-up",
    "treatment-compliance",
  ],
};
